// lib/screens/simple_video_call_screen.dart
// Alternative approach using web-based video calling without ZegoCloud UIKit

/*import 'package:flutter/material.dart';
import 'dart:html' as html;
import 'dart:ui' as ui;

class SimpleVideoCallScreen extends StatefulWidget {
  final String roomId;
  final String userName;
  final String doctorName;

  const SimpleVideoCallScreen({
    Key? key,
    required this.roomId,
    required this.userName,
    required this.doctorName,
  }) : super(key: key);

  @override
  _SimpleVideoCallScreenState createState() => _SimpleVideoCallScreenState();
}

class _SimpleVideoCallScreenState extends State<SimpleVideoCallScreen> {
  String? _iframeId;
  bool _isCallActive = false;
  bool _isMuted = false;
  bool _isVideoEnabled = true;

  @override
  void initState() {
    super.initState();
    _initializeVideoCall();
  }

  void _initializeVideoCall() {
    // Generate unique iframe ID
    _iframeId = 'video-call-${widget.roomId}';
    
    // Create ZegoCloud web URL for video calling
    final String zegoCloudUrl = _buildZegoCloudUrl();
    
    // Register iframe view factory for web
    ui.platformViewRegistry.registerViewFactory(
      _iframeId!,
      (int viewId) => html.IFrameElement()
        ..src = zegoCloudUrl
        ..style.border = 'none'
        ..style.width = '100%'
        ..style.height = '100%',
    );
    
    setState(() {
      _isCallActive = true;
    });
  }

  String _buildZegoCloudUrl() {
    // Build ZegoCloud web SDK URL
    final Map<String, String> params = {
      'appID': '772794217',
      'roomID': widget.roomId,
      'userID': 'patient_${DateTime.now().millisecondsSinceEpoch}',
      'userName': widget.userName,
      'token': _generateTempToken(),
    };
    
    final String queryString = params.entries
        .map((e) => '${Uri.encodeComponent(e.key)}=${Uri.encodeComponent(e.value)}')
        .join('&');
    
    // This would be your custom web page that implements ZegoCloud Web SDK
    // For now, return a placeholder that shows the call is connecting
    return 'data:text/html,<html><body style="background:#1a1a1a;color:white;font-family:Arial;display:flex;align-items:center;justify-content:center;margin:0;"><div style="text-align:center;"><h2>Connecting to Video Call...</h2><p>Room: ${widget.roomId}</p><p>Doctor: ${widget.doctorName}</p><div style="margin:20px 0;"><div style="width:50px;height:50px;border:5px solid #333;border-top:5px solid #4CAF50;border-radius:50%;animation:spin 2s linear infinite;margin:0 auto;"></div></div><p>Waiting for doctor to join...</p></div><style>@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}</style></body></html>';
  }

  String _generateTempToken() {
    // Generate a temporary token for testing
    // In production, get this from your backend
    return 'temp_token_${DateTime.now().millisecondsSinceEpoch}';
  }

  @override
  void dispose() {
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black54,
        title: Text(
          'Video Call with ${widget.doctorName}',
          style: const TextStyle(color: Colors.white),
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => _endCall(),
        ),
        actions: [
          IconButton(
            icon: Icon(
              _isMuted ? Icons.mic_off : Icons.mic,
              color: _isMuted ? Colors.red : Colors.white,
            ),
            onPressed: _toggleMute,
          ),
          IconButton(
            icon: Icon(
              _isVideoEnabled ? Icons.videocam : Icons.videocam_off,
              color: _isVideoEnabled ? Colors.white : Colors.red,
            ),
            onPressed: _toggleVideo,
          ),
          IconButton(
            icon: const Icon(Icons.call_end, color: Colors.red),
            onPressed: _endCall,
          ),
        ],
      ),
      body: _buildCallInterface(),
    );
  }

  Widget _buildCallInterface() {
    if (!_isCallActive || _iframeId == null) {
      return _buildLoadingScreen();
    }

    return Stack(
      children: [
        // Video call iframe
        HtmlElementView(viewType: _iframeId!),
        
        // Call controls overlay
        Positioned(
          bottom: 50,
          left: 0,
          right: 0,
          child: _buildCallControls(),
        ),
        
        // Call info overlay
        Positioned(
          top: 20,
          left: 20,
          child: _buildCallInfo(),
        ),
      ],
    );
  }

  Widget _buildLoadingScreen() {
    return Container(
      color: Colors.black,
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const CircularProgressIndicator(color: Colors.green),
            const SizedBox(height: 20),
            Text(
              'Connecting to ${widget.doctorName}...',
              style: const TextStyle(color: Colors.white, fontSize: 18),
            ),
            const SizedBox(height: 10),
            Text(
              'Room: ${widget.roomId}',
              style: const TextStyle(color: Colors.grey, fontSize: 14),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCallControls() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          _buildControlButton(
            icon: _isMuted ? Icons.mic_off : Icons.mic,
            color: _isMuted ? Colors.red : Colors.white,
            onPressed: _toggleMute,
          ),
          const SizedBox(width: 20),
          _buildControlButton(
            icon: Icons.call_end,
            color: Colors.red,
            onPressed: _endCall,
            isLarge: true,
          ),
          const SizedBox(width: 20),
          _buildControlButton(
            icon: _isVideoEnabled ? Icons.videocam : Icons.videocam_off,
            color: _isVideoEnabled ? Colors.white : Colors.red,
            onPressed: _toggleVideo,
          ),
        ],
      ),
    );
  }

  Widget _buildControlButton({
    required IconData icon,
    required Color color,
    required VoidCallback onPressed,
    bool isLarge = false,
  }) {
    final double size = isLarge ? 70 : 50;
    
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: Colors.black54,
        shape: BoxShape.circle,
        border: Border.all(color: color.withOpacity(0.5)),
      ),
      child: IconButton(
        icon: Icon(icon, color: color, size: isLarge ? 32 : 24),
        onPressed: onPressed,
      ),
    );
  }

  Widget _buildCallInfo() {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.black54,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            widget.doctorName,
            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
          ),
          Text(
            'Connected',
            style: const TextStyle(color: Colors.green, fontSize: 12),
          ),
        ],
      ),
    );
  }

  void _toggleMute() {
    setState(() {
      _isMuted = !_isMuted;
    });
    
    // Send mute state to iframe if needed
    _sendMessageToIframe('mute', _isMuted);
  }

  void _toggleVideo() {
    setState(() {
      _isVideoEnabled = !_isVideoEnabled;
    });
    
    // Send video state to iframe if needed
    _sendMessageToIframe('video', _isVideoEnabled);
  }

  void _sendMessageToIframe(String action, dynamic value) {
    // Send postMessage to iframe for control
    try {
      final iframe = html.document.getElementById(_iframeId!) as html.IFrameElement?;
      if (iframe?.contentWindow != null) {
        iframe!.contentWindow!.postMessage({
          'action': action,
          'value': value,
        }, '*');
      }
    } catch (e) {
      print('Error sending message to iframe: $e');
    }
  }

  void _endCall() {
    setState(() {
      _isCallActive = false;
    });
    
    // Show end call confirmation
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('End Call'),
        content: const Text('Are you sure you want to end the video call?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context); // Close dialog
              Navigator.pop(context); // Close video call screen
            },
            child: const Text('End Call'),
          ),
        ],
      ),
    );
  }
}*/
// lib/screens/simple_video_call_screen.dart
// Realistic video call simulation with camera access and timer
//c:CardioLink/Flutterapp/expansetracker/lib/cardio/simple_video_call_screen.dart
import 'package:flutter/material.dart';
import 'dart:html' as html;
import 'dart:ui' as ui;
import 'dart:async';

class SimpleVideoCallScreen extends StatefulWidget {
  final String roomId;
  final String userName;
  final String doctorName;

  const SimpleVideoCallScreen({
    Key? key,
    required this.roomId,
    required this.userName,
    required this.doctorName,
  }) : super(key: key);

  @override
  _SimpleVideoCallScreenState createState() => _SimpleVideoCallScreenState();
}

class _SimpleVideoCallScreenState extends State<SimpleVideoCallScreen> {
  String? _iframeId;
  bool _isCallActive = false;
  bool _isMuted = false;
  bool _isVideoEnabled = true;
  bool _isConnecting = true;
  Timer? _callTimer;
  int _callDuration = 0;
  String _callStatus = 'Connecting...';

  @override
  void initState() {
    super.initState();
    _initializeVideoCall();
  }

  void _initializeVideoCall() {
    // Generate unique iframe ID
    _iframeId = 'video-call-${widget.roomId}';
    
    // Create realistic video call interface with camera
    final String videoCallHtml = _buildVideoCallHtml();
    
    // Register iframe view factory for web
    ui.platformViewRegistry.registerViewFactory(
      _iframeId!,
      (int viewId) => html.IFrameElement()
        ..src = videoCallHtml
        ..style.border = 'none'
        ..style.width = '100%'
        ..style.height = '100%'
        ..allow = 'camera; microphone'
        ..setAttribute('allowfullscreen', 'true'),
    );
    
    // Simulate connection delay
    Future.delayed(const Duration(seconds: 2), () {
      if (mounted) {
        setState(() {
          _isCallActive = true;
          _isConnecting = false;
          _callStatus = 'Connected';
        });
        _startCallTimer();
      }
    });
  }

  String _buildVideoCallHtml() {
    return '''
data:text/html,
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      background: #1a1a1a;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      overflow: hidden;
      height: 100vh;
      display: flex;
      flex-direction: column;
    }
    
    #videoContainer {
      position: relative;
      width: 100%;
      height: 100%;
      background: #000;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    #localVideo {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transform: scaleX(-1);
    }
    
    #remoteVideo {
      position: absolute;
      top: 20px;
      right: 20px;
      width: 150px;
      height: 200px;
      border-radius: 12px;
      border: 2px solid #4CAF50;
      object-fit: cover;
      background: #2a2a2a;
      box-shadow: 0 4px 12px rgba(0,0,0,0.5);
    }
    
    .placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: white;
      text-align: center;
      padding: 20px;
    }
    
    .avatar {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 48px;
      font-weight: bold;
      margin-bottom: 20px;
      color: white;
      box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
    }
    
    .status-indicator {
      display: inline-block;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: #4CAF50;
      animation: pulse 2s infinite;
      margin-right: 8px;
    }
    
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    
    .connecting {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      text-align: center;
      color: white;
      z-index: 10;
    }
    
    .spinner {
      width: 50px;
      height: 50px;
      border: 4px solid #333;
      border-top: 4px solid #4CAF50;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 20px;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    .error-message {
      color: #ff5252;
      padding: 10px;
      background: rgba(255, 82, 82, 0.1);
      border-radius: 8px;
      margin-top: 10px;
    }
  </style>
</head>
<body>
  <div id="videoContainer">
    <div id="connecting" class="connecting">
      <div class="spinner"></div>
      <h2>Starting Video Call...</h2>
      <p style="color: #999; margin-top: 10px;">Initializing camera and microphone</p>
    </div>
    <video id="localVideo" autoplay muted playsinline></video>
    <div id="remoteVideo" class="placeholder">
      <div class="avatar">Dr</div>
      <div style="font-size: 14px;">
        <span class="status-indicator"></span>
        <span>${widget.doctorName}</span>
      </div>
      <p style="color: #999; font-size: 12px; margin-top: 8px;">Waiting to join...</p>
    </div>
  </div>

  <script>
    let localStream = null;
    
    async function startVideoCall() {
      try {
        const connecting = document.getElementById('connecting');
        
        // Request camera and microphone access
        localStream = await navigator.mediaDevices.getUserMedia({
          video: { 
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user'
          },
          audio: true
        });
        
        // Display local video
        const localVideo = document.getElementById('localVideo');
        localVideo.srcObject = localStream;
        
        // Hide connecting message
        if (connecting) {
          connecting.style.display = 'none';
        }
        
        // Simulate doctor joining after 3 seconds
        setTimeout(() => {
          const remoteVideoDiv = document.getElementById('remoteVideo');
          remoteVideoDiv.innerHTML = \`
            <div class="placeholder">
              <div class="avatar" style="width: 80px; height: 80px; font-size: 32px;">Dr</div>
              <div style="font-size: 12px;">
                <span class="status-indicator"></span>
                <span>${widget.doctorName}</span>
              </div>
            </div>
          \`;
        }, 3000);
        
      } catch (error) {
        console.error('Error accessing camera:', error);
        const connecting = document.getElementById('connecting');
        connecting.innerHTML = \`
          <h2>Unable to Access Camera</h2>
          <p class="error-message">Please allow camera and microphone permissions</p>
          <p style="color: #999; margin-top: 10px; font-size: 14px;">Error: \${error.message}</p>
        \`;
      }
    }
    
    // Handle messages from Flutter
    window.addEventListener('message', (event) => {
      if (event.data.action === 'mute' && localStream) {
        localStream.getAudioTracks().forEach(track => {
          track.enabled = !event.data.value;
        });
      } else if (event.data.action === 'video' && localStream) {
        localStream.getVideoTracks().forEach(track => {
          track.enabled = event.data.value;
        });
      }
    });
    
    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    });
    
    // Start the video call
    startVideoCall();
  </script>
</body>
</html>
    ''';
  }

  void _startCallTimer() {
    _callTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (mounted) {
        setState(() {
          _callDuration++;
        });
      }
    });
  }

  String _formatDuration(int seconds) {
    final hours = seconds ~/ 3600;
    final minutes = (seconds % 3600) ~/ 60;
    final secs = seconds % 60;
    
    if (hours > 0) {
      return '${hours.toString().padLeft(2, '0')}:${minutes.toString().padLeft(2, '0')}:${secs.toString().padLeft(2, '0')}';
    }
    return '${minutes.toString().padLeft(2, '0')}:${secs.toString().padLeft(2, '0')}';
  }

  @override
  void dispose() {
    _callTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black87,
        elevation: 0,
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              widget.doctorName,
              style: const TextStyle(color: Colors.white, fontSize: 16),
            ),
            Text(
              _isConnecting ? _callStatus : _formatDuration(_callDuration),
              style: TextStyle(
                color: _isConnecting ? Colors.orange : Colors.green,
                fontSize: 12,
              ),
            ),
          ],
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => _endCall(),
        ),
      ),
      body: _buildCallInterface(),
      bottomNavigationBar: _isCallActive ? _buildBottomControls() : null,
    );
  }

  Widget _buildCallInterface() {
    if (_iframeId == null) {
      return _buildLoadingScreen();
    }

    return Stack(
      children: [
        // Video call iframe
        HtmlElementView(viewType: _iframeId!),
        
        // Status indicator
        if (_isConnecting)
          Positioned(
            top: 20,
            left: 0,
            right: 0,
            child: Center(
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                decoration: BoxDecoration(
                  color: Colors.black54,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: const [
                    SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.orange,
                      ),
                    ),
                    SizedBox(width: 10),
                    Text(
                      'Connecting...',
                      style: TextStyle(color: Colors.white, fontSize: 14),
                    ),
                  ],
                ),
              ),
            ),
          ),
      ],
    );
  }

  Widget _buildLoadingScreen() {
    return Container(
      color: Colors.black,
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const CircularProgressIndicator(color: Colors.green),
            const SizedBox(height: 20),
            Text(
              'Setting up video call with ${widget.doctorName}...',
              style: const TextStyle(color: Colors.white, fontSize: 16),
            ),
            const SizedBox(height: 10),
            Text(
              'Requesting camera access',
              style: const TextStyle(color: Colors.grey, fontSize: 14),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBottomControls() {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            Colors.transparent,
            Colors.black.withOpacity(0.8),
            Colors.black,
          ],
        ),
      ),
      child: SafeArea(
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
          children: [
            _buildControlButton(
              icon: _isMuted ? Icons.mic_off : Icons.mic,
              color: _isMuted ? Colors.red : Colors.white,
              backgroundColor: _isMuted ? Colors.red.withOpacity(0.2) : Colors.white.withOpacity(0.2),
              label: _isMuted ? 'Unmute' : 'Mute',
              onPressed: _toggleMute,
            ),
            _buildControlButton(
              icon: Icons.call_end,
              color: Colors.white,
              backgroundColor: Colors.red,
              label: 'End',
              onPressed: _endCall,
              isLarge: true,
            ),
            _buildControlButton(
              icon: _isVideoEnabled ? Icons.videocam : Icons.videocam_off,
              color: _isVideoEnabled ? Colors.white : Colors.red,
              backgroundColor: _isVideoEnabled ? Colors.white.withOpacity(0.2) : Colors.red.withOpacity(0.2),
              label: _isVideoEnabled ? 'Video On' : 'Video Off',
              onPressed: _toggleVideo,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildControlButton({
    required IconData icon,
    required Color color,
    required Color backgroundColor,
    required String label,
    required VoidCallback onPressed,
    bool isLarge = false,
  }) {
    final double size = isLarge ? 64 : 56;
    
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: size,
          height: size,
          decoration: BoxDecoration(
            color: backgroundColor,
            shape: BoxShape.circle,
            boxShadow: [
              BoxShadow(
                color: backgroundColor.withOpacity(0.3),
                blurRadius: 8,
                spreadRadius: 2,
              ),
            ],
          ),
          child: IconButton(
            icon: Icon(icon, color: color, size: isLarge ? 32 : 28),
            onPressed: onPressed,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          label,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 12,
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }

  void _toggleMute() {
    setState(() {
      _isMuted = !_isMuted;
    });
    _sendMessageToIframe('mute', _isMuted);
  }

  void _toggleVideo() {
    setState(() {
      _isVideoEnabled = !_isVideoEnabled;
    });
    _sendMessageToIframe('video', _isVideoEnabled);
  }

  void _sendMessageToIframe(String action, dynamic value) {
    try {
      final iframe = html.document.getElementById(_iframeId!) as html.IFrameElement?;
      if (iframe?.contentWindow != null) {
        iframe!.contentWindow!.postMessage({
          'action': action,
          'value': value,
        }, '*');
      }
    } catch (e) {
      print('Error sending message to iframe: $e');
    }
  }

  void _endCall() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: Colors.grey[900],
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text(
          'End Video Call?',
          style: TextStyle(color: Colors.white),
        ),
        content: Text(
          'Call duration: ${_formatDuration(_callDuration)}',
          style: const TextStyle(color: Colors.grey),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel', style: TextStyle(color: Colors.grey)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
            onPressed: () {
              Navigator.pop(context);
              Navigator.pop(context);
            },
            child: const Text('End Call'),
          ),
        ],
      ),
    );
  }
}