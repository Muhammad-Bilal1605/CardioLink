import 'package:flutter/foundation.dart';

class Message {
  final String id;
  final String roomId;
  final String senderId;
  final String senderType; // 'doctor' or 'patient'
  final String receiverId;
  final String receiverType; // 'doctor' or 'patient'
  final String? text;
  final String type; // 'text', 'audio', or 'image'
  final String? audioUrl;
  final String? mediaUrl;
  final String status; // 'sending', 'delivered', 'read'
  final DateTime timestamp;
  final DateTime? updatedAt;
  final bool isMe;
  final String? senderName;
  final String? senderAvatar;

  Message({
    required this.id,
    required this.roomId,
    required this.senderId,
    required this.senderType,
    required this.receiverId,
    required this.receiverType,
    this.text,
    this.type = 'text',
    this.audioUrl,
    this.mediaUrl,
    this.status = 'sending',
    required this.timestamp,
    this.updatedAt,
    required this.isMe,
    this.senderName,
    this.senderAvatar,
  }) : assert(
          (type == 'text' && text != null) ||
          (type == 'audio' && audioUrl != null) ||
          (type == 'image' && mediaUrl != null),
          'Message must have content based on its type',
        );

  factory Message.fromJson(Map<String, dynamic> json, {String? currentUserId}) {
    return Message(
      id: json['_id'] ?? DateTime.now().millisecondsSinceEpoch.toString(),
      roomId: json['roomId'] ?? '',
      senderId: json['senderId'] ?? '',
      senderType: json['senderType'] ?? 'patient',
      receiverId: json['receiverId'] ?? '',
      receiverType: json['receiverType'] ?? 'doctor',
      text: json['text'],
      type: json['type'] ?? 'text',
      audioUrl: json['audioUrl'],
      mediaUrl: json['mediaUrl'] ?? json['imageUrl'],
      status: json['status'] ?? 'delivered',
      timestamp: json['createdAt'] != null 
          ? DateTime.parse(json['createdAt']) 
          : DateTime.now(),
      updatedAt: json['updatedAt'] != null 
          ? DateTime.parse(json['updatedAt']) 
          : null,
      isMe: currentUserId != null ? json['senderId'] == currentUserId : false,
      senderName: json['senderName'] ?? json['sender']?['name'],
      senderAvatar: json['senderAvatar'] ?? json['sender']?['avatar'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'roomId': roomId,
      'senderId': senderId,
      'senderType': senderType,
      'receiverId': receiverId,
      'receiverType': receiverType,
      'text': text,
      'type': type,
      'audioUrl': audioUrl,
      'mediaUrl': mediaUrl,
      'status': status,
      'createdAt': timestamp.toIso8601String(),
      'updatedAt': updatedAt?.toIso8601String(),
      'senderName': senderName,
      'senderAvatar': senderAvatar,
    };
  }

  Message copyWith({
    String? id,
    String? roomId,
    String? senderId,
    String? senderType,
    String? receiverId,
    String? receiverType,
    String? text,
    String? type,
    String? audioUrl,
    String? mediaUrl,
    String? status,
    DateTime? timestamp,
    DateTime? updatedAt,
    bool? isMe,
    String? senderName,
    String? senderAvatar,
  }) {
    return Message(
      id: id ?? this.id,
      roomId: roomId ?? this.roomId,
      senderId: senderId ?? this.senderId,
      senderType: senderType ?? this.senderType,
      receiverId: receiverId ?? this.receiverId,
      receiverType: receiverType ?? this.receiverType,
      text: text ?? this.text,
      type: type ?? this.type,
      audioUrl: audioUrl ?? this.audioUrl,
      mediaUrl: mediaUrl ?? this.mediaUrl,
      status: status ?? this.status,
      timestamp: timestamp ?? this.timestamp,
      updatedAt: updatedAt ?? this.updatedAt,
      isMe: isMe ?? this.isMe,
      senderName: senderName ?? this.senderName,
      senderAvatar: senderAvatar ?? this.senderAvatar,
    );
  }

  @override
  String toString() {
    return 'Message(id: $id, type: $type, status: $status, text: ${text?.substring(0, text!.length > 20 ? 20 : text?.length ?? 0)})';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is Message &&
        other.id == id &&
        other.status == status;
  }

  @override
  int get hashCode => id.hashCode ^ status.hashCode;
}