// lib/screens/simple_video_call_screen.dart
// Alternative approach using web-based video calling without ZegoCloud UIKit

import 'package:flutter/material.dart';
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
}