// lib/cardio/doctor_chat_screen.dart - Fixed Implementation
import 'package:flutter/material.dart';
import '../services/zego_cloud_service.dart';
import '../services/config_service.dart';
import 'dart:async';

class DoctorChatScreen extends StatefulWidget {
  final String patientId;
  final String patientName;
  final String roomId;
  final dynamic doctor;

  const DoctorChatScreen({
    Key? key,
    required this.patientId,
    required this.patientName,
    required this.roomId,
    this.doctor,
  }) : super(key: key);

  DoctorChatScreen.fromDoctor({
    Key? key,
    required dynamic doctor,
  }) : 
    patientId = 'patient_${doctor?.id?.toString() ?? DateTime.now().millisecondsSinceEpoch}',
    patientName = doctor?.name ?? doctor?.patientName ?? 'Patient ${doctor?.name ?? "Unknown"}',
    roomId = 'room_patient_${doctor?.id ?? DateTime.now().millisecondsSinceEpoch}',
    doctor = doctor,
    super(key: key);

  @override
  _DoctorChatScreenState createState() => _DoctorChatScreenState();
}

class _DoctorChatScreenState extends State<DoctorChatScreen> with WidgetsBindingObserver {
  final ZegoCloudService _zegoService = ZegoCloudService();
  bool _isInitializing = true;
  bool _isConnected = false;
  bool _isIncomingCall = false;
  String? _incomingCallId;
  String? _callerName;
  bool _isCallInProgress = false;
  String? _currentCallId;
  List<Map<String, dynamic>> _messages = [];
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();

  // Call-related states
  bool _isOutgoingCall = false;
  String _callStatus = 'idle'; // idle, calling, connecting, connected
  DateTime? _callStartTime;
  int _callDuration = 0;
  Timer? _callDurationTimer;
  bool _isInVideoCall = false;
  bool _showCallInterface = false;

  // UI states
  bool _isTyping = false;
  Timer? _typingTimer;
  String? _connectionError;
  int _reconnectAttempts = 0;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _initializeServices();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _callDurationTimer?.cancel();
    _typingTimer?.cancel();
    _zegoService.dispose();
    _messageController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    super.didChangeAppLifecycleState(state);
    
    switch (state) {
      case AppLifecycleState.paused:
        // App went to background
        break;
      case AppLifecycleState.resumed:
        // App came to foreground
        if (!_isConnected) {
          _reconnectToService();
        }
        break;
      case AppLifecycleState.detached:
        // App is about to be terminated
        _endCall();
        break;
      default:
        break;
    }
  }

  Future<void> _initializeServices() async {
    try {
      setState(() {
        _isInitializing = true;
        _connectionError = null;
      });

      if (!ConfigService.instance.isInitialized) {
        await ConfigService.initialize();
      }

      await ConfigService.instance.printConfig();

      final connectionTest = await _zegoService.testConnection();
      if (!connectionTest) {
        setState(() {
          _connectionError = 'Cannot connect to backend server. Please check your network and server configuration.';
        });
      }

      // Initialize with enhanced user info
      final success = await _zegoService.initialize(
        userId: widget.patientId,
        userName: widget.patientName,
        userType: 'patient',
      );

      if (success) {
        _setupCallbacks();
        setState(() {
          _isConnected = _zegoService.isConnected;
          _isInitializing = false;
          _reconnectAttempts = 0;
        });
        
        _zegoService.printConfig();
        _showMessage('Connected to CardioLink server');
      } else {
        setState(() {
          _isInitializing = false;
          _connectionError = 'Failed to initialize video calling service';
        });
      }
    } catch (e) {
      setState(() {
        _isInitializing = false;
        _connectionError = 'Initialization error: $e';
      });
      print('Initialization error: $e');
    }
  }

  Future<void> _reconnectToService() async {
    if (_reconnectAttempts >= 5) {
      setState(() {
        _connectionError = 'Maximum reconnection attempts reached. Please restart the app.';
      });
      return;
    }

    setState(() {
      _reconnectAttempts++;
      _connectionError = 'Reconnecting... (${_reconnectAttempts}/5)';
    });

    await Future.delayed(Duration(seconds: _reconnectAttempts * 2));
    await _initializeServices();
  }

  void _setupCallbacks() {
    _zegoService.onIncomingCall = (callId, callerId, callerName, isVideo) {
      print('Flutter: Incoming call received - CallID: $callId, Caller: $callerName, Video: $isVideo');
      
      if (mounted) {
        setState(() {
          _isIncomingCall = true;
          _incomingCallId = callId;
          _callerName = callerName;
          _callStatus = 'incoming';
        });
        
        _showMessage('Incoming ${isVideo ? 'video' : 'audio'} call from $callerName');
        _showIncomingCallDialog(callId, callerName, isVideo);
      }
    };

    _zegoService.onCallAccepted = (callId) {
      print('Flutter: Call accepted - CallID: $callId');
      
      if (mounted) {
        setState(() {
          _isCallInProgress = true;
          _currentCallId = callId;
          _isIncomingCall = false;
          _callStatus = 'connected';
          _callStartTime = DateTime.now();
          _showCallInterface = true;
          _isInVideoCall = true;
        });
        
        _showMessage('Call connected with doctor');
        _startCallTimer();
      }
    };

    _zegoService.onCallRejected = (callId) {
      print('Flutter: Call rejected - CallID: $callId');
      
      if (mounted) {
        setState(() {
          _isIncomingCall = false;
          _incomingCallId = null;
          _isOutgoingCall = false;
          _callStatus = 'idle';
          _showCallInterface = false;
        });
        
        _showMessage('Call was rejected');
      }
    };

    _zegoService.onCallEnded = (callId) {
      print('Flutter: Call ended - CallID: $callId');
      
      if (mounted) {
        _endCallSession();
        _showMessage('Call ended');
      }
    };

    _zegoService.onError = (error) {
      print('Flutter: ZegoService error: $error');
      if (mounted) {
        _showError(error);
        _endCallSession();
      }
    };
  }

  void _startCallTimer() {
    _callDurationTimer?.cancel();
    _callDurationTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!_isCallInProgress || _callStartTime == null) {
        timer.cancel();
        return;
      }
      
      if (mounted) {
        setState(() {
          _callDuration = DateTime.now().difference(_callStartTime!).inSeconds;
        });
      }
    });
  }

  void _endCallSession() {
    _callDurationTimer?.cancel();
    
    if (mounted) {
      setState(() {
        _isCallInProgress = false;
        _currentCallId = null;
        _isIncomingCall = false;
        _incomingCallId = null;
        _isOutgoingCall = false;
        _callStatus = 'idle';
        _callStartTime = null;
        _callDuration = 0;
        _showCallInterface = false;
        _isInVideoCall = false;
      });
    }
  }

  String _formatCallDuration(int seconds) {
    final minutes = seconds ~/ 60;
    final remainingSeconds = seconds % 60;
    return '${minutes.toString().padLeft(2, '0')}:${remainingSeconds.toString().padLeft(2, '0')}';
  }

  void _showMessage(String message) {
    if (!mounted) return;
    
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.green,
        duration: const Duration(seconds: 3),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  void _showError(String error) {
    if (!mounted) return;
    
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(error),
        backgroundColor: Colors.red,
        duration: const Duration(seconds: 4),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  void _showIncomingCallDialog(String callId, String callerName, bool isVideo) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => WillPopScope(
        onWillPop: () async => false, // Prevent back button dismissal
        child: AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [Colors.blue.shade400, Colors.blue.shade600],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  isVideo ? Icons.videocam : Icons.phone,
                  size: 48,
                  color: Colors.white,
                ),
              ),
              const SizedBox(height: 20),
              Text(
                'Incoming ${isVideo ? 'Video' : 'Audio'} Call',
                style: const TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                callerName,
                style: TextStyle(
                  fontSize: 16,
                  color: Colors.grey.shade700,
                ),
              ),
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.blue.shade50,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  'CardioLink Doctor',
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.blue.shade700,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
              const SizedBox(height: 32),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  _buildCallActionButton(
                    icon: Icons.call_end,
                    label: 'Decline',
                    colorScheme: Colors.red,
                    onPressed: () => _rejectIncomingCall(),
                  ),
                  _buildCallActionButton(
                    icon: isVideo ? Icons.videocam : Icons.phone,
                    label: 'Accept',
                    colorScheme: Colors.green,
                    onPressed: () => _acceptIncomingCall(),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _acceptIncomingCall() async {
    Navigator.of(context).pop(); // Close dialog
    
    if (_incomingCallId != null) {
      print('Flutter: Accepting call $_incomingCallId');
      
      setState(() {
        _callStatus = 'connecting';
      });
      
      try {
        await _zegoService.acceptIncomingCall(_incomingCallId!);
      } catch (e) {
        _showError('Failed to accept call: $e');
        _endCallSession();
      }
    }
  }

  Future<void> _rejectIncomingCall() async {
    Navigator.of(context).pop(); // Close dialog
    
    if (_incomingCallId != null) {
      print('Flutter: Rejecting call $_incomingCallId');
      await _zegoService.rejectIncomingCall(_incomingCallId!);
    }
  }

  Future<void> _initiateCallToDoctor({required bool isVideo}) async {
    if (!_isConnected) {
      _showError('Not connected to server. Please check your connection.');
      return;
    }

    if (_isCallInProgress || _isOutgoingCall) {
      _showError('A call is already in progress.');
      return;
    }

    setState(() {
      _isOutgoingCall = true;
      _callStatus = 'calling';
    });

    try {
      await _zegoService.initiateCall(
        doctorId: 'doctor_001', // Default doctor ID
        isVideo: isVideo,
      );
      
      _showMessage('Calling doctor...');
      
      // Set a timeout for outgoing calls
      Timer(const Duration(seconds: 30), () {
        if (_callStatus == 'calling' && mounted) {
          _endCallSession();
          _showError('Call timeout. The doctor is not available.');
        }
      });
      
    } catch (e) {
      setState(() {
        _isOutgoingCall = false;
        _callStatus = 'idle';
      });
      _showError('Failed to initiate call: $e');
    }
  }

  Future<void> _endCall() async {
    print('Flutter: Ending call');
    
    try {
      await _zegoService.endCall();
    } catch (e) {
      print('Error ending call: $e');
    } finally {
      _endCallSession();
    }
  }

  Future<void> _sendMessage() async {
    final messageText = _messageController.text.trim();
    if (messageText.isEmpty) return;

    // Add message to local list immediately
    final tempMessage = {
      'text': messageText,
      'isMe': true,
      'timestamp': DateTime.now(),
      'status': 'sending',
    };

    setState(() {
      _messages.add(tempMessage);
    });

    _messageController.clear();
    _scrollToBottom();

    try {
      await _zegoService.sendMessage(message: messageText);
      
      // Update message status
      setState(() {
        if (_messages.isNotEmpty) {
          _messages.last['status'] = 'sent';
        }
      });
      
    } catch (e) {
      _showError('Failed to send message: $e');
      
      // Update message status to failed
      setState(() {
        if (_messages.isNotEmpty) {
          _messages.last['status'] = 'failed';
        }
      });
    }
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  void _onMessageChanged(String text) {
    if (!_isTyping && text.isNotEmpty) {
      setState(() => _isTyping = true);
    }
    
    _typingTimer?.cancel();
    _typingTimer = Timer(const Duration(seconds: 2), () {
      if (mounted) {
        setState(() => _isTyping = false);
      }
    });
  }

  Future<void> _showConnectionSettings() async {
    final currentIP = await ConfigService.instance.currentIP;
    final currentPort = await ConfigService.instance.currentPort;
    final isCustom = await ConfigService.instance.isUsingCustomConfig;

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Row(
          children: [
            Icon(Icons.settings, color: Colors.blue.shade600),
            const SizedBox(width: 8),
            const Text('Connection Settings'),
          ],
        ),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildSettingRow('Backend Server', '$currentIP:$currentPort'),
              _buildSettingRow('Custom Config', isCustom ? 'Yes' : 'No'),
              const Divider(),
              _buildSettingRow('Environment IP', ConfigService.instance.envIP ?? 'N/A'),
              _buildSettingRow('Environment Port', ConfigService.instance.envPort ?? 'N/A'),
              const Divider(),
              _buildSettingRow('Connection Status', _zegoService.isConnected ? 'Connected' : 'Disconnected'),
              _buildSettingRow('Call Status', _callStatus),
              if (_isCallInProgress)
                _buildSettingRow('Call Duration', _formatCallDuration(_callDuration)),
              _buildSettingRow('Reconnect Attempts', _reconnectAttempts.toString()),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Close'),
          ),
          TextButton(
            onPressed: () async {
              Navigator.pop(context);
              await _testConnection();
            },
            child: const Text('Test Connection'),
          ),
          if (!_isConnected)
            TextButton(
              onPressed: () async {
                Navigator.pop(context);
                await _reconnectToService();
              },
              child: const Text('Reconnect'),
            ),
        ],
      ),
    );
  }

  Widget _buildSettingRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 120,
            child: Text(
              '$label:',
              style: const TextStyle(fontWeight: FontWeight.w500),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: TextStyle(color: Colors.grey.shade700),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _testConnection() async {
    _showMessage('Testing connection...');
    
    try {
      final success = await _zegoService.testConnection();
      
      if (success) {
        _showMessage('Connection test successful!');
        if (!_isConnected) {
          await _reconnectToService();
        }
      } else {
        _showError('Connection test failed. Please check your configuration.');
      }
    } catch (e) {
      _showError('Connection test error: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Chat with Doctor'),
        backgroundColor: Colors.blue.shade700,
        foregroundColor: Colors.white,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.settings),
            onPressed: _showConnectionSettings,
            tooltip: 'Connection Settings',
          ),
          if (_isCallInProgress)
            IconButton(
              icon: const Icon(Icons.call_end),
              onPressed: _endCall,
              tooltip: 'End Call',
            ),
          if (_isInitializing)
            const Padding(
              padding: EdgeInsets.all(16.0),
              child: SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                ),
              ),
            ),
        ],
      ),
      body: Stack(
        children: [
          Container(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  Colors.blue.shade50,
                  Colors.white,
                ],
              ),
            ),
            child: Column(
              children: [
                _buildConnectionInfoCard(),
                if (_isCallInProgress || _isOutgoingCall) _buildCallStatusCard(),
                if (_connectionError != null) _buildErrorCard(),
                Expanded(child: _buildChatArea()),
                if (_isConnected && !_showCallInterface) _buildMessageInput(),
              ],
            ),
          ),
          if (_showCallInterface) _buildCallInterface(),
        ],
      ),
    );
  }

  Widget _buildConnectionInfoCard() {
    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.1),
            spreadRadius: 1,
            blurRadius: 5,
          ),
        ],
      ),
      child: Row(
        children: [
          CircleAvatar(
            radius: 30,
            backgroundColor: Colors.blue.shade100,
            child: Icon(
              Icons.local_hospital,
              size: 35,
              color: Colors.blue.shade700,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'CardioLink Patient App',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 18,
                    color: Colors.blueAccent,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Patient: ${widget.patientName}',
                  style: TextStyle(
                    color: Colors.grey.shade600,
                    fontSize: 14,
                  ),
                ),
                Text(
                  'Server: ${ConfigService.instance.ipAddress}:${ConfigService.instance.port}',
                  style: TextStyle(
                    color: Colors.grey.shade500,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: _getStatusColor(),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(
              _getStatusText(),
              style: TextStyle(
                color: _getStatusTextColor(),
                fontWeight: FontWeight.w500,
                fontSize: 12,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCallStatusCard() {
    if (!_isCallInProgress && !_isOutgoingCall) return const SizedBox.shrink();

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: _isCallInProgress 
            ? [Colors.green.shade50, Colors.green.shade100]
            : [Colors.blue.shade50, Colors.blue.shade100],
          begin: Alignment.centerLeft,
          end: Alignment.centerRight,
        ),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: _isCallInProgress ? Colors.green.shade200 : Colors.blue.shade200,
        ),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: _isCallInProgress ? Colors.green.shade200 : Colors.blue.shade200,
              shape: BoxShape.circle,
            ),
            child: Icon(
              _isCallInProgress ? Icons.phone_in_talk : Icons.phone_forwarded,
              color: _isCallInProgress ? Colors.green.shade800 : Colors.blue.shade800,
              size: 20,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  _isCallInProgress ? 'Call Active with Doctor' : 'Calling Doctor...',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    color: _isCallInProgress ? Colors.green.shade800 : Colors.blue.shade800,
                  ),
                ),
                if (_isCallInProgress)
                  Text(
                    'Duration: ${_formatCallDuration(_callDuration)}',
                    style: TextStyle(
                      color: Colors.green.shade600,
                      fontSize: 12,
                    ),
                  )
                else
                  Text(
                    'Please wait...',
                    style: TextStyle(
                      color: Colors.blue.shade600,
                      fontSize: 12,
                    ),
                  ),
              ],
            ),
          ),
          ElevatedButton.icon(
            onPressed: _endCall,
            icon: const Icon(Icons.call_end, size: 18),
            label: const Text('End'),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildErrorCard() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.red.shade50,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.red.shade200),
      ),
      child: Row(
        children: [
          Icon(Icons.error_outline, color: Colors.red.shade600, size: 20),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              _connectionError!,
              style: TextStyle(
                color: Colors.red.shade800,
                fontSize: 12,
              ),
            ),
          ),
          if (_connectionError!.contains('network') || _connectionError!.contains('server'))
            TextButton(
              onPressed: () async {
                setState(() => _connectionError = null);
                await _testConnection();
              },
              child: const Text('Retry', style: TextStyle(fontSize: 12)),
            ),
        ],
      ),
    );
  }

  Widget _buildCallInterface() {
    return Container(
      color: Colors.black,
      child: Column(
        children: [
          SafeArea(
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [Colors.black87, Colors.black54],
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                ),
              ),
              child: Row(
                children: [
                  CircleAvatar(
                    backgroundImage: NetworkImage(
                      'https://ui-avatars.com/api/?name=Doctor&background=2563eb&color=fff',
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Dr. CardioLink',
                          style: TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                            fontSize: 16,
                          ),
                        ),
                        Text(
                          _formatCallDuration(_callDuration),
                          style: const TextStyle(
                            color: Colors.white70,
                            fontSize: 14,
                          ),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    onPressed: () {
                      setState(() => _showCallInterface = false);
                    },
                    icon: const Icon(Icons.minimize, color: Colors.white),
                  ),
                  IconButton(
                    onPressed: _endCall,
                    icon: const Icon(Icons.call_end, color: Colors.red),
                  ),
                ],
              ),
            ),
          ),
          Expanded(
            child: Container(
              width: double.infinity,
              color: Colors.black,
              child: const Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.videocam,
                      size: 64,
                      color: Colors.white54,
                    ),
                    SizedBox(height: 16),
                    Text(
                      'Video Call in Progress',
                      style: TextStyle(
                        color: Colors.white70,
                        fontSize: 18,
                      ),
                    ),
                    SizedBox(height: 8),
                    Text(
                      'ZegoCloud interface will appear here',
                      style: TextStyle(
                        color: Colors.white54,
                        fontSize: 14,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Color _getStatusColor() {
    if (_isInitializing) return Colors.orange.shade100;
    if (_isCallInProgress) return Colors.green.shade100;
    if (_isOutgoingCall) return Colors.blue.shade100;
    if (_isConnected) return Colors.green.shade100;
    return Colors.grey.shade100;
  }

  Color _getStatusTextColor() {
    if (_isInitializing) return Colors.orange.shade700;
    if (_isCallInProgress) return Colors.green.shade700;
    if (_isOutgoingCall) return Colors.blue.shade700;
    if (_isConnected) return Colors.green.shade700;
    return Colors.grey.shade700;
  }

  String _getStatusText() {
    if (_isInitializing) return 'Connecting...';
    if (_isCallInProgress) return 'In Call';
    if (_isOutgoingCall) return 'Calling...';
    if (_isConnected) return 'Online';
    return 'Offline';
  }

  Widget _buildChatArea() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.1),
            spreadRadius: 1,
            blurRadius: 5,
          ),
        ],
      ),
      child: _messages.isEmpty
          ? _buildEmptyChatState()
          : ListView.builder(
              controller: _scrollController,
              padding: const EdgeInsets.all(16),
              itemCount: _messages.length,
              itemBuilder: (context, index) {
                final message = _messages[index];
                return _buildMessageBubble(message);
              },
            ),
    );
  }

  Widget _buildEmptyChatState() {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [Colors.blue.shade100, Colors.blue.shade200],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            shape: BoxShape.circle,
          ),
          child: Icon(
            Icons.video_call,
            size: 64,
            color: Colors.blue.shade700,
          ),
        ),
        const SizedBox(height: 24),
        Text(
          'Ready to Connect with Doctor',
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.w600,
            color: Colors.grey.shade700,
          ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 12),
        Text(
          'Start a call or wait for the doctor to contact you',
          style: TextStyle(
            fontSize: 15,
            color: Colors.grey.shade600,
          ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 32),
        
        if (_isConnected && !_isCallInProgress && !_isOutgoingCall) ...[
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              _buildCallButton(
                icon: Icons.phone,
                label: 'Audio Call',
                colorScheme: Colors.green,
                onPressed: () => _initiateCallToDoctor(isVideo: false),
              ),
              const SizedBox(width: 24),
              _buildCallButton(
                icon: Icons.videocam,
                label: 'Video Call',
                colorScheme: Colors.blue,
                onPressed: () => _initiateCallToDoctor(isVideo: true),
              ),
            ],
          ),
          const SizedBox(height: 20),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            decoration: BoxDecoration(
              color: Colors.blue.shade50,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: Colors.blue.shade200),
            ),
            child: Text(
              'Or wait for incoming call from doctor',
              style: TextStyle(
                fontSize: 12,
                color: Colors.blue.shade700,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ] else if (_isInitializing) ...[
          const CircularProgressIndicator(
            strokeWidth: 3,
          ),
          const SizedBox(height: 16),
          Text(
            'Connecting to CardioLink server...',
            style: TextStyle(
              color: Colors.grey.shade600,
              fontSize: 14,
            ),
          ),
        ] else if (!_isConnected) ...[
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.red.shade50,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.red.shade200),
            ),
            child: Column(
              children: [
                Icon(
                  Icons.wifi_off,
                  size: 48,
                  color: Colors.red.shade400,
                ),
                const SizedBox(height: 12),
                Text(
                  'Connection Failed',
                  style: TextStyle(
                    color: Colors.red.shade700,
                    fontWeight: FontWeight.w600,
                    fontSize: 16,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Unable to connect to CardioLink server',
                  style: TextStyle(
                    color: Colors.red.shade600,
                    fontSize: 14,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    ElevatedButton.icon(
                      onPressed: _testConnection,
                      icon: const Icon(Icons.refresh, size: 18),
                      label: const Text('Test Connection'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.blue,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    OutlinedButton.icon(
                      onPressed: _reconnectToService,
                      icon: const Icon(Icons.replay, size: 18),
                      label: const Text('Retry'),
                      style: OutlinedButton.styleFrom(
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildCallButton({
    required IconData icon,
    required String label,
    required MaterialColor colorScheme,
    required VoidCallback onPressed,
  }) {
    return Column(
      children: [
        Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [colorScheme.shade400, colorScheme.shade600],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            shape: BoxShape.circle,
            boxShadow: [
              BoxShadow(
                color: colorScheme.withOpacity(0.3),
                spreadRadius: 2,
                blurRadius: 8,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Material(
            color: Colors.transparent,
            child: InkWell(
              onTap: onPressed,
              borderRadius: BorderRadius.circular(35),
              child: Container(
                width: 70,
                height: 70,
                padding: const EdgeInsets.all(20),
                child: Icon(
                  icon,
                  color: Colors.white,
                  size: 30,
                ),
              ),
            ),
          ),
        ),
        const SizedBox(height: 12),
        Text(
          label,
          style: TextStyle(
            color: colorScheme.shade700,
            fontWeight: FontWeight.w600,
            fontSize: 14,
          ),
        ),
      ],
    );
  }

  Widget _buildMessageBubble(Map<String, dynamic> message) {
    final isMe = message['isMe'] as bool;
    final text = message['text'] as String;
    final timestamp = message['timestamp'] as DateTime;
    final status = message['status'] as String?;

    return Align(
      alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 4),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        constraints: BoxConstraints(
          maxWidth: MediaQuery.of(context).size.width * 0.75,
        ),
        decoration: BoxDecoration(
          gradient: isMe
              ? LinearGradient(
                  colors: [Colors.blue.shade400, Colors.blue.shade600],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                )
              : null,
          color: isMe ? null : Colors.grey.shade100,
          borderRadius: BorderRadius.circular(20).copyWith(
            bottomRight: isMe ? const Radius.circular(4) : null,
            bottomLeft: isMe ? null : const Radius.circular(4),
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              spreadRadius: 1,
              blurRadius: 3,
              offset: const Offset(0, 1),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              text,
              style: TextStyle(
                color: isMe ? Colors.white : Colors.black87,
                fontSize: 16,
                fontWeight: FontWeight.w400,
              ),
            ),
            const SizedBox(height: 6),
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  _formatTime(timestamp),
                  style: TextStyle(
                    color: isMe ? Colors.white70 : Colors.grey.shade600,
                    fontSize: 12,
                  ),
                ),
                if (isMe) ...[
                  const SizedBox(width: 4),
                  Icon(
                    status == 'sending' ? Icons.access_time :
                    status == 'sent' ? Icons.check :
                    status == 'failed' ? Icons.error_outline : Icons.done_all,
                    size: 14,
                    color: status == 'failed' ? Colors.red.shade300 : Colors.white70,
                  ),
                ],
              ],
            ),
          ],
        ),
      ),
    );
  }

  String _formatTime(DateTime time) {
    return '${time.hour.toString().padLeft(2, '0')}:${time.minute.toString().padLeft(2, '0')}';
  }

  Widget _buildMessageInput() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.1),
            spreadRadius: 1,
            blurRadius: 5,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: SafeArea(
        child: Row(
          children: [
            Expanded(
              child: Container(
                decoration: BoxDecoration(
                  color: Colors.grey.shade50,
                  borderRadius: BorderRadius.circular(25),
                  border: Border.all(color: Colors.grey.shade200),
                ),
                child: TextField(
                  controller: _messageController,
                  onChanged: _onMessageChanged,
                  decoration: InputDecoration(
                    hintText: 'Type a message to doctor...',
                    hintStyle: TextStyle(color: Colors.grey.shade500),
                    border: InputBorder.none,
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 20,
                      vertical: 12,
                    ),
                    suffixIcon: _isTyping 
                        ? Padding(
                            padding: const EdgeInsets.all(12),
                            child: SizedBox(
                              width: 16,
                              height: 16,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                valueColor: AlwaysStoppedAnimation<Color>(Colors.blue.shade400),
                              ),
                            ),
                          )
                        : null,
                  ),
                  textInputAction: TextInputAction.send,
                  onSubmitted: (_) => _sendMessage(),
                  maxLines: null,
                  textCapitalization: TextCapitalization.sentences,
                ),
              ),
            ),
            const SizedBox(width: 12),
            Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [Colors.blue.shade400, Colors.blue.shade600],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: Colors.blue.withOpacity(0.3),
                    spreadRadius: 1,
                    blurRadius: 4,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Material(
                color: Colors.transparent,
                child: InkWell(
                  onTap: _sendMessage,
                  borderRadius: BorderRadius.circular(25),
                  child: Container(
                    width: 50,
                    height: 50,
                    padding: const EdgeInsets.all(12),
                    child: const Icon(
                      Icons.send,
                      color: Colors.white,
                      size: 20,
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCallActionButton({
    required IconData icon,
    required String label,
    required MaterialColor colorScheme,
    required VoidCallback onPressed,
  }) {
    return Column(
      children: [
        Container(
          width: 70,
          height: 70,
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [colorScheme.shade400, colorScheme.shade600],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            shape: BoxShape.circle,
            boxShadow: [
              BoxShadow(
                color: colorScheme.withOpacity(0.3),
                spreadRadius: 2,
                blurRadius: 8,
              ),
            ],
          ),
          child: Material(
            color: Colors.transparent,
            child: InkWell(
              onTap: onPressed,
              borderRadius: BorderRadius.circular(35),
              child: Icon(icon, color: Colors.white, size: 32),
            ),
          ),
        ),
        const SizedBox(height: 12),
        Text(
          label,
          style: TextStyle(
            color: colorScheme.shade700,
            fontWeight: FontWeight.w600,
            fontSize: 16,
          ),
        ),
      ],
    );
  }
}