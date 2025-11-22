import 'dart:convert';
import 'package:http/http.dart' as http;
import 'config_service.dart';

class AutomaticPrescriptionService {
  static String get _baseUrl => ConfigService.instance.baseUrl;

  // Get automatic prescription settings for a patient
  static Future<Map<String, dynamic>> getAutomaticPrescription(String patientId) async {
    try {
      final uri = Uri.parse('$_baseUrl/automatic-prescription/patient/$patientId');
      final response = await http.get(
        uri,
        headers: {'Content-Type': 'application/json'},
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return {
          'success': true,
          'data': data['data'] ?? {
            'facilityAvailed': false,
            'preferredPharmacy': null,
            'preferredDosage': 1
          },
        };
      } else {
        return {
          'success': false,
          'message': 'Failed to fetch automatic prescription settings',
          'data': {
            'facilityAvailed': false,
            'preferredPharmacy': null,
            'preferredDosage': 1
          },
        };
      }
    } catch (e) {
      print('Error getting automatic prescription: $e');
      return {
        'success': false,
        'message': 'Error: $e',
        'data': {
          'facilityAvailed': false,
          'preferredPharmacy': null,
          'preferredDosage': 1
        },
      };
    }
  }

  // Create or update automatic prescription settings
  static Future<Map<String, dynamic>> updateAutomaticPrescription({
    required String patientId,
    required bool facilityAvailed,
    String? preferredPharmacy,
    int? preferredDosage,
  }) async {
    try {
      final uri = Uri.parse('$_baseUrl/automatic-prescription');
      final body = json.encode({
        'patientId': patientId,
        'facilityAvailed': facilityAvailed,
        'preferredPharmacy': preferredPharmacy,
        'preferredDosage': preferredDosage ?? 1,
      });

      final response = await http.post(
        uri,
        headers: {'Content-Type': 'application/json'},
        body: body,
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return {
          'success': true,
          'message': data['message'] ?? 'Settings updated successfully',
          'data': data['data'],
        };
      } else {
        final errorData = json.decode(response.body);
        return {
          'success': false,
          'message': errorData['message'] ?? 'Failed to update settings',
        };
      }
    } catch (e) {
      print('Error updating automatic prescription: $e');
      return {
        'success': false,
        'message': 'Error: $e',
      };
    }
  }

  // Get available pharmacies
  static Future<Map<String, dynamic>> getAvailablePharmacies() async {
    try {
      final uri = Uri.parse('$_baseUrl/automatic-prescription/pharmacies');
      final response = await http.get(
        uri,
        headers: {'Content-Type': 'application/json'},
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return {
          'success': true,
          'data': data['data'] ?? [],
        };
      } else {
        return {
          'success': false,
          'message': 'Failed to fetch pharmacies',
          'data': [],
        };
      }
    } catch (e) {
      print('Error getting pharmacies: $e');
      return {
        'success': false,
        'message': 'Error: $e',
        'data': [],
      };
    }
  }
}

