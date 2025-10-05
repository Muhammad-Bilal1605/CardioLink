import 'package:flutter/material.dart';
import '../services/socket_service.dart';

class ChatScreen extends StatefulWidget {
  final String roomId;
  final String userId;

  const ChatScreen({Key? key, required this.roomId, required this.userId}) 
      : super(key: key);

  @override
  _ChatScreenState createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final TextEditingController _messageController = TextEditingController();
  final SocketService _socketService = SocketService();
  final List<Map<String, dynamic>> _messages = [];
  bool _isConnected = false;
  bool _isInitialized = false;

  @override
  void initState() {
    super.initState();
    _initializeChat();
  }

  Future<void> _initializeChat() async {
    try {
      // Initialize socket connection
      final connected = await _socketService.initSocket(
        widget.userId, 
        'patient', 
        'flutter_patient_token'
      );
      
      if (connected) {
        setState(() {
          _isConnected = true;
          _isInitialized = true;
        });
        
        // Join the chat room
        _socketService.joinRoom(widget.roomId, widget.userId);
        
        // Listen for new messages
        _socketService.listenForMessages(_handleNewMessage);
      } else {
        setState(() {
          _isInitialized = true;
        });
      }
    } catch (e) {
      print('Error initializing chat: $e');
      setState(() {
        _isInitialized = true;
      });
    }
  }

  void _handleNewMessage(dynamic messageData) {
    if (messageData is Map<String, dynamic>) {
      setState(() {
        _messages.add({
          'id': messageData['messageId'] ?? DateTime.now().millisecondsSinceEpoch.toString(),
          'text': messageData['text'] ?? messageData['message'] ?? '',
          'senderId': messageData['senderId'] ?? '',
          'timestamp': messageData['timestamp'] ?? DateTime.now().toIso8601String(),
          'isFromCurrentUser': messageData['senderId'] == widget.userId,
        });
      });
    }
  }

  void _sendMessage() {
    if (_messageController.text.trim().isNotEmpty && _isConnected) {
      final messageText = _messageController.text.trim();
      
      // Add message to local list immediately for UI feedback
      setState(() {
        _messages.add({
          'id': DateTime.now().millisecondsSinceEpoch.toString(),
          'text': messageText,
          'senderId': widget.userId,
          'timestamp': DateTime.now().toIso8601String(),
          'isFromCurrentUser': true,
        });
      });
      
      // Send via socket
      _socketService.sendMessage(
        widget.roomId,
        messageText,
        widget.userId,
      );
      
      _messageController.clear();
    }
  }

  @override
  Widget build(BuildContext context) {
    if (!_isInitialized) {
      return Scaffold(
        appBar: AppBar(title: const Text('Chat')),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              CircularProgressIndicator(),
              SizedBox(height: 16),
              Text('Connecting to chat...'),
            ],
          ),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Chat'),
        backgroundColor: Color(0xFF667eea),
        foregroundColor: Colors.white,
        actions: [
          Container(
            margin: EdgeInsets.only(right: 16),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  _isConnected ? Icons.circle : Icons.circle_outlined,
                  color: _isConnected ? Colors.green : Colors.red,
                  size: 12,
                ),
                SizedBox(width: 4),
                Text(
                  _isConnected ? 'Connected' : 'Disconnected',
                  style: TextStyle(fontSize: 12),
                ),
              ],
            ),
          ),
        ],
      ),
      body: Column(
        children: [
          // Connection status banner
          if (!_isConnected)
            Container(
              width: double.infinity,
              padding: EdgeInsets.all(8),
              color: Colors.orange,
              child: Text(
                'Not connected to chat server',
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.white),
              ),
            ),
          
          // Messages list
          Expanded(
            child: _messages.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.chat_bubble_outline,
                          size: 64,
                          color: Colors.grey[400],
                        ),
                        SizedBox(height: 16),
                        Text(
                          'No messages yet',
                          style: TextStyle(
                            fontSize: 18,
                            color: Colors.grey[600],
                          ),
                        ),
                        Text(
                          'Start the conversation!',
                          style: TextStyle(
                            fontSize: 14,
                            color: Colors.grey[500],
                          ),
                        ),
                      ],
                    ),
                  )
                : ListView.builder(
                    padding: EdgeInsets.all(16),
                    itemCount: _messages.length,
                    itemBuilder: (context, index) {
                      final message = _messages[index];
                      final isFromCurrentUser = message['isFromCurrentUser'] ?? 
                          (message['senderId'] == widget.userId);
                      
                      return Container(
                        margin: EdgeInsets.only(bottom: 12),
                        child: Row(
                          mainAxisAlignment: isFromCurrentUser
                              ? MainAxisAlignment.end
                              : MainAxisAlignment.start,
                          children: [
                            Container(
                              constraints: BoxConstraints(
                                maxWidth: MediaQuery.of(context).size.width * 0.75,
                              ),
                              padding: EdgeInsets.symmetric(
                                horizontal: 16,
                                vertical: 12,
                              ),
                              decoration: BoxDecoration(
                                color: isFromCurrentUser
                                    ? Color(0xFF667eea)
                                    : Colors.grey[200],
                                borderRadius: BorderRadius.circular(20),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withOpacity(0.1),
                                    blurRadius: 4,
                                    offset: Offset(0, 2),
                                  ),
                                ],
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    message['text'] ?? '',
                                    style: TextStyle(
                                      color: isFromCurrentUser
                                          ? Colors.white
                                          : Colors.black87,
                                      fontSize: 16,
                                    ),
                                  ),
                                  SizedBox(height: 4),
                                  Text(
                                    _formatTime(message['timestamp']),
                                    style: TextStyle(
                                      color: isFromCurrentUser
                                          ? Colors.white70
                                          : Colors.grey[600],
                                      fontSize: 12,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
          ),
          
          // Message input
          Container(
            padding: EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.1),
                  blurRadius: 4,
                  offset: Offset(0, -2),
                ),
              ],
            ),
            child: Row(
              children: [
                Expanded(
                  child: Container(
                    decoration: BoxDecoration(
                      color: Colors.grey[100],
                      borderRadius: BorderRadius.circular(25),
                    ),
                    child: TextField(
                      controller: _messageController,
                      decoration: InputDecoration(
                        hintText: 'Type a message...',
                        border: InputBorder.none,
                        contentPadding: EdgeInsets.symmetric(
                          horizontal: 20,
                          vertical: 12,
                        ),
                      ),
                      onSubmitted: (_) => _sendMessage(),
                      maxLines: null,
                    ),
                  ),
                ),
                SizedBox(width: 12),
                Container(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [Color(0xFF667eea), Color(0xFF764ba2)],
                    ),
                    shape: BoxShape.circle,
                  ),
                  child: IconButton(
                    icon: Icon(Icons.send, color: Colors.white),
                    onPressed: _isConnected ? _sendMessage : null,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  String _formatTime(dynamic timestamp) {
    try {
      DateTime dateTime;
      if (timestamp is String) {
        dateTime = DateTime.parse(timestamp);
      } else {
        dateTime = DateTime.now();
      }
      
      final now = DateTime.now();
      final difference = now.difference(dateTime);
      
      if (difference.inDays > 0) {
        return '${difference.inDays}d ago';
      } else if (difference.inHours > 0) {
        return '${difference.inHours}h ago';
      } else if (difference.inMinutes > 0) {
        return '${difference.inMinutes}m ago';
      } else {
        return 'Just now';
      }
    } catch (e) {
      return 'Now';
    }
  }

  @override
  void dispose() {
    _messageController.dispose();
    _socketService.disconnect();
    super.dispose();
  }
}
