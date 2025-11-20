import mongoose from "mongoose";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { HealthTrackerEntry } from "../models/HealthTrackerEntry.js";
import VitalSign from "../models/VitalSign.js";
import User from "../models/User.js";
import Visit from "../models/Visit.js";
import Medication from "../models/Medication.js";
import LabResult from "../models/LabResult.js";

let cachedGenAiClient = null;

const getGenAiClient = () => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error(
      "Gemini AI is not configured. Please set GEMINI_API_KEY in the environment."
    );
  }

  if (!cachedGenAiClient) {
    cachedGenAiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }

  return cachedGenAiClient;
};

const getHeartWiseModel = (modelName = null) => {
  const genAI = getGenAiClient();
  const name = modelName || process.env.GEMINI_HEARTWISE_MODEL || "gemini-1.5-pro-latest";
  return genAI.getGenerativeModel({ model: name });
};

const extractJsonObject = (text) => {
  if (!text) return null;

  // Try to find JSON in the text
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch (e) {
      console.error("Failed to parse JSON:", e);
    }
  }

  return null;
};

// Check if user has sufficient health data
export const checkUserHealthData = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.userId);
    
    // Check for health tracker entries
    const healthTrackerCount = await HealthTrackerEntry.countDocuments({ userId });
    
    // Check for EHR data
    const vitalSignsCount = await VitalSign.countDocuments({ patientId: userId });
    const visitsCount = await Visit.countDocuments({ patientId: userId });
    
    // Check for user profile data
    const user = await User.findById(userId).select('age gender');
    const hasProfileData = user && (user.age || user.gender);
    
    // User has data if they have at least health tracker OR EHR data
    const hasData = healthTrackerCount > 0 || vitalSignsCount > 0 || visitsCount > 0 || hasProfileData;

    return res.status(200).json({
      success: true,
      hasData,
      dataSummary: {
        healthTrackerEntries: healthTrackerCount,
        vitalSigns: vitalSignsCount,
        visits: visitsCount,
        hasProfileData: !!hasProfileData,
      },
    });
  } catch (error) {
    console.error("Error checking user health data:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to check user health data",
      error: error.message,
    });
  }
};

// Predict heart disease risk
export const predictHeartDisease = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.userId);

    // Fetch user profile data
    const user = await User.findById(userId)
      .select('name email age gender dateOfBirth')
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Calculate age from dateOfBirth if available
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

    // Fetch latest vital signs
    const latestVitalSign = await VitalSign.findOne({ patientId: userId })
      .sort({ date: -1 })
      .lean();

    // Calculate average vital signs from last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentVitalSigns = await VitalSign.find({
      patientId: userId,
      date: { $gte: thirtyDaysAgo },
    })
      .sort({ date: -1 })
      .lean();

    // Calculate averages
    let avgHeartRate = null;
    let avgSystolicBP = null;
    let avgDiastolicBP = null;
    let avgSpO2 = null;
    let avgTemperature = null;
    let avgWeight = null;
    let avgHeight = null;

    if (recentVitalSigns.length > 0) {
      const heartRates = recentVitalSigns
        .map(v => v.heartRate)
        .filter(v => v != null && !isNaN(v));
      if (heartRates.length > 0) {
        avgHeartRate = heartRates.reduce((a, b) => a + b, 0) / heartRates.length;
      }

      const systolicBPs = recentVitalSigns
        .map(v => v.bloodPressure?.systolic)
        .filter(v => v != null && !isNaN(v));
      if (systolicBPs.length > 0) {
        avgSystolicBP = systolicBPs.reduce((a, b) => a + b, 0) / systolicBPs.length;
      }

      const diastolicBPs = recentVitalSigns
        .map(v => v.bloodPressure?.diastolic)
        .filter(v => v != null && !isNaN(v));
      if (diastolicBPs.length > 0) {
        avgDiastolicBP = diastolicBPs.reduce((a, b) => a + b, 0) / diastolicBPs.length;
      }

      const spO2s = recentVitalSigns
        .map(v => v.spO2)
        .filter(v => v != null && !isNaN(v));
      if (spO2s.length > 0) {
        avgSpO2 = spO2s.reduce((a, b) => a + b, 0) / spO2s.length;
      }

      const temperatures = recentVitalSigns
        .map(v => v.temperature)
        .filter(v => v != null && !isNaN(v));
      if (temperatures.length > 0) {
        avgTemperature = temperatures.reduce((a, b) => a + b, 0) / temperatures.length;
      }

      const weights = recentVitalSigns
        .map(v => v.weight)
        .filter(v => v != null && !isNaN(v));
      if (weights.length > 0) {
        avgWeight = weights.reduce((a, b) => a + b, 0) / weights.length;
      }

      const heights = recentVitalSigns
        .map(v => v.height)
        .filter(v => v != null && !isNaN(v));
      if (heights.length > 0) {
        avgHeight = heights.reduce((a, b) => a + b, 0) / heights.length;
      }
    } else if (latestVitalSign) {
      avgHeartRate = latestVitalSign.heartRate;
      avgSystolicBP = latestVitalSign.bloodPressure?.systolic;
      avgDiastolicBP = latestVitalSign.bloodPressure?.diastolic;
      avgSpO2 = latestVitalSign.spO2;
      avgTemperature = latestVitalSign.temperature;
      avgWeight = latestVitalSign.weight;
      avgHeight = latestVitalSign.height;
    }

    // Calculate BMI if weight and height are available
    let bmi = null;
    if (avgWeight && avgHeight) {
      const heightInMeters = avgHeight / 100; // Convert cm to meters
      bmi = avgWeight / (heightInMeters * heightInMeters);
    }

    // Fetch latest lab results for cholesterol
    const latestLabResult = await LabResult.findOne({ patientId: userId })
      .sort({ date: -1 })
      .lean();

    let totalCholesterol = null;
    let ldlCholesterol = null;
    let hdlCholesterol = null;

    if (latestLabResult && latestLabResult.results && Array.isArray(latestLabResult.results)) {
      latestLabResult.results.forEach(result => {
        const param = result.parameter?.toLowerCase() || '';
        const value = parseFloat(result.value);
        if (!isNaN(value)) {
          if (param.includes('total cholesterol') || param.includes('cholesterol total')) {
            totalCholesterol = value;
          } else if (param.includes('ldl')) {
            ldlCholesterol = value;
          } else if (param.includes('hdl')) {
            hdlCholesterol = value;
          }
        }
      });
    }

    // Fetch health tracker data for exercise habits
    const healthTrackerEntries = await HealthTrackerEntry.find({ userId })
      .sort({ recordedAt: -1 })
      .limit(30)
      .lean();

    let exerciseFrequency = 0;
    let totalExerciseMinutes = 0;
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    healthTrackerEntries.forEach(entry => {
      if (entry.entryType === 'activity' && entry.activity && new Date(entry.recordedAt) >= last30Days) {
        exerciseFrequency++;
        if (entry.activity.duration) {
          totalExerciseMinutes += entry.activity.duration;
        }
      }
    });

    // Fetch social history for smoking status
    const userFull = await User.findById(userId)
      .select('socialHistory')
      .lean();

    let smokingStatus = 'unknown';
    if (userFull && userFull.socialHistory) {
      if (userFull.socialHistory.smoking) {
        smokingStatus = userFull.socialHistory.smoking === 'yes' || userFull.socialHistory.smoking === true ? 'yes' : 'no';
      }
    }

    // Build health data summary
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
      smokingStatus: smokingStatus,
      exerciseFrequency: exerciseFrequency,
      averageExerciseMinutesPerWeek: exerciseFrequency > 0 ? Math.round(totalExerciseMinutes / (30 / 7)) : 0,
    };

    // Build prompt for Gemini
    let prompt = `You are a medical AI assistant specializing in cardiovascular health risk assessment. Analyze the following patient health data and provide a heart disease risk prediction.

PATIENT HEALTH DATA:
- Age: ${healthData.age || 'Not provided'}
- Gender: ${healthData.gender || 'Not provided'}
- Heart Rate (bpm): ${healthData.heartRate || 'Not provided'}
- Blood Pressure: ${healthData.systolicBP ? `${healthData.systolicBP}/${healthData.diastolicBP}` : 'Not provided'} mmHg
- SpO2 (%): ${healthData.spO2 || 'Not provided'}
- Temperature (°C): ${healthData.temperature || 'Not provided'}
- Weight (kg): ${healthData.weight || 'Not provided'}
- Height (cm): ${healthData.height || 'Not provided'}
- BMI: ${healthData.bmi || 'Not provided'}
- Total Cholesterol (mg/dL): ${healthData.totalCholesterol || 'Not provided'}
- LDL Cholesterol (mg/dL): ${healthData.ldlCholesterol || 'Not provided'}
- HDL Cholesterol (mg/dL): ${healthData.hdlCholesterol || 'Not provided'}
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
    "<factor name>": "<factor value or description>",
    ...
  }
}

Important considerations:
- Use standard medical risk factors (age, gender, cholesterol, blood pressure, BMI, smoking, exercise)
- Probability should be based on clinical risk assessment
- Provide actionable recommendations
- Be clear that this is for informational purposes and professional medical consultation is essential
- Consider missing data appropriately (don't penalize for missing optional data)

Respond ONLY with valid JSON, no additional text.`;

    // Try different Gemini models
    const modelsToTry = [
      process.env.GEMINI_HEARTWISE_MODEL,
      "gemini-1.5-pro-latest",
      "gemini-1.5-flash-latest",
      "gemini-1.5-pro",
      "gemini-1.5-flash",
    ].filter(Boolean);

    let predictionResult = null;
    let modelWorked = false;

    for (const modelName of modelsToTry) {
      try {
        console.log(`Trying Gemini model: ${modelName}`);
        const model = getHeartWiseModel(modelName);
        const result = await model.generateContent(prompt);
        const responseText = result?.response?.text();

        if (responseText) {
          predictionResult = extractJsonObject(responseText);
          if (predictionResult) {
            modelWorked = true;
            console.log(`Successfully used model: ${modelName}`);
            break;
          }
        }
      } catch (error) {
        console.log(`Model ${modelName} failed:`, error.message);
        continue;
      }
    }

    // Fallback if AI fails
    if (!modelWorked || !predictionResult) {
      console.log("Creating fallback prediction");
      
      // Simple risk calculation based on available data
      let riskScore = 0;
      const factors = {};

      if (healthData.age) {
        if (healthData.age >= 65) riskScore += 0.3;
        else if (healthData.age >= 45) riskScore += 0.2;
        else if (healthData.age >= 35) riskScore += 0.1;
        factors['Age'] = `${healthData.age} years`;
      }

      if (healthData.gender === 'male') {
        riskScore += 0.1;
        factors['Gender'] = 'Male (higher risk)';
      }

      if (healthData.systolicBP && healthData.systolicBP >= 140) {
        riskScore += 0.2;
        factors['Blood Pressure'] = 'High';
      } else if (healthData.systolicBP && healthData.systolicBP >= 120) {
        riskScore += 0.1;
        factors['Blood Pressure'] = 'Elevated';
      }

      if (healthData.bmi && healthData.bmi >= 30) {
        riskScore += 0.2;
        factors['BMI'] = `Obesity (${healthData.bmi})`;
      } else if (healthData.bmi && healthData.bmi >= 25) {
        riskScore += 0.1;
        factors['BMI'] = `Overweight (${healthData.bmi})`;
      }

      if (healthData.totalCholesterol && healthData.totalCholesterol >= 240) {
        riskScore += 0.15;
        factors['Cholesterol'] = 'High';
      }

      if (healthData.smokingStatus === 'yes') {
        riskScore += 0.2;
        factors['Smoking'] = 'Yes';
      }

      if (healthData.exerciseFrequency < 3) {
        riskScore += 0.1;
        factors['Exercise'] = 'Insufficient';
      }

      // Normalize to 0-1 range
      const probability = Math.min(riskScore, 0.95);

      let riskLevel = 'low';
      if (probability >= 0.6) riskLevel = 'high';
      else if (probability >= 0.3) riskLevel = 'moderate';

      predictionResult = {
        probability: parseFloat(probability.toFixed(2)),
        riskLevel: riskLevel,
        insights: [
          `Based on available health data, your heart disease risk is ${riskLevel}.`,
          healthData.age ? `Age is a significant factor in cardiovascular risk.` : 'Age information is needed for accurate assessment.',
          healthData.systolicBP ? `Blood pressure monitoring is important for heart health.` : 'Regular blood pressure monitoring is recommended.',
        ],
        recommendations: [
          'Consult with a healthcare professional for a comprehensive cardiovascular assessment.',
          'Maintain regular physical activity (at least 150 minutes per week).',
          'Follow a heart-healthy diet low in saturated fats and cholesterol.',
          'Monitor blood pressure and cholesterol levels regularly.',
        ],
        contributingFactors: factors,
      };
    }

    // Add health data to response
    predictionResult.healthData = healthData;

    return res.status(200).json({
      success: true,
      data: predictionResult,
      message: "Heart disease prediction generated successfully",
    });
  } catch (error) {
    console.error("Error predicting heart disease:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate prediction",
      error: error.message,
    });
  }
};

