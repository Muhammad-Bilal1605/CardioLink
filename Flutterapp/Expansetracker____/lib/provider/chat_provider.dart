import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import '../cardio/message.dart';
import '../services/socket_service.dart';
import '../services/api_services.dart';

class ChatProvider with ChangeNotifier {
  // Services
  final SocketService _socketService = SocketService();
  
  // Chat state
  bool _isConnected = false;
  bool _isAuthenticated = false;
  bool _isLoading = false;
  String? _error;
  String? _currentRoomId;
  String _currentUserId = '';
  final List<Map<String, dynamic>> _currentMessages = [];
  final Map<String, String> _typingUsers = {};
  final Map<String, List<Message>> _conversations = {};
  final Map<String, int> _unreadCounts = {};
  final String _baseUrl = 'http://192.168.1.8:5001/api';
  String _authToken = '';
  
  // Getters
  bool get isConnected => _isConnected;
  bool get isAuthenticated => _isAuthenticated;
  bool get isLoading => _isLoading;
  String? get error => _error;
  String? get currentRoomId => _currentRoomId;
  String get userId => _currentUserId;
  List<Map<String, dynamic>> get currentMessages => _currentMessages;
  bool get isTyping => _typingUsers.isNotEmpty;
  Map<String, String> get typingUsers => _typingUsers;
  Map<String, int> get unreadCounts => _unreadCounts;
  List<Message> get messages => _conversations[_currentRoomId] ?? [];
  
  // Initialize the chat service
  Future<bool> initialize(String userId, String userType, {String? token}) async {
    try {
      _isLoading = true;
      _error = null;
      _currentUserId = userId;
      notifyListeners();
      
      print('🔑 ChatProvider: Initializing for user $userId ($userType)');
      
      // Use a simple token or skip token requirement for now
      _authToken = token ?? 'flutter_patient_token';
      
      // Skip token validation for now
      print('🔑 Using token: $_authToken');
      
      // Initialize socket connection with retry logic
      bool connected = false;
      int retryCount = 0;
      const maxRetries = 3;
      
      while (!connected && retryCount < maxRetries) {
        try {
          print('🔌 Attempting socket connection (attempt ${retryCount + 1}/$maxRetries)');
          connected = await _socketService.initSocket(userId, userType, _authToken);
          
          if (connected) {
            _isConnected = true;
            _isAuthenticated = true;
            _setupSocketListeners();
            print('✅ Socket connected successfully');
            break;
          }
        } catch (e) {
          print('❌ Socket connection attempt ${retryCount + 1} failed: $e');
          retryCount++;
          if (retryCount < maxRetries) {
            await Future.delayed(Duration(seconds: 2));
          }
        }
      }
      
      if (!connected) {
        throw Exception('Failed to connect to chat server after $maxRetries attempts');
      }
      
      return true;
    } catch (e) {
      _error = 'Failed to initialize chat: ${e.toString()}';
      _isConnected = false;
      _isAuthenticated = false;
      print('❌ ChatProvider initialization error: $_error');
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
  
  // Set up socket event listeners
  void _setupSocketListeners() {
    _socketService.socket.on('connect', (_) {
      _isConnected = true;
      _error = null;
      notifyListeners();
    });
    
    _socketService.socket.on('disconnect', (_) {
      _isConnected = false;
      notifyListeners();
    });
    
    _socketService.socket.on('connect_error', (error) {
      _error = 'Socket error: $error';
      notifyListeners();
    });
    
    _socketService.socket.on('connect_timeout', (_) {
      _error = 'Connection timeout';
      _isConnected = false;
      notifyListeners();
    });

    // Listen for new messages
    _socketService.socket.on('new_message', (data) {
      if (data is Map<String, dynamic>) {
        print('📨 Received new message: $data');
        final roomId = data['roomId'] as String?;
        if (roomId != null) {
          _addMessageToRoom(roomId, Map<String, dynamic>.from(data));
        }
      }
    });

      // Listen for typing indicators
    _socketService.socket.on('user_typing', (data) {
      if (data is Map<String, dynamic>) {
        final userId = data['userId'] as String?;
        final userName = data['userName'] as String?;
        if (userId != null && userId != _currentUserId) {  // Don't show our own typing indicator
          _typingUsers[userId] = userName ?? 'User';
          notifyListeners();
          
          // Auto-clear typing indicator after 3 seconds if no stop_typing is received
          Timer(Duration(seconds: 3), () {
            if (_typingUsers.containsKey(userId)) {
              _typingUsers.remove(userId);
              notifyListeners();
            }
          });
        }
      }
    });

    // Listen for stop typing
    _socketService.socket.on('user_stopped_typing', (data) {
      if (data is Map<String, dynamic>) {
        final userId = data['userId'] as String?;
        if (userId != null && _typingUsers.containsKey(userId)) {
          _typingUsers.remove(userId);
          notifyListeners();
        }
      }
    });

    // Listen for message delivery status
    _socketService.socket.on('message_delivered', (data) {
      if (data is Map<String, dynamic>) {
        final messageId = data['messageId'] as String?;
        if (messageId != null) {
          _updateMessageStatus(messageId, 'delivered');
        }
      }
    });

    // Listen for message read status
    _socketService.socket.on('message_read', (data) {
      if (data is Map<String, dynamic>) {
        final messageId = data['messageId'] as String?;
        if (messageId != null) {
          _updateMessageStatus(messageId, 'read');
        }
      }
    });
  }

  // Load messages for a specific room (public method)
  Future<void> loadMessages(String roomId) async {
    try {
      _isLoading = true;
      notifyListeners();
      
      print('📥 Loading messages for room: $roomId');
      
      final response = await http.get(
        Uri.parse('$_baseUrl/messages/conversation/$roomId'),
        headers: {
          'Authorization': 'Bearer $_authToken',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['success'] == true) {
          final List<dynamic> messages = data['messages'] ?? [];
          _currentMessages.clear();
          
          // Convert each message to the expected format
          for (var msg in messages) {
            _currentMessages.add({
              'id': msg['_id'] ?? msg['messageId'],
              'text': msg['message'] ?? '',
              'senderId': msg['senderId'] ?? '',
              'receiverId': msg['receiverId'] ?? '',
              'roomId': msg['roomId'] ?? roomId,
              'timestamp': msg['createdAt'] ?? msg['timestamp'] ?? DateTime.now().toIso8601String(),
              'isFromCurrentUser': msg['senderId'] == _currentUserId,
              'status': msg['status'] ?? 'delivered',
              'messageType': msg['messageType'] ?? 'text',
            });
          }
          
          print('✅ Loaded ${messages.length} messages');
          
          // Mark messages as read
          await _markMessagesAsRead(roomId);
        }
      } else {
        print('⚠️ Failed to load messages: ${response.statusCode}');
      }
    } catch (e) {
      print('❌ Error loading messages: $e');
      _error = 'Failed to load messages: ${e.toString()}';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Join a chat room with better error handling
  Future<bool> joinRoom(String roomId, String otherUserId) async {
    if (_currentRoomId == roomId) return true;
    
    _currentRoomId = roomId;
    _isLoading = true;
    _error = null;
    notifyListeners();
    
    try {
      _currentRoomId = roomId;
      print('🏠 ChatProvider: Joining room $roomId');
      
      // Ensure socket is connected first
      if (!_isConnected) {
        print('⚠️ Socket not connected, attempting to reconnect...');
        final connected = await initialize(_currentUserId, 'patient');
        if (!connected) {
          throw Exception('Cannot connect to chat server');
        }
      }
      
      // Join the socket room with timeout handling
      try {
        final success = await _socketService.joinRoom(roomId, _currentUserId);
        print('🏠 Room join result: $success');
        
        // Load existing messages for this room
        await loadMessages(roomId);
        
        notifyListeners();
        return true;
      } catch (e) {
        print('❌ Room join error: $e');
        // Continue anyway - room join might work even if ack times out
        await loadMessages(roomId);
        notifyListeners();
        return true;
      }
    } catch (e) {
      _error = 'Failed to join chat room: ${e.toString()}';
      print('❌ ChatProvider joinChatRoom error: $_error');
      notifyListeners();
      return false;
    }
  }

  // Send message with retry logic
  Future<bool> sendMessage(String text, {String? roomId, String? receiverId}) async {
    if (text.trim().isEmpty) return false;
    
    final messageRoomId = roomId ?? _currentRoomId;
    if (messageRoomId == null) {
      _error = 'No active chat room';
      notifyListeners();
      return false;
    }
    
    // Ensure we're connected
    if (!_isConnected || !_socketService.isConnected) {
      try {
        final success = await initialize(_currentUserId, 'patient', token: _authToken);
        if (!success) {
          _error = 'Failed to connect to chat server';
          notifyListeners();
          return false;
        }
      } catch (e) {
        _error = 'Connection error: $e';
        notifyListeners();
        return false;
      }
    }
    
    final messageId = '${DateTime.now().millisecondsSinceEpoch}_$_currentUserId';
    final message = {
      'messageId': messageId,
      'roomId': messageRoomId,
      'senderId': _currentUserId,
      'receiverId': receiverId,
      'message': text,
      'messageType': 'text',
      'timestamp': DateTime.now().toIso8601String(),
      'status': 'sending',
    };
    
    try {
      // Add to local messages immediately for instant feedback
      _currentMessages.add({
        'id': messageId,
        'text': text,
        'senderId': _currentUserId,
        'receiverId': receiverId,
        'roomId': messageRoomId,
        'timestamp': DateTime.now().toIso8601String(),
        'isFromCurrentUser': true,
        'status': 'sending',
      });
      notifyListeners();
      
      print('📤 Sending message: $text to room: $messageRoomId');
      
      // Send via socket for real-time delivery
      if (_socketService.isConnected) {
        _socketService.sendMessage(messageRoomId, text, _currentUserId);
        print('✅ Message sent via socket');
      } else {
        print('⚠️ Socket not connected, message only stored locally');
      }
      
      // Also send via HTTP API for persistence
      try {
        final response = await http.post(
          Uri.parse('$_baseUrl/messages'),
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer $_authToken',
          },
          body: json.encode({
            'roomId': messageRoomId,
            'senderId': _currentUserId,
            'receiverId': receiverId,
            'message': text,
            'messageType': 'text',
          }),
        );
        
        if (response.statusCode == 201) {
          print('✅ Message saved to database');
          // Update message status to delivered
          final messageIndex = _currentMessages.indexWhere((m) => m['id'] == messageId);
          if (messageIndex != -1) {
            _currentMessages[messageIndex]['status'] = 'delivered';
            notifyListeners();
          }
        } else {
          print('⚠️ Failed to save message to database: ${response.statusCode}');
        }
      } catch (e) {
        print('⚠️ HTTP API error: $e');
      }
      
      return true;
      
    } catch (e) {
      _error = 'Failed to send message: ${e.toString()}';
      _updateMessageStatus(messageId, 'failed');
      notifyListeners();
      return false;
    }
  }

  // Send typing indicator
  void sendTyping(String roomId, String userName) {
    if (!_isConnected) return;
    
    try {
      if (_socketService.isConnected) {
        _socketService.socket.emit('typing', {
          'roomId': roomId,
          'userId': _currentUserId,
          'userName': userName,
          'timestamp': DateTime.now().toIso8601String(),
        });
      } else {
        // If socket is not connected, try to reconnect
        _socketService.socket.connect();
      }
    } catch (e) {
      print('Error sending typing indicator: $e');
    }
  }

  // Stop typing indicator
  void stopTyping(String roomId) {
    if (!_isConnected) return;
    
    try {
      if (_socketService.isConnected) {
        _socketService.socket.emit('stop_typing', {
          'roomId': roomId,
          'userId': _currentUserId,
          'timestamp': DateTime.now().toIso8601String(),
        });
      }
    } catch (e) {
      print('Error stopping typing indicator: $e');
    }
  }
  
  // Load message history from API (private method)
  Future<void> _loadMessageHistory(String roomId) async {
    await loadMessages(roomId);
  }

  // Mark messages as read (public method)
  Future<void> markMessagesAsRead(String roomId) async {
    await _markMessagesAsRead(roomId);
  }

  // Mark messages as read (private method)
  Future<void> _markMessagesAsRead(String roomId) async {
    try {
      await http.patch(
        Uri.parse('$_baseUrl/messages/read'),
        headers: {
          'Authorization': 'Bearer $_authToken',
          'Content-Type': 'application/json',
        },
        body: json.encode({
          'roomId': roomId,
          'userId': _currentUserId,
        }),
      );
    } catch (e) {
      print('Error marking messages as read: $e');
    }
  }

  // Add message to local room
  void _addMessageToRoom(String roomId, Map<String, dynamic> message, {bool isLocalEcho = false}) {
    try {
      if (!_conversations.containsKey(roomId)) {
        _conversations[roomId] = [];
      }

      // Skip if message already exists
      if (_conversations[roomId]!.any((m) => m.id == message['messageId'])) {
        return;
      }

      final messageObj = Message.fromJson(message);
      _conversations[roomId]!.add(messageObj);

      if (roomId == _currentRoomId) {
        _currentMessages.add(message);
        notifyListeners();
      } else if (!isLocalEcho) {
        _unreadCounts[roomId] = (_unreadCounts[roomId] ?? 0) + 1;
        notifyListeners();
      }
    } catch (e) {
      print('Error adding message to room: $e');
    }
  }

  // Update message status
  void _updateMessageStatus(String messageId, String status) {
    bool updated = false;
    
    // Update in conversations
    for (final roomMessages in _conversations.values) {
      for (var i = 0; i < roomMessages.length; i++) {
        if (roomMessages[i].id == messageId) {
          roomMessages[i] = roomMessages[i].copyWith(status: status);
          updated = true;
          break;
        }
      }
      if (updated) break;
    }
    
    // Update in current messages
    if (updated) {
      final index = _currentMessages.indexWhere((m) => m['messageId'] == messageId);
      if (index != -1) {
        _currentMessages[index]['status'] = status;
        notifyListeners();
      }
    }
  }

  // Send message via HTTP as fallback
  Future<void> _sendMessageViaHttp(Map<String, dynamic> message) async {
    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/messages'),
        headers: {
          'Authorization': 'Bearer $_authToken',
          'Content-Type': 'application/json',
        },
        body: json.encode(message),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['success'] == true) {
          _updateMessageStatus(message['messageId'], 'delivered');
        }
      }
    } catch (e) {
      print('Error sending message via HTTP: $e');
      _updateMessageStatus(message['messageId'], 'failed');
    }
  }

  // Join chat room (public method)
  Future<void> joinChatRoom(String roomId, String currentUserId, String doctorId) async {
    await joinRoom(roomId, doctorId);
  }

  // Clear conversation
  void clearConversation() {
    _currentMessages.clear();
    notifyListeners();
  }

  // Disconnect
  void disconnect() {
    _socketService.disconnect();
    _isConnected = false;
    _isAuthenticated = false;
    _currentMessages.clear();
    _typingUsers.clear();
    notifyListeners();
  }
  
  // Clear error
  void clearError() {
    _error = null;
    notifyListeners();
  }
}
