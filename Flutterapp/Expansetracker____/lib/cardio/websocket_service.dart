import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'dart:convert';

class WebSocketService {
  static final WebSocketService _instance = WebSocketService._internal();
  factory WebSocketService() => _instance;
  WebSocketService._internal();

  IO.Socket? _socket;
  bool _isConnected = false;
  String? _currentUserId;
  String? _currentUserType;
  String? _currentUserName;
  String? _currentRoomId;

  // Callbacks
  Function(Map<String, dynamic>)? onMessageReceived;
  Function(Map<String, dynamic>)? onUserTyping;
  Function(Map<String, dynamic>)? onUserStopTyping;
  Function(Map<String, dynamic>)? onUserStatusChange;
  Function(String)? onConnectionError;
  Function()? onConnected;
  Function()? onDisconnected;
  Function(List<dynamic>)? onRoomJoined;

  bool get isConnected => _isConnected;
  String? get currentRoomId => _currentRoomId;

  void connect({required String serverUrl}) {
    try {
      print('🔌 Connecting to server: $serverUrl');

      _socket = IO.io(serverUrl,
          IO.OptionBuilder()
              .setTransports(['websocket', 'polling'])
              .enableAutoConnect()
              .enableReconnection()
              .setReconnectionAttempts(5)
              .setReconnectionDelay(1000)
              .setTimeout(20000)
              .build()
      );

      _setupEventListeners();

    } catch (e) {
      print('❌ Connection error: $e');
      onConnectionError?.call('Failed to connect: $e');
    }
  }

  void _setupEventListeners() {
    if (_socket == null) return;

    // Connection events
    _socket!.onConnect((_) {
      print('✅ Connected to server');
      _isConnected = true;
      onConnected?.call();
    });

    _socket!.onDisconnect((_) {
      print('🔌 Disconnected from server');
      _isConnected = false;
      _currentRoomId = null;
      onDisconnected?.call();
    });

    _socket!.onConnectError((data) {
      print('❌ Connection error: $data');
      _isConnected = false;
      onConnectionError?.call('Connection error: $data');
    });

    _socket!.onError((data) {
      print('❌ Socket error: $data');
      onConnectionError?.call('Socket error: $data');
    });

    // Authentication events
    _socket!.on('authenticated', (data) {
      print('👤 Authenticated successfully: $data');
    });

    _socket!.on('auth_error', (data) {
      print('❌ Authentication error: $data');
      onConnectionError?.call('Authentication failed: ${data['message']}');
    });

    // Room events
    _socket!.on('room_joined', (data) {
      print('🏠 Joined room: ${data['roomId']}');
      _currentRoomId = data['roomId'];
      List<dynamic> messages = data['messages'] ?? [];
      onRoomJoined?.call(messages);
    });

    // Message events
    _socket!.on('new_message', (data) {
      print('💬 New message received: $data');
      onMessageReceived?.call(Map<String, dynamic>.from(data));
    });

    _socket!.on('message_sent', (data) {
      print('✅ Message sent confirmation: $data');
    });

    // Typing events
    _socket!.on('user_typing', (data) {
      print('⌨️ User typing: ${data['name']}');
      onUserTyping?.call(Map<String, dynamic>.from(data));
    });

    _socket!.on('user_stop_typing', (data) {
      print('⌨️ User stopped typing: ${data['name']}');
      onUserStopTyping?.call(Map<String, dynamic>.from(data));
    });

    // Status events
    _socket!.on('user_status_change', (data) {
      print('👤 User status changed: ${data['name']} - ${data['status']}');
      onUserStatusChange?.call(Map<String, dynamic>.from(data));
    });

    // Error events
    _socket!.on('error', (data) {
      print('❌ Server error: $data');
      onConnectionError?.call('Server error: ${data['message']}');
    });

    _socket!.on('force_disconnect', (data) {
      print('🔌 Force disconnect: ${data['reason']}');
      disconnect();
    });
  }

  Future<void> authenticate({
    required String userId,
    required String userType, // 'doctor' or 'patient'
    required String name,
    String? avatar,
  }) async {
    if (_socket == null || !_isConnected) {
      throw Exception('Socket not connected');
    }

    _currentUserId = userId;
    _currentUserType = userType;
    _currentUserName = name;

    print('🔐 Authenticating user: $name ($userType)');

    _socket!.emit('authenticate', {
      'userId': userId,
      'userType': userType,
      'name': name,
      'avatar': avatar ?? '',
    });

    // Wait a bit for authentication to complete
    await Future.delayed(Duration(milliseconds: 500));
  }

  Future<void> joinChat({
    required String doctorId,
    required String patientId,
  }) async {
    if (_socket == null || !_isConnected) {
      throw Exception('Socket not connected');
    }

    print('🏠 Joining chat room - Doctor: $doctorId, Patient: $patientId');

    _socket!.emit('join_chat', {
      'doctorId': doctorId,
      'patientId': patientId,
    });
  }

  void sendMessage({
    required String doctorId,
    required String patientId,
    String? text,
    String? audioUrl,
    String? mediaUrl,
    String type = 'text',
  }) {
    if (_socket == null || !_isConnected) {
      print('❌ Cannot send message: Socket not connected');
      return;
    }

    if (text == null && audioUrl == null && mediaUrl == null) {
      print('❌ Cannot send empty message');
      return;
    }

    final messageData = {
      'doctorId': doctorId,
      'patientId': patientId,
      'type': type,
    };

    if (text != null) messageData['text'] = text;
    if (audioUrl != null) messageData['audioUrl'] = audioUrl;
    if (mediaUrl != null) messageData['mediaUrl'] = mediaUrl;

    print('📤 Sending message: ${text?.substring(0, text.length > 50 ? 50 : text.length)}${text != null && text.length > 50 ? '...' : ''}');

    _socket!.emit('send_message', messageData);
  }

  void sendTypingIndicator({
    required String doctorId,
    required String patientId,
  }) {
    if (_socket == null || !_isConnected) return;

    _socket!.emit('typing', {
      'doctorId': doctorId,
      'patientId': patientId,
    });
  }

  void sendStopTypingIndicator({
    required String doctorId,
    required String patientId,
  }) {
    if (_socket == null || !_isConnected) return;

    _socket!.emit('stop_typing', {
      'doctorId': doctorId,
      'patientId': patientId,
    });
  }

  void disconnect() {
    print('🔌 Disconnecting from server');

    _socket?.disconnect();
    _socket?.dispose();
    _socket = null;
    _isConnected = false;
    _currentRoomId = null;
    _currentUserId = null;
    _currentUserType = null;
    _currentUserName = null;

    // Clear callbacks
    onMessageReceived = null;
    onUserTyping = null;
    onUserStopTyping = null;
    onUserStatusChange = null;
    onConnectionError = null;
    onConnected = null;
    onDisconnected = null;
    onRoomJoined = null;
  }

  // Helper method to check server health
  static Future<bool> checkServerHealth(String serverUrl) async {
    try {
      // You can implement HTTP health check here if needed
      return true;
    } catch (e) {
      print('❌ Server health check failed: $e');
      return false;
    }
  }
}