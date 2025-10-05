// lib/services/webrtc_service.dart
import 'dart:async';
import 'dart:convert';
import 'package:flutter_webrtc/flutter_webrtc.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;

class WebRTCService {
  RTCPeerConnection? _peerConnection;
  MediaStream? _localStream;
  MediaStream? _remoteStream;
  RTCVideoRenderer? _localRenderer;
  RTCVideoRenderer? _remoteRenderer;
  SocketIOService? _socketService;
  
  final String _userId;
  final String _roomId; // Added roomId parameter
  final String _wsUrl;  // Added wsUrl parameter
  
  String? _currentCallId;
  String? _currentRoomId;
  
  // Callbacks - Fixed signature to match usage
  Function(MediaStream)? onAddRemoteStream;
  Function()? onCallEnded;
  Function(String)? onCallAccepted;
  Function()? onCallRejected;
  Function(String)? onCallIncoming; // Fixed: Single parameter for caller name
  Function(String)? onError;

  // Fixed constructor to accept roomId and wsUrl
  WebRTCService({
    required String userId,
    required String roomId, // Added required roomId
    String? wsUrl,          // Added optional wsUrl
  }) : _userId = userId, 
       _roomId = roomId,   // Store roomId
       _wsUrl = wsUrl ?? 'ws://192.168.1.11:8080'; // Default WebSocket URL
         //_wsurl= wsUrl ?? 'ws://10.113.91.64:8080';

  // Getters
  MediaStream? get localStream => _localStream;
  MediaStream? get remoteStream => _remoteStream;
  RTCVideoRenderer? get localRenderer => _localRenderer;
  RTCVideoRenderer? get remoteRenderer => _remoteRenderer;
  
  bool get isAudioEnabled {
    if (_localStream == null) return false;
    final audioTracks = _localStream!.getAudioTracks();
    return audioTracks.isNotEmpty ? audioTracks.first.enabled : false;
  }
  
  bool get isVideoEnabled {
    if (_localStream == null) return false;
    final videoTracks = _localStream!.getVideoTracks();
    return videoTracks.isNotEmpty ? videoTracks.first.enabled : false;
  }

  // Initialize WebRTC
  Future<void> initialize() async {
    try {
      await _initializeRenderers();
      await _getUserMedia();
      await _initializeSocket();
      await _createPeerConnection();
      print('✅ WebRTC Service initialized successfully');
    } catch (e) {
      print('❌ Error initializing WebRTC: $e');
      onError?.call('Failed to initialize WebRTC: $e');
      rethrow;
    }
  }

  // Initialize Socket.IO connection
  Future<void> _initializeSocket() async {
    // Extract HTTP URL from WebSocket URL
    String httpUrl = _wsUrl;
    if (_wsUrl.startsWith('ws://')) {
      httpUrl = _wsUrl.replaceFirst('ws://', 'http://');
    } else if (_wsUrl.startsWith('wss://')) {
      httpUrl = _wsUrl.replaceFirst('wss://', 'https://');
    }
    
    _socketService = SocketIOService(
      serverUrl: httpUrl,
      userId: _userId,
      userType: 'doctor',
      userName: 'Doctor $_userId',
    );
    
    // Fixed callback signature to match service definition
    _socketService!.onCallIncoming = (callId, callerId, callerName) {
      _currentCallId = callId;
      onCallIncoming?.call(callerName); // Pass only caller name
    };
    
    _socketService!.onCallAccepted = (callId) {
      _currentCallId = callId;
      onCallAccepted?.call('Call accepted');
    };
    
    _socketService!.onCallRejected = (callId) {
      _cleanup();
      onCallRejected?.call();
    };
    
    _socketService!.onCallEnded = (callId) {
      _cleanup();
      onCallEnded?.call();
    };
    
    _socketService!.onWebRTCOffer = (from, offer, callId) async {
      await _handleOffer(from, offer, callId);
    };
    
    _socketService!.onWebRTCAnswer = (from, answer, callId) async {
      await _handleAnswer(from, answer, callId);
    };
    
    _socketService!.onWebRTCIceCandidate = (from, candidate, callId) async {
      await _handleIceCandidate(from, candidate, callId);
    };
    
    _socketService!.onError = (error) {
      onError?.call(error);
    };
    
    try {
      await _socketService!.connect();
    } catch (e) {
      onError?.call('Failed to connect to signaling server: $e');
    }
  }

  // Initialize video renderers
  Future<void> _initializeRenderers() async {
    _localRenderer = RTCVideoRenderer();
    _remoteRenderer = RTCVideoRenderer();
    
    await _localRenderer!.initialize();
    await _remoteRenderer!.initialize();
  }

  // Get user media (camera & microphone)
  Future<void> _getUserMedia() async {
    final cameraStatus = await Permission.camera.request();
    if (!cameraStatus.isGranted) {
      onError?.call('Camera permission not granted');
      return;
    }

    final micStatus = await Permission.microphone.request();
    if (!micStatus.isGranted) {
      onError?.call('Microphone permission not granted');
      return;
    }

    try {
      _localStream = await navigator.mediaDevices.getUserMedia({
        'audio': true,
        'video': {
          'facingMode': 'user',
          'width': 640,
          'height': 480,
        },
      });

      if (_localRenderer != null && _localStream != null) {
        _localRenderer!.srcObject = _localStream;
      }
    } catch (e) {
      onError?.call('Failed to get user media: $e');
    }
  }

  // Create peer connection
  Future<void> _createPeerConnection() async {
    final configuration = <String, dynamic>{
      'iceServers': [
        {'urls': 'stun:stun.l.google.com:19302'},
        {'urls': 'stun:stun1.l.google.com:19302'},
        // Add TURN servers if needed for NAT traversal
        // {
        //   'urls': 'turn:your-turn-server.com:3478',
        //   'username': 'username',
        //   'credential': 'password'
        // }
      ],
      'sdpSemantics': 'unified-plan',
      'iceTransportPolicy': 'all',
      'bundlePolicy': 'max-bundle',
      'rtcpMuxPolicy': 'require',
    };

    final constraints = <String, dynamic>{
      'mandatory': {},
      'optional': [
        {'DtlsSrtpKeyAgreement': true},
        {'RtpDataChannels': true},
      ]
    };

    _peerConnection = await createPeerConnection(configuration, constraints);

    // Add local stream to peer connection
    if (_localStream != null) {
      _localStream!.getTracks().forEach((track) {
        _peerConnection?.addTrack(track, _localStream!);
      });
    }

    // Set up event handlers
    _peerConnection?.onIceCandidate = (RTCIceCandidate candidate) {
      if (_currentCallId != null && _socketService != null) {
        _socketService!.sendIceCandidate(_currentCallId!, candidate);
      }
    };

    _peerConnection?.onTrack = (RTCTrackEvent event) {
      if (event.streams.isNotEmpty) {
        _remoteStream = event.streams.first;
        if (_remoteRenderer != null) {
          _remoteRenderer!.srcObject = _remoteStream;
        }
        onAddRemoteStream?.call(_remoteStream!);
      }
    };

    _peerConnection?.onIceConnectionState = (RTCIceConnectionState state) {
      print('ICE Connection State: $state');
      if (state == RTCIceConnectionState.RTCIceConnectionStateFailed) {
        onError?.call('Connection failed');
        _cleanup();
      } else if (state == RTCIceConnectionState.RTCIceConnectionStateDisconnected) {
        _cleanup();
      }
    };

    _peerConnection?.onConnectionState = (RTCPeerConnectionState state) {
      print('Peer Connection State: $state');
    };
  }

  // Handle incoming offer
  Future<void> _handleOffer(String from, Map<String, dynamic> offer, String callId) async {
    try {
      _currentCallId = callId;
      
      final rtcOffer = RTCSessionDescription(
        offer['sdp'],
        offer['type'],
      );
      
      await _peerConnection?.setRemoteDescription(rtcOffer);
      
      final answer = await _peerConnection!.createAnswer();
      await _peerConnection!.setLocalDescription(answer);
      
      _socketService?.sendAnswer(from, answer, callId);
    } catch (e) {
      onError?.call('Failed to handle offer: $e');
    }
  }

  // Handle incoming answer
  Future<void> _handleAnswer(String from, Map<String, dynamic> answer, String callId) async {
    try {
      final rtcAnswer = RTCSessionDescription(
        answer['sdp'],
        answer['type'],
      );
      
      await _peerConnection?.setRemoteDescription(rtcAnswer);
    } catch (e) {
      onError?.call('Failed to handle answer: $e');
    }
  }

  // Handle ICE candidate
  Future<void> _handleIceCandidate(String from, Map<String, dynamic> candidateData, String callId) async {
    try {
      final candidate = RTCIceCandidate(
        candidateData['candidate'],
        candidateData['sdpMid'],
        candidateData['sdpMLineIndex'],
      );
      
      await _peerConnection?.addCandidate(candidate);
    } catch (e) {
      onError?.call('Failed to handle ICE candidate: $e');
    }
  }

  // Start a call
  Future<void> startCall(String targetUserId, {bool isVideo = true}) async {
    try {
      if (_peerConnection == null) {
        onError?.call('Peer connection not initialized');
        return;
      }

      final offer = await _peerConnection!.createOffer();
      await _peerConnection!.setLocalDescription(offer);
      
      // Send the offer to the remote peer via Socket.IO
      _socketService?.sendOffer(targetUserId, offer);
      
    } catch (e) {
      onError?.call('Failed to start call: $e');
    }
  }

  // Accept an incoming call
  Future<void> acceptCall() async {
    try {
      if (_currentCallId == null) {
        onError?.call('No incoming call to accept');
        return;
      }

      _socketService?.acceptCall(_currentCallId!);
      
    } catch (e) {
      onError?.call('Failed to accept call: $e');
    }
  }

  // End the current call
  Future<void> endCall() async {
    if (_currentCallId != null) {
      _socketService?.endCall(_currentCallId!);
    }
    
    await _cleanup();
    onCallEnded?.call();
  }

  // Reject an incoming call
  Future<void> rejectCall() async {
    if (_currentCallId != null) {
      _socketService?.rejectCall(_currentCallId!);
    }
    
    await _cleanup();
    onCallRejected?.call();
  }

  // Toggle camera (front/back)
  Future<void> toggleCamera() async {
    if (_localStream == null) return;

    final videoTracks = _localStream!.getVideoTracks();
    if (videoTracks.isNotEmpty) {
      final videoTrack = videoTracks.first;
      await Helper.switchCamera(videoTrack);
    }
  }

  // Toggle video on/off
  void toggleVideo() {
    if (_localStream == null) return;
    
    final videoTracks = _localStream!.getVideoTracks();
    if (videoTracks.isNotEmpty) {
      final videoTrack = videoTracks.first;
      videoTrack.enabled = !videoTrack.enabled;
    }
  }

  // Toggle audio on/off
  void toggleAudio() {
    if (_localStream == null) return;
    
    final audioTracks = _localStream!.getAudioTracks();
    if (audioTracks.isNotEmpty) {
      final audioTrack = audioTracks.first;
      audioTrack.enabled = !audioTrack.enabled;
    }
  }

  // Clean up resources
  Future<void> _cleanup() async {
    _currentCallId = null;
    _currentRoomId = null;
    
    await _peerConnection?.close();
    _peerConnection = null;
    
    _localStream?.getTracks().forEach((track) {
      track.stop();
    });
    _localStream = null;
    
    _remoteStream = null;
    
    if (_localRenderer != null) {
      _localRenderer!.srcObject = null;
    }
    
    if (_remoteRenderer != null) {
      _remoteRenderer!.srcObject = null;
    }
  }

  // Dispose the service
  Future<void> dispose() async {
    await _cleanup();
    await _socketService?.disconnect();
    
    await _localRenderer?.dispose();
    await _remoteRenderer?.dispose();
    
    _localRenderer = null;
    _remoteRenderer = null;
    _socketService = null;
  }
}

// Socket.IO Service for signaling
class SocketIOService {
  final String _serverUrl;
  final String _userId;
  final String _userType;
  final String _userName;
  IO.Socket? _socket;
  
  bool _isConnected = false;
  bool _isAuthenticated = false;
  
  // Callbacks
  Function(String, String, String)? onCallIncoming; // (callId, callerId, callerName)
  Function(String)? onCallAccepted;
  Function(String)? onCallRejected;
  Function(String)? onCallEnded;
  Function(String, Map<String, dynamic>, String)? onWebRTCOffer;
  Function(String, Map<String, dynamic>, String)? onWebRTCAnswer;
  Function(String, Map<String, dynamic>, String)? onWebRTCIceCandidate;
  Function(String)? onError;
  
  SocketIOService({
    required String serverUrl,
    required String userId,
    required String userType,
    required String userName,
  }) : _serverUrl = serverUrl,
       _userId = userId,
       _userType = userType,
       _userName = userName;
  
  bool get isConnected => _isConnected;
  bool get isAuthenticated => _isAuthenticated;
  
  Future<void> connect() async {
    try {
      _socket = IO.io(_serverUrl, IO.OptionBuilder()
        .setTransports(['websocket'])
        .disableAutoConnect()
        .setTimeout(20000)
        .setReconnectionAttempts(5)
        .setReconnectionDelay(1000)
        .build());
      
      _setupEventHandlers();
      _socket!.connect();
      
      // Wait for connection
      await _waitForConnection();
      
      // Authenticate
      await _authenticate();
      
      print('✅ Socket.IO connected and authenticated');
    } catch (e) {
      print('❌ Socket.IO connection failed: $e');
      onError?.call('Failed to connect: $e');
      rethrow;
    }
  }
  
  void _setupEventHandlers() {
    _socket!.onConnect((_) {
      print('🔌 Socket.IO connected');
      _isConnected = true;
    });
    
    _socket!.onDisconnect((_) {
      print('🔌 Socket.IO disconnected');
      _isConnected = false;
      _isAuthenticated = false;
    });
    
    _socket!.onConnectError((data) {
      print('❌ Socket.IO connection error: $data');
      onError?.call('Connection error: $data');
    });
    
    _socket!.on('authenticated', (data) {
      print('✅ Socket.IO authenticated: $data');
      _isAuthenticated = true;
    });
    
    _socket!.on('unauthorized', (data) {
      print('❌ Socket.IO authentication failed: $data');
      onError?.call('Authentication failed: $data');
    });
    
    // Call events
    _socket!.on('call:incoming', (data) {
      print('📞 Incoming call: $data');
      final callId = data['callId'];
      final from = data['from'];
      final callerName = data['callerName'] ?? 'Unknown';
      onCallIncoming?.call(callId, from, callerName);
    });
    
    _socket!.on('call:accepted', (data) {
      print('📞 Call accepted: $data');
      final callId = data['callId'];
      onCallAccepted?.call(callId);
    });
    
    _socket!.on('call:rejected', (data) {
      print('📞 Call rejected: $data');
      final callId = data['callId'];
      onCallRejected?.call(callId);
    });
    
    _socket!.on('call:ended', (data) {
      print('📞 Call ended: $data');
      final callId = data['callId'];
      onCallEnded?.call(callId);
    });
    
    // WebRTC signaling events
    _socket!.on('webrtc:offer', (data) {
      print('🔄 WebRTC offer received: $data');
      final from = data['from'];
      final offer = data['offer'];
      final callId = data['callId'];
      onWebRTCOffer?.call(from, offer, callId);
    });
    
    _socket!.on('webrtc:answer', (data) {
      print('🔄 WebRTC answer received: $data');
      final from = data['from'];
      final answer = data['answer'];
      final callId = data['callId'];
      onWebRTCAnswer?.call(from, answer, callId);
    });
    
    _socket!.on('webrtc:ice-candidate', (data) {
      print('🔄 ICE candidate received: $data');
      final from = data['from'];
      final candidate = data['candidate'];
      final callId = data['callId'];
      onWebRTCIceCandidate?.call(from, candidate, callId);
    });
  }
  
  Future<void> _waitForConnection() async {
    int attempts = 0;
    while (!_isConnected && attempts < 50) {
      await Future.delayed(Duration(milliseconds: 100));
      attempts++;
    }
    
    if (!_isConnected) {
      throw Exception('Connection timeout');
    }
  }
  
  Future<void> _authenticate() async {
    _socket!.emit('authenticate', {
      'userId': _userId,
      'userType': _userType,
      'name': _userName,
    });
    
    // Wait for authentication
    int attempts = 0;
    while (!_isAuthenticated && attempts < 50) {
      await Future.delayed(Duration(milliseconds: 100));
      attempts++;
    }
    
    if (!_isAuthenticated) {
      throw Exception('Authentication timeout');
    }
  }
  
  void initiateCall(String targetUserId, bool isVideo, String callerName) {
    if (!_isConnected || !_isAuthenticated) return;
    
    _socket!.emit('call:initiate', {
      'to': targetUserId,
      'from': _userId,
      'callerName': callerName,
      'isVideo': isVideo,
      'roomId': 'room_${_userId}_$targetUserId',
    });
  }
  
  void acceptCall(String callId) {
    if (!_isConnected) return;
    _socket!.emit('call:accept', {'callId': callId});
  }
  
  void rejectCall(String callId) {
    if (!_isConnected) return;
    _socket!.emit('call:reject', {'callId': callId});
  }
  
  void endCall(String callId) {
    if (!_isConnected) return;
    _socket!.emit('call:end', {'callId': callId});
  }
  
  void sendOffer(String targetUserId, RTCSessionDescription offer) {
    if (!_isConnected) return;
    
    _socket!.emit('webrtc:offer', {
      'to': targetUserId,
      'offer': {
        'type': offer.type,
        'sdp': offer.sdp,
      }
    });
  }
  
  void sendAnswer(String targetUserId, RTCSessionDescription answer, String callId) {
    if (!_isConnected) return;
    
    _socket!.emit('webrtc:answer', {
      'to': targetUserId,
      'answer': {
        'type': answer.type,
        'sdp': answer.sdp,
      },
      'callId': callId,
    });
  }
  
  void sendIceCandidate(String callId, RTCIceCandidate candidate) {
    if (!_isConnected) return;
    
    _socket!.emit('webrtc:ice-candidate', {
      'to': _getTargetUserIdFromCallId(callId),
      'candidate': {
        'candidate': candidate.candidate,
        'sdpMid': candidate.sdpMid,
        'sdpMLineIndex': candidate.sdpMLineIndex,
      },
      'callId': callId,
    });
  }
  
  String _getTargetUserIdFromCallId(String callId) {
    // Extract target user ID from call ID format: call_fromId_toId_timestamp
    final parts = callId.split('_');
    if (parts.length >= 3) {
      final fromId = parts[1];
      final toId = parts[2];
      return fromId == _userId ? toId : fromId;
    }
    return '';
  }
  
  Future<void> disconnect() async {
    _socket?.disconnect();
    _isConnected = false;
    _isAuthenticated = false;
  }
}