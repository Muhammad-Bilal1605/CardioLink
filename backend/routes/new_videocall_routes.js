// C:\Users\PMLS\Desktop\CardioLink\CardioLink\backend\routes\new_videocall_routes.js
/*
const express = require('express');
const router = express.Router();
const { RtcTokenBuilder, RtcRole } = require('agora-access-token');

const APP_ID = '88a403916325401a8e5f04beff756692';
const APP_CERTIFICATE = '8407591dbbda46f9b4286093767b7e80';

// Generate Agora token
router.post('/generate-token', (req, res) => {
  try {
    const { channelName, uid } = req.body;
    
    if (!channelName) {
      return res.status(400).json({ error: 'Channel name is required' });
    }

    const role = RtcRole.PUBLISHER;
    const expirationTimeInSeconds = 3600; // 1 hour
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;
    
    const uidInt = uid ? parseInt(uid) : 0;

    const token = RtcTokenBuilder.buildTokenWithUid(
      APP_ID,
      APP_CERTIFICATE,
      channelName,
      uidInt,
      role,
      privilegeExpiredTs
    );

    res.json({
      token,
      appId: APP_ID,
      channelName,
      uid: uidInt
    });
  } catch (error) {
    console.error('Error generating token:', error);
    res.status(500).json({ error: 'Failed to generate token' });
  }
});

module.exports = router;
*/

// backend/routes/new_videocall_routes.js
// backend/routes/new_videocall_routes.js
import express from 'express';
import pkg from 'agora-access-token';
const { RtcTokenBuilder, RtcRole } = pkg;

const router = express.Router();

const APP_ID = process.env.AGORA_APP_ID || '88a403916325401a8e5f04beff756692';
const APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE || '8407591dbbda46f9b4286093767b7e80';

// Store consultation sessions (in production, use Redis or database)
const consultationSessions = new Map();
const patientConsultations = new Map(); // For Flutter app access

// Generate Agora token
router.post('/generate-token', (req, res) => {
  try {
    const { channelName, uid } = req.body;
    
    if (!channelName) {
      return res.status(400).json({ 
        success: false,
        error: 'Channel name is required' 
      });
    }

    const role = RtcRole.PUBLISHER;
    const expirationTimeInSeconds = 3600; // 1 hour
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;
    
    const uidInt = uid ? parseInt(uid) : 0;

    const token = RtcTokenBuilder.buildTokenWithUid(
      APP_ID,
      APP_CERTIFICATE,
      channelName,
      uidInt,
      role,
      privilegeExpiredTs
    );

    res.json({
      success: true,
      token,
      appId: APP_ID,
      channelName,
      uid: uidInt
    });
  } catch (error) {
    console.error('Error generating token:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to generate token' 
    });
  }
});

// Generate 4-digit consultation code
router.post('/generate-code', async (req, res) => {
  try {
    const { doctorId, patientId, doctorName, patientName } = req.body;
    
    if (!doctorId || !patientId) {
      return res.status(400).json({
        success: false,
        message: 'Doctor ID and Patient ID are required'
      });
    }
    
    // Generate unique 4-digit code
    let code;
    let isUnique = false;
    
    while (!isUnique) {
      code = Math.floor(1000 + Math.random() * 9000).toString();
      if (!consultationSessions.has(code)) {
        isUnique = true;
      }
    }
    
    const channelName = `consultation_${doctorId}_${patientId}_${Date.now()}`; // FIXED: Added backticks
    
    const session = {
      code,
      channelName,
      doctorId,
      patientId,
      doctorName: doctorName || 'Doctor',
      patientName: patientName || 'Patient',
      createdAt: new Date(),
      status: 'active',
      notes: '',
      duration: 0,
      startTime: new Date(),
      endTime: null
    };
    
    consultationSessions.set(code, session);
    
    // Store for patient access in Flutter app
    if (!patientConsultations.has(patientId)) {
      patientConsultations.set(patientId, []);
    }
    patientConsultations.get(patientId).push(session);
    
    console.log(`Consultation code generated: ${code} for patient ${patientId}`); // FIXED: Added backticks
    
    res.json({
      success: true,
      code,
      channelName,
      message: 'Consultation code generated successfully'
    });
  } catch (error) {
    console.error('Error generating code:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate consultation code'
    });
  }
});

// Verify consultation code
router.post('/verify-code', async (req, res) => {
  try {
    const { code, doctorId } = req.body;
    
    if (!code) {
      return res.status(400).json({
        valid: false,
        message: 'Consultation code is required'
      });
    }
    
    const session = consultationSessions.get(code);
    
    if (!session) {
      return res.json({
        valid: false,
        message: 'Invalid consultation code'
      });
    }
    
    if (session.doctorId !== doctorId) {
      return res.json({
        valid: false,
        message: 'Code does not belong to this doctor'
      });
    }
    
    // Update session status
    session.status = 'joined';
    session.startTime = new Date();
    consultationSessions.set(code, session);
    
    res.json({
      valid: true,
      channelName: session.channelName,
      session: {
        code: session.code,
        doctorName: session.doctorName,
        patientName: session.patientName,
        startTime: session.startTime
      }
    });
  } catch (error) {
    console.error('Error verifying code:', error);
    res.status(500).json({
      valid: false,
      message: 'Error verifying code'
    });
  }
});

// Save consultation notes
router.post('/save-notes', async (req, res) => {
  try {
    const { consultationCode, doctorId, patientId, notes, duration } = req.body;
    
    if (!consultationCode) {
      return res.status(400).json({
        success: false,
        message: 'Consultation code is required'
      });
    }
    
    const session = consultationSessions.get(consultationCode);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Consultation session not found'
      });
    }
    
    // Update session with notes
    session.notes = notes || '';
    session.duration = duration || 0;
    session.updatedAt = new Date();
    
    consultationSessions.set(consultationCode, session);
    
    // Update in patient consultations
    if (patientConsultations.has(patientId)) {
      const patientSessions = patientConsultations.get(patientId);
      const sessionIndex = patientSessions.findIndex(s => s.code === consultationCode);
      if (sessionIndex !== -1) {
        patientSessions[sessionIndex] = { ...session };
      }
    }
    
    console.log(`Notes saved for consultation ${consultationCode}`); // FIXED: Added backticks
    
    res.json({
      success: true,
      message: 'Notes saved successfully'
    });
  } catch (error) {
    console.error('Error saving notes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save notes'
    });
  }
});

// Send notes to patient (Flutter API integration)
router.post('/send-notes-to-patient', async (req, res) => {
  try {
    const { consultationCode, doctorId, patientId, notes, duration } = req.body;
    
    if (!consultationCode || !patientId) {
      return res.status(400).json({
        success: false,
        message: 'Consultation code and patient ID are required'
      });
    }
    
    const session = consultationSessions.get(consultationCode);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Consultation session not found'
      });
    }
    
    // Update session with final notes and mark as completed
    session.notes = notes || '';
    session.duration = duration || 0;
    session.endTime = new Date();
    session.status = 'completed';
    
    consultationSessions.set(consultationCode, session);
    
    // Update in patient consultations
    if (patientConsultations.has(patientId)) {
      const patientSessions = patientConsultations.get(patientId);
      const sessionIndex = patientSessions.findIndex(s => s.code === consultationCode);
      if (sessionIndex !== -1) {
        patientSessions[sessionIndex] = { ...session };
      }
    }
    
    console.log(`Consultation ${consultationCode} completed and notes sent to patient ${patientId}`); // FIXED: Added backticks
    
    res.json({
      success: true,
      message: 'Consultation notes sent to patient successfully',
      consultation: {
        code: consultationCode,
        doctorName: session.doctorName,
        patientName: session.patientName,
        notes: session.notes,
        duration: session.duration,
        startTime: session.startTime,
        endTime: session.endTime,
        status: session.status
      }
    });
  } catch (error) {
    console.error('Error sending notes to patient:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send notes to patient'
    });
  }
});

// FLUTTER APP API ENDPOINTS

// Get patient's consultation history
router.get('/patient/:patientId/consultations', async (req, res) => {
  try {
    const { patientId } = req.params;
    
    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: 'Patient ID is required'
      });
    }
    
    const consultations = patientConsultations.get(patientId) || [];
    
    // Filter only completed consultations with notes
    const completedConsultations = consultations
      .filter(consultation => consultation.status === 'completed' && consultation.notes)
      .map(consultation => ({
        consultationCode: consultation.code,
        doctorName: consultation.doctorName,
        patientName: consultation.patientName,
        notes: consultation.notes,
        duration: consultation.duration,
        startTime: consultation.startTime,
        endTime: consultation.endTime,
        status: consultation.status
      }))
      .sort((a, b) => new Date(b.startTime) - new Date(a.startTime)); // Most recent first
    
    res.json({
      success: true,
      consultations: completedConsultations,
      count: completedConsultations.length
    });
  } catch (error) {
    console.error('Error fetching patient consultations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch consultations'
    });
  }
});

// Get specific consultation details for patient
router.get('/consultation/:code/patient/:patientId', async (req, res) => {
  try {
    const { code, patientId } = req.params;
    
    if (!code || !patientId) {
      return res.status(400).json({
        success: false,
        message: 'Consultation code and patient ID are required'
      });
    }
    
    const session = consultationSessions.get(code);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Consultation not found'
      });
    }
    
    if (session.patientId !== patientId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this consultation'
      });
    }
    
    res.json({
      success: true,
      consultation: {
        consultationCode: session.code,
        doctorName: session.doctorName,
        patientName: session.patientName,
        notes: session.notes,
        duration: session.duration,
        startTime: session.startTime,
        endTime: session.endTime,
        status: session.status
      }
    });
  } catch (error) {
    console.error('Error fetching consultation details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch consultation details'
    });
  }
});

// Join consultation from Flutter app (Patient side)
router.post('/patient/join-consultation', async (req, res) => {
  try {
    const { code, patientId, patientName } = req.body;
    
    if (!code || !patientId) {
      return res.status(400).json({
        success: false,
        message: 'Consultation code and patient ID are required'
      });
    }
    
    const session = consultationSessions.get(code);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Invalid consultation code'
      });
    }
    
    if (session.patientId !== patientId) {
      return res.status(403).json({
        success: false,
        message: 'This consultation code does not belong to you'
      });
    }
    
    // Update patient name if provided
    if (patientName && patientName !== session.patientName) {
      session.patientName = patientName;
    }
    
    session.status = 'in-progress';
    consultationSessions.set(code, session);
    
    // Generate token for patient
    const role = RtcRole.PUBLISHER;
    const expirationTimeInSeconds = 3600;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;
    
    const token = RtcTokenBuilder.buildTokenWithUid(
      APP_ID,
      APP_CERTIFICATE,
      session.channelName,
      patientId, // Using patientId as UID
      role,
      privilegeExpiredTs
    );
    
    res.json({
      success: true,
      token,
      appId: APP_ID,
      channelName: session.channelName,
      consultation: {
        code: session.code,
        doctorName: session.doctorName,
        patientName: session.patientName,
        startTime: session.startTime
      }
    });
  } catch (error) {
    console.error('Error joining consultation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to join consultation'
    });
  }
});

// Get active consultations for patient
router.get('/patient/:patientId/active-consultations', async (req, res) => {
  try {
    const { patientId } = req.params;
    
    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: 'Patient ID is required'
      });
    }
    
    const consultations = patientConsultations.get(patientId) || [];
    
    const activeConsultations = consultations
      .filter(consultation => 
        consultation.status === 'active' || 
        consultation.status === 'joined' || 
        consultation.status === 'in-progress'
      )
      .map(consultation => ({
        consultationCode: consultation.code,
        doctorName: consultation.doctorName,
        patientName: consultation.patientName,
        startTime: consultation.startTime,
        status: consultation.status
      }));
    
    res.json({
      success: true,
      consultations: activeConsultations,
      count: activeConsultations.length
    });
  } catch (error) {
    console.error('Error fetching active consultations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch active consultations'
    });
  }
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Video consultation API is running',
    timestamp: new Date().toISOString(),
    activeSessions: consultationSessions.size
  });
});

// Get all sessions (for debugging - remove in production)
router.get('/debug/sessions', (req, res) => {
  const sessions = Array.from(consultationSessions.entries()).map(([code, session]) => ({
    code,
    ...session
  }));
  
  res.json({
    success: true,
    sessions,
    total: sessions.length
  });
});

export default router;