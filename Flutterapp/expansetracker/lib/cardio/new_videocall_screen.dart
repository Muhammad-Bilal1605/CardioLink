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
  bool _showCustomKeypad = false;
  
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
      
      print('Video Call initialized with base URL: $_baseUrl');
      
      await _initAgora();
      
    } catch (e) {
      print('Error initializing config: $e');
      setState(() {
        _isInitializing = false;
      });
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error initializing: $e'),
            backgroundColor: Colors.red,
          ),
        );
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
    if (_codeController.text.isEmpty || _codeController.text.length != 4) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Please enter a valid 4-digit code'),
          backgroundColor: const Color(0xFF2C5F7C),
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
      );
      return;
    }

    if (_baseUrl.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Server configuration not initialized'),
          backgroundColor: Colors.red,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
      );
      return;
    }

    try {
      print('Attempting to join channel with URL: $_baseUrl/generate-token');
      
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
      print('Error joining channel: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to join channel: $e'),
            backgroundColor: Colors.red,
            duration: const Duration(seconds: 5),
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
        );
      }
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
    // Show thank you message
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: const Text('Thank you for your feedback!'),
        backgroundColor: const Color(0xFF20C997),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    );
    
    // Reset and go back
    setState(() {
      _showRatingForm = false;
      _rating = 0;
      _feedbackController.clear();
      _codeController.clear();
    });
  }

  void _onKeypadButtonPressed(String value) {
    if (_codeController.text.length < 4) {
      setState(() {
        _codeController.text += value;
      });
    }
  }

  void _onBackspacePressed() {
    if (_codeController.text.isNotEmpty) {
      setState(() {
        _codeController.text = _codeController.text.substring(0, _codeController.text.length - 1);
      });
    }
  }

  void _toggleKeypad() {
    setState(() {
      _showCustomKeypad = !_showCustomKeypad;
    });
  }

  void _clearCode() {
    setState(() {
      _codeController.clear();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FA),
      appBar: _isJoined ? null : AppBar(
        elevation: 0,
        backgroundColor: Colors.transparent,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Color(0xFF2C5F7C)),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          'Video Consultation',
          style: TextStyle(
            color: Color(0xFF2C5F7C),
            fontWeight: FontWeight.w600,
            fontSize: 20,
          ),
        ),
      ),
      body: _isInitializing 
          ? _buildLoadingScreen()
          : _showRatingForm
              ? _buildRatingForm()
              : _isJoined 
                  ? _buildCallScreen() 
                  : _buildJoinScreen(),
      bottomSheet: _showCustomKeypad && !_isJoined && !_isInitializing && !_showRatingForm
          ? _buildNumericKeypad()
          : null,
    );
  }

  Widget _buildLoadingScreen() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.white,
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFF2C5F7C).withOpacity(0.1),
                  blurRadius: 20,
                  spreadRadius: 5,
                ),
              ],
            ),
            child: const CircularProgressIndicator(
              valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF2C5F7C)),
              strokeWidth: 3,
            ),
          ),
          const SizedBox(height: 24),
          const Text(
            'Initializing server configuration...',
            style: TextStyle(
              color: Color(0xFF6C757D),
              fontSize: 16,
              fontWeight: FontWeight.w500,
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
            
            // Illustration Container
            Container(
              height: 200,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    const Color(0xFF2C5F7C).withOpacity(0.1),
                    const Color(0xFF20C997).withOpacity(0.1),
                  ],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(24),
              ),
              child: Center(
                child: Icon(
                  Icons.videocam_rounded,
                  size: 80,
                  color: const Color(0xFF2C5F7C),
                ),
              ),
            ),
            
            const SizedBox(height: 40),
            
            // Title
            const Text(
              'Join Video Call',
              style: TextStyle(
                fontSize: 28,
                fontWeight: FontWeight.bold,
                color: Color(0xFF2C5F7C),
              ),
              textAlign: TextAlign.center,
            ),
            
            const SizedBox(height: 12),
            
            // Subtitle
            const Text(
              'Enter the 4-digit code provided by your doctor',
              style: TextStyle(
                fontSize: 16,
                color: Color(0xFF6C757D),
              ),
              textAlign: TextAlign.center,
            ),
            
            const SizedBox(height: 40),
            
            // Code Input with Custom Keypad Toggle
            Column(
              children: [
                Container(
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFF2C5F7C).withOpacity(0.08),
                        blurRadius: 20,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: TextField(
                    controller: _codeController,
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      fontSize: 32,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 16,
                      color: Color(0xFF2C5F7C),
                    ),
                    keyboardType: TextInputType.none, // Disable default keyboard
                    maxLength: 4,
                    readOnly: true, // Make it read-only to prevent default keyboard
                    //onTap: _toggleKeypad, // Show custom keypad when tapped
                    decoration: InputDecoration(
                      hintText: '----',
                      hintStyle: TextStyle(
                        color: const Color(0xFF6C757D).withOpacity(0.3),
                        letterSpacing: 16,
                      ),
                      counterText: '',
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(16),
                        borderSide: BorderSide.none,
                      ),
                      filled: true,
                      fillColor: Colors.white,
                      contentPadding: const EdgeInsets.symmetric(vertical: 24),
                      suffixIcon: IconButton(
                        icon: Icon(
                          _showCustomKeypad ? Icons.keyboard_hide : Icons.keyboard,
                          color: const Color(0xFF2C5F7C),
                        ),
                        onPressed: _toggleKeypad,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  _showCustomKeypad ? 'Tap the keyboard icon to hide' : 'Tap the code field to open keyboard',
                  style: TextStyle(
                    fontSize: 12,
                    color: const Color(0xFF6C757D).withOpacity(0.7),
                  ),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
            
            const SizedBox(height: 32),
            
            // Join Button
            Container(
              height: 56,
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF2C5F7C), Color(0xFF20C997)],
                  begin: Alignment.centerLeft,
                  end: Alignment.centerRight,
                ),
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFF2C5F7C).withOpacity(0.3),
                    blurRadius: 12,
                    offset: const Offset(0, 6),
                  ),
                ],
              ),
              child: ElevatedButton(
                onPressed: _joinChannel,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.transparent,
                  shadowColor: Colors.transparent,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                ),
                child: const Text(
                  'Join Consultation',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w600,
                    color: Colors.white,
                  ),
                ),
              ),
            ),
            
            const SizedBox(height: 24),
            
            // Info Card
            if (_baseUrl.isNotEmpty)
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFF20C997).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: const Color(0xFF20C997).withOpacity(0.3),
                  ),
                ),
                child: Row(
                  children: [
                    const Icon(
                      Icons.info_outline_rounded,
                      color: Color(0xFF20C997),
                      size: 20,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        'Connected to server',
                        style: TextStyle(
                          fontSize: 14,
                          color: const Color(0xFF2C5F7C).withOpacity(0.8),
                          fontWeight: FontWeight.w500,
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

  Widget _buildNumericKeypad() {
    // Define the keys for the numeric keypad
    final List<List<String>> keypadRows = [
      ['1', '2', '3'],
      ['4', '5', '6'],
      ['7', '8', '9'],
      ['', '0', ''],
    ];

    return Container(
      height: 300,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: const BorderRadius.only(
          topLeft: Radius.circular(20),
          topRight: Radius.circular(20),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 20,
            offset: const Offset(0, -5),
          ),
        ],
      ),
      child: Column(
        children: [
          // Current Code Display
          Container(
            padding: const EdgeInsets.symmetric(vertical: 12),
            child: Text(
              _codeController.text.padRight(4, '_'),
              style: const TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                letterSpacing: 8,
                color: Color(0xFF2C5F7C),
              ),
            ),
          ),
          const Divider(),
          const SizedBox(height: 8),
          
          // Keypad Grid
          Expanded(
            child: Column(
              children: keypadRows.map((row) {
                return Expanded(
                  child: Row(
                    children: row.map((key) {
                      return Expanded(
                        child: Padding(
                          padding: const EdgeInsets.all(4),
                          child: key.isEmpty
                              ? const SizedBox() // Empty space for layout
                              : Material(
                                  color: Colors.transparent,
                                  child: InkWell(
                                    onTap: () => _onKeypadButtonPressed(key),
                                    borderRadius: BorderRadius.circular(12),
                                    child: Container(
                                      decoration: BoxDecoration(
                                        color: const Color(0xFF2C5F7C).withOpacity(0.1),
                                        borderRadius: BorderRadius.circular(12),
                                        border: Border.all(
                                          color: const Color(0xFF2C5F7C).withOpacity(0.2),
                                        ),
                                      ),
                                      child: Center(
                                        child: Text(
                                          key,
                                          style: const TextStyle(
                                            fontSize: 24,
                                            fontWeight: FontWeight.w600,
                                            color: Color(0xFF2C5F7C),
                                          ),
                                        ),
                                      ),
                                    ),
                                  ),
                                ),
                        ),
                      );
                    }).toList(),
                  ),
                );
              }).toList(),
            ),
          ),
          
          // Bottom Row with Backspace, Clear and Close
          Container(
            height: 60,
            child: Row(
              children: [
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.all(4),
                    child: Material(
                      color: Colors.transparent,
                      child: InkWell(
                        onTap: _clearCode,
                        borderRadius: BorderRadius.circular(12),
                        child: Container(
                          decoration: BoxDecoration(
                            color: const Color(0xFF6C757D).withOpacity(0.1),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: const Center(
                            child: Icon(
                              Icons.clear,
                              color: Color(0xFF6C757D),
                              size: 24,
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.all(4),
                    child: Material(
                      color: Colors.transparent,
                      child: InkWell(
                        onTap: _onBackspacePressed,
                        borderRadius: BorderRadius.circular(12),
                        child: Container(
                          decoration: BoxDecoration(
                            color: const Color(0xFF6C757D).withOpacity(0.1),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: const Center(
                            child: Icon(
                              Icons.backspace_outlined,
                              color: Color(0xFF6C757D),
                              size: 24,
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.all(4),
                    child: Material(
                      color: Colors.transparent,
                      child: InkWell(
                        onTap: _toggleKeypad,
                        borderRadius: BorderRadius.circular(12),
                        child: Container(
                          decoration: BoxDecoration(
                            color: const Color(0xFF2C5F7C),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: const Center(
                            child: Text(
                              'Done',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 16,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
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
                    colors: [Color(0xFF2C5F7C), Color(0xFF1A3A4F)],
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                  ),
                ),
                child: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Container(
                        padding: const EdgeInsets.all(24),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.1),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(
                          Icons.person_outline_rounded,
                          size: 64,
                          color: Colors.white,
                        ),
                      ),
                      const SizedBox(height: 24),
                      const Text(
                        'Waiting for doctor to join...',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 18,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
        
        // Local video (small preview)
        Positioned(
          top: 50,
          right: 20,
          child: Container(
            width: 120,
            height: 160,
            decoration: BoxDecoration(
              border: Border.all(color: Colors.white, width: 3),
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.3),
                  blurRadius: 12,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(13),
              child: AgoraVideoView(
                controller: VideoViewController(
                  rtcEngine: _engine!,
                  canvas: const VideoCanvas(uid: 0),
                ),
              ),
            ),
          ),
        ),
        
        // Controls
        Positioned(
          bottom: 40,
          left: 0,
          right: 0,
          child: Container(
            margin: const EdgeInsets.symmetric(horizontal: 24),
            padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 16),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.95),
              borderRadius: BorderRadius.circular(24),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.2),
                  blurRadius: 20,
                  offset: const Offset(0, 8),
                ),
              ],
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                _buildControlButton(
                  icon: _isMuted ? Icons.mic_off_rounded : Icons.mic_rounded,
                  isActive: !_isMuted,
                  onPressed: _toggleMute,
                ),
                _buildControlButton(
                  icon: _isVideoOff ? Icons.videocam_off_rounded : Icons.videocam_rounded,
                  isActive: !_isVideoOff,
                  onPressed: _toggleVideo,
                ),
                _buildControlButton(
                  icon: Icons.call_end_rounded,
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

  Widget _buildControlButton({
    required IconData icon,
    required bool isActive,
    required VoidCallback onPressed,
    bool isEndCall = false,
  }) {
    return Container(
      width: 64,
      height: 64,
      decoration: BoxDecoration(
        color: isEndCall 
            ? Colors.red 
            : isActive 
                ? const Color(0xFF2C5F7C) 
                : const Color(0xFF6C757D),
        shape: BoxShape.circle,
        boxShadow: [
          BoxShadow(
            color: (isEndCall ? Colors.red : const Color(0xFF2C5F7C)).withOpacity(0.3),
            blurRadius: 8,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: IconButton(
        onPressed: onPressed,
        icon: Icon(icon, color: Colors.white, size: 28),
        padding: EdgeInsets.zero,
      ),
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
            
            // Success Icon
            Container(
              width: 100,
              height: 100,
              decoration: BoxDecoration(
                color: const Color(0xFF20C997).withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.check_circle_rounded,
                size: 60,
                color: Color(0xFF20C997),
              ),
            ),
            
            const SizedBox(height: 24),
            
            // Title
            const Text(
              'Consultation Completed',
              style: TextStyle(
                fontSize: 26,
                fontWeight: FontWeight.bold,
                color: Color(0xFF2C5F7C),
              ),
              textAlign: TextAlign.center,
            ),
            
            const SizedBox(height: 12),
            
            const Text(
              'How was your experience?',
              style: TextStyle(
                fontSize: 16,
                color: Color(0xFF6C757D),
              ),
              textAlign: TextAlign.center,
            ),
            
            const SizedBox(height: 40),
            
            // Rating Stars
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFF2C5F7C).withOpacity(0.08),
                    blurRadius: 20,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Column(
                children: [
                  const Text(
                    'Rate Your Doctor',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF2C5F7C),
                    ),
                  ),
                  const SizedBox(height: 20),
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
                          child: Icon(
                            index < _rating ? Icons.star_rounded : Icons.star_outline_rounded,
                            size: 48,
                            color: index < _rating ? const Color(0xFFFFC107) : const Color(0xFF6C757D).withOpacity(0.3),
                          ),
                        ),
                      );
                    }),
                  ),
                ],
              ),
            ),
            
            const SizedBox(height: 24),
            
            // Feedback TextField
            Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFF2C5F7C).withOpacity(0.08),
                    blurRadius: 20,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: TextField(
                controller: _feedbackController,
                maxLines: 5,
                decoration: InputDecoration(
                  hintText: 'Share your feedback (optional)',
                  hintStyle: TextStyle(
                    color: const Color(0xFF6C757D).withOpacity(0.5),
                  ),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(16),
                    borderSide: BorderSide.none,
                  ),
                  filled: true,
                  fillColor: Colors.white,
                  contentPadding: const EdgeInsets.all(20),
                ),
              ),
            ),
            
            const SizedBox(height: 32),
            
            // Submit Button
            Container(
              height: 56,
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF2C5F7C), Color(0xFF20C997)],
                  begin: Alignment.centerLeft,
                  end: Alignment.centerRight,
                ),
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFF2C5F7C).withOpacity(0.3),
                    blurRadius: 12,
                    offset: const Offset(0, 6),
                  ),
                ],
              ),
              child: ElevatedButton(
                onPressed: _rating > 0 ? _submitRating : null,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.transparent,
                  disabledBackgroundColor: const Color(0xFF6C757D).withOpacity(0.3),
                  shadowColor: Colors.transparent,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                ),
                child: const Text(
                  'Submit Feedback',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w600,
                    color: Colors.white,
                  ),
                ),
              ),
            ),
            
            const SizedBox(height: 16),
            
            // Skip Button
            TextButton(
              onPressed: () {
                setState(() {
                  _showRatingForm = false;
                  _rating = 0;
                  _feedbackController.clear();
                  _codeController.clear();
                });
              },
              child: const Text(
                'Skip for now',
                style: TextStyle(
                  color: Color(0xFF6C757D),
                  fontSize: 16,
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