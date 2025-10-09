import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

export const generatePrescriptionPDF = (prescriptionData, outputPath) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const stream = fs.createWriteStream(outputPath);
      doc.pipe(stream);

      // Header
      doc.fontSize(20).font('Helvetica-Bold').fillColor('#2c3e50');
      doc.text('MEDICAL PRESCRIPTION', { align: 'center' });
      doc.moveDown(0.5);

      // Hospital/Clinic Info
      doc.fontSize(10).font('Helvetica').fillColor('#7f8c8d');
      doc.text('CardioLink Healthcare System', { align: 'center' });
      doc.text('Digital Health Platform', { align: 'center' });
      doc.moveDown(1);

      // Patient Information Section
      doc.fontSize(14).font('Helvetica-Bold').fillColor('#2c3e50');
      doc.text('PATIENT INFORMATION');
      doc.moveDown(0.3);
      
      doc.fontSize(10).font('Helvetica').fillColor('#000000');
      doc.text(`Patient Name: ${prescriptionData.patientName}`);
      doc.text(`Date: ${new Date(prescriptionData.date).toLocaleDateString()}`);
      if (prescriptionData.followUpDate) {
        doc.text(`Follow-up Date: ${new Date(prescriptionData.followUpDate).toLocaleDateString()}`);
      }
      doc.moveDown(1);

      // Medical Assessment
      doc.fontSize(14).font('Helvetica-Bold').fillColor('#2c3e50');
      doc.text('MEDICAL ASSESSMENT');
      doc.moveDown(0.3);
      
      doc.fontSize(10).font('Helvetica').fillColor('#000000');
      doc.text(`Diagnosis: ${prescriptionData.diagnosis}`);
      if (prescriptionData.symptoms) {
        doc.text(`Symptoms: ${prescriptionData.symptoms}`);
      }
      doc.moveDown(1);

      // Medications Section
      if (prescriptionData.medicines && prescriptionData.medicines.length > 0) {
        doc.fontSize(14).font('Helvetica-Bold').fillColor('#2c3e50');
        doc.text('PRESCRIBED MEDICATIONS');
        doc.moveDown(0.3);
        
        prescriptionData.medicines.forEach((medicine, index) => {
          doc.fontSize(10).font('Helvetica-Bold').fillColor('#000000');
          doc.text(`${index + 1}. ${medicine.name}`);
          
          doc.fontSize(9).font('Helvetica').fillColor('#555555');
          let medicineDetails = `   Dosage: ${medicine.dosage} | Frequency: ${medicine.frequency} | Duration: ${medicine.duration}`;
          if (medicine.instructions) {
            medicineDetails += ` | Instructions: ${medicine.instructions}`;
          }
          doc.text(medicineDetails);
          doc.moveDown(0.3);
        });
        doc.moveDown(0.5);
      }

      // Tests Section
      if (prescriptionData.tests && prescriptionData.tests.length > 0) {
        doc.fontSize(14).font('Helvetica-Bold').fillColor('#2c3e50');
        doc.text('RECOMMENDED TESTS');
        doc.moveDown(0.3);
        
        doc.fontSize(10).font('Helvetica').fillColor('#000000');
        prescriptionData.tests.forEach((test, index) => {
          doc.text(`${index + 1}. ${test.name}`);
        });
        doc.moveDown(0.5);
      }

      // Medical Advice
      if (prescriptionData.advice) {
        doc.fontSize(14).font('Helvetica-Bold').fillColor('#2c3e50');
        doc.text('MEDICAL ADVICE');
        doc.moveDown(0.3);
        
        doc.fontSize(10).font('Helvetica').fillColor('#000000');
        doc.text(prescriptionData.advice, { 
          width: 500,
          align: 'justify'
        });
        doc.moveDown(0.5);
      }

      // Doctor's Notes
      if (prescriptionData.doctorNotes) {
        doc.fontSize(14).font('Helvetica-Bold').fillColor('#2c3e50');
        doc.text('DOCTOR\'S NOTES');
        doc.moveDown(0.3);
        
        doc.fontSize(10).font('Helvetica').fillColor('#000000');
        doc.text(prescriptionData.doctorNotes, { 
          width: 500,
          align: 'justify'
        });
        doc.moveDown(0.5);
      }

      // Footer
      const bottomY = doc.page.height - 100;
      doc.y = bottomY;
      
      doc.fontSize(9).font('Helvetica').fillColor('#7f8c8d');
      doc.text('This is a computer-generated prescription. No physical signature required.', { align: 'center' });
      doc.text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' });
      
      doc.text('CardioLink EHR System - Secure Digital Healthcare', { align: 'center' });

      doc.end();

      stream.on('finish', () => {
        resolve(outputPath);
      });

      stream.on('error', (error) => {
        reject(error);
      });

    } catch (error) {
      reject(error);
    }
  });
};