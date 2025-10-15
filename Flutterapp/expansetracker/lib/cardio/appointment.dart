// lib/cardio/appointment.dart
// This file contains ONLY the Appointment model class

class Appointment {
  final String id;
  final String patientId;
  final String doctorId;
  final String doctorName;
  final String doctorSpecialty;
  final String doctorImage;
  final String date;
  final String time;
  final String location;
  final String status;
  final String joiningCode;

  Appointment({
    required this.id,
    required this.patientId,
    required this.doctorId,
    required this.doctorName,
    required this.doctorSpecialty,
    required this.doctorImage,
    required this.date,
    required this.time,
    required this.location,
    required this.status,
    required this.joiningCode,
  });

  // Optional: Add a factory constructor for JSON parsing
  factory Appointment.fromJson(Map<String, dynamic> json) {
    return Appointment(
      id: json['id']?.toString() ?? '',
      patientId: json['patientId']?.toString() ?? '',
      doctorId: json['doctorId']?.toString() ?? '',
      doctorName: json['doctorName']?.toString() ?? 'Unknown',
      doctorSpecialty: json['doctorSpecialty']?.toString() ?? 'General',
      doctorImage: json['doctorImage']?.toString() ?? '',
      date: json['date']?.toString() ?? '',
      time: json['time']?.toString() ?? '',
      location: json['location']?.toString() ?? '',
      status: json['status']?.toString() ?? 'Upcoming',
      joiningCode: json['joiningCode']?.toString() ?? '',
    );
  }

  // Optional: Add a toJson method
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'patientId': patientId,
      'doctorId': doctorId,
      'doctorName': doctorName,
      'doctorSpecialty': doctorSpecialty,
      'doctorImage': doctorImage,
      'date': date,
      'time': time,
      'location': location,
      'status': status,
      'joiningCode': joiningCode,
    };
  }
}