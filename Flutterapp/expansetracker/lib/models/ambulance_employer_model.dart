// lib/backend/models/ambulance_employer_model.dart

class AmbulanceEmployerModel {
  final String id;
  final String name;
  final String phone;
  final String email;
  final double? latitude;
  final double? longitude;
  final String? address;
  final String? coordinates;
  final DateTime? locationTimestamp;
  final String status; // 'available', 'busy', 'offline'
  final String? ambulanceId;
  final String? licenseNumber;

  const AmbulanceEmployerModel({
    required this.id,
    required this.name,
    required this.phone,
    required this.email,
    this.latitude,
    this.longitude,
    this.address,
    this.coordinates,
    this.locationTimestamp,
    this.status = 'available',
    this.ambulanceId,
    this.licenseNumber,
  });

  AmbulanceEmployerModel copyWith({
    String? id,
    String? name,
    String? phone,
    String? email,
    double? latitude,
    double? longitude,
    String? address,
    String? coordinates,
    DateTime? locationTimestamp,
    String? status,
    String? ambulanceId,
    String? licenseNumber,
  }) {
    return AmbulanceEmployerModel(
      id: id ?? this.id,
      name: name ?? this.name,
      phone: phone ?? this.phone,
      email: email ?? this.email,
      latitude: latitude ?? this.latitude,
      longitude: longitude ?? this.longitude,
      address: address ?? this.address,
      coordinates: coordinates ?? this.coordinates,
      locationTimestamp: locationTimestamp ?? this.locationTimestamp,
      status: status ?? this.status,
      ambulanceId: ambulanceId ?? this.ambulanceId,
      licenseNumber: licenseNumber ?? this.licenseNumber,
    );
  }

  bool get hasLocation => latitude != null && longitude != null;
  bool get hasAddress => address != null && address!.isNotEmpty;

  factory AmbulanceEmployerModel.fromJson(Map<String, dynamic> json) {
    return AmbulanceEmployerModel(
      id: json['_id'] ?? json['id'] ?? '',
      name: json['name'] ?? 'Unknown',
      phone: json['phone'] ?? '',
      email: json['email'] ?? '',
      latitude: json['latitude'] != null ? double.tryParse(json['latitude'].toString()) : null,
      longitude: json['longitude'] != null ? double.tryParse(json['longitude'].toString()) : null,
      address: json['address'],
      coordinates: json['coordinates'],
      locationTimestamp: json['locationTimestamp'] != null 
          ? DateTime.tryParse(json['locationTimestamp'].toString())
          : null,
      status: json['status'] ?? 'available',
      ambulanceId: json['ambulanceId'],
      licenseNumber: json['licenseNumber'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'phone': phone,
      'email': email,
      'latitude': latitude,
      'longitude': longitude,
      'address': address,
      'coordinates': coordinates,
      'locationTimestamp': locationTimestamp?.toIso8601String(),
      'status': status,
      'ambulanceId': ambulanceId,
      'licenseNumber': licenseNumber,
    };
  }

  @override
  String toString() {
    return 'AmbulanceEmployerModel(id: $id, name: $name, lat: $latitude, lng: $longitude, status: $status)';
  }
}