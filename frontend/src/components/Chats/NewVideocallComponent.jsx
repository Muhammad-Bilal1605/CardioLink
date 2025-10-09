// Fixed NewVideocallComponent.jsx
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AgoraRTC from 'agora-rtc-sdk-ng';
import axios from 'axios';
import PrescriptionComponent from '../Prescription/PrescriptionComponent';
import './NewVideocallComponent.css';

const APP_ID = '88a403916325401a8e5f04beff756692';
const BASE_URL = 'http://localhost:5001/api/videocall';

const NewVideocallComponent = () => {
  const navigate = useNavigate();
  
  const [channelName, setChannelName] = useState('');
  const [isJoined, setIsJoined] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [remoteUsers, setRemoteUsers] = useState([]);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [layout, setLayout] = useState('grid');
  const [isLoading, setIsLoading] = useState(false);
  
  // Prescription states
  const [showPrescription, setShowPrescription] = useState(false);
  const [currentPatient, setCurrentPatient] = useState('');
  const [prescriptionLoading, setPrescriptionLoading] = useState(false);
  const [prescriptionError, setPrescriptionError] = useState('');

  // Refs
  const clientRef = useRef(null);
  const localVideoTrackRef = useRef(null);
  const localAudioTrackRef = useRef(null);
  const remoteVideoRefs = useRef({});
  const videoPlayedRef = useRef(new Set());

  // Add class to body when modal is open
  useEffect(() => {
    if (showPrescription) {
      document.body.classList.add('prescription-modal-open');
    } else {
      document.body.classList.remove('prescription-modal-open');
    }
    
    return () => {
      document.body.classList.remove('prescription-modal-open');
    };
  }, [showPrescription]);

  useEffect(() => {
    // Initialize Agora client
    clientRef.current = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
    
    // Handle remote user published
    const handleUserPublished = async (user, mediaType) => {
      console.log('User published:', user.uid, mediaType);
      
      try {
        await clientRef.current.subscribe(user, mediaType);
        console.log('Successfully subscribed to', mediaType, 'from user:', user.uid);
        
        if (mediaType === 'video') {
          console.log('Video track received from user:', user.uid);
          
          setRemoteUsers(prev => {
            const exists = prev.find(u => u.uid === user.uid);
            if (exists) {
              return prev.map(u => u.uid === user.uid ? user : u);
            }
            return [...prev, user];
          });
        }
        
        if (mediaType === 'audio') {
          if (user.audioTrack) {
            user.audioTrack.play();
            console.log('Playing audio for user:', user.uid);
          }
        }
      } catch (error) {
        console.error('Error subscribing to user:', error);
      }
    };

    // Handle remote user unpublished
    const handleUserUnpublished = (user, mediaType) => {
      console.log('User unpublished:', user.uid, mediaType);
      if (mediaType === 'video') {
        videoPlayedRef.current.delete(user.uid);
        setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
        delete remoteVideoRefs.current[user.uid];
      }
    };

    // Handle user left
    const handleUserLeft = (user) => {
      console.log('User left:', user.uid);
      videoPlayedRef.current.delete(user.uid);
      setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
      delete remoteVideoRefs.current[user.uid];
    };

    clientRef.current.on('user-published', handleUserPublished);
    clientRef.current.on('user-unpublished', handleUserUnpublished);
    clientRef.current.on('user-left', handleUserLeft);

    return () => {
      // Cleanup event listeners
      if (clientRef.current) {
        clientRef.current.off('user-published', handleUserPublished);
        clientRef.current.off('user-unpublished', handleUserUnpublished);
        clientRef.current.off('user-left', handleUserLeft);
      }
      leaveChannel();
    };
  }, []);

  // Effect to play remote video when user is added and ref is available
  useEffect(() => {
    remoteUsers.forEach(user => {
      if (user.videoTrack && !videoPlayedRef.current.has(user.uid)) {
        const container = remoteVideoRefs.current[user.uid];
        if (container) {
          console.log('Playing video for user:', user.uid);
          user.videoTrack.play(container);
          videoPlayedRef.current.add(user.uid);
        }
      }
    });
  }, [remoteUsers]);

  const joinChannel = async () => {
    if (!channelName.trim()) {
      setPrescriptionError('Please enter a channel name');
      return;
    }

    if (isLoading) return;

    setIsLoading(true);
    setPrescriptionError('');
    
    try {
      console.log('Joining channel:', channelName);
      
      // Get token from backend
      const response = await axios.post(`${BASE_URL}/generate-token`, {
        channelName: channelName.trim(),
        uid: 0,
      });

      console.log('Token response:', response.data);
      const { token, appId, uid } = response.data;

      // Initialize client and join channel
      await clientRef.current.join(appId, channelName.trim(), token, uid);
      console.log('Joined channel successfully');

      // Create local tracks
      localAudioTrackRef.current = await AgoraRTC.createMicrophoneAudioTrack();
      localVideoTrackRef.current = await AgoraRTC.createCameraVideoTrack();
      
      console.log('Local tracks created');

      // Publish local tracks
      await clientRef.current.publish([
        localAudioTrackRef.current,
        localVideoTrackRef.current,
      ]);

      console.log('Local tracks published');
      setIsJoined(true);
      
      // Play local video
      setTimeout(() => {
        const localContainer = document.getElementById('local-video');
        if (localContainer && localVideoTrackRef.current) {
          localVideoTrackRef.current.play(localContainer);
          console.log('Playing local video');
        }
      }, 100);
      
    } catch (error) {
      console.error('Error joining channel:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to join channel';
      setPrescriptionError(`Unable to join: ${errorMessage}`);
      // Removed alert - error is now shown in UI
    } finally {
      setIsLoading(false);
    }
  };

  const leaveChannel = async () => {
    try {
      // Stop and close local tracks
      if (localAudioTrackRef.current) {
        localAudioTrackRef.current.stop();
        localAudioTrackRef.current.close();
        localAudioTrackRef.current = null;
      }
      if (localVideoTrackRef.current) {
        localVideoTrackRef.current.stop();
        localVideoTrackRef.current.close();
        localVideoTrackRef.current = null;
      }
      
      // Leave channel
      if (clientRef.current) {
        await clientRef.current.leave();
      }
      
      // Ask doctor if they want to upload visit (ONLY when ending consultation)
      const shouldUploadVisit = window.confirm(
        'Consultation ended!\n\nWould you like to:\n✅ Upload visit details and generate prescription?\n\n(Click OK to upload visit, Cancel to just end call)'
      );
      
      if (shouldUploadVisit) {
        // Use React Router's navigate instead of window.location.href
        // This prevents page reload and maintains authentication state
        console.log('Redirecting to upload visit page...');
        navigate('/upload-visits', { 
          replace: false,
          state: { fromVideoCall: true, channelName: channelName }
        });
        return; // Return early to prevent state reset
      }
      
      // Reset state (only if not redirecting)
      resetCallState();
      
      console.log('Left channel successfully');
    } catch (error) {
      console.error('Error leaving channel:', error);
      setPrescriptionError('Error leaving channel: ' + error.message);
      // Still reset state even if there's an error
      resetCallState();
    }
  };

  const resetCallState = () => {
    setIsJoined(false);
    setRemoteUsers([]);
    setChannelName('');
    setIsMuted(false);
    setIsVideoOff(false);
    setZoomLevel(100);
    setLayout('grid');
    setShowPrescription(false);
    setCurrentPatient('');
    setPrescriptionError('');
    videoPlayedRef.current.clear();
    remoteVideoRefs.current = {};
  };

  const toggleMute = async () => {
    if (localAudioTrackRef.current) {
      try {
        await localAudioTrackRef.current.setEnabled(!isMuted);
        setIsMuted(!isMuted);
        console.log('Audio', !isMuted ? 'unmuted' : 'muted');
      } catch (error) {
        console.error('Error toggling audio:', error);
        setPrescriptionError('Error toggling audio: ' + error.message);
      }
    }
  };

  const toggleVideo = async () => {
    if (localVideoTrackRef.current) {
      try {
        await localVideoTrackRef.current.setEnabled(!isVideoOff);
        setIsVideoOff(!isVideoOff);
        console.log('Video', !isVideoOff ? 'enabled' : 'disabled');
      } catch (error) {
        console.error('Error toggling video:', error);
        setPrescriptionError('Error toggling video: ' + error.message);
      }
    }
  };

  const handleZoomIn = () => {
    const zoomLevels = [50, 75, 100, 125, 150, 200];
    const currentIndex = zoomLevels.indexOf(zoomLevel);
    if (currentIndex < zoomLevels.length - 1) {
      setZoomLevel(zoomLevels[currentIndex + 1]);
    }
  };

  const handleZoomOut = () => {
    const zoomLevels = [50, 75, 100, 125, 150, 200];
    const currentIndex = zoomLevels.indexOf(zoomLevel);
    if (currentIndex > 0) {
      setZoomLevel(zoomLevels[currentIndex - 1]);
    }
  };

  const handleResetZoom = () => {
    setZoomLevel(100);
  };

  const changeLayout = (newLayout) => {
    setLayout(newLayout);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !isJoined) {
      joinChannel();
    }
  };

  // Separate function for prescription button (during call - generates PDF only)
  const handlePrescriptionButtonClick = () => {
    const patientName = prompt('Enter patient name to generate prescription:');
    if (patientName && patientName.trim()) {
      setCurrentPatient(patientName.trim());
      setShowPrescription(true);
      setPrescriptionError('');
    } else if (patientName === '') {
      setPrescriptionError('Patient name is required to generate prescription');
    }
  };

  const handleSavePrescription = async (prescriptionData) => {
    try {
      setPrescriptionLoading(true);
      setPrescriptionError('');
      
      console.log('Generating prescription PDF:', prescriptionData);
      
      // Validate prescription data
      if (!prescriptionData.patientName?.trim()) {
        throw new Error('Patient name is required');
      }
      
      if (!prescriptionData.diagnosis?.trim()) {
        throw new Error('Diagnosis is required');
      }

      const prescriptionPayload = {
        patientName: prescriptionData.patientName.trim(),
        date: prescriptionData.date || new Date().toISOString().split('T')[0],
        diagnosis: prescriptionData.diagnosis.trim(),
        symptoms: prescriptionData.symptoms?.trim() || '',
        medicines: prescriptionData.medicines || [],
        tests: prescriptionData.tests || [],
        advice: prescriptionData.advice?.trim() || '',
        followUpDate: prescriptionData.followUpDate || '',
        doctorNotes: prescriptionData.doctorNotes?.trim() || ''
      };

      console.log('Sending prescription payload for PDF generation:', prescriptionPayload);

      // Use the PDF generation endpoint
      const response = await fetch('http://localhost:5001/api/prescriptions/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(prescriptionPayload)
      });

      // Check if response is OK
      if (!response.ok) {
        const errorText = await response.text();
        console.error('PDF generation failed:', errorText);
        throw new Error(`Failed to generate PDF: ${response.status} ${response.statusText}`);
      }

      // Check if response is a PDF
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/pdf')) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Server returned non-PDF response');
      }

      // Handle PDF download
      const blob = await response.blob();
      
      // Check if blob is valid
      if (blob.size === 0) {
        throw new Error('Generated PDF is empty');
      }

      const url = window.URL.createObjectURL(blob);
      
      // Create download link
      const a = document.createElement('a');
      a.href = url;
      a.download = `prescription_${prescriptionData.patientName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 100);

      // Show success message without alert
      setPrescriptionError(''); // Clear any errors
      console.log('✅ Prescription PDF downloaded successfully!');
      
      // Close the modal after successful download
      setShowPrescription(false);
      setCurrentPatient('');

      // Show a brief success notification in the UI
      const successMsg = document.createElement('div');
      successMsg.className = 'success-toast';
      successMsg.textContent = '✅ Prescription PDF downloaded successfully!';
      successMsg.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #10b981;
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
      `;
      document.body.appendChild(successMsg);
      setTimeout(() => {
        successMsg.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => document.body.removeChild(successMsg), 300);
      }, 3000);

    } catch (error) {
      console.error('Error generating prescription PDF:', error);
      setPrescriptionError(error.message);
      // Removed alert - error is shown in UI
    } finally {
      setPrescriptionLoading(false);
    }
  };

  const handleClosePrescription = () => {
    setShowPrescription(false);
    setCurrentPatient('');
    setPrescriptionError('');
  };

  return (
    <div className="videocall-container">
      {!isJoined ? (
        <div className="join-screen">
          <h2>Join Video Call</h2>
          <input
            type="text"
            placeholder="Enter Channel Name"
            value={channelName}
            onChange={(e) => setChannelName(e.target.value)}
            onKeyPress={handleKeyPress}
            className="channel-input"
            disabled={isLoading}
            style={{ color: '#000000' }}
          />
          <button 
            onClick={joinChannel} 
            className="join-btn"
            disabled={isLoading}
          >
            {isLoading ? 'Joining...' : 'Join Call'}
          </button>
          {isLoading && <div className="loading-spinner">Connecting to call...</div>}
          {prescriptionError && (
            <div className="error-message" style={{ 
              color: '#ef4444', 
              backgroundColor: '#fee2e2',
              padding: '12px',
              borderRadius: '8px',
              marginTop: '16px',
              border: '1px solid #fca5a5'
            }}>
              ⚠️ {prescriptionError}
            </div>
          )}
        </div>
      ) : (
        <div className="call-screen">
          {/* Zoom Controls */}
          <div className="zoom-controls">
            <button 
              onClick={handleZoomOut}
              className="zoom-btn"
              title="Zoom Out"
              disabled={zoomLevel === 50}
            >
              ➖
            </button>
            <div className="zoom-display">
              {zoomLevel}%
            </div>
            <button 
              onClick={handleZoomIn}
              className="zoom-btn"
              title="Zoom In"
              disabled={zoomLevel === 200}
            >
              ➕
            </button>
            <button 
              onClick={handleResetZoom}
              className="zoom-btn"
              title="Reset Zoom"
            >
              ⟳
            </button>
          </div>

          {/* Layout Controls */}
          <div className="layout-controls">
            <button 
              onClick={() => changeLayout('grid')}
              className={`layout-btn ${layout === 'grid' ? 'active' : ''}`}
              title="Grid Layout"
            >
              ⏹️
            </button>
            <button 
              onClick={() => changeLayout('focus')}
              className={`layout-btn ${layout === 'focus' ? 'active' : ''}`}
              title="Focus Layout"
            >
              🔍
            </button>
            <button 
              onClick={() => changeLayout('sidebar')}
              className={`layout-btn ${layout === 'sidebar' ? 'active' : ''}`}
              title="Sidebar Layout"
            >
              📑
            </button>
          </div>

          {/* Remote Users Container with Zoom */}
          <div className={`remote-container zoom-${zoomLevel}`}>
            {remoteUsers.length > 0 ? (
              <div className={`remote-users-grid layout-${layout}`}>
                {remoteUsers.map(user => (
                  <div 
                    key={user.uid}
                    id={`remote-video-${user.uid}`}
                    ref={(el) => {
                      if (el) {
                        remoteVideoRefs.current[user.uid] = el;
                        if (user.videoTrack && !videoPlayedRef.current.has(user.uid)) {
                          setTimeout(() => {
                            user.videoTrack.play(el);
                            videoPlayedRef.current.add(user.uid);
                          }, 100);
                        }
                      }
                    }}
                    className="remote-video-container"
                  >
                    <div className="user-info">
                      User: {user.uid}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="waiting-message">
                <h3>Waiting for others to join...</h3>
                <p>Channel: {channelName}</p>
              </div>
            )}
          </div>
          
          {/* Local Video */}
          <div 
            id="local-video" 
            className="local-video"
          />
          
          {/* Main Controls */}
          <div className="controls">
            <button
              onClick={toggleMute}
              className={`control-btn ${isMuted ? 'active' : ''}`}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? '🔇' : '🎤'}
            </button>
            <button
              onClick={toggleVideo}
              className={`control-btn ${isVideoOff ? 'active' : ''}`}
              title={isVideoOff ? 'Turn on camera' : 'Turn off camera'}
            >
              {isVideoOff ? '📹' : '📷'}
            </button>
            <button 
              onClick={handlePrescriptionButtonClick}
              className="control-btn prescription-btn"
              title="Write Prescription (Download PDF)"
              disabled={prescriptionLoading}
            >
              {prescriptionLoading ? '⏳' : '📝'}
            </button>
            <button 
              onClick={leaveChannel} 
              className="control-btn end-call"
              title="End call"
            >
              📞
            </button>
          </div>

          {/* Error Display */}
          {prescriptionError && (
            <div className="error-banner" style={{
              position: 'absolute',
              top: '80px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: '#fee2e2',
              border: '1px solid #fca5a5',
              color: '#991b1b',
              padding: '12px 20px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              zIndex: 1000,
              maxWidth: '80%'
            }}>
              <span>⚠️ {prescriptionError}</span>
              <button 
                onClick={() => setPrescriptionError('')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#991b1b',
                  fontSize: '20px',
                  cursor: 'pointer',
                  padding: '0 4px'
                }}
              >
                ×
              </button>
            </div>
          )}
        </div>
      )}

      {/* Prescription Modal */}
      {showPrescription && (
        <div className="prescription-modal">
          <button 
            className="prescription-close-btn"
            onClick={handleClosePrescription}
            title="Close prescription"
            disabled={prescriptionLoading}
          >
            ×
          </button>
          <PrescriptionComponent
            patientName={currentPatient}
            onSavePrescription={handleSavePrescription}
            onClose={handleClosePrescription}
            isLoading={prescriptionLoading}
          />
        </div>
      )}
    </div>
  );
};

export default NewVideocallComponent;