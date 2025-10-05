import 'package:socket_io_client/socket_io_client.dart' as IO;

class SocketService {
  static final SocketService _instance = SocketService._internal();
  factory SocketService() => _instance;
  
  IO.Socket? _socket;
  bool get isConnected => _socket?.connected ?? false;
  IO.Socket get socket => _socket!;
  
  // Use your second laptop's IP where MERN server is running
  // Replace with your second laptop's actual IP address
  //static const String serverUrl = 'http://192.168.65.182:5001'; // Update this IP
  static  String serverUrl = 'http://192.168.1.11:5001';
  
  SocketService._internal();

  // Initialize socket connection
  Future<bool> initSocket(String userId, String userType, String authToken) async {
    try {
      print('🔌 SocketService: Initializing socket for user $userId ($userType)');
      print('🌐 Connecting to server: $serverUrl');
      
      // Disconnect existing socket if any
      if (_socket != null) {
        _socket!.disconnect();
        _socket = null;
      }
      
      // Create new socket connection with timeout
      _socket = IO.io(
        serverUrl,
        IO.OptionBuilder()
          .setTransports(['websocket', 'polling'])
          .enableAutoConnect()
          .enableReconnection()
          .setReconnectionAttempts(3) // Reduced attempts
          .setReconnectionDelay(2000)
          .setTimeout(10000) // 10 second timeout
          .setQuery({
            'userId': userId,
            'userType': userType,
            'token': authToken,
            'from': 'flutter'
          })
          .build(),
      );

      bool connected = false;
      
      _socket!.onConnect((_) {
        print('✅ Connected to MERN server: ${_socket!.id}');
        connected = true;
        
        // Send authentication data matching MERN format
        _socket!.emit('authenticate', {
          'userId': userId,
          'userType': userType,
          'name': userType == 'patient' ? 'Patient User' : 'Doctor User',
        });
      });

      _socket!.onDisconnect((_) {
        print('❌ Disconnected from server');
        connected = false;
      });
      
      _socket!.onError((error) {
        print('❌ Socket error: $error');
        connected = false;
      });

      _socket!.onConnectError((error) {
        print('❌ Connection error: $error');
        connected = false;
      });

      // Wait for connection with timeout
      int attempts = 0;
      while (!connected && attempts < 10) {
        await Future.delayed(Duration(milliseconds: 500));
        attempts++;
        if (_socket!.connected) {
          connected = true;
          break;
        }
      }
      
      if (!connected) {
        print('❌ Failed to connect after timeout');
        _socket?.disconnect();
        _socket = null;
      }
      
      return connected;
      
    } catch (e) {
      print('❌ SocketService initSocket error: $e');
      return false;
    }
  }

  // Join a chat room
  Future<bool> joinRoom(String roomId, String userId) async {
    try {
      if (_socket?.connected == true) {
        _socket!.emit('join_room', {
          'roomId': roomId,
          'userId': userId,
        });
        print('🏠 Joined room: $roomId');
        return true;
      } else {
        print('❌ Cannot join room: Socket not connected');
        return false;
      }
    } catch (e) {
      print('❌ Error joining room: $e');
      return false;
    }
  }

  // Send a message
  void sendMessage(String roomId, String message, String senderId) {
    if (_socket?.connected == true) {
      _socket!.emit('send_message', {
        'roomId': roomId,
        'senderId': senderId,
        'receiverId': '', // Will be determined by room
        'text': message,
        'type': 'text',
        'timestamp': DateTime.now().toIso8601String(),
      });
      print('📤 Message sent: $message');
    }
  }

  // Listen for new messages
  void listenForMessages(Function(dynamic) onMessageReceived) {
    if (_socket != null) {
      _socket!.on('receive_message', (data) {
        print('📨 Received message: $data');
        onMessageReceived(data);
      });
    }
  }

  // Send typing indicator
  void emitTyping(String roomId, String userId) {
    if (_socket?.connected == true) {
      _socket!.emit('typing_start', {
        'roomId': roomId,
        'userId': userId,
        'userName': 'User',
      });
    }
  }

  // Stop typing indicator
  void stopTyping(String roomId, String userId) {
    if (_socket?.connected == true) {
      _socket!.emit('typing_stop', {
        'roomId': roomId,
        'userId': userId,
      });
    }
  }

  // Disconnect
  void disconnect() {
    if (_socket != null) {
      _socket!.disconnect();
      _socket = null;
    }
  }
}