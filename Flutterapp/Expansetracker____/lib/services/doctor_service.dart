//doctor_service.dart
import 'dart:convert';
import 'package:http/http.dart' as http;
import '../cardio/doctor.dart';
import '../services/config_service.dart';

class DoctorService {
  // Get base URL from config service
  static String get baseUrl => ConfigService.instance.baseUrl;

  static List<Doctor>? _cachedDoctors;

  // Get all doctors
  static Future<List<Doctor>> getAllDoctors() async {
    if (_cachedDoctors != null) {
      print('🏥 Using cached doctors data');
      return _cachedDoctors!;
    }

    try {
      print('🏥 Fetching doctors from API...');
      print('🏥 Fetching all doctors from: $baseUrl/doctors');
      
      final response = await http.get(
        Uri.parse('$baseUrl/doctors'),
        headers: {'Content-Type': 'application/json'},
      );

      print('🏥 Doctors response status: ${response.statusCode}');
      print('🏥 Doctors response body: ${response.body}');

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['success'] == true && data['doctors'] is List) {
          final List<dynamic> doctorsJson = data['doctors'];
          _cachedDoctors = doctorsJson.map((json) => Doctor.fromJson(json)).toList();
          
          print('✅ Successfully fetched ${_cachedDoctors!.length} doctors');
          return _cachedDoctors!;
        }
      }
      
      throw Exception('Failed to load doctors: ${response.statusCode}');
    } catch (e) {
      print('❌ Error fetching doctors: $e');
      return [];
    }
  }

  // Get online doctors
  static Future<List<Doctor>> getOnlineDoctors() async {
    final allDoctors = await getAllDoctors();
    return allDoctors.where((doctor) => doctor.isOnline).toList();
  }

  // Get doctor by ID
  static Future<Doctor?> getDoctorById(String doctorId) async {
    final allDoctors = await getAllDoctors();
    try {
      return allDoctors.firstWhere((doctor) => doctor.id == doctorId);
    } catch (e) {
      print('❌ Doctor not found with ID: $doctorId');
      return null;
    }
  }

  // Clear cache
  static void clearCache() {
    _cachedDoctors = null;
    print('🗑️ Doctor cache cleared');
  }

  // Refresh doctors
  static Future<List<Doctor>> refreshDoctors() async {
    clearCache();
    return await getAllDoctors();
  }
}