import 'package:flutter_test/flutter_test.dart';
import 'package:mockito/annotations.dart';
import 'package:mockito/mockito.dart';
import 'package:expansetracker/provider/chat_provider.dart';
import 'package:expansetracker/cardio/message.dart';
import 'package:expansetracker/services/socket_services.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;

// Generate mocks
@GenerateMocks([SocketService])
import 'chat_integration_test.mocks.dart';

void main() {
  late ChatProvider chatProvider;
  late MockSocketService mockSocketService;
  
  const testUserId = 'test_user_123';
  const testDoctorId = 'test_doctor_456';
  const testPatientId = 'test_patient_789';
  const testRoomId = 'room_${testDoctorId}_$testPatientId';
  
  setUp(() {
    // Create mock socket service
    mockSocketService = MockSocketService();
    
    // Set up the mock to return test values
    when(mockSocketService.currentUserId).thenReturn(testUserId);
    when(mockSocketService.userType).thenReturn('patient');
    
    // Initialize chat provider with mock service
    chatProvider = ChatProvider(mockSocketService);
    
    // Initialize the chat provider
    chatProvider.initialize(
      userId: testUserId,
      userType: 'patient',
      name: 'Test User',
    );
  });
  
  tearDown(() {
    chatProvider.dispose();
  });
  
  group('ChatProvider Tests', () {
    test('initializes with default values', () {
      expect(chatProvider.isConnected, false);
      expect(chatProvider.isLoading, false);
      expect(chatProvider.currentRoomId, isNull);
      expect(chatProvider.error, isNull);
      expect(chatProvider.messages, isEmpty);
      expect(chatProvider.typingUsers, isEmpty);
    });
    
    test('connects to socket on initialization', () {
      // Verify socket connection was initiated
      verify(mockSocketService.connect(any)).called(1);
      
      // Verify authentication was called
      verify(mockSocketService.authenticate(
        userId: testUserId,
        userType: 'patient',
        name: 'Test User',
        email: anyNamed('email'),
        avatar: anyNamed('avatar'),
        specialization: anyNamed('specialization'),
      )).called(1);
    });
    
    test('joins a chat room', () {
      // Call joinChat
      chatProvider.joinChat(doctorId: testDoctorId, patientId: testPatientId);
      
      // Verify loading state
      expect(chatProvider.isLoading, true);
      
      // Verify room ID is set
      expect(chatProvider.currentRoomId, testRoomId);
      
      // Verify socket service was called
      verify(mockSocketService.joinChat(
        doctorId: testDoctorId,
        patientId: testPatientId,
      )).called(1);
    });
    
    test('sends a text message', () {
      const testMessage = 'Hello, doctor!';
      
      // Set up mock to simulate connection
      when(mockSocketService.isConnected).thenReturn(true);
      
      // Send a message
      chatProvider.sendMessage(testMessage);
      
      // Verify message was added to local state
      expect(chatProvider.messages.length, 1);
      expect(chatProvider.messages[0].text, testMessage);
      expect(chatProvider.messages[0].status, 'sending');
      
      // Verify socket service was called
      verify(mockSocketService.sendMessage(
        doctorId: '', // Should be empty for patient
        patientId: testUserId,
        text: testMessage,
        type: 'text',
        audioUrl: anyNamed('audioUrl'),
        mediaUrl: anyNamed('mediaUrl'),
      )).called(1);
    });
    
    test('handles incoming messages', () {
      // Set up test message data
      final testMessageData = {
        '_id': 'msg_123',
        'roomId': testRoomId,
        'senderId': testDoctorId,
        'senderType': 'doctor',
        'receiverId': testUserId,
        'receiverType': 'patient',
        'text': 'Hello, how can I help you?',
        'type': 'text',
        'status': 'delivered',
        'createdAt': DateTime.now().toIso8601String(),
        'senderName': 'Dr. Smith',
      };
      
      // Simulate receiving a new message
      chatProvider._handleNewMessage(testMessageData);
      
      // Verify message was added to the list
      expect(chatProvider.messages.length, 1);
      expect(chatProvider.messages[0].id, 'msg_123');
      expect(chatProvider.messages[0].text, 'Hello, how can I help you?');
      expect(chatProvider.messages[0].isMe, false);
    });
    
    test('handles typing indicators', () {
      // Simulate user typing
      chatProvider._handleUserTyping({
        'userId': testDoctorId,
        'name': 'Dr. Smith',
        'roomId': testRoomId,
      });
      
      // Verify typing indicator is shown
      expect(chatProvider.typingUsers.length, 1);
      expect(chatProvider.typingUsers.contains('Dr. Smith'), true);
      
      // Simulate user stopped typing
      chatProvider._handleUserStopTyping({
        'userId': testDoctorId,
        'name': 'Dr. Smith',
        'roomId': testRoomId,
      });
      
      // Verify typing indicator is removed
      expect(chatProvider.typingUsers.isEmpty, true);
    });
    
    test('marks messages as read', () {
      // Add a test message
      final message = Message(
        id: 'msg_123',
        roomId: testRoomId,
        senderId: testDoctorId,
        senderType: 'doctor',
        receiverId: testUserId,
        receiverType: 'patient',
        text: 'Test message',
        type: 'text',
        status: 'delivered',
        timestamp: DateTime.now(),
        isMe: false,
      );
      
      // Add to messages
      chatProvider._addMessageToConversation(message);
      
      // Mark as read
      chatProvider.markMessagesAsRead(testRoomId);
      
      // Verify status was updated
      expect(chatProvider.messages[0].status, 'read');
      
      // Verify read receipt was sent
      verify(mockSocketService.emit(
        'mark_as_read',
        {
          'roomId': testRoomId,
          'messageId': 'msg_123',
        },
      )).called(1);
    });
  });
}
