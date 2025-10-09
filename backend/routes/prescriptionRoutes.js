import express from 'express';
import Prescription from '../models/Prescription.js';
import { verifyToken } from '../middleware/verifyToken.js';

const router = express.Router();

// Create new prescription
router.post('/', verifyToken, async (req, res) => {
  try {
    const {
      patientId,
      patientName,
      diagnosis,
      symptoms,
      medicines,
      tests,
      advice,
      followUpDate,
      doctorNotes
    } = req.body;

    console.log('Prescription request received:', req.body);

    // Validate required fields
    if (!patientName || !diagnosis) {
      return res.status(400).json({
        success: false,
        message: 'Patient name and diagnosis are required'
      });
    }

    // Create prescription
    const prescription = new Prescription({
      patientId: patientId || req.userId,
      patientName,
      diagnosis,
      symptoms: symptoms || '',
      medicines: medicines || [],
      tests: tests || [],
      advice: advice || '',
      followUpDate: followUpDate || null,
      doctorNotes: doctorNotes || '',
      doctorId: req.userId,
      doctorName: 'Doctor' // You can get this from user database later
    });

    await prescription.save();

    // Generate PDF URL
    const pdfUrl = `http://localhost:5001/api/prescriptions/download/${prescription._id}`;

    // Update prescription with PDF URL
    prescription.pdfUrl = pdfUrl;
    await prescription.save();

    res.status(201).json({
      success: true,
      message: 'Prescription created successfully',
      prescription: {
        ...prescription._doc,
        pdfUrl
      }
    });

  } catch (error) {
    console.error('Error creating prescription:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating prescription',
      error: error.message
    });
  }
});

// Get prescriptions by patient ID
router.get('/patient/:patientId', verifyToken, async (req, res) => {
  try {
    const { patientId } = req.params;
    
    const prescriptions = await Prescription.find({ patientId })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      success: true,
      prescriptions
    });
  } catch (error) {
    console.error('Error fetching prescriptions:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching prescriptions'
    });
  }
});

// Get prescriptions by doctor ID
router.get('/doctor/:doctorId', verifyToken, async (req, res) => {
  try {
    const { doctorId } = req.params;
    
    const prescriptions = await Prescription.find({ doctorId })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      success: true,
      prescriptions
    });
  } catch (error) {
    console.error('Error fetching doctor prescriptions:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching prescriptions'
    });
  }
});

// Download prescription PDF
router.get('/download/:prescriptionId', verifyToken, async (req, res) => {
  try {
    const { prescriptionId } = req.params;
    
    const prescription = await Prescription.findById(prescriptionId);
    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found'
      });
    }

    // For now, return JSON. Implement PDF generation later
    res.json({
      success: true,
      message: 'PDF download endpoint',
      prescription
    });

  } catch (error) {
    console.error('Error downloading prescription:', error);
    res.status(500).json({
      success: false,
      message: 'Server error downloading prescription'
    });
  }
});

export default router;