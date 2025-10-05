// C:\Users\PMLS\Desktop\CardioLink\CardioLink\frontend\src\components\Chats\NewVideocallComponent.jsx

import React, { useState, useEffect, useRef } from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng';
import axios from 'axios';
import './NewVideocallComponent.css';

const APP_ID = '88a403916325401a8e5f04beff756692';
const BASE_URL = 'http://localhost:5001/api/videocall';

const NewVideocallComponent = () => {
  const [channelName, setChannelName] = useState('');
  const [isJoined, setIsJoined] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [remoteUsers, setRemoteUsers] = useState([]);
  
  const clientRef = useRef(null);
  const localVideoTrackRef = useRef(null);
  const localAudioTrackRef = useRef(null);
  const remoteVideoRefs = useRef({});
  const videoPlayedRef = useRef(new Set()); // Track which videos have been played

  useEffect(() => {
    // Initialize Agora client
    clientRef.current = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
    
    // Handle remote user published
    clientRef.current.on('user-published', async (user, mediaType) => {
      console.log('User published:', user.uid, mediaType);
      
      try {
        await clientRef.current.subscribe(user, mediaType);
        console.log('Successfully subscribed to', mediaType, 'from user:', user.uid);
        
        if (mediaType === 'video') {
          console.log('Video track received from user:', user.uid);
          
          setRemoteUsers(prev => {
            const exists = prev.find(u => u.uid === user.uid);
            if (exists) {
              // Update existing user with new video track
              return prev.map(u => u.uid === user.uid ? user : u);
            }
            // Add new user
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
    });

    // Handle remote user unpublished
    clientRef.current.on('user-unpublished', (user, mediaType) => {
      console.log('User unpublished:', user.uid, mediaType);
      if (mediaType === 'video') {
        videoPlayedRef.current.delete(user.uid);
        setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
        delete remoteVideoRefs.current[user.uid];
      }
    });

    // Handle user left
    clientRef.current.on('user-left', (user) => {
      console.log('User left:', user.uid);
      videoPlayedRef.current.delete(user.uid);
      setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
      delete remoteVideoRefs.current[user.uid];
    });

    return () => {
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
      alert('Please enter a channel name');
      return;
    }

    try {
      console.log('Joining channel:', channelName);
      
      // Get token from backend
      const response = await axios.post(`${BASE_URL}/generate-token`, {
        channelName: channelName.trim(),
        uid: 0,
      });

      console.log('Token response:', response.data);
      const { token, appId, uid } = response.data;

      // Join the channel
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
      
      // Play local video after state update
      setTimeout(() => {
        const localContainer = document.getElementById('local-video');
        if (localContainer && localVideoTrackRef.current) {
          localVideoTrackRef.current.play(localContainer);
          console.log('Playing local video');
        }
      }, 100);
    } catch (error) {
      console.error('Error joining channel:', error);
      alert('Failed to join channel: ' + error.message);
    }
  };

  const leaveChannel = async () => {
    try {
      if (localAudioTrackRef.current) {
        localAudioTrackRef.current.close();
        localAudioTrackRef.current = null;
      }
      if (localVideoTrackRef.current) {
        localVideoTrackRef.current.close();
        localVideoTrackRef.current = null;
      }
      if (clientRef.current) {
        await clientRef.current.leave();
      }
      setIsJoined(false);
      setRemoteUsers([]);
      setChannelName('');
      videoPlayedRef.current.clear();
      remoteVideoRefs.current = {};
    } catch (error) {
      console.error('Error leaving channel:', error);
    }
  };

  const toggleMute = async () => {
    if (localAudioTrackRef.current) {
      await localAudioTrackRef.current.setEnabled(isMuted);
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = async () => {
    if (localVideoTrackRef.current) {
      await localVideoTrackRef.current.setEnabled(isVideoOff);
      setIsVideoOff(!isVideoOff);
    }
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
            onKeyPress={(e) => e.key === 'Enter' && joinChannel()}
            className="channel-input"
          />
          <button onClick={joinChannel} className="join-btn">
            Join Call
          </button>
        </div>
      ) : (
        <div className="call-screen">
          <div className="remote-container">
            {remoteUsers.length > 0 ? (
              <div className="remote-users-grid">
                {remoteUsers.map(user => (
                  <div 
                    key={user.uid}
                    id={`remote-video-${user.uid}`}
                    ref={(el) => {
                      if (el) {
                        remoteVideoRefs.current[user.uid] = el;
                        // Play video when ref is set and video hasn't been played yet
                        if (user.videoTrack && !videoPlayedRef.current.has(user.uid)) {
                          console.log('Setting up video for user:', user.uid);
                          setTimeout(() => {
                            user.videoTrack.play(el);
                            videoPlayedRef.current.add(user.uid);
                            console.log('Video playing for user:', user.uid);
                          }, 100);
                        }
                      }
                    }}
                    className="remote-video-container"
                    style={{ 
                      width: '100%', 
                      height: '100%',
                      position: 'relative',
                      backgroundColor: '#000'
                    }}
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
          
          <div 
            id="local-video" 
            className="local-video"
            style={{ 
              width: '200px', 
              height: '150px',
              backgroundColor: '#000'
            }}
          />
          
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
              onClick={leaveChannel} 
              className="control-btn end-call"
              title="Leave call"
            >
              📞
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewVideocallComponent;