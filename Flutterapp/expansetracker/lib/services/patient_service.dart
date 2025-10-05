import 'dart:convert';
import 'package:http/http.dart' as http;
import '../services/config_service.dart';

class Patient {
  final String id;
  final String name;
  final String phoneNumber;
  final String gender;
  final int age;
  // Add other fields from your patient schema here

  Patient({
    required this.id,
    required this.name,
    required this.phoneNumber,
    required this.gender,
    required this.age,
    // Add other fields here
  });

  factory Patient.fromJson(Map<String, dynamic> json) {
    return Patient(
      id: json['_id'] ?? json['id'] ?? '',
      name: json['name'] ?? '',
      phoneNumber: json['phoneNumber'] ?? '',
      gender: json['gender'] ?? '',
      age: json['age'] ?? 0,
      // Add other fields here
    );
  }
}

class PatientService {
  // Get base URL from config service
  static String get baseUrl => ConfigService.instance.baseUrl;

  static Future<List<Patient>> getAllPatients(String token) async {
    try {
      print('👥 Fetching all patients from: $baseUrl/patients/all');
      
      final response = await http.get(
        Uri.parse('$baseUrl/patients/all'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      print('👥 Patients response status: ${response.statusCode}');
      print('👥 Patients response body: ${response.body}');

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['success'] == true && data['patients'] is List) {
          final List<dynamic> patientsJson = data['patients'];
          final patients = patientsJson.map((json) => Patient.fromJson(json)).toList();
          
          print('✅ Successfully fetched ${patients.length} patients');
          return patients;
        }
      }
      
      throw Exception('Failed to load patients: ${response.statusCode}');
    } catch (e) {
      print('❌ Error fetching patients: $e');
      return [];
    }
  }

  static Future<Patient?> getPatientById(String patientId, String token) async {
    try {
      print('👤 Fetching patient by ID: $patientId from: $baseUrl/patients/$patientId');
      
      final response = await http.get(
        Uri.parse('$baseUrl/patients/$patientId'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      print('👤 Patient response status: ${response.statusCode}');

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['success'] == true && data['patient'] != null) {
          return Patient.fromJson(data['patient']);
        }
      }
      
      return null;
    } catch (e) {
      print('❌ Error fetching patient by ID: $e');
      return null;
    }
  }

  static Future<bool> updatePatient(String patientId, Map<String, dynamic> updateData, String token) async {
    try {
      print('📝 Updating patient: $patientId at: $baseUrl/patients/$patientId');
      
      final response = await http.put(
        Uri.parse('$baseUrl/patients/$patientId'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: json.encode(updateData),
      );

      print('📝 Update patient response status: ${response.statusCode}');

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return data['success'] == true;
      }
      
      return false;
    } catch (e) {
      print('❌ Error updating patient: $e');
      return false;
    }
  }
}