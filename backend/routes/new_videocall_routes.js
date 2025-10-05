// C:\Users\PMLS\Desktop\CardioLink\CardioLink\backend\routes\new_videocall_routes.js

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