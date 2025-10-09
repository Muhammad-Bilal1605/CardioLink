import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class PrescriptionPDFGenerator {
  static generatePrescriptionPDF(prescription, outputPath) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const stream = fs.createWriteStream(outputPath);
        
        doc.pipe(stream);

        // Header
        this.addHeader(doc, prescription);
        
        // Patient Information
        this.addPatientInfo(doc, prescription);
        
        // Medical Information
        this.addMedicalInfo(doc, prescription);
        
        // Medicines
        this.addMedicines(doc, prescription);
        
        // Tests
        this.addTests(doc, prescription);
        
        // Advice and Follow-up
        this.addAdvice(doc, prescription);
        
        // Footer
        this.addFooter(doc, prescription);

        doc.end();

        stream.on('finish', () => resolve(outputPath));
        stream.on('error', reject);
      } catch (error) {
        reject(error);
      }
    });
  }

  static addHeader(doc, prescription) {
    // Title
    doc.fontSize(20)
       .font('Helvetica-Bold')
       .fillColor('#2c5530')
       .text('MEDICAL PRESCRIPTION', 50, 50, { align: 'center' });
    
    // Prescription ID
    doc.fontSize(10)
       .font('Helvetica')
       .fillColor('#666')
       .text(`Prescription ID: ${prescription.prescriptionId}`, 50, 80, { align: 'center' });
    
    doc.moveDown(2);
  }

  static addPatientInfo(doc, prescription) {
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .fillColor('#000')
       .text('PATIENT INFORMATION', 50, 120);
    
    doc.moveDown(0.5);
    
    const patientY = doc.y;
    
    // Left column
    doc.fontSize(10)
       .font('Helvetica')
       .text('Patient Name:', 50, patientY)
       .font('Helvetica-Bold')
       .text(prescription.patientName, 120, patientY);
    
    doc.font('Helvetica')
       .text('Date:', 50, patientY + 15)
       .font('Helvetica-Bold')
       .text(new Date(prescription.date).toLocaleDateString(), 120, patientY + 15);
    
    // Right column
    doc.font('Helvetica')
       .text('Doctor:', 300, patientY)
       .font('Helvetica-Bold')
       .text(prescription.doctorName, 340, patientY);
    
    doc.font('Helvetica')
       .text('Follow-up:', 300, patientY + 15)
       .font('Helvetica-Bold')
       .text(prescription.followUpDate ? new Date(prescription.followUpDate).toLocaleDateString() : 'Not specified', 360, patientY + 15);
    
    doc.moveDown(2);
  }

  static addMedicalInfo(doc, prescription) {
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .fillColor('#000')
       .text('MEDICAL ASSESSMENT');
    
    doc.moveDown(0.5);
    
    doc.fontSize(10)
       .font('Helvetica-Bold')
       .text('Diagnosis:', 50, doc.y)
       .font('Helvetica')
       .text(prescription.diagnosis, 110, doc.y);
    
    doc.moveDown(0.8);
    
    if (prescription.symptoms) {
      doc.font('Helvetica-Bold')
         .text('Symptoms & Observations:')
         .font('Helvetica')
         .text(prescription.symptoms, { width: 500 });
      
      doc.moveDown(0.8);
    }
    
    doc.moveDown(1);
  }

  static addMedicines(doc, prescription) {
    if (prescription.medicines.length === 0) return;
    
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .fillColor('#000')
       .text('PRESCRIBED MEDICATIONS');
    
    doc.moveDown(0.5);
    
    // Table header
    const startY = doc.y;
    doc.fontSize(9)
       .font('Helvetica-Bold')
       .text('Medicine', 50, startY)
       .text('Dosage', 180, startY)
       .text('Frequency', 250, startY)
       .text('Duration', 320, startY)
       .text('Instructions', 380, startY);
    
    // Separator line
    doc.moveTo(50, startY + 15)
       .lineTo(550, startY + 15)
       .strokeColor('#ccc')
       .lineWidth(1)
       .stroke();
    
    let currentY = startY + 25;
    
    // Medicine rows
    prescription.medicines.forEach((medicine, index) => {
      if (currentY > 700) {
        doc.addPage();
        currentY = 50;
      }
      
      doc.font('Helvetica')
         .text(medicine.name, 50, currentY, { width: 120 })
         .text(medicine.dosage, 180, currentY, { width: 60 })
         .text(medicine.frequency, 250, currentY, { width: 60 })
         .text(medicine.duration, 320, currentY, { width: 50 })
         .text(medicine.instructions || '-', 380, currentY, { width: 150 });
      
      currentY += 20;
    });
    
    doc.y = currentY + 10;
  }

  static addTests(doc, prescription) {
    if (prescription.tests.length === 0) return;
    
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .fillColor('#000')
       .text('RECOMMENDED TESTS');
    
    doc.moveDown(0.5);
    
    prescription.tests.forEach((test, index) => {
      doc.fontSize(10)
         .font('Helvetica')
         .text(`• ${test.name}`, 60, doc.y);
      
      if (test.instructions) {
        doc.fontSize(8)
           .fillColor('#666')
           .text(`  ${test.instructions}`, 70, doc.y + 12);
        doc.y += 15;
      }
      
      doc.y += 5;
    });
    
    doc.moveDown(1);
  }

  static addAdvice(doc, prescription) {
    if (!prescription.advice && !prescription.doctorNotes) return;
    
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .fillColor('#000')
       .text('MEDICAL ADVICE & INSTRUCTIONS');
    
    doc.moveDown(0.5);
    
    if (prescription.advice) {
      doc.fontSize(10)
         .font('Helvetica')
         .text(prescription.advice, { width: 500 });
      
      doc.moveDown(0.8);
    }
    
    if (prescription.doctorNotes) {
      doc.fontSize(9)
         .font('Helvetica-Oblique')
         .fillColor('#555')
         .text('Doctor\'s Notes:', { continued: true })
         .font('Helvetica')
         .text(` ${prescription.doctorNotes}`, { width: 500 });
    }
    
    doc.moveDown(2);
  }

  static addFooter(doc, prescription) {
    const footerY = 750;
    
    // Signature line
    doc.moveTo(400, footerY)
       .lineTo(550, footerY)
       .strokeColor('#000')
       .lineWidth(1)
       .stroke();
    
    doc.fontSize(9)
       .font('Helvetica')
       .fillColor('#000')
       .text('Doctor\'s Signature', 400, footerY + 5, { width: 150, align: 'center' });
    
    // Generated info
    doc.fontSize(8)
       .fillColor('#666')
       .text(`Generated on: ${new Date().toLocaleString()}`, 50, footerY + 5)
       .text(`Digital Prescription - ${prescription.prescriptionId}`, 50, footerY + 18);
    
    // Disclaimer
    doc.text('This is a computer-generated prescription. Valid without signature for telemedicine consultations.', 
             50, footerY + 35, { width: 500, align: 'center' });
  }
}