// lib/services/appointment_api_service.dart
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../config/api_config.dart';

// Import the Appointment model from cardio folder
import '../cardio/appointment.dart';

class AppointmentApiService {
  static String _authToken = '';

  // Set auth token from login
  static void setAuthToken(String token) {
    _authToken = token;
    print('✓ AppointmentApiService: Auth token set (${token.length} chars)');
  }

  // Get the current auth token
  static String get authToken => _authToken;

  // Create appointment
  static Future<Map<String, dynamic>> createAppointment({
    required String doctorId,
    required String doctorName,
    required String doctorSpecialty,
    required String doctorImage,
    required DateTime appointmentDate,
    required String appointmentTime,
    required String formattedDate,
    required String reason,
    required String paymentMethod,
    required int consultationFee,
    required String location,
    required String roomNumber,
  }) async {
    try {
      print('========== APPOINTMENT API CREATE ==========');
      print('📍 API Base URL: ${ApiConfig.baseUrl}');
      print('📍 Token Present: ${_authToken.isNotEmpty}');
      print('📍 Token Length: ${_authToken.length}');

      if (_authToken.isEmpty) {
        print('❌ Auth token is empty!');
        return {
          'success': false,
          'message': 'Authentication token not found. Please login again.'
        };
      }

      final payload = {
        'doctorId': doctorId,
        'doctorName': doctorName,
        'doctorSpecialty': doctorSpecialty,
        'doctorImage': doctorImage,
        'appointmentDate': appointmentDate.toIso8601String(),
        'appointmentTime': appointmentTime,
        'formattedDate': formattedDate,
        'reason': reason,
        'paymentMethod': paymentMethod,
        'consultationFee': consultationFee,
        'location': location,
        'roomNumber': roomNumber,
      };

      print('📤 Payload: ${json.encode(payload)}');

      final url = '${ApiConfig.baseUrl}/appointments';
      print('📍 Request URL: $url');
      print('🔑 Token: ${_authToken.substring(0, 20)}...');

      final response = await http.post(
        Uri.parse(url),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $_authToken',
          'Accept': 'application/json',
        },
        body: json.encode(payload),
      ).timeout(const Duration(seconds: 30));

      print('📥 Response Status: ${response.statusCode}');
      print('📥 Response Body: ${response.body}');

      if (response.statusCode == 201 || response.statusCode == 200) {
        try {
          final responseData = json.decode(response.body);
          if (responseData['success'] == true) {
            print('✅ Appointment created successfully');
            return {
              'success': true,
              'message': responseData['message'] ?? 'Appointment created successfully',
              'appointment': responseData['appointment'] ?? {}
            };
          }
        } catch (e) {
          print('❌ Error parsing response: $e');
          return {
            'success': false,
            'message': 'Invalid response format'
          };
        }
      } else if (response.statusCode == 401) {
        print('❌ Authentication failed (401)');
        return {
          'success': false,
          'message': 'Authentication failed. Your session may have expired. Please login again.'
        };
      } else if (response.statusCode == 400) {
        try {
          final errorData = json.decode(response.body);
          print('❌ Bad request: ${errorData['message']}');
          return {
            'success': false,
            'message': errorData['message'] ?? 'Invalid appointment data'
          };
        } catch (e) {
          return {
            'success': false,
            'message': 'Bad request: Invalid appointment data'
          };
        }
      } else {
        print('❌ Unexpected status: ${response.statusCode}');
        return {
          'success': false,
          'message': 'Server error: ${response.statusCode}'
        };
      }
      
      // Fallback return to satisfy non-nullable return type
      return {
        'success': false,
        'message': 'Unexpected error occurred'
      };
    } catch (e) {
      print('❌ Exception in createAppointment: $e');
      return {
        'success': false,
        'message': 'Network error: ${e.toString()}'
      };
    }
  }

  // Get patient appointments
  static Future<Map<String, dynamic>> getPatientAppointments({
    String? status,
  }) async {
    try {
      print('========== APPOINTMENT API FETCH ==========');
      print('📍 Fetching appointments...');
      print('📍 Token Present: ${_authToken.isNotEmpty}');

      if (_authToken.isEmpty) {
        print('❌ Auth token is empty when fetching appointments!');
        return {
          'success': false,
          'message': 'Authentication token not found'
        };
      }

      String url = '${ApiConfig.baseUrl}/appointments/patient';
      if (status != null && status.isNotEmpty) {
        url += '?status=$status';
      }

      print('📍 Request URL: $url');
      print('🔑 Token: ${_authToken.substring(0, 20)}...');

      final response = await http.get(
        Uri.parse(url),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $_authToken',
          'Accept': 'application/json',
        },
      ).timeout(const Duration(seconds: 30));

      print('📥 Response Status: ${response.statusCode}');

      if (response.statusCode == 200) {
        try {
          final responseData = json.decode(response.body);
          if (responseData['success'] == true) {
            final appointments = responseData['appointments'] as List? ?? [];
            print('✅ Fetched ${appointments.length} appointments');
            return {
              'success': true,
              'message': 'Appointments retrieved',
              'appointments': appointments
            };
          }
        } catch (e) {
          print('❌ Error parsing response: $e');
        }
      } else if (response.statusCode == 401) {
        print('❌ Authentication failed (401) - Token may be invalid or expired');
        return {
          'success': false,
          'message': 'Authentication failed. Please login again.'
        };
      } else {
        print('❌ Error: Status ${response.statusCode}');
        print('📥 Response Body: ${response.body}');
      }

      return {
        'success': false,
        'message': 'Failed to fetch appointments'
      };
    } catch (e) {
      print('❌ Exception in getPatientAppointments: $e');
      return {
        'success': false,
        'message': 'Network error: ${e.toString()}'
      };
    }
  }

  // Cancel appointment
  static Future<Map<String, dynamic>> cancelAppointment(
    String appointmentId,
    String reason,
  ) async {
    try {
      print('📍 Cancelling appointment: $appointmentId');

      if (_authToken.isEmpty) {
        return {
          'success': false,
          'message': 'Authentication token not found'
        };
      }

      final url = '${ApiConfig.baseUrl}/appointments/$appointmentId/cancel';
      print('📍 Request URL: $url');

      final response = await http.patch(
        Uri.parse(url),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $_authToken',
          'Accept': 'application/json',
        },
        body: json.encode({'cancellationReason': reason}),
      ).timeout(const Duration(seconds: 30));

      print('📥 Response Status: ${response.statusCode}');

      if (response.statusCode == 200) {
        final responseData = json.decode(response.body);
        if (responseData['success'] == true) {
          print('✅ Appointment cancelled successfully');
          return {
            'success': true,
            'message': 'Appointment cancelled'
          };
        }
      } else if (response.statusCode == 401) {
        return {
          'success': false,
          'message': 'Authentication failed'
        };
      }

      return {
        'success': false,
        'message': 'Failed to cancel appointment'
      };
    } catch (e) {
      print('❌ Exception in cancelAppointment: $e');
      return {
        'success': false,
        'message': 'Network error: ${e.toString()}'
      };
    }
  }

  // Sync appointments from server
  static Future<void> syncAppointments() async {
    try {
      print('🔄 Starting appointment sync...');
      
      final result = await getPatientAppointments();

      if (result['success'] == true) {
        final appointments = result['appointments'] as List? ?? [];
        print('✅ Synced ${appointments.length} appointments');

        // Clear existing appointments
        AppointmentStore.upcomingAppointments.clear();
        AppointmentStore.completedAppointments.clear();
        AppointmentStore.cancelledAppointments.clear();

        // Populate from server data
        for (var apt in appointments) {
          try {
            final appointment = Appointment.fromJson(apt);

            if (appointment.status == 'Upcoming') {
              AppointmentStore.upcomingAppointments.add(appointment);
            } else if (appointment.status == 'Completed') {
              AppointmentStore.completedAppointments.add(appointment);
            } else if (appointment.status == 'Cancelled') {
              AppointmentStore.cancelledAppointments.add(appointment);
            }
          } catch (e) {
            print('⚠️ Error parsing appointment: $e');
          }
        }

        print('✅ Appointments synced to local store');
      } else {
        print('❌ Sync failed: ${result['message']}');
      }
    } catch (e) {
      print('❌ Error syncing appointments: $e');
    }
  }

  // Verify joining code
  static Future<Map<String, dynamic>> verifyJoiningCode(String code) async {
    try {
      final url = '${ApiConfig.baseUrl}/appointments/verify-code';
      print('📍 Verifying joining code: $code');

      final response = await http.post(
        Uri.parse(url),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: json.encode({'joiningCode': code}),
      ).timeout(const Duration(seconds: 30));

      print('📥 Response Status: ${response.statusCode}');

      if (response.statusCode == 200) {
        final responseData = json.decode(response.body);
        if (responseData['success'] == true) {
          return {
            'success': true,
            'appointment': responseData['appointment'] ?? {}
          };
        }
      }

      return {
        'success': false,
        'message': 'Invalid joining code'
      };
    } catch (e) {
      print('❌ Error verifying joining code: $e');
      return {
        'success': false,
        'message': 'Error: ${e.toString()}'
      };
    }
  }
}

// Global appointment store
class AppointmentStore {
  static List<Appointment> upcomingAppointments = [];
  static List<Appointment> completedAppointments = [];
  static List<Appointment> cancelledAppointments = [];
}