import 'dart:ui';
import 'dart:math';
import 'package:flutter/material.dart';
import 'package:agora_rtc_engine/agora_rtc_engine.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../services/config_service.dart';
import 'appointment.dart';
import 'appointment_screen.dart';

class NewVideocallScreen extends StatefulWidget {
  const NewVideocallScreen({Key? key}) : super(key: key);

  @override
  State<NewVideocallScreen> createState() => _NewVideocallScreenState();
}

class _NewVideocallScreenState extends State<NewVideocallScreen> {
  final String appId = '88a403916325401a8e5f04beff756692';
  
  String _baseUrl = '';
  
  RtcEngine? _engine;
  bool _isJoined = false;
  bool _isMuted = false;
  bool _isVideoOff = false;
  int? _remoteUid;
  String _channelName = '';
  final TextEditingController _codeController = TextEditingController();
  bool _isInitializing = true;
  bool _showRatingForm = false;
  
  // Rating form controllers
  int _rating = 0;
  final TextEditingController _feedbackController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _initializeConfig();
  }

  Future<void> _initializeConfig() async {
    try {
      await ConfigService.initialize();
      
      final ip = await ConfigService.instance.currentIP;
      final port = await ConfigService.instance.currentPort;
      
      setState(() {
        _baseUrl = 'http://$ip:$port/api/videocall';
        _isInitializing = false;
      });
      
      await _initAgora();
      
    } catch (e) {
      print('Error initializing config: $e');
      setState(() {
        _isInitializing = false;
      });
      
      if (mounted) {
        _showErrorSnackBar('Error initializing: $e');
      }
    }
  }

  Future<void> _initAgora() async {
    await [Permission.microphone, Permission.camera].request();

    _engine = createAgoraRtcEngine();
    await _engine!.initialize(RtcEngineContext(appId: appId));

    _engine!.registerEventHandler(
      RtcEngineEventHandler(
        onJoinChannelSuccess: (RtcConnection connection, int elapsed) {
          setState(() {
            _isJoined = true;
          });
        },
        onUserJoined: (RtcConnection connection, int remoteUid, int elapsed) {
          setState(() {
            _remoteUid = remoteUid;
          });
        },
        onUserOffline: (RtcConnection connection, int remoteUid, UserOfflineReasonType reason) {
          setState(() {
            _remoteUid = null;
          });
        },
      ),
    );

    await _engine!.enableVideo();
    await _engine!.startPreview();
  }

  Future<void> _joinChannel() async {
    if (_codeController.text.isEmpty || _codeController.text.length != 6) {
      _showErrorSnackBar('Please enter a valid 6-digit code');
      return;
    }

    if (_baseUrl.isEmpty) {
      _showErrorSnackBar('Server configuration not initialized');
      return;
    }

    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/generate-token'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'channelName': _codeController.text,
          'uid': 0,
        }),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        await _engine!.joinChannel(
          token: data['token'],
          channelId: data['channelName'],
          uid: data['uid'],
          options: const ChannelMediaOptions(
            channelProfile: ChannelProfileType.channelProfileCommunication,
            clientRoleType: ClientRoleType.clientRoleBroadcaster,
          ),
        );
        setState(() {
          _channelName = data['channelName'];
        });
      } else {
        throw Exception('Server returned status ${response.statusCode}: ${response.body}');
      }
    } catch (e) {
      _showErrorSnackBar('Failed to join channel: $e');
    }
  }

  Future<void> _leaveChannel() async {
    await _engine!.leaveChannel();
    setState(() {
      _isJoined = false;
      _remoteUid = null;
      _channelName = '';
      _showRatingForm = true;
    });
  }

  void _toggleMute() {
    setState(() {
      _isMuted = !_isMuted;
    });
    _engine!.muteLocalAudioStream(_isMuted);
  }

  void _toggleVideo() {
    setState(() {
      _isVideoOff = !_isVideoOff;
    });
    _engine!.muteLocalVideoStream(_isVideoOff);
  }

  void _submitRating() {
    _showSuccessSnackBar('Thank you for your feedback!');
    setState(() {
      _showRatingForm = false;
      _rating = 0;
      _feedbackController.clear();
      _codeController.clear();
    });
  }

  void _showErrorSnackBar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.red,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      ),
    );
  }

  void _showSuccessSnackBar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: const Color(0xFF20C997),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0A0E21),
      body: _buildGradientBackground(
        child: _isInitializing 
            ? _buildLoadingScreen()
            : _showRatingForm
                ? _buildRatingForm()
                : _isJoined 
                    ? _buildCallScreen() 
                    : _buildJoinScreen(),
      ),
    );
  }

  Widget _buildGradientBackground({required Widget child}) {
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [
            Color(0xFF0A0E21),
            Color(0xFF1A1F38),
            Color(0xFF2C5F7C),
          ],
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          stops: [0.0, 0.5, 1.0],
        ),
      ),
      child: child,
    );
  }

  Widget _buildGlassContainer({required Widget child, double borderRadius = 20, double padding = 20}) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(borderRadius),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 15, sigmaY: 15),
        child: Container(
          padding: EdgeInsets.all(padding),
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.08),
            borderRadius: BorderRadius.circular(borderRadius),
            border: Border.all(
              color: Colors.white.withOpacity(0.2),
              width: 1,
            ),
          ),
          child: child,
        ),
      ),
    );
  }

  Widget _buildLoadingScreen() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          _buildCircularGlowingButton(
            icon: Icons.videocam_rounded,
            size: 80,
            isActive: true,
            onTap: () {},
          ),
          const SizedBox(height: 32),
          _buildGlassContainer(
            child: Column(
              children: [
                const Text(
                  'Initializing Secure Call',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 20,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 16),
                const LinearProgressIndicator(
                  backgroundColor: Colors.white24,
                  valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF20C997)),
                  minHeight: 4,
                ),
                const SizedBox(height: 16),
                Text(
                  'Setting up encrypted connection...',
                  style: TextStyle(
                    color: Colors.white.withOpacity(0.7),
                    fontSize: 14,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildJoinScreen() {
    return SingleChildScrollView(
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const SizedBox(height: 20),
            
            // Custom App Bar
            _buildGlassContainer(
              child: Row(
                children: [
                  _buildCircularGlowingButton(
                    icon: Icons.arrow_back_rounded,
                    size: 50,
                    isActive: false,
                    onTap: () => Navigator.pop(context),
                  ),
                  const SizedBox(width: 16),
                  const Expanded(
                    child: Text(
                      'Secure Video Consultation',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 20,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            
            const SizedBox(height: 40),
            
            // Main Content
            _buildGlassContainer(
              child: Column(
                children: [
                  _buildCircularGlowingButton(
                    icon: Icons.medical_services_rounded,
                    size: 100,
                    isActive: true,
                    onTap: () {},
                  ),
                  const SizedBox(height: 24),
                  const Text(
                    'Secure Medical Consultation',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 24,
                      fontWeight: FontWeight.w700,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'Enter the 6-digit code provided by your healthcare provider',
                    style: TextStyle(
                      color: Colors.white.withOpacity(0.8),
                      fontSize: 16,
                      height: 1.4,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
            
            const SizedBox(height: 32),
            
            // Code Input
            _buildGlassContainer(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'CONSULTATION CODE',
                    style: TextStyle(
                      color: Colors.white.withOpacity(0.6),
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      letterSpacing: 1.2,
                    ),
                  ),
                  const SizedBox(height: 16),
                  Container(
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(16),
                      gradient: LinearGradient(
                        colors: [
                          Colors.white.withOpacity(0.1),
                          Colors.white.withOpacity(0.05),
                        ],
                      ),
                    ),
                    child: TextField(
                      controller: _codeController,
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        fontSize: 36,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 8,
                        color: Colors.white,
                        fontFamily: 'Monospace',
                      ),
                      keyboardType: TextInputType.number,
                      maxLength: 6,
                      decoration: InputDecoration(
                        hintText: '000000',
                        hintStyle: TextStyle(
                          color: Colors.white.withOpacity(0.3),
                          letterSpacing: 8,
                          fontFamily: 'Monospace',
                        ),
                        counterText: '',
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(16),
                          borderSide: BorderSide.none,
                        ),
                        filled: true,
                        fillColor: Colors.transparent,
                        contentPadding: const EdgeInsets.symmetric(vertical: 24),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            
            const SizedBox(height: 32),
            
            // Join Button
            _buildCircularGlowingButton(
              icon: Icons.lock_open_rounded,
              size: 70,
              isActive: true,
              onTap: _joinChannel,
              label: 'JOIN SECURE CALL',
            ),
            
            const SizedBox(height: 24),
            
            // Server Status
            if (_baseUrl.isNotEmpty)
              _buildGlassContainer(
                child: Row(
                  children: [
                    Container(
                      width: 12,
                      height: 12,
                      decoration: const BoxDecoration(
                        color: Color(0xFF20C997),
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: Color(0xFF20C997),
                            blurRadius: 8,
                            spreadRadius: 2,
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        'Connected to Secure Server',
                        style: TextStyle(
                          color: Colors.white.withOpacity(0.9),
                          fontSize: 14,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                    Icon(
                      Icons.verified_rounded,
                      color: const Color(0xFF20C997),
                      size: 20,
                    ),
                  ],
                ),
              ),
            
            const SizedBox(height: 20),
            
            // Security Info
            _buildGlassContainer(
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(
                    Icons.security_rounded,
                    color: const Color(0xFF20C997),
                    size: 20,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      'End-to-end encrypted connection ensures your medical consultation remains completely private and secure.',
                      style: TextStyle(
                        color: Colors.white.withOpacity(0.7),
                        fontSize: 13,
                        height: 1.4,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCallScreen() {
    return Stack(
      children: [
        // Remote video (full screen)
        _remoteUid != null
            ? AgoraVideoView(
                controller: VideoViewController.remote(
                  rtcEngine: _engine!,
                  canvas: VideoCanvas(uid: _remoteUid),
                  connection: RtcConnection(channelId: _channelName),
                ),
              )
            : Container(
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    colors: [Color(0xFF0A0E21), Color(0xFF1A1F38)],
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                  ),
                ),
                child: Center(
                  child: _buildGlassContainer(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        _buildCircularGlowingButton(
                          icon: Icons.person_outline_rounded,
                          size: 80,
                          isActive: false,
                          onTap: () {},
                        ),
                        const SizedBox(height: 24),
                        const Text(
                          'Waiting for Provider',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 20,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Channel: $_channelName',
                          style: TextStyle(
                            color: Colors.white.withOpacity(0.7),
                            fontSize: 14,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
        
        // Local video preview
        Positioned(
          top: 60,
          right: 20,
          child: _buildGlassContainer(
            borderRadius: 16,
            padding: 0,
            child: Container(
              width: 120,
              height: 160,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: Colors.white.withOpacity(0.3),
                  width: 2,
                ),
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(14),
                child: AgoraVideoView(
                  controller: VideoViewController(
                    rtcEngine: _engine!,
                    canvas: const VideoCanvas(uid: 0),
                  ),
                ),
              ),
            ),
          ),
        ),
        
        // Status Indicator
        if (_remoteUid != null)
          Positioned(
            top: 60,
            left: 20,
            child: _buildGlassContainer(
              child: Row(
                children: [
                  Container(
                    width: 8,
                    height: 8,
                    decoration: const BoxDecoration(
                      color: Color(0xFF20C997),
                      shape: BoxShape.circle,
                    ),
                  ),
                  const SizedBox(width: 8),
                  const Text(
                    'LIVE CONSULTATION',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      letterSpacing: 1.2,
                    ),
                  ),
                ],
              ),
            ),
          ),
        
        // Bottom Glass Controls
        Positioned(
          bottom: 40,
          left: 20,
          right: 20,
          child: _buildGlassContainer(
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                _buildControlButton(
                  icon: _isMuted ? Icons.mic_off_rounded : Icons.mic_rounded,
                  label: _isMuted ? 'Unmute' : 'Mute',
                  isActive: !_isMuted,
                  onPressed: _toggleMute,
                ),
                _buildControlButton(
                  icon: _isVideoOff ? Icons.videocam_off_rounded : Icons.videocam_rounded,
                  label: _isVideoOff ? 'Camera On' : 'Camera Off',
                  isActive: !_isVideoOff,
                  onPressed: _toggleVideo,
                ),
                _buildControlButton(
                  icon: Icons.call_end_rounded,
                  label: 'End Call',
                  isActive: false,
                  isEndCall: true,
                  onPressed: _leaveChannel,
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildCircularGlowingButton({
    required IconData icon,
    required double size,
    required bool isActive,
    required VoidCallback onTap,
    String? label,
  }) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        GestureDetector(
          onTap: onTap,
          child: Container(
            width: size,
            height: size,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: isActive
                  ? const LinearGradient(
                      colors: [Color(0xFF20C997), Color(0xFF2C5F7C)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    )
                  : LinearGradient(
                      colors: [
                        Colors.white.withOpacity(0.1),
                        Colors.white.withOpacity(0.05),
                      ],
                    ),
              boxShadow: isActive
                  ? [
                      BoxShadow(
                        color: const Color(0xFF20C997).withOpacity(0.4),
                        blurRadius: 20,
                        spreadRadius: 2,
                      ),
                      BoxShadow(
                        color: const Color(0xFF2C5F7C).withOpacity(0.3),
                        blurRadius: 40,
                        spreadRadius: 4,
                      ),
                    ]
                  : null,
              border: Border.all(
                color: Colors.white.withOpacity(0.2),
                width: 1,
              ),
            ),
            child: Icon(
              icon,
              color: Colors.white,
              size: size * 0.4,
            ),
          ),
        ),
        if (label != null) ...[
          const SizedBox(height: 12),
          Text(
            label,
            style: TextStyle(
              color: Colors.white.withOpacity(0.8),
              fontSize: 12,
              fontWeight: FontWeight.w600,
              letterSpacing: 1.1,
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildControlButton({
    required IconData icon,
    required String label,
    required bool isActive,
    required VoidCallback onPressed,
    bool isEndCall = false,
  }) {
    return Column(
      children: [
        _buildCircularGlowingButton(
          icon: icon,
          size: 60,
          isActive: isEndCall ? true : isActive,
          onTap: onPressed,
        ),
        const SizedBox(height: 8),
        Text(
          label,
          style: TextStyle(
            color: Colors.white.withOpacity(0.8),
            fontSize: 11,
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }

  Widget _buildRatingForm() {
    return SingleChildScrollView(
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const SizedBox(height: 40),
            
            // Success Header
            _buildGlassContainer(
              child: Column(
                children: [
                  _buildCircularGlowingButton(
                    icon: Icons.check_circle_rounded,
                    size: 100,
                    isActive: true,
                    onTap: () {},
                  ),
                  const SizedBox(height: 24),
                  const Text(
                    'Consultation Complete',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 24,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Thank you for choosing our secure medical service',
                    style: TextStyle(
                      color: Colors.white.withOpacity(0.8),
                      fontSize: 16,
                      height: 1.4,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
            
            const SizedBox(height: 32),
            
            // Rating Section
            _buildGlassContainer(
              child: Column(
                children: [
                  const Text(
                    'Rate Your Experience',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 20,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Your feedback helps us improve',
                    style: TextStyle(
                      color: Colors.white.withOpacity(0.7),
                      fontSize: 14,
                    ),
                  ),
                  const SizedBox(height: 24),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: List.generate(5, (index) {
                      return GestureDetector(
                        onTap: () {
                          setState(() {
                            _rating = index + 1;
                          });
                        },
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 4),
                          child: AnimatedContainer(
                            duration: const Duration(milliseconds: 200),
                            child: Icon(
                              index < _rating ? Icons.star_rounded : Icons.star_outline_rounded,
                              size: 40,
                              color: index < _rating 
                                  ? const Color(0xFFFFB800)
                                  : Colors.white.withOpacity(0.3),
                            ),
                          ),
                        ),
                      );
                    }),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    _rating == 0 ? 'Tap to rate' : '${_rating}.0 / 5.0',
                    style: TextStyle(
                      color: _rating == 0 ? Colors.white.withOpacity(0.5) : const Color(0xFFFFB800),
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
            
            const SizedBox(height: 24),
            
            // Feedback Section
            _buildGlassContainer(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'ADDITIONAL FEEDBACK',
                    style: TextStyle(
                      color: Colors.white.withOpacity(0.6),
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      letterSpacing: 1.2,
                    ),
                  ),
                  const SizedBox(height: 16),
                  Container(
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(16),
                      color: Colors.white.withOpacity(0.05),
                    ),
                    child: TextField(
                      controller: _feedbackController,
                      maxLines: 4,
                      style: const TextStyle(color: Colors.white),
                      decoration: InputDecoration(
                        hintText: 'Share your thoughts about the consultation...',
                        hintStyle: TextStyle(
                          color: Colors.white.withOpacity(0.4),
                        ),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(16),
                          borderSide: BorderSide.none,
                        ),
                        contentPadding: const EdgeInsets.all(16),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            
            const SizedBox(height: 32),
            
            // Submit Button
            _buildCircularGlowingButton(
              icon: Icons.thumb_up_rounded,
              size: 70,
              isActive: _rating > 0,
              onTap: _rating > 0 ? _submitRating : () {},
              label: 'SUBMIT FEEDBACK',
            ),
            
            const SizedBox(height: 16),
            
            // Skip Button
            Center(
              child: TextButton(
                onPressed: () {
                  setState(() {
                    _showRatingForm = false;
                    _rating = 0;
                    _feedbackController.clear();
                    _codeController.clear();
                  });
                },
                child: Text(
                  'Skip Feedback',
                  style: TextStyle(
                    color: Colors.white.withOpacity(0.6),
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  void dispose() {
    _engine?.leaveChannel();
    _engine?.release();
    _codeController.dispose();
    _feedbackController.dispose();
    super.dispose();
  }
}