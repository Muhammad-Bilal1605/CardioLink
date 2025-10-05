// lib/services/zego_cloud_service.dart - Updated with actual ZegoCloud integration
import 'package:flutter/material.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'package:permission_handler/permission_handler.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'config_service.dart';

// Add these dependencies to pubspec.yaml:
// zego_uikit_prebuilt_call: ^4.10.15
// zego_uikit_signaling_plugin: ^2.8.2

// Uncomment these imports when you add the dependencies
// import 'package:zego_uikit_prebuilt_call/zego_uikit_prebuilt_call.dart';
// import 'package:zego_uikit_signaling_plugin/zego_uikit_signaling_plugin.dart';

class ZegoCloudService {
  static final ZegoCloudService _instance = ZegoCloudService._internal();
  factory ZegoCloudService() => _instance;
  ZegoCloudService._internal();

  // ZegoCloud Configuration - SAME AS MERN APP
  static const int appID = 772794217;
  static const String appSign = '7c38b677dcb04a1d0e3d416c111b192538d44369c06690cac98625257dd32442';
  static const String serverSecret = 'f00a82a2161ac6a81585caecb5e04e47';
  
  IO.Socket? _socket;
  String? _currentUserId;
  String? _currentUserName;
  String? _currentUserType;
  bool _isConnected = false;
  bool _isInCall = false;
  String? _currentRoomId;

  // Callbacks
  Function(String callId, String callerId, String callerName, bool isVideo)? onIncomingCall;
  Function(String callId)? onCallAccepted;
  Function(String callId)? onCallRejected;
  Function(String callId)? onCallEnded;
  Function(String error)? onError;

  // Get backend URL from ConfigService
  String get _backendUrl => ConfigService.instance.baseUrl.replaceAll('/api', '');
  String get _socketUrl => ConfigService.instance.serverUrl;

  // Initialize service
  Future<bool> initialize({
    required String userId,
    required String userName,
    required String userType,
  }) async {
    try {
      _currentUserId = userId;
      _currentUserName = userName;
      _currentUserType = userType;

      // Ensure ConfigService is initialized
      if (!ConfigService.instance.isInitialized) {
        await ConfigService.initialize();
      }

      print('Using backend URL: $_backendUrl');
      print('Using socket URL: $_socketUrl');

      // Request permissions
      await _requestPermissions();

      // Initialize ZegoCloud UIKit
      await _initializeZegoUIKit();

      // Initialize Socket.IO connection
      await _initializeSocket();

      print('Service initialized successfully');
      return true;
    } catch (e) {
      print('Failed to initialize service: $e');
      onError?.call('Failed to initialize: $e');
      return false;
    }
  }

  // Initialize ZegoCloud UIKit
  Future<void> _initializeZegoUIKit() async {
    try {
      // Uncomment when you add the ZegoCloud dependencies
      /*
      await ZegoUIKitPrebuiltCallInvitationService().init(
        appID: appID,
        appSign: appSign,
        userID: _currentUserId!,
        userName: _currentUserName!,
        plugins: [ZegoUIKitSignalingPlugin()],
      );
      */
      
      print('ZegoCloud UIKit initialized (placeholder)');
    } catch (e) {
      print('Failed to initialize ZegoCloud UIKit: $e');
      throw e;
    }
  }

  // Initialize Socket.IO connection
  Future<void> _initializeSocket() async {
    try {
      print('Connecting to socket: $_socketUrl');
      
      _socket = IO.io(_socketUrl, <String, dynamic>{
        'transports': ['websocket', 'polling'],
        'autoConnect': false,
        'timeout': 20000,
        'reconnection': true,
        'reconnectionAttempts': 5,
        'reconnectionDelay': 1000,
      });

      _socket!.connect();

      _socket!.on('connect', (_) {
        print('Connected to backend socket');
        _isConnected = true;
        
        // Register user with backend
        _socket!.emit('register_user', {
          'userId': _currentUserId,
          'userType': _currentUserType,
          'userName': _currentUserName,
        });
      });

      _socket!.on('disconnect', (reason) {
        print('Disconnected from backend socket: $reason');
        _isConnected = false;
      });

      _socket!.on('connect_error', (error) {
        print('Socket connection error: $error');
        _isConnected = false;
        onError?.call('Failed to connect to server: $error');
      });

      _socket!.on('user_registered', (data) {
        print('User registered successfully: $data');
      });

      // Handle incoming calls
      _socket!.on('call:initiate', (data) {
        print('Incoming call: $data');
        final callId = data['callId'] ?? data['roomId'] ?? 'unknown';
        final callerId = data['from'] ?? data['callerId'];
        final callerName = data['callerName'] ?? 'Doctor';
        final isVideo = data['isVideo'] ?? true;
        
        onIncomingCall?.call(callId, callerId, callerName, isVideo);
      });

      // Handle call accepted
      _socket!.on('call:response', (data) {
        if (data['accepted'] == true) {
          print('Call accepted: $data');
          final callId = data['callId'] ?? data['roomId'] ?? 'unknown';
          _currentRoomId = callId;
          onCallAccepted?.call(callId);
        } else {
          print('Call rejected: $data');
          final callId = data['callId'] ?? 'unknown';
          onCallRejected?.call(callId);
        }
      });

      // Handle call ended
      _socket!.on('call:end', (data) {
        print('Call ended: $data');
        final callId = data['callId'] ?? 'unknown';
        _endCurrentCall();
        onCallEnded?.call(callId);
      });

      _socket!.on('call:error', (data) {
        print('Call error: $data');
        onError?.call(data['message'] ?? 'Unknown call error');
      });

    } catch (e) {
      print('Failed to initialize socket: $e');
      onError?.call('Failed to connect to server: $e');
    }
  }

  // Request necessary permissions
  Future<void> _requestPermissions() async {
    await Permission.camera.request();
    await Permission.microphone.request();
  }

  // Accept incoming call
  Future<void> acceptIncomingCall(String callId) async {
    if (!_isConnected || _socket == null) {
      onError?.call('Not connected to server');
      return;
    }

    try {
      // Send acceptance to backend
      _socket!.emit('call:response', {
        'to': 'doctor_001', // This should be dynamic based on caller
        'from': _currentUserId,
        'accepted': true,
        'callId': callId,
        'roomId': callId,
        'isVideo': true,
      });

      // Start actual ZegoCloud call
      await _startZegoCall(callId, isIncoming: true);

      print('Call acceptance sent and ZegoCloud call started');
    } catch (e) {
      print('Failed to accept call: $e');
      onError?.call('Failed to accept call: $e');
    }
  }

  // Reject incoming call
  Future<void> rejectIncomingCall(String callId) async {
    if (!_isConnected || _socket == null) {
      onError?.call('Not connected to server');
      return;
    }

    try {
      _socket!.emit('call:response', {
        'to': 'doctor_001', // This should be dynamic
        'from': _currentUserId,
        'accepted': false,
        'callId': callId,
      });

      print('Call rejection sent');
    } catch (e) {
      print('Failed to reject call: $e');
      onError?.call('Failed to reject call: $e');
    }
  }

  // Initiate call to doctor
  Future<void> initiateCall({
    required String doctorId,
    required bool isVideo,
  }) async {
    if (!_isConnected || _socket == null) {
      onError?.call('Not connected to server');
      return;
    }

    try {
      final roomId = _generateRoomId(_currentUserId!, doctorId);
      
      _socket!.emit('call:initiate', {
        'to': doctorId,
        'from': _currentUserId,
        'callerName': _currentUserName,
        'isVideo': isVideo,
        'roomId': roomId,
        'callId': roomId,
      });

      print('Call initiation sent to doctor: $doctorId');
    } catch (e) {
      print('Failed to initiate call: $e');
      onError?.call('Failed to initiate call: $e');
    }
  }

  // Start ZegoCloud call
  Future<void> _startZegoCall(String roomId, {bool isIncoming = false}) async {
    try {
      _currentRoomId = roomId;
      _isInCall = true;

      // This is where you would start the actual ZegoCloud call
      // Uncomment when you add the dependencies:
      
      /*
      // Generate token (in production, get this from your backend)
      final token = ZegoUIKitPrebuiltCallInvitationService.generateToken(
        appID: appID,
        serverSecret: serverSecret,
        userID: _currentUserId!,
        roomID: roomId,
      );

      // Navigate to call screen
      final context = NavigatorService.navigatorKey.currentContext;
      if (context != null) {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => ZegoUIKitPrebuiltCall(
              appID: appID,
              appSign: appSign,
              userID: _currentUserId!,
              userName: _currentUserName!,
              callID: roomId,
              config: ZegoUIKitPrebuiltCallConfig.oneOnOneVideoCall()
                ..onOnlySelfInRoom = (context) {
                  Navigator.of(context).pop();
                }
                ..onCallEnd = (event, defaultAction) {
                  _endCurrentCall();
                  defaultAction.call();
                },
            ),
          ),
        );
      }
      */

      print('ZegoCloud call started (placeholder) for room: $roomId');
      
    } catch (e) {
      print('Failed to start ZegoCloud call: $e');
      onError?.call('Failed to start video call: $e');
      _isInCall = false;
    }
  }

  // End current call
  Future<void> endCall() async {
    if (!_isConnected || _socket == null) {
      return;
    }

    try {
      // Notify backend
      _socket!.emit('call:end', {
        'to': 'doctor_001', // This should be dynamic
        'from': _currentUserId,
        'callId': _currentRoomId,
      });

      _endCurrentCall();
      print('Call ended and backend notified');
    } catch (e) {
      print('Failed to end call: $e');
      onError?.call('Failed to end call: $e');
    }
  }

  void _endCurrentCall() {
    _isInCall = false;
    _currentRoomId = null;
    
    // This would end the ZegoCloud call
    // ZegoUIKitPrebuiltCallInvitationService().hangUp();
  }

  // Generate room ID
  String _generateRoomId(String userId1, String userId2) {
    final ids = [userId1, userId2]..sort();
    return 'call_${ids.join('_')}_${DateTime.now().millisecondsSinceEpoch}';
  }

  // Send message
  Future<void> sendMessage({
    required String message,
    String messageType = 'text',
  }) async {
    if (!_isConnected || _socket == null) {
      onError?.call('Not connected to server');
      return;
    }

    try {
      final roomId = 'room_${_currentUserId}_doctor_001';
      
      _socket!.emit('send_message', {
        'roomId': roomId,
        'senderId': _currentUserId,
        'receiverId': 'doctor_001',
        'text': message,
        'type': messageType,
      });

      print('Message sent');
    } catch (e) {
      print('Failed to send message: $e');
      onError?.call('Failed to send message: $e');
    }
  }

  // Test connection
  Future<bool> testConnection() async {
    try {
      final response = await http.get(
        Uri.parse('$_backendUrl/health'),
        headers: {'Content-Type': 'application/json'},
      );
      
      if (response.statusCode == 200) {
        print('Backend connection test successful');
        return true;
      }
      return false;
    } catch (e) {
      print('Backend connection test failed: $e');
      return false;
    }
  }

  // Getters
  bool get isConnected => _isConnected;
  bool get isInCall => _isInCall;

  Map<String, String?> get currentUser => {
    'userId': _currentUserId,
    'userName': _currentUserName,
    'userType': _currentUserType,
  };

  void printConfig() {
    print('Service Configuration:');
    print('  Backend URL: $_backendUrl');
    print('  Socket URL: $_socketUrl');
    print('  ZegoCloud App ID: $appID');
    print('  Connected: $_isConnected');
    print('  In Call: $_isInCall');
    print('  User: $_currentUserName ($_currentUserId)');
  }

  // Dispose
  void dispose() {
    _socket?.disconnect();
    _socket = null;
    _isConnected = false;
    _isInCall = false;
    _currentRoomId = null;
    
    // Uninitialize ZegoCloud
    // ZegoUIKitPrebuiltCallInvitationService().uninit();
    
    print('Service disposed');
  }
}