class User {
  final String id;
  final String email;
  final String name;
  final String role;
  final DateTime? lastLogin;
  final bool isVerified;
  final String? hospitalId;
  final DateTime createdAt;
  final DateTime updatedAt;

  User({
    required this.id,
    required this.email,
    required this.name,
    required this.role,
    this.lastLogin,
    this.isVerified = false,
    this.hospitalId,
    required this.createdAt,
    required this.updatedAt,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['_id'] ?? json['id'] ?? '',
      email: json['email'] ?? '',
      name: json['name'] ?? '',
      role: json['role'] ?? '',
      lastLogin: json['lastLogin'] != null
          ? DateTime.parse(json['lastLogin'])
          : null,
      isVerified: json['isVerified'] ?? false,
      hospitalId: json['hospitalId'],
      createdAt: DateTime.parse(json['createdAt'] ?? DateTime.now().toIso8601String()),
      updatedAt: DateTime.parse(json['updatedAt'] ?? DateTime.now().toIso8601String()),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'name': name,
      'role': role,
      'lastLogin': lastLogin?.toIso8601String(),
      'isVerified': isVerified,
      'hospitalId': hospitalId,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  bool get isDoctor => role == 'doctor';
  bool get isPatient => role == 'patient';
  bool get isAdmin => role == 'admin';
  bool get isHospitalAdmin => role == 'hospital-admin';
  bool get isAmbulanceEmployer => role == 'ambulance-employer'; // New role
  bool get isHospitalStaff => [
    'hospital-admin',
    'radiologist',
    'lab-technologist',
    'doctor',
    'hospital-front-desk'
  ].contains(role);

  User copyWith({
    String? id,
    String? email,
    String? name,
    String? role,
    DateTime? lastLogin,
    bool? isVerified,
    String? hospitalId,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return User(
      id: id ?? this.id,
      email: email ?? this.email,
      name: name ?? this.name,
      role: role ?? this.role,
      lastLogin: lastLogin ?? this.lastLogin,
      isVerified: isVerified ?? this.isVerified,
      hospitalId: hospitalId ?? this.hospitalId,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}

class Doctor extends User {
  final String specialization;
  final String? licenseNumber;
  final List<String> expertise;
  final bool isAvailable;
  final double rating;
  final int totalPatients;

  Doctor({
    required super.id,
    required super.email,
    required super.name,
    super.lastLogin,
    super.isVerified,
    super.hospitalId,
    required super.createdAt,
    required super.updatedAt,
    required this.specialization,
    this.licenseNumber,
    this.expertise = const [],
    this.isAvailable = true,
    this.rating = 0.0,
    this.totalPatients = 0,
  }) : super(role: 'doctor');

  factory Doctor.fromJson(Map<String, dynamic> json) {
    return Doctor(
      id: json['_id'] ?? json['id'] ?? '',
      email: json['email'] ?? '',
      name: json['name'] ?? '',
      lastLogin: json['lastLogin'] != null
          ? DateTime.parse(json['lastLogin'])
          : null,
      isVerified: json['isVerified'] ?? false,
      hospitalId: json['hospitalId'],
      createdAt: DateTime.parse(json['createdAt'] ?? DateTime.now().toIso8601String()),
      updatedAt: DateTime.parse(json['updatedAt'] ?? DateTime.now().toIso8601String()),
      specialization: json['specialization'] ?? '',
      licenseNumber: json['licenseNumber'],
      expertise: List<String>.from(json['expertise'] ?? []),
      isAvailable: json['isAvailable'] ?? true,
      rating: (json['rating'] ?? 0).toDouble(),
      totalPatients: json['totalPatients'] ?? 0,
    );
  }

  @override
  Map<String, dynamic> toJson() {
    final json = super.toJson();
    json.addAll({
      'specialization': specialization,
      'licenseNumber': licenseNumber,
      'expertise': expertise,
      'isAvailable': isAvailable,
      'rating': rating,
      'totalPatients': totalPatients,
    });
    return json;
  }
}

class Patient extends User {
  final String? phoneNumber;
  final DateTime? dateOfBirth;
  final String? gender;
  final String? bloodType;
  final List<String> allergies;
  final List<String> currentMedications;
  final String? emergencyContact;

  Patient({
    required super.id,
    required super.email,
    required super.name,
    super.lastLogin,
    super.isVerified,
    required super.createdAt,
    required super.updatedAt,
    this.phoneNumber,
    this.dateOfBirth,
    this.gender,
    this.bloodType,
    this.allergies = const [],
    this.currentMedications = const [],
    this.emergencyContact,
  }) : super(role: 'patient', hospitalId: null);

  factory Patient.fromJson(Map<String, dynamic> json) {
    return Patient(
      id: json['_id'] ?? json['id'] ?? '',
      email: json['email'] ?? '',
      name: json['name'] ?? '',
      lastLogin: json['lastLogin'] != null
          ? DateTime.parse(json['lastLogin'])
          : null,
      isVerified: json['isVerified'] ?? false,
      createdAt: DateTime.parse(json['createdAt'] ?? DateTime.now().toIso8601String()),
      updatedAt: DateTime.parse(json['updatedAt'] ?? DateTime.now().toIso8601String()),
      phoneNumber: json['phoneNumber'],
      dateOfBirth: json['dateOfBirth'] != null
          ? DateTime.parse(json['dateOfBirth'])
          : null,
      gender: json['gender'],
      bloodType: json['bloodType'],
      allergies: List<String>.from(json['allergies'] ?? []),
      currentMedications: List<String>.from(json['currentMedications'] ?? []),
      emergencyContact: json['emergencyContact'],
    );
  }

  @override
  Map<String, dynamic> toJson() {
    final json = super.toJson();
    json.addAll({
      'phoneNumber': phoneNumber,
      'dateOfBirth': dateOfBirth?.toIso8601String(),
      'gender': gender,
      'bloodType': bloodType,
      'allergies': allergies,
      'currentMedications': currentMedications,
      'emergencyContact': emergencyContact,
    });
    return json;
  }

  int? get age {
    if (dateOfBirth == null) return null;
    final now = DateTime.now();
    var age = now.year - dateOfBirth!.year;
    if (now.month < dateOfBirth!.month ||
        (now.month == dateOfBirth!.month && now.day < dateOfBirth!.day)) {
      age--;
    }
    return age;
  }
}

// New AmbulanceEmployer class
class AmbulanceEmployer extends User {
  final String? phoneNumber;
  final DateTime? dateOfBirth;
  final String? gender;
  final String? companyName;
  final String? licenseNumber;
  final String? serviceArea;
  final List<String> availableServices;
  final bool isActive;
  final double rating;
  final int totalRides;
  final String? emergencyContact;

  AmbulanceEmployer({
    required super.id,
    required super.email,
    required super.name,
    super.lastLogin,
    super.isVerified,
    required super.createdAt,
    required super.updatedAt,
    this.phoneNumber,
    this.dateOfBirth,
    this.gender,
    this.companyName,
    this.licenseNumber,
    this.serviceArea,
    this.availableServices = const [],
    this.isActive = true,
    this.rating = 0.0,
    this.totalRides = 0,
    this.emergencyContact,
  }) : super(role: 'ambulance-employer', hospitalId: null);

  factory AmbulanceEmployer.fromJson(Map<String, dynamic> json) {
    return AmbulanceEmployer(
      id: json['_id'] ?? json['id'] ?? '',
      email: json['email'] ?? '',
      name: json['name'] ?? '',
      lastLogin: json['lastLogin'] != null
          ? DateTime.parse(json['lastLogin'])
          : null,
      isVerified: json['isVerified'] ?? false,
      createdAt: DateTime.parse(json['createdAt'] ?? DateTime.now().toIso8601String()),
      updatedAt: DateTime.parse(json['updatedAt'] ?? DateTime.now().toIso8601String()),
      phoneNumber: json['phoneNumber'],
      dateOfBirth: json['dateOfBirth'] != null
          ? DateTime.parse(json['dateOfBirth'])
          : null,
      gender: json['gender'],
      companyName: json['companyName'],
      licenseNumber: json['licenseNumber'],
      serviceArea: json['serviceArea'],
      availableServices: List<String>.from(json['availableServices'] ?? []),
      isActive: json['isActive'] ?? true,
      rating: (json['rating'] ?? 0).toDouble(),
      totalRides: json['totalRides'] ?? 0,
      emergencyContact: json['emergencyContact'],
    );
  }

  @override
  Map<String, dynamic> toJson() {
    final json = super.toJson();
    json.addAll({
      'phoneNumber': phoneNumber,
      'dateOfBirth': dateOfBirth?.toIso8601String(),
      'gender': gender,
      'companyName': companyName,
      'licenseNumber': licenseNumber,
      'serviceArea': serviceArea,
      'availableServices': availableServices,
      'isActive': isActive,
      'rating': rating,
      'totalRides': totalRides,
      'emergencyContact': emergencyContact,
    });
    return json;
  }

  int? get age {
    if (dateOfBirth == null) return null;
    final now = DateTime.now();
    var age = now.year - dateOfBirth!.year;
    if (now.month < dateOfBirth!.month ||
        (now.month == dateOfBirth!.month && now.day < dateOfBirth!.day)) {
      age--;
    }
    return age;
  }

  String get displayCompanyName => companyName ?? 'Independent Operator';
}

class Hospital {
  final String id;
  final String name;
  final String address;
  final String city;
  final String state;
  final String zipCode;
  final String? phoneNumber;
  final String? email;
  final String? website;
  final List<String> departments;
  final bool isActive;
  final DateTime createdAt;
  final DateTime updatedAt;

  Hospital({
    required this.id,
    required this.name,
    required this.address,
    required this.city,
    required this.state,
    required this.zipCode,
    this.phoneNumber,
    this.email,
    this.website,
    this.departments = const [],
    this.isActive = true,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Hospital.fromJson(Map<String, dynamic> json) {
    return Hospital(
      id: json['_id'] ?? json['id'] ?? '',
      name: json['name'] ?? '',
      address: json['address'] ?? '',
      city: json['city'] ?? '',
      state: json['state'] ?? '',
      zipCode: json['zipCode'] ?? '',
      phoneNumber: json['phoneNumber'],
      email: json['email'],
      website: json['website'],
      departments: List<String>.from(json['departments'] ?? []),
      isActive: json['isActive'] ?? true,
      createdAt: DateTime.parse(json['createdAt'] ?? DateTime.now().toIso8601String()),
      updatedAt: DateTime.parse(json['updatedAt'] ?? DateTime.now().toIso8601String()),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'address': address,
      'city': city,
      'state': state,
      'zipCode': zipCode,
      'phoneNumber': phoneNumber,
      'email': email,
      'website': website,
      'departments': departments,
      'isActive': isActive,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  String get fullAddress => '$address, $city, $state $zipCode';
}

class ChatMessage {
  final String id;
  final String senderId;
  final String senderName;
  final String senderType; // 'doctor', 'patient', or 'ambulance-employer'
  final String text;
  final String type; // 'text', 'audio', 'image', etc.
  final String? audioUrl;
  final String? mediaUrl;
  final String doctorId;
  final String patientId;
  final String roomId;
  final DateTime timestamp;
  final String status; // 'sent', 'delivered', 'read'

  ChatMessage({
    required this.id,
    required this.senderId,
    required this.senderName,
    required this.senderType,
    required this.text,
    this.type = 'text',
    this.audioUrl,
    this.mediaUrl,
    required this.doctorId,
    required this.patientId,
    required this.roomId,
    required this.timestamp,
    this.status = 'sent',
  });

  factory ChatMessage.fromJson(Map<String, dynamic> json) {
    return ChatMessage(
      id: json['id'] ?? '',
      senderId: json['senderId'] ?? '',
      senderName: json['senderName'] ?? '',
      senderType: json['senderType'] ?? '',
      text: json['text'] ?? '',
      type: json['type'] ?? 'text',
      audioUrl: json['audioUrl'],
      mediaUrl: json['mediaUrl'],
      doctorId: json['doctorId'] ?? '',
      patientId: json['patientId'] ?? '',
      roomId: json['roomId'] ?? '',
      timestamp: DateTime.parse(json['timestamp'] ?? DateTime.now().toIso8601String()),
      status: json['status'] ?? 'sent',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'senderId': senderId,
      'senderName': senderName,
      'senderType': senderType,
      'text': text,
      'type': type,
      'audioUrl': audioUrl,
      'mediaUrl': mediaUrl,
      'doctorId': doctorId,
      'patientId': patientId,
      'roomId': roomId,
      'timestamp': timestamp.toIso8601String(),
      'status': status,
    };
  }

  bool get isFromDoctor => senderType == 'doctor';
  bool get isFromPatient => senderType == 'patient';
  bool get isFromAmbulanceEmployer => senderType == 'ambulance-employer';
  bool get isTextMessage => type == 'text';
  bool get isAudioMessage => type == 'audio';
  bool get isImageMessage => type == 'image';
  bool get hasMedia => audioUrl != null || mediaUrl != null;
}

class AuthResponse {
  final bool success;
  final String? token;
  final User? user;
  final String? message;

  AuthResponse({
    required this.success,
    this.token,
    this.user,
    this.message,
  });

  factory AuthResponse.fromJson(Map<String, dynamic> json) {
    User? user;
    if (json['user'] != null) {
      final userData = json['user'];
      if (userData['role'] == 'doctor') {
        user = Doctor.fromJson(userData);
      } else if (userData['role'] == 'patient') {
        user = Patient.fromJson(userData);
      } else if (userData['role'] == 'ambulance-employer') {
        user = AmbulanceEmployer.fromJson(userData);
      } else {
        user = User.fromJson(userData);
      }
    }

    return AuthResponse(
      success: json['success'] ?? false,
      token: json['token'],
      user: user,
      message: json['message'],
    );
  }
}