// lib/services/agora_service.dart
import 'package:flutter/foundation.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'package:permission_handler/permission_handler.dart';
import 'dart:convert';
import 'package:crypto/crypto.dart';
import 'config_service.dart';

// Add to pubspec.yaml:
// agora_rtc_engine: ^6.3.0
// crypto: ^3.0.3

import 'package:agora_rtc_engine/agora_rtc_engine.dart';

class AgoraService {
  static final AgoraService _instance = AgoraService._internal();
  factory AgoraService() => _instance;
  AgoraService._internal();

  // Agora Configuration
  static const String appId = '88a403916325401a8e5f04beff756692';
  static const String appCertificate = '8407591dbbda46f9b4286093767b7e80';
  
  IO.Socket? _socket;
  RtcEngine? _rtcEngine;
  String? _currentUserId;
  String? _currentUserName;
  String? _currentUserType;
  bool _isConnected = false;
  bool _isInCall = false;
  String? _currentChannelId;

  // Callbacks
  Function(String callId, String callerId, String callerName, bool isVideo)? onIncomingCall;
  Function(String callId)? onCallAccepted;
  Function(String callId)? onCallRejected;
  Function(String callId)? onCallEnded;
  Function(String error)? onError;
  Function(int uid, int elapsed)? onUserJoined;
  Function(int uid, int reason)? onUserOffline;

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

      if (!ConfigService.instance.isInitialized) {
        await ConfigService.initialize();
      }

      print('Using backend URL: $_backendUrl');
      print('Using socket URL: $_socketUrl');

      // Request permissions
      await _requestPermissions();

      // Initialize Agora RTC Engine
      await _initializeAgoraEngine();

      // Initialize Socket.IO
      await _initializeSocket();

      print('Agora Service initialized successfully');
      return true;
    } catch (e) {
      print('Failed to initialize Agora service: $e');
      onError?.call('Failed to initialize: $e');
      return false;
    }
  }

  // Initialize Agora RTC Engine
  Future<void> _initializeAgoraEngine() async {
    try {
      _rtcEngine = createAgoraRtcEngine();
      
      await _rtcEngine!.initialize(RtcEngineContext(
        appId: appId,
        channelProfile: ChannelProfileType.channelProfileCommunication,
      ));

      await _rtcEngine!.enableVideo();
      await _rtcEngine!.enableAudio();
      
      // Start camera preview
      await _rtcEngine!.startPreview();

      _rtcEngine!.registerEventHandler(
        RtcEngineEventHandler(
          onJoinChannelSuccess: (RtcConnection connection, int elapsed) {
            print('Successfully joined channel: ${connection.channelId}');
            _isInCall = true;
          },
          onUserJoined: (RtcConnection connection, int uid, int elapsed) {
            print('Remote user joined: $uid');
            onUserJoined?.call(uid, elapsed);
          },
          onUserOffline: (RtcConnection connection, int uid, UserOfflineReasonType reason) {
            print('Remote user left: $uid');
            onUserOffline?.call(uid, reason.index);
          },
          onLeaveChannel: (RtcConnection connection, RtcStats stats) {
            print('Left channel');
            _isInCall = false;
          },
          onError: (ErrorCodeType err, String msg) {
            print('Agora Error: $err - $msg');
            onError?.call('Video call error: $msg');
          },
          onConnectionStateChanged: (RtcConnection connection, 
              ConnectionStateType state, ConnectionChangedReasonType reason) {
            print('Connection state changed: $state, reason: $reason');
          },
        ),
      );

      print('Agora RTC Engine initialized for mobile');
    } catch (e) {
      print('Failed to initialize Agora Engine: $e');
      throw e;
    }
  }

  // Initialize Socket.IO
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
        
        _socket!.emit('authenticate', {
          'userId': _currentUserId,
          'userType': _currentUserType,
          'name': _currentUserName,
        });
      });

      _socket!.on('disconnect', (reason) {
        print('Disconnected: $reason');
        _isConnected = false;
      });

      _socket!.on('connect_error', (error) {
        print('Socket error: $error');
        _isConnected = false;
        onError?.call('Connection failed: $error');
      });

      // Call events
      _socket!.on('call_request', (data) {
        print('Incoming call: $data');
        final callId = data['roomId'] ?? data['callId'] ?? 'unknown';
        final callerId = data['callerId'] ?? data['from'];
        final callerName = data['callerName'] ?? 'Doctor';
        final isVideo = data['callType'] == 'video';
        
        onIncomingCall?.call(callId, callerId, callerName, isVideo);
      });

      _socket!.on('call_accepted', (data) async {
        print('Call accepted: $data');
        final callId = data['roomId'] ?? data['callId'];
        await joinChannel(callId);
        onCallAccepted?.call(callId);
      });

      _socket!.on('call_rejected', (data) {
        print('Call rejected: $data');
        final callId = data['callId'] ?? 'unknown';
        onCallRejected?.call(callId);
      });

      _socket!.on('call_ended', (data) {
        print('Call ended: $data');
        final callId = data['callId'] ?? 'unknown';
        _leaveChannel();
        onCallEnded?.call(callId);
      });

    } catch (e) {
      print('Socket init failed: $e');
      onError?.call('Connection failed: $e');
    }
  }

  // Request permissions
  Future<void> _requestPermissions() async {
    await [Permission.camera, Permission.microphone].request();
  }

  // Generate Agora token client-side (NO BACKEND)
  String _generateAgoraToken(String channelName, int uid) {
    // For testing without token server, return empty string
    // Agora will work in testing mode (24 hours limit)
    // For production, you MUST use a token server
    return '';
  }

  // Accept incoming call
  Future<void> acceptIncomingCall(String callId, String callerId) async {
    if (!_isConnected || _socket == null) {
      onError?.call('Not connected to server');
      return;
    }

    try {
      _socket!.emit('call_accepted', {
        'calleeId': _currentUserId,
        'callerId': callerId,
        'roomId': callId,
        'callType': 'video',
      });

      await joinChannel(callId);
      print('Call accepted and joined');
    } catch (e) {
      print('Failed to accept call: $e');
      onError?.call('Failed to accept: $e');
    }
  }

  // Reject incoming call
  Future<void> rejectIncomingCall(String callId, String callerId) async {
    if (!_isConnected || _socket == null) {
      onError?.call('Not connected');
      return;
    }

    try {
      _socket!.emit('call_rejected', {
        'calleeId': _currentUserId,
        'callerId': callerId,
        'roomId': callId,
      });
      print('Call rejected');
    } catch (e) {
      print('Failed to reject: $e');
    }
  }

  // Initiate call
  Future<void> initiateCall({
    required String doctorId,
    required bool isVideo,
  }) async {
    if (!_isConnected || _socket == null) {
      onError?.call('Not connected');
      return;
    }

    try {
      final channelId = _generateChannelId(_currentUserId!, doctorId);
      
      _socket!.emit('call_request', {
        'callerId': _currentUserId,
        'calleeId': doctorId,
        'callerName': _currentUserName,
        'callType': isVideo ? 'video' : 'audio',
        'roomId': channelId,
      });

      print('Call initiated to: $doctorId');
    } catch (e) {
      print('Failed to initiate: $e');
      onError?.call('Failed to call: $e');
    }
  }

  // Join Agora channel
  Future<void> joinChannel(String channelId) async {
    if (_rtcEngine == null) {
      onError?.call('Engine not initialized');
      return;
    }

    try {
      _currentChannelId = channelId;
      
      // Generate UID from userId
      final uid = _currentUserId.hashCode.abs() % 1000000;
      
      // Generate token (empty for testing mode)
      final token = _generateAgoraToken(channelId, uid);

      await _rtcEngine!.joinChannel(
        token: token,
        channelId: channelId,
        uid: uid,
        options: const ChannelMediaOptions(
          channelProfile: ChannelProfileType.channelProfileCommunication,
          clientRoleType: ClientRoleType.clientRoleBroadcaster,
          publishCameraTrack: true,
          publishMicrophoneTrack: true,
          autoSubscribeAudio: true,
          autoSubscribeVideo: true,
        ),
      );

      _isInCall = true;
      print('Joined channel: $channelId with uid: $uid');
    } catch (e) {
      print('Failed to join: $e');
      onError?.call('Failed to join: $e');
    }
  }

  // Leave channel
  Future<void> _leaveChannel() async {
    if (_rtcEngine != null && _isInCall) {
      await _rtcEngine!.leaveChannel();
      _isInCall = false;
      _currentChannelId = null;
      print('Left channel');
    }
  }

  // End call
  Future<void> endCall() async {
    try {
      if (_socket != null && _isConnected && _currentChannelId != null) {
        _socket!.emit('call_ended', {
          'callerId': _currentUserId,
          'calleeId': 'doctor_001',
          'roomId': _currentChannelId,
        });
      }

      await _leaveChannel();
      print('Call ended');
    } catch (e) {
      print('Failed to end call: $e');
    }
  }

  // Toggle camera
  Future<void> toggleCamera(bool enable) async {
    if (_rtcEngine != null) {
      await _rtcEngine!.enableLocalVideo(enable);
    }
  }

  // Toggle microphone
  Future<void> toggleMicrophone(bool enable) async {
    if (_rtcEngine != null) {
      await _rtcEngine!.enableLocalAudio(enable);
    }
  }

  // Switch camera
  Future<void> switchCamera() async {
    if (_rtcEngine != null) {
      await _rtcEngine!.switchCamera();
    }
  }

  // Generate channel ID
  String _generateChannelId(String userId1, String userId2) {
    final ids = [userId1, userId2]..sort();
    return 'call_${ids.join('_')}';
  }

  // Getters
  RtcEngine? get rtcEngine => _rtcEngine;
  bool get isConnected => _isConnected;
  bool get isInCall => _isInCall;
  String? get currentChannelId => _currentChannelId;
  String? get currentUserId => _currentUserId;

  // Dispose
  Future<void> dispose() async {
    _socket?.disconnect();
    _socket = null;
    _isConnected = false;
    
    await _leaveChannel();
    await _rtcEngine?.release();
    _rtcEngine = null;
    
    print('Service disposed');
  }
}