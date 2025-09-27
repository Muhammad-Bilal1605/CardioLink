// frontend/src/services/ZegoCloudService.js   Mern side 
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';

class ZegoCloudService {
  constructor() {
    this.appID = 772794217;
    this.serverSecret = 'f00a82a2161ac6a81585caecb5e04e47';
    this.zegoEngine = null;
    this.currentRoomID = null;
    this.currentUserID = null;
    this.isInitialized = false;
    this.callbacks = {
      onUserJoin: null,
      onUserLeave: null,
      onRoomStateUpdate: null,
      onCallEnd: null
    };
  }

  // Generate token for authentication
  generateToken(userID, roomID, expirationTimeInSeconds = 3600) {
    // In production, this should be generated on your backend for security
    // For now, using frontend generation for testing
    return ZegoUIKitPrebuilt.generateKitTokenForTest(
      this.appID,
      this.serverSecret,
      roomID,
      userID,
      userID, // userName same as userID for simplicity
      expirationTimeInSeconds
    );
  }

  // Initialize ZegoCloud engine
  async initializeEngine(userID, userName) {
    try {
      if (this.isInitialized) {
        console.log('ZegoCloud already initialized');
        return true;
      }

      this.currentUserID = userID;
      console.log('Initializing ZegoCloud for user:', userID);
      
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize ZegoCloud:', error);
      this.isInitialized = false;
      throw error;
    }
  }

  // Join a video call room
  async joinVideoCall(roomID, userID, userName, containerElement, config = {}) {
    try {
      if (!this.isInitialized) {
        await this.initializeEngine(userID, userName);
      }

      this.currentRoomID = roomID;
      
      // Generate token
      const kitToken = this.generateToken(userID, roomID);

      // Default configuration
      const defaultConfig = {
        turnOnMicrophoneWhenJoining: true,
        turnOnCameraWhenJoining: true,
        showMyCameraToggleButton: true,
        showMyMicrophoneToggleButton: true,
        showAudioVideoSettingsButton: false,
        showScreenSharingButton: false,
        showTextChat: false,
        showUserList: false,
        maxUsers: 2,
        layout: "Auto",
        showLayoutButton: false,
        ...config
      };

      // Create ZegoUIKit instance
      const zg = ZegoUIKitPrebuilt.create(kitToken);
      
      // Store reference
      this.zegoEngine = zg;

      // Set up event handlers
      this.setupEventHandlers();

      // Join room
      await zg.joinRoom({
        container: containerElement,
        sharedLinks: [],
        scenario: {
          mode: ZegoUIKitPrebuilt.VideoConference,
        },
        ...defaultConfig,
        onJoinRoom: () => {
          console.log('Successfully joined room:', roomID);
          if (this.callbacks.onRoomStateUpdate) {
            this.callbacks.onRoomStateUpdate('joined', roomID);
          }
        },
        onLeaveRoom: () => {
          console.log('Left room:', roomID);
          this.currentRoomID = null;
          if (this.callbacks.onRoomStateUpdate) {
            this.callbacks.onRoomStateUpdate('left', roomID);
          }
          if (this.callbacks.onCallEnd) {
            this.callbacks.onCallEnd();
          }
        },
        onUserJoin: (users) => {
          console.log('Users joined:', users);
          if (this.callbacks.onUserJoin) {
            this.callbacks.onUserJoin(users);
          }
        },
        onUserLeave: (users) => {
          console.log('Users left:', users);
          if (this.callbacks.onUserLeave) {
            this.callbacks.onUserLeave(users);
          }
        }
      });

      return true;
    } catch (error) {
      console.error('Failed to join video call:', error);
      throw error;
    }
  }

  // Start an audio-only call
  async joinAudioCall(roomID, userID, userName, containerElement, config = {}) {
    const audioConfig = {
      turnOnMicrophoneWhenJoining: true,
      turnOnCameraWhenJoining: false,
      showMyCameraToggleButton: false,
      showMyMicrophoneToggleButton: true,
      ...config
    };

    return this.joinVideoCall(roomID, userID, userName, containerElement, audioConfig);
  }

  // Leave current call
  async leaveCall() {
    try {
      if (this.zegoEngine) {
        await this.zegoEngine.destroy();
        this.zegoEngine = null;
      }
      this.currentRoomID = null;
      console.log('Successfully left the call');
      return true;
    } catch (error) {
      console.error('Error leaving call:', error);
      throw error;
    }
  }

  // Setup event handlers
  setupEventHandlers() {
    if (!this.zegoEngine) return;

    // Additional event handling can be added here
    console.log('Event handlers set up for ZegoCloud');
  }

  // Set callback functions
  setCallbacks(callbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  // Check if currently in a call
  isInCall() {
    return this.currentRoomID !== null && this.zegoEngine !== null;
  }

  // Get current room info
  getCurrentRoomInfo() {
    return {
      roomID: this.currentRoomID,
      userID: this.currentUserID,
      isInCall: this.isInCall()
    };
  }

  // Mute/unmute microphone
  async toggleMicrophone() {
    if (!this.zegoEngine) return false;
    
    try {
      // This will be handled by the UI kit automatically
      console.log('Microphone toggle handled by ZegoUIKit');
      return true;
    } catch (error) {
      console.error('Error toggling microphone:', error);
      return false;
    }
  }

  // Turn camera on/off
  async toggleCamera() {
    if (!this.zegoEngine) return false;
    
    try {
      // This will be handled by the UI kit automatically
      console.log('Camera toggle handled by ZegoUIKit');
      return true;
    } catch (error) {
      console.error('Error toggling camera:', error);
      return false;
    }
  }

  // Clean up resources
  async cleanup() {
    try {
      if (this.isInCall()) {
        await this.leaveCall();
      }
      
      this.zegoEngine = null;
      this.currentRoomID = null;
      this.currentUserID = null;
      this.isInitialized = false;
      this.callbacks = {
        onUserJoin: null,
        onUserLeave: null,
        onRoomStateUpdate: null,
        onCallEnd: null
      };
      
      console.log('ZegoCloud service cleaned up');
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }
}

// Export singleton instance
export const zegoCloudService = new ZegoCloudService();
export default zegoCloudService;