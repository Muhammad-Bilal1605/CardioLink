import mongoose from "mongoose";
import PDFDocument from "pdfkit";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { HealthTrackerEntry } from "../models/HealthTrackerEntry.js";
import { HealthTrackerReport } from "../models/HealthTrackerReport.js";
import LabResult from "../models/LabResult.js";
import VitalSign from "../models/VitalSign.js";
import User from "../models/User.js";
import Visit from "../models/Visit.js";
import Medication from "../models/Medication.js";

const formatEntry = (entry) => {
  if (!entry) {
    return null;
  }

  const base = {
    id: entry._id ? entry._id.toString() : entry.id,
    entryType: entry.entryType,
    recordedAt: entry.recordedAt,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
    user: entry.user,
  };

  if (entry.entryType === "activity" && entry.activity) {
    return {
      ...base,
      data: entry.activity,
    };
  }

  if (entry.entryType === "meal" && entry.meal) {
    return {
      ...base,
      data: entry.meal,
    };
  }

  if (entry.entryType === "medication" && entry.medication) {
    return {
      ...base,
      data: entry.medication,
    };
  }

  return base;
};

const sanitizePayload = (entryType, payload = {}) => {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  switch (entryType) {
    case "activity":
      if (
        payload.type &&
        payload.duration !== undefined &&
        payload.distance !== undefined &&
        payload.calories !== undefined &&
        payload.date
      ) {
        return {
          type: payload.type,
          duration: Number(payload.duration),
          distance: Number(payload.distance),
          calories: Number(payload.calories),
          steps:
            payload.steps !== undefined ? Number(payload.steps) : undefined,
          date: new Date(payload.date),
        };
      }
      break;
    case "meal":
      if (
        payload.mealType &&
        payload.foodItems &&
        payload.calories !== undefined &&
        payload.saturatedFat !== undefined &&
        payload.cholesterol !== undefined &&
        payload.date
      ) {
        return {
          mealType: payload.mealType,
          foodItems: payload.foodItems,
          calories: Number(payload.calories),
          saturatedFat: Number(payload.saturatedFat),
          cholesterol: Number(payload.cholesterol),
          date: new Date(payload.date),
        };
      }
      break;
    case "medication":
      if (payload.name && payload.dosage && payload.frequency && payload.time) {
        return {
          name: payload.name,
          dosage: payload.dosage,
          frequency: payload.frequency,
          time: payload.time,
          reminderEnabled:
            payload.reminderEnabled !== undefined
              ? Boolean(payload.reminderEnabled)
              : true,
          notes: payload.notes,
        };
      }
      break;
    default:
      return null;
  }

  return null;
};

const buildUserSnapshot = (user) => {
  if (!user) {
    return {};
  }

  const name =
    user.name ||
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    user.email ||
    "";

  return {
    id: user._id || user.id,
    email: user.email,
    name: name,
  };
};

let cachedGenAiClient = null;

const getGenAiClient = () => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error(
      "HeartWise AI is not configured. Please set GEMINI_API_KEY in the environment."
    );
  }

  if (!cachedGenAiClient) {
    cachedGenAiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }

  return cachedGenAiClient;
};

// Simple function to get a model - we'll try models when generating content
const getHeartWiseModel = (modelName = null) => {
  const genAI = getGenAiClient();
  const name = modelName || process.env.GEMINI_HEARTWISE_MODEL || "gemini-1.5-pro-latest";
  return genAI.getGenerativeModel({ model: name });
};

const HEARTWISE_REPORT_SCHEMA = `Respond strictly in JSON using the following schema:
{
  "title": string,
  "patientOverview": string,
  "medicalHistory": string[],
  "currentStatus": string[],
  "medicationsSummary": string[],
  "recommendedActions": string[],
  "followUpPlan": string[]
}`;

const formatEntriesForPrompt = (entries = [], focusEntryId = null) => {
  const result = {
    activities: [],
    meals: [],
    medications: [],
  };

  let highlightedEntry = null;

  entries.forEach((entry) => {
    const base = {
      id: entry._id ? entry._id.toString() : undefined,
      recordedAt: entry.recordedAt,
    };

    if (entry.entryType === "activity" && entry.activity) {
      const activity = {
        ...base,
        type: entry.activity.type,
        duration: entry.activity.duration,
        distance: entry.activity.distance,
        calories: entry.activity.calories,
        steps: entry.activity.steps,
        date: entry.activity.date,
      };
      result.activities.push(activity);
      if (focusEntryId && activity.id === focusEntryId) {
        highlightedEntry = { entryType: "activity", data: activity };
      }
    }

    if (entry.entryType === "meal" && entry.meal) {
      const meal = {
        ...base,
        mealType: entry.meal.mealType,
        foodItems: entry.meal.foodItems,
        calories: entry.meal.calories,
        saturatedFat: entry.meal.saturatedFat,
        cholesterol: entry.meal.cholesterol,
        date: entry.meal.date,
      };
      result.meals.push(meal);
      if (focusEntryId && meal.id === focusEntryId) {
        highlightedEntry = { entryType: "meal", data: meal };
      }
    }

    if (entry.entryType === "medication" && entry.medication) {
      const medication = {
        ...base,
        name: entry.medication.name,
        dosage: entry.medication.dosage,
        frequency: entry.medication.frequency,
        time: entry.medication.time,
        reminderEnabled: entry.medication.reminderEnabled,
      };
      result.medications.push(medication);
      if (focusEntryId && medication.id === focusEntryId) {
        highlightedEntry = { entryType: "medication", data: medication };
      }
    }
  });

  return { groupedEntries: result, highlightedEntry };
};

const buildHeartWiseReportPrompt = ({
  patientSnapshot,
  groupedEntries,
  highlightedEntry,
  ehrData = {},
}) => {
  const patientName = patientSnapshot?.name || "Unknown patient";
  const patientEmail = patientSnapshot?.email || "Not provided";

  const formatDate = (value) => {
    if (!value) return "Unknown date";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value.toString();
    }
    return date.toISOString();
  };

  const activityLines = groupedEntries.activities
    .map(
      (activity) =>
        `- ${formatDate(activity.date || activity.recordedAt)} | ${activity.type} | ${activity.duration} min | ${activity.distance} km | ${activity.calories} kcal`
    )
    .join("\n");

  const mealLines = groupedEntries.meals
    .map(
      (meal) =>
        `- ${formatDate(meal.date || meal.recordedAt)} | ${meal.mealType} | ${meal.foodItems} | ${meal.calories} kcal | Saturated Fat ${meal.saturatedFat}g | Cholesterol ${meal.cholesterol}mg`
    )
    .join("\n");

  const medicationLines = groupedEntries.medications
    .map(
      (medication) =>
        `- ${medication.name} (${medication.dosage}) | ${medication.frequency} | Reminder ${medication.reminderEnabled ? "ON" : "OFF"}`
    )
    .join("\n");

  const highlightSection = highlightedEntry
    ? `FOCUS ENTRY (${highlightedEntry.entryType.toUpperCase()}):
${JSON.stringify(highlightedEntry.data, null, 2)}`
    : "No specific entry highlighted. Provide an overall analysis.";

  // Build EHR data section
  let ehrSection = "";
  
  // Patient Information
  if (ehrData.patientInfo) {
    const age = ehrData.patientInfo.dateOfBirth 
      ? Math.floor((new Date() - new Date(ehrData.patientInfo.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000))
      : null;
    ehrSection += `\nPATIENT DEMOGRAPHICS:\n`;
    ehrSection += `- Name: ${ehrData.patientInfo.firstName || ''} ${ehrData.patientInfo.lastName || ''}\n`;
    ehrSection += `- Age: ${age || 'N/A'} | Gender: ${ehrData.patientInfo.gender || 'N/A'}\n`;
    ehrSection += `- Blood Type: ${ehrData.patientInfo.bloodType || 'N/A'}\n`;
    ehrSection += `- Phone: ${ehrData.patientInfo.phoneNumber || 'N/A'}\n`;
    if (ehrData.patientInfo.address) {
      const addr = ehrData.patientInfo.address;
      ehrSection += `- Address: ${[addr.street, addr.city, addr.state, addr.zipCode, addr.country].filter(Boolean).join(', ') || 'N/A'}\n`;
    }
  }

  // Allergies
  if (ehrData.allergies) {
    const allAllergies = [];
    if (ehrData.allergies.medicinal && ehrData.allergies.medicinal.length > 0) {
      ehrData.allergies.medicinal.forEach(a => {
        allAllergies.push(`Medicinal: ${a.name} (${a.criticality || 'N/A'}) - ${a.reaction || 'N/A'}`);
      });
    }
    if (ehrData.allergies.environmental && ehrData.allergies.environmental.length > 0) {
      ehrData.allergies.environmental.forEach(a => {
        allAllergies.push(`Environmental: ${a.name} (${a.criticality || 'N/A'}) - ${a.reaction || 'N/A'}`);
      });
    }
    if (ehrData.allergies.food && ehrData.allergies.food.length > 0) {
      ehrData.allergies.food.forEach(a => {
        allAllergies.push(`Food: ${a.name} (${a.criticality || 'N/A'}) - ${a.reaction || 'N/A'}`);
      });
    }
    if (allAllergies.length > 0) {
      ehrSection += `\nALLERGIES:\n${allAllergies.map(a => `- ${a}`).join("\n")}\n`;
    } else {
      ehrSection += `\nALLERGIES: None recorded\n`;
    }
  }

  // Social History
  if (ehrData.socialHistory) {
    ehrSection += `\nSOCIAL HISTORY:\n`;
    if (ehrData.socialHistory.tobaccoUse) {
      ehrSection += `- Tobacco: ${ehrData.socialHistory.tobaccoUse}${ehrData.socialHistory.tobaccoType ? ` (${ehrData.socialHistory.tobaccoType})` : ''}${ehrData.socialHistory.tobaccoFrequency ? ` - ${ehrData.socialHistory.tobaccoFrequency}` : ''}\n`;
    }
    if (ehrData.socialHistory.alcoholUse) {
      ehrSection += `- Alcohol: ${ehrData.socialHistory.alcoholUse}${ehrData.socialHistory.alcoholType ? ` (${ehrData.socialHistory.alcoholType})` : ''}${ehrData.socialHistory.alcoholFrequency ? ` - ${ehrData.socialHistory.alcoholFrequency}` : ''}\n`;
    }
    if (ehrData.socialHistory.illicitDrugUse) {
      ehrSection += `- Illicit Drugs: ${ehrData.socialHistory.illicitDrugUse}${ehrData.socialHistory.drugType ? ` (${ehrData.socialHistory.drugType})` : ''}\n`;
    }
    if (ehrData.socialHistory.occupation) {
      ehrSection += `- Occupation: ${ehrData.socialHistory.occupation}\n`;
    }
  }

  // Emergency Contact
  if (ehrData.emergencyContact) {
    ehrSection += `\nEMERGENCY CONTACT:\n`;
    ehrSection += `- Name: ${ehrData.emergencyContact.name || 'N/A'}\n`;
    ehrSection += `- Relationship: ${ehrData.emergencyContact.relationship || 'N/A'}\n`;
    ehrSection += `- Phone: ${ehrData.emergencyContact.phoneNumber || 'N/A'}\n`;
  }

  // Insurance
  if (ehrData.insurance) {
    ehrSection += `\nINSURANCE:\n`;
    ehrSection += `- Provider: ${ehrData.insurance.provider || 'N/A'}\n`;
    ehrSection += `- Policy Number: ${ehrData.insurance.policyNumber || 'N/A'}\n`;
  }

  // Special Directives
  if (ehrData.specialDirectives) {
    ehrSection += `\nSPECIAL DIRECTIVES:\n`;
    ehrSection += `- DNR: ${ehrData.specialDirectives.dnr ? 'Yes' : 'No'}\n`;
    ehrSection += `- Living Will: ${ehrData.specialDirectives.livingWill ? 'Yes' : 'No'}\n`;
    ehrSection += `- Organ Donor: ${ehrData.specialDirectives.organDonor ? 'Yes' : 'No'}\n`;
    if (ehrData.specialDirectives.religiousInstructions) {
      ehrSection += `- Religious Instructions: ${ehrData.specialDirectives.religiousInstructions}\n`;
    }
  }
  
  if (ehrData.vitalSigns && ehrData.vitalSigns.length > 0) {
    const recentVitals = ehrData.vitalSigns.slice(0, 10); // Get last 10 vital sign records
    const vitalLines = recentVitals.map((vital) => {
      const parts = [];
      if (vital.heartRate?.value) parts.push(`Heart Rate: ${vital.heartRate.value} ${vital.heartRate.unit || 'bpm'}`);
      if (vital.bloodPressure?.systolic && vital.bloodPressure?.diastolic) {
        parts.push(`BP: ${vital.bloodPressure.systolic}/${vital.bloodPressure.diastolic} ${vital.bloodPressure.unit || 'mmHg'}`);
      }
      if (vital.temperature?.value) parts.push(`Temp: ${vital.temperature.value} ${vital.temperature.unit || 'C'}`);
      if (vital.oxygenSaturation?.value) parts.push(`SpO2: ${vital.oxygenSaturation.value} ${vital.oxygenSaturation.unit || '%'}`);
      if (vital.respiratoryRate?.value) parts.push(`RR: ${vital.respiratoryRate.value} ${vital.respiratoryRate.unit || 'breaths/min'}`);
      if (vital.weight?.value) parts.push(`Weight: ${vital.weight.value} ${vital.weight.unit || 'kg'}`);
      return `- ${formatDate(vital.date)} | ${parts.join(" | ")}`;
    }).join("\n");
    
    ehrSection += `\nVITAL SIGNS (Recent):\n${vitalLines}\n`;
  }

  if (ehrData.visits && ehrData.visits.length > 0) {
    const recentVisits = ehrData.visits.slice(0, 5); // Get last 5 visits
    const visitLines = recentVisits.map((visit) => {
      return `- ${formatDate(visit.date)} | ${visit.type || 'N/A'} | Provider: ${visit.provider || 'N/A'} | Reason: ${visit.reason || 'N/A'} | Diagnosis: ${visit.diagnosis || 'N/A'}`;
    }).join("\n");
    
    ehrSection += `\nRECENT VISITS:\n${visitLines}\n`;
  }

  if (ehrData.ehrMedications && ehrData.ehrMedications.length > 0) {
    const activeMeds = ehrData.ehrMedications.filter(med => !med.endDate || new Date(med.endDate) > new Date());
    const medLines = activeMeds.map((med) => {
      return `- ${med.name} (${med.dosage}) | ${med.frequency} | Prescribed by: ${med.prescribedBy || 'N/A'} | Reason: ${med.reason || 'N/A'}`;
    }).join("\n");
    
    if (medLines) {
      ehrSection += `\nEHR MEDICATIONS (Active):\n${medLines}\n`;
    }
  }

  if (ehrData.labResults && ehrData.labResults.length > 0) {
    const recentLabs = ehrData.labResults.slice(0, 5); // Get last 5 lab results
    const labLines = recentLabs.map((lab) => {
      let resultText = 'N/A';
      if (lab.results && Array.isArray(lab.results) && lab.results.length > 0) {
        resultText = lab.results.map(r => `${r.parameter}: ${r.value} ${r.unit || ''}`).join(', ');
      }
      return `- ${formatDate(lab.date)} | ${lab.testName || 'N/A'} (${lab.testType || 'N/A'}) | Results: ${resultText}`;
    }).join("\n");
    
    ehrSection += `\nRECENT LAB RESULTS:\n${labLines}\n`;
  }

  return `You are HeartWiseAI, a specialized cardiac health assistant.
Use the provided patient health tracker data and Electronic Health Record (EHR) data to create a thorough clinical-style report.
${HEARTWISE_REPORT_SCHEMA}

PATIENT SUMMARY:
- Name: ${patientName}
- Email: ${patientEmail}

HEALTH TRACKER DATA:
Activities:
${activityLines || "- None recorded"}

Meals:
${mealLines || "- None recorded"}

Medications:
${medicationLines || "- None recorded"}

${ehrSection || "EHR DATA:\nNo EHR data available for this patient.\n"}

${highlightSection}

Generate the JSON response now.`;
};

const extractJsonObject = (text) => {
  if (!text) {
    throw new Error("No response received from HeartWise AI.");
  }

  const fencedMatch = text.match(/```json([\s\S]*?)```/i);
  const jsonCandidate = fencedMatch ? fencedMatch[1] : text;

  const startIndex = jsonCandidate.indexOf("{");
  const endIndex = jsonCandidate.lastIndexOf("}");

  if (startIndex === -1 || endIndex === -1) {
    throw new Error("HeartWise AI response could not be parsed as JSON.");
  }

  const rawJson = jsonCandidate.slice(startIndex, endIndex + 1);
  return JSON.parse(rawJson);
};

const createReportPdf = async (
  report,
  {
    patientName,
    generatedAt,
    reportTitle = "HeartWise AI Patient Report",
    ehrData = {},
  } = {}
) =>
  new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const buffers = [];

    doc.on("data", (chunk) => buffers.push(chunk));
    doc.on("error", (error) => reject(error));
    doc.on("end", () => resolve(Buffer.concat(buffers)));

    // Header with better formatting
    doc.fontSize(24).font('Helvetica-Bold').text(report.title || reportTitle, { align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica').fillColor('#666666')
      .text(`Generated for: ${patientName || "Unknown patient"}`, { align: "center" });
    doc.text(`Generated at: ${generatedAt.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}`, { align: "center" });
    doc.fillColor('#000000');
    doc.moveDown();
    
    // Add a divider line
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#CCCCCC').lineWidth(1).stroke();
    doc.moveDown();

    const addSection = (heading, content) => {
      if (!content || content.length === 0) return;
      doc.fontSize(14).text(heading, { underline: true });
      doc.moveDown(0.5);
      if (Array.isArray(content)) {
        content.forEach((item) => {
          doc.fontSize(12).text(`• ${item}`);
        });
      } else {
        doc.fontSize(12).text(content);
      }
      doc.moveDown();
    };

    const formatDate = (value) => {
      if (!value) return "Unknown date";
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) {
        return value.toString();
      }
      return date.toLocaleDateString();
    };

    addSection("Patient Overview", report.patientOverview);
    addSection("Medical History", report.medicalHistory);
    addSection("Current Status", report.currentStatus);
    addSection("Medications Summary", report.medicationsSummary);

    // Add Patient Demographics Section
    if (ehrData.patientInfo) {
      doc.fontSize(14).font('Helvetica-Bold').text("Patient Demographics", { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(11).font('Helvetica');
      const age = ehrData.patientInfo.dateOfBirth 
        ? Math.floor((new Date() - new Date(ehrData.patientInfo.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000))
        : null;
      doc.text(`Name: ${ehrData.patientInfo.firstName || ''} ${ehrData.patientInfo.lastName || ''}`);
      doc.text(`Age: ${age || 'N/A'} | Gender: ${ehrData.patientInfo.gender || 'N/A'} | Blood Type: ${ehrData.patientInfo.bloodType || 'N/A'}`);
      doc.text(`Phone: ${ehrData.patientInfo.phoneNumber || 'N/A'}`);
      if (ehrData.patientInfo.address) {
        const addr = ehrData.patientInfo.address;
        const addressStr = [addr.street, addr.city, addr.state, addr.zipCode, addr.country].filter(Boolean).join(', ') || 'N/A';
        doc.text(`Address: ${addressStr}`);
      }
      doc.moveDown();
    }

    // Add Allergies Section
    if (ehrData.allergies) {
      const allAllergies = [];
      if (ehrData.allergies.medicinal && ehrData.allergies.medicinal.length > 0) {
        ehrData.allergies.medicinal.forEach(a => {
          allAllergies.push(`Medicinal: ${a.name} (${a.criticality || 'N/A'}) - ${a.reaction || 'N/A'}`);
        });
      }
      if (ehrData.allergies.environmental && ehrData.allergies.environmental.length > 0) {
        ehrData.allergies.environmental.forEach(a => {
          allAllergies.push(`Environmental: ${a.name} (${a.criticality || 'N/A'}) - ${a.reaction || 'N/A'}`);
        });
      }
      if (ehrData.allergies.food && ehrData.allergies.food.length > 0) {
        ehrData.allergies.food.forEach(a => {
          allAllergies.push(`Food: ${a.name} (${a.criticality || 'N/A'}) - ${a.reaction || 'N/A'}`);
        });
      }
      if (allAllergies.length > 0) {
        doc.fontSize(14).font('Helvetica-Bold').text("Allergies", { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(11).font('Helvetica');
        allAllergies.forEach(a => doc.text(`• ${a}`));
        doc.moveDown();
      }
    }

    // Add Social History Section
    if (ehrData.socialHistory) {
      const socialItems = [];
      if (ehrData.socialHistory.tobaccoUse) {
        socialItems.push(`Tobacco: ${ehrData.socialHistory.tobaccoUse}${ehrData.socialHistory.tobaccoType ? ` (${ehrData.socialHistory.tobaccoType})` : ''}${ehrData.socialHistory.tobaccoFrequency ? ` - ${ehrData.socialHistory.tobaccoFrequency}` : ''}`);
      }
      if (ehrData.socialHistory.alcoholUse) {
        socialItems.push(`Alcohol: ${ehrData.socialHistory.alcoholUse}${ehrData.socialHistory.alcoholType ? ` (${ehrData.socialHistory.alcoholType})` : ''}${ehrData.socialHistory.alcoholFrequency ? ` - ${ehrData.socialHistory.alcoholFrequency}` : ''}`);
      }
      if (ehrData.socialHistory.illicitDrugUse) {
        socialItems.push(`Illicit Drugs: ${ehrData.socialHistory.illicitDrugUse}${ehrData.socialHistory.drugType ? ` (${ehrData.socialHistory.drugType})` : ''}`);
      }
      if (ehrData.socialHistory.occupation) {
        socialItems.push(`Occupation: ${ehrData.socialHistory.occupation}`);
      }
      if (socialItems.length > 0) {
        doc.fontSize(14).font('Helvetica-Bold').text("Social History", { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(11).font('Helvetica');
        socialItems.forEach(item => doc.text(`• ${item}`));
        doc.moveDown();
      }
    }

    // Add Emergency Contact Section
    if (ehrData.emergencyContact) {
      doc.fontSize(14).font('Helvetica-Bold').text("Emergency Contact", { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(11).font('Helvetica');
      doc.text(`Name: ${ehrData.emergencyContact.name || 'N/A'}`);
      doc.text(`Relationship: ${ehrData.emergencyContact.relationship || 'N/A'}`);
      doc.text(`Phone: ${ehrData.emergencyContact.phoneNumber || 'N/A'}`);
      doc.moveDown();
    }

    // Add EHR Vital Signs Section with proper BP handling
    if (ehrData.vitalSigns && ehrData.vitalSigns.length > 0) {
      doc.fontSize(14).font('Helvetica-Bold').text("EHR Vital Signs (Recent)", { underline: true });
      doc.moveDown(0.5);
      const recentVitals = ehrData.vitalSigns.slice(0, 10);
      
      // Calculate statistics for vital signs
      const heartRates = recentVitals
        .filter(v => v.heartRate?.value)
        .map(v => v.heartRate.value);
      const bloodPressures = recentVitals
        .filter(v => v.bloodPressure?.systolic && v.bloodPressure?.diastolic)
        .map(v => ({ systolic: v.bloodPressure.systolic, diastolic: v.bloodPressure.diastolic }));
      
      if (heartRates.length > 0) {
        const avgHR = Math.round(heartRates.reduce((a, b) => a + b, 0) / heartRates.length);
        const minHR = Math.min(...heartRates);
        const maxHR = Math.max(...heartRates);
        doc.fontSize(11).font('Helvetica').text(`Heart Rate: Avg ${avgHR} bpm (Range: ${minHR}-${maxHR} bpm)`);
      }
      
      if (bloodPressures.length > 0) {
        const avgSys = Math.round(bloodPressures.reduce((a, b) => a + b.systolic, 0) / bloodPressures.length);
        const avgDia = Math.round(bloodPressures.reduce((a, b) => a + b.diastolic, 0) / bloodPressures.length);
        const minSys = Math.min(...bloodPressures.map(bp => bp.systolic));
        const maxSys = Math.max(...bloodPressures.map(bp => bp.systolic));
        const minDia = Math.min(...bloodPressures.map(bp => bp.diastolic));
        const maxDia = Math.max(...bloodPressures.map(bp => bp.diastolic));
        doc.text(`Blood Pressure: Avg ${avgSys}/${avgDia} mmHg (Range: ${minSys}-${maxSys}/${minDia}-${maxDia} mmHg)`);
      }
      
      doc.moveDown(0.3);
      doc.fontSize(10).font('Helvetica').fillColor('#666666').text("Recent Readings:");
      doc.fillColor('#000000');
      doc.moveDown(0.2);
      
      recentVitals.forEach((vital) => {
        const parts = [];
        if (vital.heartRate?.value) parts.push(`HR: ${vital.heartRate.value} ${vital.heartRate.unit || 'bpm'}`);
        if (vital.bloodPressure?.systolic && vital.bloodPressure?.diastolic) {
          parts.push(`BP: ${vital.bloodPressure.systolic}/${vital.bloodPressure.diastolic} ${vital.bloodPressure.unit || 'mmHg'}`);
        }
        if (vital.temperature?.value) parts.push(`Temp: ${vital.temperature.value} ${vital.temperature.unit || 'C'}`);
        if (vital.oxygenSaturation?.value) parts.push(`SpO2: ${vital.oxygenSaturation.value} ${vital.oxygenSaturation.unit || '%'}`);
        if (vital.respiratoryRate?.value) parts.push(`RR: ${vital.respiratoryRate.value} ${vital.respiratoryRate.unit || 'breaths/min'}`);
        if (vital.weight?.value) parts.push(`Weight: ${vital.weight.value} ${vital.weight.unit || 'kg'}`);
        if (parts.length > 0) {
          doc.fontSize(10).font('Helvetica').text(`• ${formatDate(vital.date)}: ${parts.join(" | ")}`);
        }
      });
      doc.moveDown();
    }

    if (ehrData.ehrMedications && ehrData.ehrMedications.length > 0) {
      doc.fontSize(14).font('Helvetica-Bold').text("EHR Medications (Active)", { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(11).font('Helvetica');
      const activeMeds = ehrData.ehrMedications.filter(med => !med.endDate || new Date(med.endDate) > new Date());
      activeMeds.forEach((med) => {
        doc.text(`• ${med.name} (${med.dosage}) - ${med.frequency} | Prescribed by: ${med.prescribedBy || 'N/A'}`);
        if (med.reason) {
          doc.fontSize(10).fillColor('#666666').text(`  Reason: ${med.reason}`, { indent: 20 });
          doc.fillColor('#000000');
        }
      });
      doc.moveDown();
    }

    // Add Special Directives Section
    if (ehrData.specialDirectives) {
      doc.fontSize(14).font('Helvetica-Bold').text("Special Directives", { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(11).font('Helvetica');
      doc.text(`Do Not Resuscitate (DNR): ${ehrData.specialDirectives.dnr ? 'Yes' : 'No'}`);
      doc.text(`Living Will: ${ehrData.specialDirectives.livingWill ? 'Yes' : 'No'}`);
      doc.text(`Organ Donor: ${ehrData.specialDirectives.organDonor ? 'Yes' : 'No'}`);
      if (ehrData.specialDirectives.religiousInstructions) {
        doc.text(`Religious Instructions: ${ehrData.specialDirectives.religiousInstructions}`);
      }
      doc.moveDown();
    }

    // Add Insurance Section
    if (ehrData.insurance && (ehrData.insurance.provider || ehrData.insurance.policyNumber)) {
      doc.fontSize(14).font('Helvetica-Bold').text("Insurance Information", { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(11).font('Helvetica');
      doc.text(`Provider: ${ehrData.insurance.provider || 'N/A'}`);
      if (ehrData.insurance.policyNumber) {
        doc.text(`Policy Number: ${ehrData.insurance.policyNumber}`);
      }
      if (ehrData.insurance.groupNumber) {
        doc.text(`Group Number: ${ehrData.insurance.groupNumber}`);
      }
      doc.moveDown();
    }

    if (ehrData.visits && ehrData.visits.length > 0) {
      doc.fontSize(14).font('Helvetica-Bold').text("Recent Medical Visits", { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(11).font('Helvetica');
      const recentVisits = ehrData.visits.slice(0, 5);
      recentVisits.forEach((visit) => {
        doc.text(`• ${formatDate(visit.date)}: ${visit.type || 'N/A'} - ${visit.provider || 'N/A'}`);
        doc.fontSize(10).fillColor('#666666');
        if (visit.reason) {
          doc.text(`  Reason: ${visit.reason}`, { indent: 20 });
        }
        if (visit.diagnosis) {
          doc.text(`  Diagnosis: ${visit.diagnosis}`, { indent: 20 });
        }
        doc.fillColor('#000000');
      });
      doc.moveDown();
    }

    if (ehrData.labResults && ehrData.labResults.length > 0) {
      doc.fontSize(14).font('Helvetica-Bold').text("Recent Lab Results", { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(11).font('Helvetica');
      const recentLabs = ehrData.labResults.slice(0, 5);
      recentLabs.forEach((lab) => {
        doc.text(`• ${formatDate(lab.date)}: ${lab.testName || 'N/A'} (${lab.testType || 'N/A'})`);
        if (lab.results && Array.isArray(lab.results) && lab.results.length > 0) {
          doc.fontSize(10).fillColor('#666666');
          lab.results.forEach(r => {
            doc.text(`  ${r.parameter}: ${r.value} ${r.unit || ''}${r.referenceRange ? ` (Ref: ${r.referenceRange})` : ''}${r.status ? ` [${r.status}]` : ''}`, { indent: 20 });
          });
          doc.fillColor('#000000');
        }
      });
      doc.moveDown();
    }

    addSection("Recommended Actions", report.recommendedActions);
    addSection("Follow-Up Plan", report.followUpPlan);

    doc.end();
  });

const createMonthlyHealthReportPdf = async (
  reportData,
  { patientName, patientAge, patientGender, patientId, month, year, generatedAt }
) =>
  new Promise((resolve, reject) => {
    const doc = new PDFDocument({ 
      margin: 40,
      size: 'A4',
      info: {
        Title: `CardioLink Monthly Health Report - ${month} ${year}`,
        Author: 'CardioLink',
        Subject: 'Monthly Health Report',
      }
    });
    const buffers = [];

    doc.on("data", (chunk) => buffers.push(chunk));
    doc.on("error", (error) => reject(error));
    doc.on("end", () => resolve(Buffer.concat(buffers)));

    // Color palette
    const lightBlue = '#E3F2FD';
    const darkBlue = '#1565C0';
    const softRed = '#EF9A9A';
    const white = '#FFFFFF';
    const gray = '#757575';
    const lightGray = '#F5F5F5';

    // Helper function to draw rounded rectangle
    const drawRoundedRect = (x, y, width, height, radius, color) => {
      doc.save();
      doc.roundedRect(x, y, width, height, radius)
        .fillColor(color)
        .fill();
      doc.restore();
    };

    // Helper function to draw card
    const drawCard = (x, y, width, height, title, value, icon = null) => {
      const cardRadius = 8;
      drawRoundedRect(x, y, width, height, cardRadius, lightBlue);
      doc.rect(x, y, width, height).strokeColor('#BBDEFB').lineWidth(1).stroke();
      
      doc.fillColor(darkBlue);
      doc.fontSize(10).text(title, x + 10, y + 8, { width: width - 20 });
      
      doc.fillColor('#000000');
      doc.fontSize(18).font('Helvetica-Bold').text(value, x + 10, y + 22, { width: width - 20 });
    };

    let yPos = 40;
    const pageHeight = 792; // A4 height in points
    const bottomMargin = 80; // Space to leave at bottom for footer
    const headingHeight = 20; // Height for section heading

    // Helper function to check if we need a new page
    const checkPageBreak = (requiredHeight) => {
      const availableSpace = pageHeight - yPos - bottomMargin;
      if (requiredHeight > availableSpace) {
        doc.addPage();
        yPos = 40;
        return true;
      }
      return false;
    };

    // Helper function to add section with page break check
    const addSectionWithBreak = (heading, contentHeight, contentCallback) => {
      const totalHeight = headingHeight + contentHeight; // heading height + content height
      
      // Check if we need a new page before adding the section
      checkPageBreak(totalHeight);
      
      // Add heading
      doc.fillColor(darkBlue);
      doc.fontSize(12).font('Helvetica-Bold').text(heading, 40, yPos);
      yPos += headingHeight;
      
      // Add content
      if (contentCallback) {
        contentCallback();
      }
    };

    // ========== HEADER ==========
    doc.save();
    drawRoundedRect(40, yPos, 515, 60, 8, darkBlue);
    doc.fillColor(white);
    doc.fontSize(24).font('Helvetica-Bold').text('CardioLink', 60, yPos + 15, { width: 200 });
    doc.fontSize(16).font('Helvetica').text('Monthly Health Report', 60, yPos + 40, { width: 200 });
    doc.fontSize(14).font('Helvetica').text(`${month} ${year}`, 400, yPos + 20, { width: 140, align: 'right' });
    doc.restore();
    yPos += 80;

    // Divider line
    doc.moveTo(40, yPos).lineTo(555, yPos).strokeColor('#BBDEFB').lineWidth(2).stroke();
    yPos += 20;

    // ========== USER INFORMATION ==========
    doc.fillColor(darkBlue);
    doc.fontSize(12).font('Helvetica-Bold').text('Patient Information', 40, yPos);
    yPos += 20;

    drawRoundedRect(40, yPos, 515, 50, 8, lightGray);
    doc.rect(40, yPos, 515, 50).strokeColor('#E0E0E0').lineWidth(1).stroke();
    
    doc.fillColor('#000000');
    doc.fontSize(10).font('Helvetica');
    doc.text(`Name: ${patientName || 'N/A'}`, 50, yPos + 8);
    doc.text(`Age: ${patientAge || 'N/A'}`, 200, yPos + 8);
    doc.text(`Gender: ${patientGender || 'N/A'}`, 300, yPos + 8);
    doc.text(`CardioLink ID: ${patientId || 'N/A'}`, 50, yPos + 28);
    doc.text(`Generated: ${generatedAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`, 300, yPos + 28);
    yPos += 70;

    // ========== ACTIVITY SUMMARY ==========
    addSectionWithBreak('Activity Summary', 120, () => {
      if (reportData.activityStats && reportData.activityStats.totalActivities > 0) {
      drawRoundedRect(40, yPos, 515, 100, 8, lightGray);
      doc.rect(40, yPos, 515, 100).strokeColor('#E0E0E0').lineWidth(1).stroke();
      
      doc.fillColor('#000000');
      doc.fontSize(10).font('Helvetica');
      doc.text(`Total Activities: ${reportData.activityStats.totalActivities}`, 50, yPos + 10);
      doc.text(`Total Duration: ${Math.round(reportData.activityStats.totalDuration)} minutes (${(reportData.activityStats.totalDuration / 60).toFixed(1)} hours)`, 50, yPos + 25);
      doc.text(`Total Distance: ${reportData.activityStats.totalDistance.toFixed(2)} km`, 50, yPos + 40);
      doc.text(`Total Calories Burned: ${Math.round(reportData.activityStats.totalCalories)} kcal`, 50, yPos + 55);
      if (reportData.activityStats.totalSteps > 0) {
        doc.text(`Total Steps: ${reportData.activityStats.totalSteps.toLocaleString()}`, 50, yPos + 70);
      }
      
      // Activity by type
      if (Object.keys(reportData.activityStats.byType).length > 0) {
        doc.fontSize(9).font('Helvetica-Bold').fillColor(darkBlue).text('Activities by Type:', 300, yPos + 10);
        let typeY = yPos + 25;
        Object.entries(reportData.activityStats.byType).slice(0, 5).forEach(([type, stats]) => {
          doc.fontSize(8).fillColor('#000000').text(`${type}: ${stats.count} times, ${Math.round(stats.totalDuration)} min, ${stats.totalDistance.toFixed(1)} km`, 300, typeY, { width: 245 });
          typeY += 15;
        });
      }
      yPos += 120;
      } else {
        doc.fillColor(gray);
        doc.fontSize(10).font('Helvetica').text('No activity data recorded this month', 50, yPos);
        yPos += 30;
      }
    });

    // ========== DIET SUMMARY ==========
    addSectionWithBreak('Diet & Nutrition Summary', 100, () => {
      if (reportData.mealStats && reportData.mealStats.totalMeals > 0) {
      drawRoundedRect(40, yPos, 515, 80, 8, lightGray);
      doc.rect(40, yPos, 515, 80).strokeColor('#E0E0E0').lineWidth(1).stroke();
      
      doc.fillColor('#000000');
      doc.fontSize(10).font('Helvetica');
      doc.text(`Total Meals Logged: ${reportData.mealStats.totalMeals}`, 50, yPos + 10);
      doc.text(`Total Calories: ${Math.round(reportData.mealStats.totalCalories)} kcal`, 50, yPos + 25);
      doc.text(`Total Saturated Fat: ${reportData.mealStats.totalSaturatedFat.toFixed(1)} g`, 50, yPos + 40);
      doc.text(`Total Cholesterol: ${Math.round(reportData.mealStats.totalCholesterol)} mg`, 50, yPos + 55);
      
      // Meals by type
      if (Object.keys(reportData.mealStats.byMealType).length > 0) {
        doc.fontSize(9).font('Helvetica-Bold').fillColor(darkBlue).text('Meals by Type:', 300, yPos + 10);
        let mealY = yPos + 25;
        Object.entries(reportData.mealStats.byMealType).forEach(([mealType, stats]) => {
          doc.fontSize(8).fillColor('#000000').text(`${mealType}: ${stats.count} meals, ${Math.round(stats.totalCalories)} kcal`, 300, mealY, { width: 245 });
          mealY += 15;
        });
      }
      yPos += 100;
      } else {
        doc.fillColor(gray);
        doc.fontSize(10).font('Helvetica').text('No meal data recorded this month', 50, yPos);
        yPos += 30;
      }
    });

    // ========== MEDICATION SUMMARY ==========
    const medicationHeight = reportData.medicationStats && reportData.medicationStats.totalMedications > 0
      ? 80 + (Object.keys(reportData.medicationStats.byMedication).length * 15)
      : 30;
    addSectionWithBreak('Medication Summary', medicationHeight, () => {
      if (reportData.medicationStats && reportData.medicationStats.totalMedications > 0) {
      drawRoundedRect(40, yPos, 515, 60 + (Object.keys(reportData.medicationStats.byMedication).length * 15), 8, lightGray);
      doc.rect(40, yPos, 515, 60 + (Object.keys(reportData.medicationStats.byMedication).length * 15)).strokeColor('#E0E0E0').lineWidth(1).stroke();
      
      doc.fillColor('#000000');
      doc.fontSize(10).font('Helvetica');
      doc.text(`Total Medication Entries: ${reportData.medicationStats.totalMedications}`, 50, yPos + 10);
      doc.text(`Unique Medications: ${reportData.medicationStats.uniqueMedications.size}`, 50, yPos + 25);
      doc.text(`Reminders Enabled: ${reportData.medicationStats.remindersEnabled}`, 50, yPos + 40);
      
      // Medications list
      if (Object.keys(reportData.medicationStats.byMedication).length > 0) {
        doc.fontSize(9).font('Helvetica-Bold').fillColor(darkBlue).text('Medications Taken:', 50, yPos + 55);
        let medY = yPos + 70;
        Object.entries(reportData.medicationStats.byMedication).forEach(([name, stats]) => {
          doc.fontSize(8).fillColor('#000000').text(`• ${name} (${stats.dosage}) - ${stats.frequency} - ${stats.count} times`, 55, medY, { width: 500 });
          medY += 12;
        });
      }
      yPos += 80 + (Object.keys(reportData.medicationStats.byMedication).length * 15);
      } else {
        doc.fillColor(gray);
        doc.fontSize(10).font('Helvetica').text('No medication data recorded this month', 50, yPos);
        yPos += 30;
      }
    });

    // ========== VITAL SIGNS SUMMARY ==========
    const vitalHeight = reportData.vitalStats ? 120 : 30;
    addSectionWithBreak('Vital Signs Summary (EHR)', vitalHeight, () => {
      if (reportData.vitalStats) {
      const vitalHeight = 120;
      drawRoundedRect(40, yPos, 515, vitalHeight, 8, lightGray);
      doc.rect(40, yPos, 515, vitalHeight).strokeColor('#E0E0E0').lineWidth(1).stroke();
      
      doc.fillColor('#000000');
      doc.fontSize(10).font('Helvetica');
      let vitalY = yPos + 10;
      
      // Heart Rate
      if (reportData.vitalStats.heartRate && reportData.vitalStats.heartRate.total > 0) {
        doc.text(`Heart Rate: ${reportData.vitalStats.heartRate.avg} bpm (Range: ${reportData.vitalStats.heartRate.min}-${reportData.vitalStats.heartRate.max} bpm) | Total Readings: ${reportData.vitalStats.heartRate.total}`, 50, vitalY);
        if (reportData.vitalStats.heartRate.abnormal > 0) {
          doc.fillColor(softRed).text(`⚠️ Abnormal Readings: ${reportData.vitalStats.heartRate.abnormal}`, 50, vitalY + 15);
          doc.fillColor('#000000');
        }
        vitalY += 30;
      }
      
      // Blood Pressure (only if data exists)
      if (reportData.vitalStats.bloodPressure && reportData.vitalStats.bloodPressure.total > 0) {
        doc.text(`Blood Pressure: Avg ${reportData.vitalStats.bloodPressure.avgSystolic}/${reportData.vitalStats.bloodPressure.avgDiastolic} mmHg`, 50, vitalY);
        doc.text(`Range: ${reportData.vitalStats.bloodPressure.minSystolic}-${reportData.vitalStats.bloodPressure.maxSystolic}/${reportData.vitalStats.bloodPressure.minDiastolic}-${reportData.vitalStats.bloodPressure.maxDiastolic} mmHg | Total Readings: ${reportData.vitalStats.bloodPressure.total}`, 50, vitalY + 15);
        vitalY += 30;
      }
      
      // SpO2
      if (reportData.vitalStats.spO2 && reportData.vitalStats.spO2.total > 0) {
        doc.text(`SpO2 (Oxygen Saturation): ${reportData.vitalStats.spO2.avg}% (Range: ${reportData.vitalStats.spO2.min}-${reportData.vitalStats.spO2.max}%) | Total Readings: ${reportData.vitalStats.spO2.total}`, 50, vitalY);
        vitalY += 20;
      }
      
      // Temperature
      if (reportData.vitalStats.temperature && reportData.vitalStats.temperature.total > 0) {
        doc.text(`Temperature: Avg ${reportData.vitalStats.temperature.avg}°C (Range: ${reportData.vitalStats.temperature.min}-${reportData.vitalStats.temperature.max}°C) | Total Readings: ${reportData.vitalStats.temperature.total}`, 50, vitalY);
        vitalY += 20;
      }
      
      // Weight
      if (reportData.vitalStats.weight && reportData.vitalStats.weight.total > 0) {
        doc.text(`Weight: Avg ${reportData.vitalStats.weight.avg} kg (Range: ${reportData.vitalStats.weight.min}-${reportData.vitalStats.weight.max} kg) | Total Readings: ${reportData.vitalStats.weight.total}`, 50, vitalY);
      }
      
      yPos += vitalHeight + 10;
      } else {
        doc.fillColor(gray);
        doc.fontSize(10).font('Helvetica').text('No vital signs data recorded this month', 50, yPos);
        yPos += 30;
      }
    });

    // ========== EHR DATA SECTIONS ==========
    const ehrData = reportData.ehrData || {};
    
    // Allergies
    if (ehrData.allergies) {
      const allAllergies = [];
      if (ehrData.allergies.medicinal && ehrData.allergies.medicinal.length > 0) {
        ehrData.allergies.medicinal.forEach(a => allAllergies.push(`Medicinal: ${a.name} (${a.criticality || 'N/A'})`));
      }
      if (ehrData.allergies.environmental && ehrData.allergies.environmental.length > 0) {
        ehrData.allergies.environmental.forEach(a => allAllergies.push(`Environmental: ${a.name} (${a.criticality || 'N/A'})`));
      }
      if (ehrData.allergies.food && ehrData.allergies.food.length > 0) {
        ehrData.allergies.food.forEach(a => allAllergies.push(`Food: ${a.name} (${a.criticality || 'N/A'})`));
      }
      
      if (allAllergies.length > 0) {
        const allergyHeight = 20 + (allAllergies.length * 12);
        addSectionWithBreak('Allergies', allergyHeight, () => {
          drawRoundedRect(40, yPos, 515, 20 + (allAllergies.length * 12), 8, lightGray);
          doc.rect(40, yPos, 515, 20 + (allAllergies.length * 12)).strokeColor('#E0E0E0').lineWidth(1).stroke();
          doc.fillColor('#000000');
          doc.fontSize(9).font('Helvetica');
          allAllergies.forEach((a, idx) => {
            doc.text(`• ${a}`, 50, yPos + 10 + (idx * 12), { width: 495 });
          });
          yPos += 30 + (allAllergies.length * 12);
        });
      }
    }

    // Medical Visits
    if (ehrData.visits && ehrData.visits.length > 0) {
      const visitHeight = 20 + (ehrData.visits.length * 35);
      addSectionWithBreak('Medical Visits This Month', visitHeight, () => {
        drawRoundedRect(40, yPos, 515, 20 + (ehrData.visits.length * 35), 8, lightGray);
        doc.rect(40, yPos, 515, 20 + (ehrData.visits.length * 35)).strokeColor('#E0E0E0').lineWidth(1).stroke();
        doc.fillColor('#000000');
        doc.fontSize(9).font('Helvetica');
        ehrData.visits.forEach((visit, idx) => {
          const visitDate = new Date(visit.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
          doc.text(`• ${visitDate}: ${visit.type || 'N/A'} - ${visit.provider || 'N/A'}`, 50, yPos + 10 + (idx * 35), { width: 495 });
          if (visit.reason) doc.text(`  Reason: ${visit.reason}`, 55, yPos + 22 + (idx * 35), { width: 490 });
          if (visit.diagnosis) doc.text(`  Diagnosis: ${visit.diagnosis}`, 55, yPos + 32 + (idx * 35), { width: 490 });
        });
        yPos += 40 + (ehrData.visits.length * 35);
      });
    }

    // EHR Medications
    if (ehrData.ehrMedications && ehrData.ehrMedications.length > 0) {
      const activeMeds = ehrData.ehrMedications.filter(med => !med.endDate || new Date(med.endDate) > new Date());
      if (activeMeds.length > 0) {
        const medHeight = 20 + (activeMeds.length * 15);
        addSectionWithBreak('Active Medications (EHR)', medHeight, () => {
          drawRoundedRect(40, yPos, 515, 20 + (activeMeds.length * 15), 8, lightGray);
          doc.rect(40, yPos, 515, 20 + (activeMeds.length * 15)).strokeColor('#E0E0E0').lineWidth(1).stroke();
          doc.fillColor('#000000');
          doc.fontSize(9).font('Helvetica');
          activeMeds.forEach((med, idx) => {
            doc.text(`• ${med.name} (${med.dosage}) - ${med.frequency} | Prescribed by: ${med.prescribedBy || 'N/A'}`, 50, yPos + 10 + (idx * 15), { width: 495 });
          });
          yPos += 30 + (activeMeds.length * 15);
        });
      }
    }

    // Lab Results
    if (ehrData.labResults && ehrData.labResults.length > 0) {
      let labHeight = 20;
      ehrData.labResults.forEach(lab => {
        labHeight += 30;
        if (lab.results && Array.isArray(lab.results) && lab.results.length > 0) {
          labHeight += lab.results.length * 12;
        }
      });
      addSectionWithBreak('Lab Results This Month', labHeight, () => {
        drawRoundedRect(40, yPos, 515, labHeight, 8, lightGray);
        doc.rect(40, yPos, 515, labHeight).strokeColor('#E0E0E0').lineWidth(1).stroke();
        doc.fillColor('#000000');
        doc.fontSize(9).font('Helvetica');
        let labY = yPos + 10;
        ehrData.labResults.forEach((lab) => {
          const labDate = new Date(lab.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
          doc.text(`• ${labDate}: ${lab.testName || 'N/A'} (${lab.testType || 'N/A'})`, 50, labY, { width: 495 });
          labY += 15;
          if (lab.results && Array.isArray(lab.results) && lab.results.length > 0) {
            lab.results.forEach(r => {
              doc.fontSize(8).fillColor('#666666').text(`  ${r.parameter}: ${r.value} ${r.unit || ''}${r.status ? ` [${r.status}]` : ''}`, 55, labY, { width: 490 });
              labY += 12;
            });
          }
          labY += 5;
        });
        doc.fillColor('#000000');
        yPos += labHeight + 10;
      });
    }

    // ========== INSIGHTS & AI SUMMARY ==========
    addSectionWithBreak('AI Insights & Summary', 140, () => {
      drawRoundedRect(40, yPos, 515, 120, 8, lightBlue);
      doc.rect(40, yPos, 515, 120).strokeColor('#BBDEFB').lineWidth(1).stroke();
      
      doc.fillColor('#000000');
      doc.fontSize(10).font('Helvetica');
      let insightY = yPos + 10;
      
      if (reportData.overallCondition) {
        doc.fontSize(10).font('Helvetica-Bold').text('Overall Cardiac Condition:', 50, insightY);
        insightY += 15;
        doc.fontSize(9).font('Helvetica').text(reportData.overallCondition, 50, insightY, { width: 495 });
        insightY += 20;
      }

      if (reportData.keyObservations && reportData.keyObservations.length > 0) {
        doc.fontSize(10).font('Helvetica-Bold').text('Key Observations:', 50, insightY);
        insightY += 15;
        reportData.keyObservations.slice(0, 3).forEach(obs => {
          doc.fontSize(9).text(`• ${obs}`, 55, insightY, { width: 490 });
          insightY += 12;
        });
        insightY += 5;
      }

      if (reportData.recommendedActions && reportData.recommendedActions.length > 0) {
        doc.fontSize(10).font('Helvetica-Bold').fillColor(darkBlue).text('Recommended Actions:', 50, insightY);
        insightY += 15;
        reportData.recommendedActions.slice(0, 2).forEach(action => {
          doc.fontSize(9).fillColor('#000000').text(`→ ${action}`, 55, insightY, { width: 490 });
          insightY += 12;
        });
      }
      yPos += 140;
    });

    if (reportData.heartRisk) {
      const riskBlockHeight = 160;
      addSectionWithBreak('AI Heart Disease Risk', riskBlockHeight, () => {
        const risk = reportData.heartRisk;
        const probability = typeof risk.probability === "number" ? risk.probability : 0;
        const percent = Math.round(probability * 100);
        const riskLevelLabel = (risk.riskLevel || "Unknown").toUpperCase();
        let riskColor = '#16A34A';
        if (probability >= 0.6) riskColor = '#DC2626';
        else if (probability >= 0.3) riskColor = '#F59E0B';

        drawRoundedRect(40, yPos, 515, 140, 8, white);
        doc.rect(40, yPos, 515, 140).strokeColor('#E0E0E0').lineWidth(1).stroke();

        doc.fontSize(28).font('Helvetica-Bold').fillColor(riskColor).text(`${percent}%`, 55, yPos + 15);
        doc.fontSize(12).font('Helvetica-Bold').fillColor('#0F172A').text(`Risk Level: ${riskLevelLabel}`, 55, yPos + 55);
        doc.fontSize(9).font('Helvetica').fillColor('#4B5563').text(
          'AI score derived from your vitals, labs, and lifestyle tracking over the last 30 days.',
          55,
          yPos + 75,
          { width: 200 }
        );

        const factors = risk.contributingFactors && typeof risk.contributingFactors === "object"
          ? Object.entries(risk.contributingFactors).slice(0, 4)
          : [];
        doc.fontSize(11).font('Helvetica-Bold').fillColor(darkBlue).text('Top Drivers', 280, yPos + 15);
        doc.fontSize(9).font('Helvetica').fillColor('#111827');
        if (factors.length) {
          let factorY = yPos + 32;
          factors.forEach(([label, value]) => {
            doc.text(`• ${label}: ${value}`, 285, factorY, { width: 250 });
            factorY += 14;
          });
        } else {
          doc.text('Data insufficient to highlight key drivers.', 285, yPos + 35, { width: 250 });
        }

        const recommendations = Array.isArray(risk.recommendations) ? risk.recommendations.slice(0, 2) : [];
        doc.fontSize(11).font('Helvetica-Bold').fillColor(darkBlue).text('Precautions', 280, yPos + 95);
        doc.fontSize(9).font('Helvetica').fillColor('#111827');
        if (recommendations.length) {
          let recY = yPos + 112;
          recommendations.forEach((rec) => {
            doc.text(`→ ${rec}`, 285, recY, { width: 250 });
            recY += 12;
          });
        } else {
          doc.text('Maintain heart-healthy diet, exercise, and regular checkups.', 285, yPos + 110, { width: 250 });
        }

        yPos += 150;
      });
    }

    // ========== DOCTOR'S NOTE ==========
    addSectionWithBreak("Doctor's Note", 70, () => {

      drawRoundedRect(40, yPos, 515, 50, 8, white);
      doc.rect(40, yPos, 515, 50).strokeColor('#E0E0E0').lineWidth(1).stroke();
      
      doc.fillColor(gray);
      doc.fontSize(10).font('Helvetica');
      if (reportData.doctorNote && reportData.doctorNote.trim()) {
        doc.text(reportData.doctorNote, 50, yPos + 15, { width: 495 });
      } else {
        doc.text('— No remarks for this month —', 50, yPos + 15, { width: 495, align: 'center' });
      }
      yPos += 70;
    });

    // ========== FOOTER ==========
    const footerY = 750;
    doc.moveTo(40, footerY).lineTo(555, footerY).strokeColor('#E0E0E0').lineWidth(1).stroke();
    
    doc.fillColor(gray);
    doc.fontSize(8).font('Helvetica');
    doc.text('CardioLink - Your Trusted Cardiac Health Companion', 40, footerY + 10, { width: 515, align: 'center' });
    doc.text('Support: support@cardiolink.com | This report is auto-generated and informational only.', 40, footerY + 25, { width: 515, align: 'center' });

    doc.end();
  });

const collectHeartRiskInputs = async (userId) => {
  const user = await User.findById(userId)
    .select("name email age gender dateOfBirth socialHistory")
    .lean();

  if (!user) {
    return null;
  }

  let age = user.age;
  if (!age && user.dateOfBirth) {
    const birthDate = new Date(user.dateOfBirth);
    const today = new Date();
    age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
  }

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentVitalSigns = await VitalSign.find({
    patientId: userId,
    date: { $gte: thirtyDaysAgo },
  })
    .sort({ date: -1 })
    .lean();

  let heartRateSum = 0;
  let heartRateCount = 0;
  let systolicSum = 0;
  let diastolicSum = 0;
  let bpCount = 0;
  let spO2Sum = 0;
  let spO2Count = 0;
  let tempSum = 0;
  let tempCount = 0;
  let weightSum = 0;
  let weightCount = 0;
  let heightSum = 0;
  let heightCount = 0;

  recentVitalSigns.forEach((vs) => {
    if (vs.heartRate?.value) {
      heartRateSum += vs.heartRate.value;
      heartRateCount++;
    }
    if (vs.bloodPressure?.systolic) {
      systolicSum += vs.bloodPressure.systolic;
      bpCount++;
    }
    if (vs.bloodPressure?.diastolic) {
      diastolicSum += vs.bloodPressure.diastolic;
    }
    if (vs.oxygenSaturation?.value) {
      spO2Sum += vs.oxygenSaturation.value;
      spO2Count++;
    }
    if (vs.temperature?.value) {
      tempSum += vs.temperature.value;
      tempCount++;
    }
    if (vs.weight?.value) {
      weightSum += vs.weight.value;
      weightCount++;
    }
    if (vs.height?.value) {
      heightSum += vs.height.value;
      heightCount++;
    }
  });

  const avgHeartRate = heartRateCount ? heartRateSum / heartRateCount : null;
  const avgSystolicBP = bpCount ? systolicSum / bpCount : null;
  const avgDiastolicBP = bpCount ? diastolicSum / bpCount : null;
  const avgSpO2 = spO2Count ? spO2Sum / spO2Count : null;
  const avgTemperature = tempCount ? tempSum / tempCount : null;
  const avgWeight = weightCount ? weightSum / weightCount : null;
  const avgHeight = heightCount ? heightSum / heightCount : null;

  let bmi = null;
  if (avgWeight && avgHeight) {
    const heightMeters = avgHeight / 100;
    if (heightMeters > 0) {
      bmi = avgWeight / (heightMeters * heightMeters);
    }
  }

  const latestLabResult = await LabResult.findOne({ patientId: userId })
    .sort({ date: -1 })
    .lean();

  let totalCholesterol = null;
  let ldlCholesterol = null;
  let hdlCholesterol = null;

  if (latestLabResult?.results && Array.isArray(latestLabResult.results)) {
    latestLabResult.results.forEach((result) => {
      const param = result.parameter?.toLowerCase() || "";
      const value = parseFloat(result.value);
      if (Number.isFinite(value)) {
        if (param.includes("total cholesterol") || param.includes("cholesterol total")) {
          totalCholesterol = value;
        } else if (param.includes("ldl")) {
          ldlCholesterol = value;
        } else if (param.includes("hdl")) {
          hdlCholesterol = value;
        }
      }
    });
  }

  const trackerActivities = await HealthTrackerEntry.find({
    userId,
    entryType: "activity",
    recordedAt: { $gte: thirtyDaysAgo },
  })
    .sort({ recordedAt: -1 })
    .lean();

  let exerciseFrequency = 0;
  let totalExerciseMinutes = 0;

  trackerActivities.forEach((entry) => {
    if (entry.activity) {
      exerciseFrequency++;
      if (entry.activity.duration) {
        totalExerciseMinutes += entry.activity.duration;
      }
    }
  });

  let smokingStatus = "unknown";
  if (user.socialHistory?.smoking !== undefined) {
    const raw = user.socialHistory.smoking;
    smokingStatus = raw === true || raw === "yes" ? "yes" : "no";
  }

  const healthData = {
    age: age || null,
    gender: user.gender || null,
    heartRate: avgHeartRate ? Math.round(avgHeartRate) : null,
    systolicBP: avgSystolicBP ? Math.round(avgSystolicBP) : null,
    diastolicBP: avgDiastolicBP ? Math.round(avgDiastolicBP) : null,
    spO2: avgSpO2 ? Math.round(avgSpO2) : null,
    temperature: avgTemperature ? parseFloat(avgTemperature.toFixed(1)) : null,
    weight: avgWeight ? parseFloat(avgWeight.toFixed(1)) : null,
    height: avgHeight ? parseFloat(avgHeight.toFixed(1)) : null,
    bmi: bmi ? parseFloat(bmi.toFixed(1)) : null,
    totalCholesterol: totalCholesterol ? Math.round(totalCholesterol) : null,
    ldlCholesterol: ldlCholesterol ? Math.round(ldlCholesterol) : null,
    hdlCholesterol: hdlCholesterol ? Math.round(hdlCholesterol) : null,
    smokingStatus,
    exerciseFrequency,
    averageExerciseMinutesPerWeek:
      exerciseFrequency > 0 ? Math.round(totalExerciseMinutes / (30 / 7)) : 0,
  };

  return {
    patient: {
      name: user.name,
      email: user.email,
    },
    healthData,
  };
};

const evaluateHeartRisk = async (healthData) => {
  if (!healthData) {
    return null;
  }

  const prompt = `You are a medical AI assistant specializing in cardiovascular health risk assessment. Analyze the following patient health data and provide a heart disease risk prediction.

PATIENT HEALTH DATA:
- Age: ${healthData.age || "Not provided"}
- Gender: ${healthData.gender || "Not provided"}
- Heart Rate (bpm): ${healthData.heartRate || "Not provided"}
- Blood Pressure: ${
    healthData.systolicBP
      ? `${healthData.systolicBP}/${healthData.diastolicBP || "?"}`
      : "Not provided"
  } mmHg
- SpO2 (%): ${healthData.spO2 || "Not provided"}
- Temperature (°C): ${healthData.temperature || "Not provided"}
- Weight (kg): ${healthData.weight || "Not provided"}
- Height (cm): ${healthData.height || "Not provided"}
- BMI: ${healthData.bmi || "Not provided"}
- Total Cholesterol (mg/dL): ${healthData.totalCholesterol || "Not provided"}
- LDL Cholesterol (mg/dL): ${healthData.ldlCholesterol || "Not provided"}
- HDL Cholesterol (mg/dL): ${healthData.hdlCholesterol || "Not provided"}
- Smoking Status: ${healthData.smokingStatus}
- Exercise Frequency (last 30 days): ${healthData.exerciseFrequency} sessions
- Average Exercise Minutes per Week: ${healthData.averageExerciseMinutesPerWeek} minutes

Based on established medical research and risk factors for heart disease, provide a comprehensive analysis in JSON format:

{
  "probability": <number between 0 and 1 representing the risk probability>,
  "riskLevel": "<low|moderate|high>",
  "insights": [
    "<insight 1>",
    "<insight 2>",
    "<insight 3>"
  ],
  "recommendations": [
    "<recommendation 1>",
    "<recommendation 2>",
    "<recommendation 3>"
  ],
  "contributingFactors": {
    "<factor name>": "<factor value or description>"
  }
}

Important considerations:
- Use standard medical risk factors (age, gender, cholesterol, blood pressure, BMI, smoking, exercise)
- Probability should be based on clinical risk assessment
- Provide actionable recommendations
- Be clear that this is for informational purposes and professional medical consultation is essential
- Consider missing data appropriately (don't penalize for missing optional data)

Respond ONLY with valid JSON, no additional text.`;

  const modelsToTry = [
    process.env.GEMINI_HEARTWISE_MODEL,
    "gemini-1.5-pro-latest",
    "gemini-1.5-flash-latest",
    "gemini-1.5-pro",
    "gemini-1.5-flash",
  ].filter(Boolean);

  for (const modelName of modelsToTry) {
    try {
      const model = getHeartWiseModel(modelName);
      const result = await model.generateContent(prompt);
      const responseText = result?.response?.text();

      if (responseText) {
        const parsed = extractJsonObject(responseText);
        if (parsed) {
          return {
            ...parsed,
            probability: parsed.probability
              ? parseFloat(Number(parsed.probability).toFixed(2))
              : null,
            healthData,
          };
        }
      }
    } catch (error) {
      console.log(`Heart risk model ${modelName} failed:`, error.message);
      continue;
    }
  }

  // Fallback simple assessment
  let riskScore = 0;
  const factors = {};

  if (healthData.age) {
    if (healthData.age >= 65) riskScore += 0.3;
    else if (healthData.age >= 45) riskScore += 0.2;
    else if (healthData.age >= 35) riskScore += 0.1;
    factors["Age"] = `${healthData.age} years`;
  }

  if (healthData.gender === "male") {
    riskScore += 0.1;
    factors["Gender"] = "Male (higher risk)";
  }

  if (healthData.systolicBP) {
    if (healthData.systolicBP >= 140) {
      riskScore += 0.2;
      factors["Blood Pressure"] = "High";
    } else if (healthData.systolicBP >= 120) {
      riskScore += 0.1;
      factors["Blood Pressure"] = "Elevated";
    }
  }

  if (healthData.bmi) {
    if (healthData.bmi >= 30) {
      riskScore += 0.2;
      factors["BMI"] = `Obesity (${healthData.bmi})`;
    } else if (healthData.bmi >= 25) {
      riskScore += 0.1;
      factors["BMI"] = `Overweight (${healthData.bmi})`;
    }
  }

  if (healthData.totalCholesterol && healthData.totalCholesterol >= 240) {
    riskScore += 0.15;
    factors["Cholesterol"] = "High";
  }

  if (healthData.smokingStatus === "yes") {
    riskScore += 0.2;
    factors["Smoking"] = "Yes";
  }

  if (
    typeof healthData.exerciseFrequency === "number" &&
    healthData.exerciseFrequency < 3
  ) {
    riskScore += 0.1;
    factors["Exercise"] = "Insufficient";
  }

  const probability = Math.min(riskScore, 0.95);

  let riskLevel = "low";
  if (probability >= 0.6) riskLevel = "high";
  else if (probability >= 0.3) riskLevel = "moderate";

  return {
    probability: parseFloat(probability.toFixed(2)),
    riskLevel,
    insights: [
      `Based on available health data, your heart disease risk is ${riskLevel}.`,
      healthData.age
        ? "Age remains a key cardiovascular risk indicator."
        : "Age information can improve accuracy.",
      healthData.systolicBP
        ? "Blood pressure trends are included in the assessment."
        : "Add regular blood pressure measurements for better insights.",
    ],
    recommendations: [
      "Consult a cardiologist if symptoms such as chest pain or breathlessness occur.",
      "Maintain 150 minutes of moderate exercise per week.",
      "Track blood pressure and lipid panels at least twice a year.",
    ],
    contributingFactors: factors,
    healthData,
  };
};

const calculateHeartRiskSummary = async (userId) => {
  try {
    const snapshot = await collectHeartRiskInputs(userId);
    if (!snapshot) {
      return null;
    }

    const aiResult = await evaluateHeartRisk(snapshot.healthData);
    return aiResult;
  } catch (error) {
    console.error("Failed to calculate heart risk summary:", error);
    return null;
  }
};

export const createHealthTrackerEntry = async (req, res) => {
  try {
    const { entryType, payload, recordedAt, entries } = req.body || {};

    if (Array.isArray(entries) && entries.length > 0) {
      const preparedEntries = [];
      for (const item of entries) {
        const { entryType: type, payload: itemPayload, recordedAt: itemRecordedAt } =
          item;
        const sanitized = sanitizePayload(type, itemPayload);
        if (!type || !sanitized) {
          continue;
        }
        preparedEntries.push({
          userId: new mongoose.Types.ObjectId(req.userId),
          user: buildUserSnapshot(req.user),
          entryType: type,
          [`${type}`]: sanitized,
          recordedAt: itemRecordedAt ? new Date(itemRecordedAt) : sanitized.date || new Date(),
        });
      }

      if (!preparedEntries.length) {
        return res.status(400).json({
          success: false,
          message: "No valid entries provided for bulk save",
        });
      }

      const created = await HealthTrackerEntry.insertMany(preparedEntries);
      return res.status(201).json({
        success: true,
        data: created.map((entry) => formatEntry(entry)),
        message: "Entries saved successfully",
      });
    }

    if (!entryType) {
      return res.status(400).json({
        success: false,
        message: "entryType is required",
      });
    }

    const sanitizedPayload = sanitizePayload(entryType, payload);
    if (!sanitizedPayload) {
      return res.status(400).json({
        success: false,
        message: "Invalid payload for entry type",
      });
    }

    const doc = await HealthTrackerEntry.create({
      userId: new mongoose.Types.ObjectId(req.userId),
      user: buildUserSnapshot(req.user),
      entryType,
      [entryType]: sanitizedPayload,
      recordedAt: recordedAt
        ? new Date(recordedAt)
        : sanitizedPayload.date || new Date(),
    });

    return res.status(201).json({
      success: true,
      data: formatEntry(doc.toObject()),
      message: "Entry saved successfully",
    });
  } catch (error) {
    console.error("Error creating health tracker entry:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to save entry",
      error: error.message,
    });
  }
};

export const getHealthTrackerEntries = async (req, res) => {
  try {
    const { entryType, limit } = req.query;
    const filter = {
      userId: new mongoose.Types.ObjectId(req.userId),
    };

    if (entryType) {
      filter.entryType = entryType;
    }

    const query = HealthTrackerEntry.find(filter).sort({ recordedAt: -1 });

    if (limit) {
      const parsedLimit = parseInt(limit, 10);
      if (!Number.isNaN(parsedLimit) && parsedLimit > 0) {
        query.limit(parsedLimit);
      }
    }

    const entries = await query.lean();

    const formatted = entries.map((entry) => formatEntry(entry));

    if (entryType) {
      return res.status(200).json({
        success: true,
        data: formatted,
      });
    }

    const grouped = {
      activities: [],
      meals: [],
      medications: [],
    };

    formatted.forEach((entry) => {
      if (!entry) return;

      switch (entry.entryType) {
        case "activity":
          grouped.activities.push(entry);
          break;
        case "meal":
          grouped.meals.push(entry);
          break;
        case "medication":
          grouped.medications.push(entry);
          break;
        default:
          break;
      }
    });

    return res.status(200).json({
      success: true,
      data: grouped,
    });
  } catch (error) {
    console.error("Error fetching health tracker entries:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch health tracker entries",
      error: error.message,
    });
  }
};

export const updateHealthTrackerEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const { payload, recordedAt } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid entry id",
      });
    }

    const entry = await HealthTrackerEntry.findOne({
      _id: id,
      userId: new mongoose.Types.ObjectId(req.userId),
    });

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: "Entry not found",
      });
    }

    if (recordedAt) {
      entry.recordedAt = new Date(recordedAt);
    }

    if (payload && typeof payload === "object") {
      switch (entry.entryType) {
        case "activity": {
          const currentActivity =
            entry.activity && typeof entry.activity.toObject === "function"
              ? entry.activity.toObject()
              : entry.activity || {};
          const sanitized = sanitizePayload("activity", {
            ...currentActivity,
            ...payload,
          });
          if (sanitized) {
            entry.activity = sanitized;
          }
          break;
        }
        case "meal": {
          const currentMeal =
            entry.meal && typeof entry.meal.toObject === "function"
              ? entry.meal.toObject()
              : entry.meal || {};
          const sanitized = sanitizePayload("meal", {
            ...currentMeal,
            ...payload,
          });
          if (sanitized) {
            entry.meal = sanitized;
          }
          break;
        }
        case "medication": {
          const currentMedication =
            entry.medication && typeof entry.medication.toObject === "function"
              ? entry.medication.toObject()
              : entry.medication || {};
          const merged = {
            ...currentMedication,
            ...payload,
          };
          const sanitized = sanitizePayload("medication", merged);
          if (sanitized) {
            entry.medication = sanitized;
          }
          break;
        }
        default:
          break;
      }
    }

    await entry.save();

    return res.status(200).json({
      success: true,
      data: formatEntry(entry.toObject()),
      message: "Entry updated successfully",
    });
  } catch (error) {
    console.error("Error updating health tracker entry:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update entry",
      error: error.message,
    });
  }
};

export const deleteHealthTrackerEntry = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid entry id",
      });
    }

    const deleted = await HealthTrackerEntry.findOneAndDelete({
      _id: id,
      userId: new mongoose.Types.ObjectId(req.userId),
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Entry not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Entry deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting health tracker entry:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete entry",
      error: error.message,
    });
  }
};

export const generateHealthTrackerReport = async (req, res) => {
  try {
    const { entryId } = req.body || {};

    const entries = await HealthTrackerEntry.find({
      userId: new mongoose.Types.ObjectId(req.userId),
    })
      .sort({ recordedAt: 1 })
      .lean();

    if (!entries.length) {
      return res.status(404).json({
        success: false,
        message: "No health tracker data found for this patient.",
      });
    }

    const focusEntryId =
      entryId && mongoose.Types.ObjectId.isValid(entryId)
        ? entryId.toString()
        : null;

    const { groupedEntries, highlightedEntry } = formatEntriesForPrompt(
      entries,
      focusEntryId
    );

    const patientSnapshot =
      highlightedEntry?.data?.user ||
      entries
        .map((entry) => entry.user)
        .find((snapshot) => snapshot && Object.keys(snapshot).length > 0) ||
      buildUserSnapshot(req.user);

    // Fetch EHR data for the patient
    const patientId = new mongoose.Types.ObjectId(req.userId);
    const ehrData = {
      vitalSigns: [],
      visits: [],
      ehrMedications: [],
      labResults: [],
      patientInfo: null,
      allergies: null,
      socialHistory: null,
      insurance: null,
      emergencyContact: null,
      specialDirectives: null,
    };

    try {
      // Fetch full patient data from User model
      const patient = await User.findById(patientId)
        .select('firstName lastName dateOfBirth gender email phoneNumber address allergies socialHistory insurance emergencyContact specialDirectives bloodType')
        .lean();
      
      if (patient) {
        ehrData.patientInfo = {
          firstName: patient.firstName,
          lastName: patient.lastName,
          dateOfBirth: patient.dateOfBirth,
          gender: patient.gender,
          email: patient.email,
          phoneNumber: patient.phoneNumber,
          address: patient.address,
          bloodType: patient.bloodType,
        };
        ehrData.allergies = patient.allergies || null;
        ehrData.socialHistory = patient.socialHistory || null;
        ehrData.insurance = patient.insurance || null;
        ehrData.emergencyContact = patient.emergencyContact || null;
        ehrData.specialDirectives = patient.specialDirectives || null;
      }

      // Fetch vital signs (most recent 20 records)
      const vitalSigns = await VitalSign.find({ patientId })
        .sort({ date: -1 })
        .limit(20)
        .lean();
      ehrData.vitalSigns = vitalSigns || [];

      // Fetch recent visits (last 10)
      const visits = await Visit.find({ patientId })
        .sort({ date: -1 })
        .limit(10)
        .lean();
      ehrData.visits = visits || [];

      // Fetch active medications from EHR
      const medications = await Medication.find({ 
        patientId,
        $or: [
          { endDate: { $exists: false } },
          { endDate: null },
          { endDate: { $gte: new Date() } }
        ]
      })
        .sort({ startDate: -1 })
        .lean();
      ehrData.ehrMedications = medications || [];

      // Also get medications from visits
      visits.forEach(visit => {
        if (visit.prescribedMedicines && Array.isArray(visit.prescribedMedicines)) {
          visit.prescribedMedicines.forEach(med => {
            if (!med.endDate || new Date(med.endDate) > new Date()) {
              ehrData.ehrMedications.push({
                name: med.name,
                dosage: med.dosage,
                frequency: med.frequency,
                prescribedBy: med.prescribedBy,
                reason: med.reason,
                startDate: med.startDate,
                endDate: med.endDate,
              });
            }
          });
        }
      });

      // Fetch recent lab results (last 10)
      const labResults = await LabResult.find({ patientId })
        .sort({ date: -1 })
        .limit(10)
        .lean();
      ehrData.labResults = labResults || [];

      console.log(`EHR Data fetched: ${ehrData.vitalSigns.length} vital signs, ${ehrData.visits.length} visits, ${ehrData.ehrMedications.length} medications, ${ehrData.labResults.length} lab results`);
    } catch (ehrError) {
      console.error("Error fetching EHR data:", ehrError);
      // Continue with report generation even if EHR data fetch fails
    }

    const prompt = buildHeartWiseReportPrompt({
      patientSnapshot,
      groupedEntries,
      highlightedEntry,
      ehrData,
    });

    // Try different Gemini models until one works
    const modelsToTry = [
      process.env.GEMINI_HEARTWISE_MODEL,
      "gemini-1.5-pro-latest",
      "gemini-1.5-flash-latest",
      "gemini-1.5-pro",
      "gemini-1.5-flash",
    ].filter(Boolean);
    
    let responseText;
    let parsed;
    let modelWorked = false;
    
    for (const modelName of modelsToTry) {
      try {
        console.log(`Trying Gemini model: ${modelName}`);
        const model = getHeartWiseModel(modelName);
        const result = await model.generateContent(prompt);
        responseText = result?.response?.text();
        
        if (responseText) {
          modelWorked = true;
          console.log(`Successfully used model: ${modelName}`);
          break;
        }
      } catch (error) {
        console.log(`Model ${modelName} failed:`, error.message);
        continue;
      }
    }
    
    if (!modelWorked || !responseText) {
      // Fallback: create a simple text report from the data
      console.log("Creating fallback text report");
      const reportText = `HeartWise AI Health Report\n\n` +
        `Patient: ${patientSnapshot?.name || "Unknown"}\n\n` +
        `Activities: ${groupedEntries.activities.length} recorded\n` +
        `Meals: ${groupedEntries.meals.length} recorded\n` +
        `Medications: ${groupedEntries.medications.length} recorded\n\n` +
        `This is a basic health summary. For detailed AI analysis, please ensure your Gemini API key is correctly configured.`;
      
      parsed = {
        title: "HeartWise AI Patient Report",
        patientOverview: reportText,
        medicalHistory: [],
        currentStatus: [],
        medicationsSummary: groupedEntries.medications.map(m => `${m.name} (${m.dosage})`),
        recommendedActions: ["Continue tracking your health data", "Consult with your healthcare provider"],
        followUpPlan: ["Regular monitoring recommended"]
      };
    } else {
      // Try to parse as JSON, if it fails, create a simple text report
      try {
        parsed = extractJsonObject(responseText);
      } catch (parseError) {
        console.log("Could not parse as JSON, creating text report from response");
        // Create a simple text-based report structure from the AI response
        parsed = {
          title: "HeartWise AI Patient Report",
          patientOverview: responseText.substring(0, 500) || "Health analysis report",
          medicalHistory: [responseText.substring(500, 1000) || "No specific history noted"],
          currentStatus: [responseText.substring(1000, 1500) || "Current status analysis"],
          medicationsSummary: groupedEntries.medications.map(m => `${m.name} (${m.dosage})`),
          recommendedActions: ["Review the full report for detailed recommendations"],
          followUpPlan: ["Schedule follow-up as recommended"]
        };
      }
    }

    const generatedAt = new Date();
    const pdfBuffer = await createReportPdf(parsed, {
      patientName: patientSnapshot?.name,
      generatedAt,
      reportTitle: parsed.title,
      ehrData,
    });

    const reportDocument = await HealthTrackerReport.create({
      userId: new mongoose.Types.ObjectId(req.userId),
      entryId: focusEntryId ? new mongoose.Types.ObjectId(focusEntryId) : null,
      title: parsed.title || "HeartWise AI Patient Report",
      summary: parsed.patientOverview,
      keyFindings: parsed.currentStatus || [],
      recommendations: parsed.recommendedActions || [],
      aiResponse: parsed,
      pdf: {
        data: pdfBuffer,
        contentType: "application/pdf",
      },
    });

    return res.status(201).json({
      success: true,
      data: {
        reportId: reportDocument._id,
        title: reportDocument.title,
        createdAt: reportDocument.createdAt,
        entryId: reportDocument.entryId,
        reportType: reportDocument.reportType,
      },
      message: "HeartWise AI report generated successfully.",
    });
  } catch (error) {
    console.error("Error generating HeartWise AI report:", error);
    const statusCode =
      error.message &&
      error.message.includes("HeartWise AI is not configured.")
        ? 500
        : 500;
    return res.status(statusCode).json({
      success: false,
      message:
        error.message ||
        "Failed to generate HeartWise AI report. Please try again later.",
    });
  }
};

export const listHealthTrackerReports = async (req, res) => {
  try {
    const reports = await HealthTrackerReport.find({
      userId: new mongoose.Types.ObjectId(req.userId),
    })
      .sort({ createdAt: -1 })
      .select("title createdAt entryId reportType summary recommendations");

    return res.status(200).json({
      success: true,
      data: reports.map((report) => ({
        reportId: report._id,
        title: report.title,
        summary: report.summary,
        recommendations: report.recommendations,
        createdAt: report.createdAt,
        entryId: report.entryId,
        reportType: report.reportType,
      })),
    });
  } catch (error) {
    console.error("Error fetching HeartWise AI reports:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve reports",
      error: error.message,
    });
  }
};

export const getHealthTrackerReportPdf = async (req, res) => {
  try {
    const { reportId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(reportId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid report id",
      });
    }

    const report = await HealthTrackerReport.findOne({
      _id: reportId,
      userId: new mongoose.Types.ObjectId(req.userId),
    });

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found",
      });
    }

    const pdfData = report?.pdf?.data;

    let pdfBuffer = null;
    if (Buffer.isBuffer(pdfData)) {
      pdfBuffer = pdfData;
    } else if (pdfData?.buffer) {
      pdfBuffer = Buffer.from(pdfData.buffer);
    } else if (pdfData?.data && Array.isArray(pdfData.data)) {
      pdfBuffer = Buffer.from(pdfData.data);
    }

    if (!pdfBuffer || !pdfBuffer.length) {
      return res.status(422).json({
        success: false,
        message: "Report PDF data is missing or corrupted.",
      });
    }

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="heartwise-report-${report._id}.pdf"`
    );
    res.setHeader("Content-Type", report.pdf?.contentType || "application/pdf");
    res.setHeader("Content-Length", pdfBuffer.length);

    return res.status(200).send(pdfBuffer);
  } catch (error) {
    console.error("Error retrieving HeartWise AI report PDF:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve report pdf",
      error: error.message,
    });
  }
};

export const generateMonthlyHealthReport = async (req, res) => {
  try {
    const { month, year } = req.body || {};
    const userId = new mongoose.Types.ObjectId(req.userId);
    
    // Determine month and year
    const now = new Date();
    const targetMonth = month !== undefined ? parseInt(month, 10) - 1 : now.getMonth();
    const targetYear = year || now.getFullYear();
    
    const startDate = new Date(targetYear, targetMonth, 1);
    const endDate = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);
    
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    const monthName = monthNames[targetMonth];

    // Get user information
    const user = await User.findById(userId).lean();
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const patientName = user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Unknown';
    const patientAge = user.dateOfBirth 
      ? Math.floor((now - new Date(user.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000))
      : null;
    const patientGender = user.gender || 'N/A';
    const patientId = user._id?.toString() || userId.toString();

    // Fetch vital signs for the month
    const vitalSigns = await VitalSign.find({
      patientId: userId,
      date: { $gte: startDate, $lte: endDate },
    }).lean();

    // Calculate heart rate statistics
    const heartRates = vitalSigns
      .filter(vs => vs.heartRate && vs.heartRate.value)
      .map(vs => vs.heartRate.value);
    
    const totalHeartReadings = heartRates.length;
    const avgHeartRate = heartRates.length > 0
      ? Math.round(heartRates.reduce((a, b) => a + b, 0) / heartRates.length)
      : 0;
    const minHeartRate = heartRates.length > 0 ? Math.min(...heartRates) : 0;
    const maxHeartRate = heartRates.length > 0 ? Math.max(...heartRates) : 0;
    
    // Abnormal readings (heart rate < 60 or > 100)
    const abnormalReadings = heartRates.filter(hr => hr < 60 || hr > 100).length;

    // Weekly heart rate trend (group by week)
    const weeklyHeartRate = [];
    for (let week = 0; week < 4; week++) {
      const weekStart = new Date(targetYear, targetMonth, week * 7 + 1);
      const weekEnd = new Date(targetYear, targetMonth, Math.min((week + 1) * 7, endDate.getDate()));
      const weekVitals = vitalSigns.filter(vs => {
        const vsDate = new Date(vs.date);
        return vsDate >= weekStart && vsDate <= weekEnd && vs.heartRate && vs.heartRate.value;
      });
      if (weekVitals.length > 0) {
        const avgWeekHR = weekVitals.reduce((sum, vs) => sum + vs.heartRate.value, 0) / weekVitals.length;
        weeklyHeartRate.push(Math.round(avgWeekHR));
      } else {
        weeklyHeartRate.push(0);
      }
    }

    // Fetch health tracker entries for the month
    const entries = await HealthTrackerEntry.find({
      userId: userId,
      recordedAt: { $gte: startDate, $lte: endDate },
    }).lean();

    // Calculate Activity Statistics
    const activities = entries.filter(e => e.entryType === 'activity' && e.activity);
    const activityStats = {
      totalActivities: activities.length,
      totalDuration: 0, // in minutes
      totalDistance: 0, // in km
      totalCalories: 0,
      totalSteps: 0,
      byType: {},
    };

    activities.forEach(activity => {
      const act = activity.activity;
      if (act.duration) activityStats.totalDuration += act.duration;
      if (act.distance) activityStats.totalDistance += act.distance;
      if (act.calories) activityStats.totalCalories += act.calories;
      if (act.steps) activityStats.totalSteps += act.steps;
      
      const type = act.type || 'Unknown';
      if (!activityStats.byType[type]) {
        activityStats.byType[type] = {
          count: 0,
          totalDuration: 0,
          totalDistance: 0,
          totalCalories: 0,
        };
      }
      activityStats.byType[type].count++;
      if (act.duration) activityStats.byType[type].totalDuration += act.duration;
      if (act.distance) activityStats.byType[type].totalDistance += act.distance;
      if (act.calories) activityStats.byType[type].totalCalories += act.calories;
    });

    // Calculate Diet/Meal Statistics
    const meals = entries.filter(e => e.entryType === 'meal' && e.meal);
    const mealStats = {
      totalMeals: meals.length,
      totalCalories: 0,
      totalSaturatedFat: 0,
      totalCholesterol: 0,
      byMealType: {},
    };

    meals.forEach(meal => {
      const mealData = meal.meal;
      if (mealData.calories) mealStats.totalCalories += mealData.calories;
      if (mealData.saturatedFat) mealStats.totalSaturatedFat += mealData.saturatedFat;
      if (mealData.cholesterol) mealStats.totalCholesterol += mealData.cholesterol;
      
      const mealType = mealData.mealType || 'Unknown';
      if (!mealStats.byMealType[mealType]) {
        mealStats.byMealType[mealType] = {
          count: 0,
          totalCalories: 0,
        };
      }
      mealStats.byMealType[mealType].count++;
      if (mealData.calories) mealStats.byMealType[mealType].totalCalories += mealData.calories;
    });

    // Calculate Medication Statistics
    const medications = entries.filter(e => e.entryType === 'medication' && e.medication);
    const medicationStats = {
      totalMedications: medications.length,
      uniqueMedications: new Set(),
      remindersEnabled: 0,
      byMedication: {},
    };

    medications.forEach(med => {
      const medData = med.medication;
      if (medData.name) {
        medicationStats.uniqueMedications.add(medData.name);
        if (!medicationStats.byMedication[medData.name]) {
          medicationStats.byMedication[medData.name] = {
            count: 0,
            dosage: medData.dosage || 'N/A',
            frequency: medData.frequency || 'N/A',
          };
        }
        medicationStats.byMedication[medData.name].count++;
      }
      if (medData.reminderEnabled) medicationStats.remindersEnabled++;
    });

    // Count symptoms (assuming symptoms might be in notes or a separate field)
    const totalSymptoms = 0; // Placeholder - adjust based on your data model
    const symptomFrequency = {}; // Placeholder

    // Generate AI insights using existing AI model
    let overallCondition = "Your cardiac health data shows regular monitoring this month.";
    let keyObservations = [];
    let recommendedActions = [];

    try {
      const modelsToTry = [
        process.env.GEMINI_HEARTWISE_MODEL,
        "gemini-1.5-pro-latest",
        "gemini-1.5-flash-latest",
      ].filter(Boolean);

      let aiResponse = null;
      for (const modelName of modelsToTry) {
        try {
          const model = getHeartWiseModel(modelName);
          
          // Build comprehensive prompt with all data
          let prompt = `Analyze this comprehensive monthly health data and provide brief insights:\n\n`;
          
          // Activity Data
          if (activityStats.totalActivities > 0) {
            prompt += `ACTIVITY DATA:\n`;
            prompt += `- Total Activities: ${activityStats.totalActivities}\n`;
            prompt += `- Total Duration: ${Math.round(activityStats.totalDuration)} minutes\n`;
            prompt += `- Total Distance: ${activityStats.totalDistance.toFixed(2)} km\n`;
            prompt += `- Total Calories Burned: ${Math.round(activityStats.totalCalories)} kcal\n`;
            if (activityStats.totalSteps > 0) prompt += `- Total Steps: ${activityStats.totalSteps}\n`;
            if (Object.keys(activityStats.byType).length > 0) {
              prompt += `- Activities by Type:\n`;
              Object.entries(activityStats.byType).forEach(([type, stats]) => {
                prompt += `  * ${type}: ${stats.count} times, ${Math.round(stats.totalDuration)} min\n`;
              });
            }
            prompt += `\n`;
          }
          
          // Diet Data
          if (mealStats.totalMeals > 0) {
            prompt += `DIET DATA:\n`;
            prompt += `- Total Meals: ${mealStats.totalMeals}\n`;
            prompt += `- Total Calories: ${Math.round(mealStats.totalCalories)} kcal\n`;
            prompt += `- Total Saturated Fat: ${mealStats.totalSaturatedFat.toFixed(1)} g\n`;
            prompt += `- Total Cholesterol: ${Math.round(mealStats.totalCholesterol)} mg\n`;
            prompt += `\n`;
          }
          
          // Medication Data
          if (medicationStats.totalMedications > 0) {
            prompt += `MEDICATION DATA:\n`;
            prompt += `- Total Medication Entries: ${medicationStats.totalMedications}\n`;
            prompt += `- Unique Medications: ${medicationStats.uniqueMedications.size}\n`;
            prompt += `- Reminders Enabled: ${medicationStats.remindersEnabled}\n`;
            prompt += `\n`;
          }
          
          // Vital Signs Data
          if (vitalStats.heartRate && vitalStats.heartRate.total > 0) {
            prompt += `VITAL SIGNS DATA:\n`;
            prompt += `- Heart Rate: Avg ${vitalStats.heartRate.avg} bpm (Range: ${vitalStats.heartRate.min}-${vitalStats.heartRate.max} bpm), Total: ${vitalStats.heartRate.total} readings\n`;
            if (vitalStats.heartRate.abnormal > 0) {
              prompt += `- Abnormal Heart Rate Readings: ${vitalStats.heartRate.abnormal}\n`;
            }
            if (vitalStats.bloodPressure && vitalStats.bloodPressure.total > 0) {
              prompt += `- Blood Pressure: Avg ${vitalStats.bloodPressure.avgSystolic}/${vitalStats.bloodPressure.avgDiastolic} mmHg (Range: ${vitalStats.bloodPressure.minSystolic}-${vitalStats.bloodPressure.maxSystolic}/${vitalStats.bloodPressure.minDiastolic}-${vitalStats.bloodPressure.maxDiastolic} mmHg)\n`;
            }
            if (vitalStats.spO2 && vitalStats.spO2.total > 0) {
              prompt += `- SpO2: Avg ${vitalStats.spO2.avg}% (Range: ${vitalStats.spO2.min}-${vitalStats.spO2.max}%)\n`;
            }
            if (vitalStats.temperature && vitalStats.temperature.total > 0) {
              prompt += `- Temperature: Avg ${vitalStats.temperature.avg}°C (Range: ${vitalStats.temperature.min}-${vitalStats.temperature.max}°C)\n`;
            }
            prompt += `\n`;
          }
          
          // EHR Data Summary
          if (ehrData.visits && ehrData.visits.length > 0) {
            prompt += `MEDICAL VISITS: ${ehrData.visits.length} visits this month\n`;
          }
          if (ehrData.ehrMedications && ehrData.ehrMedications.length > 0) {
            const activeMeds = ehrData.ehrMedications.filter(med => !med.endDate || new Date(med.endDate) > new Date());
            prompt += `ACTIVE EHR MEDICATIONS: ${activeMeds.length} medications\n`;
          }
          if (ehrData.labResults && ehrData.labResults.length > 0) {
            prompt += `LAB RESULTS: ${ehrData.labResults.length} lab tests this month\n`;
          }
          if (ehrData.allergies) {
            const allergyCount = (ehrData.allergies.medicinal?.length || 0) + (ehrData.allergies.environmental?.length || 0) + (ehrData.allergies.food?.length || 0);
            if (allergyCount > 0) {
              prompt += `ALLERGIES: ${allergyCount} allergies recorded\n`;
            }
          }
          
          prompt += `\nProvide a JSON response with:\n`;
          prompt += `{\n`;
          prompt += `  "overallCondition": "brief summary of overall health condition based on all data",\n`;
          prompt += `  "keyObservations": ["observation1", "observation2", "observation3"],\n`;
          prompt += `  "recommendedActions": ["action1", "action2", "action3"]\n`;
          prompt += `}`;
          
          const result = await model.generateContent(prompt);
          const responseText = result?.response?.text();
          if (responseText) {
            try {
              aiResponse = extractJsonObject(responseText);
              break;
            } catch (e) {
              // Continue to next model
            }
          }
        } catch (error) {
          continue;
        }
      }

      if (aiResponse) {
        overallCondition = aiResponse.overallCondition || overallCondition;
        keyObservations = aiResponse.keyObservations || [];
        recommendedActions = aiResponse.recommendedActions || [];
      }
    } catch (error) {
      // Use default values if AI fails
    }

    // Fetch comprehensive EHR data for the month
    const ehrData = {
      vitalSigns: vitalSigns,
      visits: [],
      ehrMedications: [],
      labResults: [],
      patientInfo: null,
      allergies: null,
      socialHistory: null,
      insurance: null,
      emergencyContact: null,
      specialDirectives: null,
    };

    try {
      // Fetch full patient data from User model
      const patient = await User.findById(userId)
        .select('firstName lastName dateOfBirth gender email phoneNumber address allergies socialHistory insurance emergencyContact specialDirectives bloodType')
        .lean();
      
      if (patient) {
        ehrData.patientInfo = {
          firstName: patient.firstName,
          lastName: patient.lastName,
          dateOfBirth: patient.dateOfBirth,
          gender: patient.gender,
          email: patient.email,
          phoneNumber: patient.phoneNumber,
          address: patient.address,
          bloodType: patient.bloodType,
        };
        ehrData.allergies = patient.allergies || null;
        ehrData.socialHistory = patient.socialHistory || null;
        ehrData.insurance = patient.insurance || null;
        ehrData.emergencyContact = patient.emergencyContact || null;
        ehrData.specialDirectives = patient.specialDirectives || null;
      }

      // Fetch visits for the month
      const visits = await Visit.find({ 
        patientId: userId,
        date: { $gte: startDate, $lte: endDate }
      })
        .sort({ date: -1 })
        .lean();
      ehrData.visits = visits || [];

      // Fetch active medications from EHR
      const ehrMedications = await Medication.find({ 
        patientId: userId,
        $or: [
          { endDate: { $exists: false } },
          { endDate: null },
          { endDate: { $gte: new Date() } }
        ]
      })
        .sort({ startDate: -1 })
        .lean();
      ehrData.ehrMedications = ehrMedications || [];

      // Also get medications from visits
      visits.forEach(visit => {
        if (visit.prescribedMedicines && Array.isArray(visit.prescribedMedicines)) {
          visit.prescribedMedicines.forEach(med => {
            if (!med.endDate || new Date(med.endDate) > new Date()) {
              ehrData.ehrMedications.push({
                name: med.name,
                dosage: med.dosage,
                frequency: med.frequency,
                prescribedBy: med.prescribedBy,
                reason: med.reason,
                startDate: med.startDate,
                endDate: med.endDate,
              });
            }
          });
        }
      });

      // Fetch lab results for the month
      const labResults = await LabResult.find({ 
        patientId: userId,
        date: { $gte: startDate, $lte: endDate }
      })
        .sort({ date: -1 })
        .lean();
      ehrData.labResults = labResults || [];

      console.log(`Monthly Report - EHR Data: ${ehrData.vitalSigns.length} vital signs, ${ehrData.visits.length} visits, ${ehrData.ehrMedications.length} medications, ${ehrData.labResults.length} lab results`);
    } catch (ehrError) {
      console.error("Error fetching EHR data for monthly report:", ehrError);
    }

    // Calculate comprehensive vital sign statistics
    const bpReadings = vitalSigns
      .filter(vs => vs.bloodPressure && vs.bloodPressure.systolic && vs.bloodPressure.diastolic)
      .map(vs => ({ systolic: vs.bloodPressure.systolic, diastolic: vs.bloodPressure.diastolic }));
    
    const spO2Readings = vitalSigns
      .filter(vs => vs.oxygenSaturation && vs.oxygenSaturation.value)
      .map(vs => vs.oxygenSaturation.value);

    const tempReadings = vitalSigns
      .filter(vs => vs.temperature && vs.temperature.value)
      .map(vs => vs.temperature.value);

    const weightReadings = vitalSigns
      .filter(vs => vs.weight && vs.weight.value)
      .map(vs => vs.weight.value);

    const vitalStats = {
      heartRate: {
        total: totalHeartReadings,
        avg: avgHeartRate,
        min: minHeartRate,
        max: maxHeartRate,
        abnormal: abnormalReadings,
      },
      bloodPressure: bpReadings.length > 0 ? {
        total: bpReadings.length,
        avgSystolic: Math.round(bpReadings.reduce((sum, bp) => sum + bp.systolic, 0) / bpReadings.length),
        avgDiastolic: Math.round(bpReadings.reduce((sum, bp) => sum + bp.diastolic, 0) / bpReadings.length),
        minSystolic: Math.min(...bpReadings.map(bp => bp.systolic)),
        maxSystolic: Math.max(...bpReadings.map(bp => bp.systolic)),
        minDiastolic: Math.min(...bpReadings.map(bp => bp.diastolic)),
        maxDiastolic: Math.max(...bpReadings.map(bp => bp.diastolic)),
      } : null,
      spO2: spO2Readings.length > 0 ? {
        total: spO2Readings.length,
        avg: Math.round(spO2Readings.reduce((a, b) => a + b, 0) / spO2Readings.length),
        min: Math.min(...spO2Readings),
        max: Math.max(...spO2Readings),
      } : null,
      temperature: tempReadings.length > 0 ? {
        total: tempReadings.length,
        avg: (tempReadings.reduce((a, b) => a + b, 0) / tempReadings.length).toFixed(1),
        min: Math.min(...tempReadings).toFixed(1),
        max: Math.max(...tempReadings).toFixed(1),
      } : null,
      weight: weightReadings.length > 0 ? {
        total: weightReadings.length,
        avg: (weightReadings.reduce((a, b) => a + b, 0) / weightReadings.length).toFixed(1),
        min: Math.min(...weightReadings).toFixed(1),
        max: Math.max(...weightReadings).toFixed(1),
      } : null,
    };

    // Build report data
    const reportData = {
      activityStats,
      mealStats,
      medicationStats,
      vitalStats,
      weeklyHeartRate,
      ehrData,
      overallCondition,
      keyObservations,
      recommendedActions,
      doctorNote: null,
    };

    let heartRiskSummary = null;
    try {
      heartRiskSummary = await calculateHeartRiskSummary(userId);
      if (heartRiskSummary) {
        reportData.heartRisk = heartRiskSummary;
      }
    } catch (riskError) {
      console.error("Monthly report heart risk error:", riskError.message);
    }

    // Generate PDF
    const generatedAt = new Date();
    const pdfBuffer = await createMonthlyHealthReportPdf(reportData, {
      patientName,
      patientAge,
      patientGender,
      patientId,
      month: monthName,
      year: targetYear,
      generatedAt,
    });

    const aiResponsePayload = {
      overallCondition,
      keyObservations,
      recommendedActions,
      heartRisk: heartRiskSummary,
      monthlyData: reportData,
    };

    // Save report to database
    const reportDocument = await HealthTrackerReport.create({
      userId: userId,
      entryId: null,
      reportType: "MonthlyReport",
      title: `CardioLink Monthly Health Report - ${monthName} ${targetYear}`,
      summary: overallCondition,
      keyFindings: keyObservations,
      recommendations: recommendedActions,
      aiResponse: aiResponsePayload,
      pdf: {
        data: pdfBuffer,
        contentType: "application/pdf",
      },
    });

    return res.status(201).json({
      success: true,
      data: {
        reportId: reportDocument._id,
        title: reportDocument.title,
        createdAt: reportDocument.createdAt,
        reportType: reportDocument.reportType,
      },
      message: "Monthly health report generated successfully.",
    });
  } catch (error) {
    console.error("Error generating monthly health report:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate monthly health report",
      error: error.message,
    });
  }
};

export const deleteHealthTrackerReport = async (req, res) => {
  try {
    const { reportId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(reportId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid report id",
      });
    }

    const deleted = await HealthTrackerReport.findOneAndDelete({
      _id: reportId,
      userId: new mongoose.Types.ObjectId(req.userId),
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Report not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Report deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting health tracker report:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete report",
      error: error.message,
    });
  }
};


