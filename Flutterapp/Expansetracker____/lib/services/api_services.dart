import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter/foundation.dart'; // For kIsWeb


class ApiService {
  // Platform-aware base URL configuration
  static String get baseUrl {
    if (kIsWeb) {
      // For web/PC (Chrome, Edge, etc.)
      return 'http://localhost:5001/api';
    } else {
      // For Android/iOS devices - use your actual IP address
      //return 'http://${dotenv.env['IP']}:5001/api';  // FIXED: Now consistent with your IP
      //return 'http:// 10.113.65.182:5001/api';
      return 'http://192.168.1.2:5001/api';
    }
  }
  
  static String get socketUrl {
    if (kIsWeb) {
      // For web/PC
      return 'http://localhost:5001';
    } else {
      // For Android/iOS devices
      //return 'http://${dotenv.env['IP']}:5001';  // FIXED: Now consistent with your IP
      //return 'http://10.113.65.182:5001';
      return 'http://192.168.1.2:5001';
    }
  }

  // Network connection test method with better error handling
  static Future<bool> testConnection() async {
    try {
      print('🔄 Testing connection to: $baseUrl');
      print('🌐 Platform: ${kIsWeb ? 'Web' : Platform.operatingSystem}');
      
      final response = await http.get(
        Uri.parse('${baseUrl}/patient/test-db'),
        headers: _headers,
      ).timeout(Duration(seconds: 15)); // Reduced timeout for faster feedback
      
      if (response.statusCode == 200) {
        print('✅ Network connection successful!');
        print('📡 Connected to: $baseUrl');
        return true;
      } else {
        print('❌ Server responded with status: ${response.statusCode}');
        print('📝 Response body: ${response.body}');
        return false;
      }
    } on SocketException catch (e) {
      print('❌ Socket connection failed: $e');
      print('🔍 Trying to connect to: $baseUrl');
      print('💡 Make sure:');
      print('   - Your server is running on IP 192.168.1.12:5001');
      print('   - Your phone and PC are on the same WiFi network');
      print('   - Windows Firewall allows port 5001');
      print('   - Your PC\'s IP address is actually 192.168.1.12');
      return false;
    } on HttpException catch (e) {
      print('❌ HTTP connection failed: $e');
      return false;
    } catch (e) {
      print('❌ Network connection failed: $e');
      print('🔍 Trying to connect to: $baseUrl');
      return false;
    }
  }

  // Headers for API requests with better error handling
  static Map<String, String> get _headers => {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  // Headers with authentication token
  static Future<Map<String, String>> get _authHeaders async {
    final token = await getToken();
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  // ========== TOKEN MANAGEMENT ==========

  static Future<void> saveToken(String token) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('auth_token', token);
      print('💾 Token saved successfully');
    } catch (e) {
      print('❌ Error saving token: $e');
    }
  }

  static Future<String?> getToken() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      return prefs.getString('auth_token');
    } catch (e) {
      print('❌ Error getting token: $e');
      return null;
    }
  }

  static Future<void> removeToken() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('auth_token');
      print('🗑️ Token removed successfully');
    } catch (e) {
      print('❌ Error removing token: $e');
    }
  }

  // Public method to clear token
  static Future<void> clearToken() async {
    await removeToken();
  }

  // Public method to save token
  static Future<void> saveAuthToken(String token) async {
    await saveToken(token);
  }

  // Public method to get token
  static Future<String?> getAuthToken() async {
    return await getToken();
  }

  // ========== PATIENT AUTHENTICATION ==========

  // Patient Signup - uses /api/patient/signup endpoint
  static Future<ApiResponse> patientSignup({
    required String email,
    required String password,
    required String name,
    required String phoneNumber,
    required String gender,
    required int age,
    required DateTime dateOfBirth,
    required String? bloodType,
    List<String>? allergies,
    required String emergencyContact,
  }) async {
    try {
      print('📝 Patient signup request to: ${baseUrl}/patient/signup');
      
      final requestBody = {
        'email': email.trim(),
        'password': password,
        'name': name.trim(),
        'phoneNumber': phoneNumber.trim(),
        'gender': gender.toLowerCase().trim(),
        'age': age,
        'dateOfBirth': dateOfBirth.toIso8601String(),
        'bloodType': bloodType?.trim(),
        'allergies': allergies ?? [],
        'emergencyContact': emergencyContact.trim(),
      };
      
      print('📝 Request body: ${jsonEncode(requestBody)}');
      
      final response = await http.post(
        Uri.parse('${baseUrl}/patient/signup'),
        headers: _headers,
        body: jsonEncode(requestBody),
      ).timeout(Duration(seconds: 30));

      print('📝 Signup response status: ${response.statusCode}');
      print('📝 Signup response body: ${response.body}');

      if (response.body.isEmpty) {
        return ApiResponse(
          success: false, 
          message: 'Server returned empty response'
        );
      }

      final data = jsonDecode(response.body);
      
      if (response.statusCode == 201 && data['success'] == true) {
        // Save JWT token if present
        if (data['token'] != null) {
          await saveToken(data['token']);
          print('💾 JWT token saved to local storage');
        }
        
        // Save patient data - check both possible keys
        if (data['patient'] != null) {
          await _saveUserData(data['patient']);
        } else if (data['user'] != null) {
          await _saveUserData(data['user']);
        }
        return ApiResponse(success: true, data: data);
      } else {
        return ApiResponse(
          success: false, 
          message: data['message'] ?? 'Signup failed'
        );
      }
    } on SocketException catch (e) {
      print('❌ Socket error during signup: $e');
      return ApiResponse(
        success: false, 
        message: 'Connection failed. Check your internet connection and server status.'
      );
    } on HttpException catch (e) {
      print('❌ HTTP error during signup: $e');
      return ApiResponse(
        success: false, 
        message: 'HTTP error occurred during signup.'
      );
    } on FormatException catch (e) {
      print('❌ JSON parsing error during signup: $e');
      return ApiResponse(
        success: false, 
        message: 'Invalid response from server.'
      );
    } catch (e) {
      print('❌ Patient signup error: $e');
      return ApiResponse(
        success: false, 
        message: 'Network error: ${e.toString()}'
      );
    }
  }

  // Patient Login - uses /api/patient/login endpoint with enhanced error handling
  static Future<ApiResponse> patientLogin({
    required String email,
    required String password,
  }) async {
    try {
      print('🔐 Patient login request to: ${baseUrl}/patient/login');
      
      final requestBody = {
        'email': email.trim(),
        'password': password,
      };
      
      print('🔐 Request body: ${jsonEncode(requestBody)}');
      
      final response = await http.post(
        Uri.parse('${baseUrl}/patient/login'),
        headers: _headers,
        body: jsonEncode(requestBody),
      ).timeout(Duration(seconds: 30));

      print('🔐 Login response status: ${response.statusCode}');
      print('🔐 Login response body: ${response.body}');

      if (response.body.isEmpty) {
        return ApiResponse(
          success: false, 
          message: 'Server returned empty response'
        );
      }

      final data = jsonDecode(response.body);
      
      if (response.statusCode == 200 && data['success'] == true) {
        // Save JWT token if present
        if (data['token'] != null) {
          await saveToken(data['token']);
          print('💾 JWT token saved to local storage');
        }
        
        // Save patient data - check both possible keys
        if (data['patient'] != null) {
          await _saveUserData(data['patient']);
        } else if (data['user'] != null) {
          await _saveUserData(data['user']);
        }
        return ApiResponse(success: true, data: data);
      } else {
        return ApiResponse(
          success: false, 
          message: data['message'] ?? 'Login failed'
        );
      }
    } on SocketException catch (e) {
      print('❌ Socket error during login: $e');
      return ApiResponse(
        success: false, 
        message: 'Connection failed. Please check your internet connection and ensure the server is running.'
      );
    } on HttpException catch (e) {
      print('❌ HTTP error during login: $e');
      return ApiResponse(
        success: false, 
        message: 'HTTP error occurred during login.'
      );
    } on FormatException catch (e) {
      print('❌ JSON parsing error during login: $e');
      return ApiResponse(
        success: false, 
        message: 'Invalid response from server.'
      );
    } catch (e) {
      print('❌ Patient login error: $e');
      return ApiResponse(
        success: false, 
        message: 'Login failed: ${e.toString()}'
      );
    }
  }

  // Patient Logout - uses /api/patient/logout endpoint
  static Future<ApiResponse> patientLogout() async {
    try {
      print('👋 Patient logout request to: ${baseUrl}/patient/logout');
      
      final response = await http.post(
        Uri.parse('${baseUrl}/patient/logout'),
        headers: await _authHeaders,
      ).timeout(Duration(seconds: 15));

      print('👋 Logout response status: ${response.statusCode}');

      // Always clear local data even if server request fails
      await removeToken();
      await _clearUserData();

      return ApiResponse(success: true, data: {'message': 'Logged out successfully'});
    } catch (e) {
      print('❌ Patient logout error: $e');
      // Still clear local data even if logout request fails
      await removeToken();
      await _clearUserData();
      return ApiResponse(
        success: true, // Return true since local logout succeeded
        message: 'Logged out locally (server may be unreachable)'
      );
    }
  }

  // Test database connection for patients
  static Future<ApiResponse> testPatientDatabase() async {
    try {
      print('🧪 Testing patient database connection: ${baseUrl}/patient/test-db');
      
      final response = await http.get(
        Uri.parse('${baseUrl}/patient/test-db'),
        headers: _headers,
      ).timeout(Duration(seconds: 15));

      print('🧪 Test response status: ${response.statusCode}');
      print('🧪 Test response body: ${response.body}');

      if (response.body.isEmpty) {
        return ApiResponse(
          success: false, 
          message: 'Server returned empty response'
        );
      }

      final data = jsonDecode(response.body);
      return ApiResponse(success: response.statusCode == 200, data: data);
    } on SocketException catch (e) {
      print('❌ Socket error during database test: $e');
      return ApiResponse(
        success: false, 
        message: 'Connection failed. Server may be offline.'
      );
    } catch (e) {
      print('❌ Database test error: $e');
      return ApiResponse(
        success: false, 
        message: 'Test failed: ${e.toString()}'
      );
    }
  }

  // ========== AMBULANCE EMPLOYER AUTHENTICATION ==========

  // Ambulance Employer Signup - uses /api/ambulance-employer/signup endpoint
  static Future<ApiResponse> ambulanceEmployerSignup({
    required String email,
    required String password,
    required String name,
    required String phoneNumber,
    required String gender,
    required int age,
    required DateTime dateOfBirth,
    String? companyName,
    String? licenseNumber,
    String? serviceArea,
    required String emergencyContact,
  }) async {
    try {
      print('🚑 Ambulance employer signup request to: ${baseUrl}/ambulance-employer/signup');
      
      final requestBody = {
        'email': email.trim(),
        'password': password,
        'name': name.trim(),
        'phoneNumber': phoneNumber.trim(),
        'gender': gender.toLowerCase().trim(),
        'age': age,
        'dateOfBirth': dateOfBirth.toIso8601String(),
        'companyName': companyName?.trim(),
        'licenseNumber': licenseNumber?.trim(),
        'serviceArea': serviceArea?.trim(),
        'emergencyContact': emergencyContact.trim(),
      };
      
      final response = await http.post(
        Uri.parse('${baseUrl}/ambulance-employer/signup'),
        headers: _headers,
        body: jsonEncode(requestBody),
      ).timeout(Duration(seconds: 30));

      print('🚑 Ambulance signup response status: ${response.statusCode}');
      print('🚑 Ambulance signup response body: ${response.body}');

      if (response.body.isEmpty) {
        return ApiResponse(
          success: false, 
          message: 'Server returned empty response'
        );
      }

      final data = jsonDecode(response.body);
      
      if (response.statusCode == 201 && data['success'] == true) {
        // Save JWT token if present
        if (data['token'] != null) {
          await saveToken(data['token']);
          print('💾 JWT token saved to local storage after signup');
        }
        
        // Save ambulance employer data
        if (data['ambulanceEmployer'] != null) {
          await _saveUserData(data['ambulanceEmployer']);
        } else if (data['user'] != null) {
          await _saveUserData(data['user']);
        }
        return ApiResponse(success: true, data: data);
      } else {
        return ApiResponse(
          success: false, 
          message: data['message'] ?? 'Ambulance employer signup failed'
        );
      }
    } on SocketException catch (e) {
      print('❌ Socket error during ambulance signup: $e');
      return ApiResponse(
        success: false, 
        message: 'Connection failed. Check your internet connection.'
      );
    } catch (e) {
      print('❌ Ambulance employer signup error: $e');
      return ApiResponse(
        success: false, 
        message: 'Network error: ${e.toString()}'
      );
    }
  }

  // Ambulance Employer Login - uses /api/ambulance-employer/login endpoint
  static Future<ApiResponse> ambulanceEmployerLogin({
    required String email,
    required String password,
  }) async {
    try {
      print('🔐 Ambulance employer login request to: ${baseUrl}/ambulance-employer/login');
      
      final requestBody = {
        'email': email.trim(),
        'password': password,
      };
      
      final response = await http.post(
        Uri.parse('${baseUrl}/ambulance-employer/login'),
        headers: _headers,
        body: jsonEncode(requestBody),
      ).timeout(Duration(seconds: 30));

      print('🔐 Ambulance login response status: ${response.statusCode}');
      print('🔐 Ambulance login response body: ${response.body}');

      if (response.body.isEmpty) {
        return ApiResponse(
          success: false, 
          message: 'Server returned empty response'
        );
      }

      final data = jsonDecode(response.body);
      
      if (response.statusCode == 200 && data['success'] == true) {
        // Save JWT token if present
        if (data['token'] != null) {
          await saveToken(data['token']);
          print('💾 JWT token saved to local storage');
        }
        
        // Save ambulance employer data
        if (data['ambulanceEmployer'] != null) {
          await _saveUserData(data['ambulanceEmployer']);
        } else if (data['user'] != null) {
          await _saveUserData(data['user']);
        }
        return ApiResponse(success: true, data: data);
      } else {
        return ApiResponse(
          success: false, 
          message: data['message'] ?? 'Login failed'
        );
      }
    } on SocketException catch (e) {
      print('❌ Socket error during ambulance login: $e');
      return ApiResponse(
        success: false, 
        message: 'Connection failed. Check your internet connection.'
      );
    } catch (e) {
      print('❌ Ambulance employer login error: $e');
      return ApiResponse(
        success: false, 
        message: 'Network error: ${e.toString()}'
      );
    }
  }

  // Ambulance Employer Logout - uses /api/ambulance-employer/logout endpoint
  static Future<ApiResponse> ambulanceEmployerLogout() async {
    try {
      print('👋 Ambulance employer logout request to: ${baseUrl}/ambulance-employer/logout');
      
      final response = await http.post(
        Uri.parse('${baseUrl}/ambulance-employer/logout'),
        headers: await _authHeaders,
      ).timeout(Duration(seconds: 15));

      print('👋 Ambulance logout response status: ${response.statusCode}');

      // Always clear local data even if server request fails
      await removeToken();
      await _clearUserData();

      return ApiResponse(success: true, data: {'message': 'Logged out successfully'});
    } catch (e) {
      print('❌ Ambulance employer logout error: $e');
      // Still clear local data even if logout request fails
      await removeToken();
      await _clearUserData();
      return ApiResponse(
        success: true,
        message: 'Logged out locally (server may be unreachable)'
      );
    }
  }

  // Test database connection for ambulance employers
  static Future<ApiResponse> testAmbulanceEmployerDatabase() async {
    try {
      print('🧪 Testing ambulance employer database connection: ${baseUrl}/ambulance-employer/test-db');
      
      final response = await http.get(
        Uri.parse('${baseUrl}/ambulance-employer/test-db'),
        headers: _headers,
      ).timeout(Duration(seconds: 15));

      print('🧪 Ambulance test response status: ${response.statusCode}');
      print('🧪 Ambulance test response body: ${response.body}');

      if (response.body.isEmpty) {
        return ApiResponse(
          success: false, 
          message: 'Server returned empty response'
        );
      }

      final data = jsonDecode(response.body);
      return ApiResponse(success: response.statusCode == 200, data: data);
    } on SocketException catch (e) {
      print('❌ Socket error during ambulance database test: $e');
      return ApiResponse(
        success: false, 
        message: 'Connection failed. Server may be offline.'
      );
    } catch (e) {
      print('❌ Ambulance database test error: $e');
      return ApiResponse(
        success: false, 
        message: 'Test failed: ${e.toString()}'
      );
    }
  }

  // ========== DOCTOR SERVICES ==========

  // Get all doctors
  static Future<ApiResponse> getAllDoctors() async {
    try {
      print('🏥 Fetching all doctors from: ${baseUrl}/doctors');
      
      final response = await http.get(
        Uri.parse('${baseUrl}/doctors'),
        headers: await _authHeaders,
      ).timeout(Duration(seconds: 30));

      print('🏥 Doctors response status: ${response.statusCode}');
      print('🏥 Doctors response body: ${response.body}');

      if (response.body.isEmpty) {
        return ApiResponse(
          success: false, 
          message: 'Server returned empty response'
        );
      }

      final data = jsonDecode(response.body);
      
      if (response.statusCode == 200 && data['success'] == true) {
        return ApiResponse(
          success: true,
          message: data['message'] ?? 'Doctors retrieved successfully',
          data: data['doctors'],
        );
      } else {
        return ApiResponse(
          success: false,
          message: data['message'] ?? 'Failed to fetch doctors',
          data: null,
        );
      }
    } on SocketException catch (e) {
      print('❌ Socket error fetching doctors: $e');
      return ApiResponse(
        success: false,
        message: 'Connection failed. Check your internet connection.',
        data: null,
      );
    } catch (e) {
      print('❌ Error fetching doctors: $e');
      return ApiResponse(
        success: false,
        message: 'Network error: Unable to fetch doctors',
        data: null,
      );
    }
  }

  // Get doctor by ID
  static Future<ApiResponse> getDoctorById(String doctorId) async {
    try {
      print('🏥 Fetching doctor by ID: $doctorId');
      
      final response = await http.get(
        Uri.parse('${baseUrl}/doctors/$doctorId'),
        headers: await _authHeaders,
      ).timeout(Duration(seconds: 30));

      if (response.body.isEmpty) {
        return ApiResponse(
          success: false, 
          message: 'Server returned empty response'
        );
      }

      final data = jsonDecode(response.body);
      
      if (response.statusCode == 200 && data['success'] == true) {
        return ApiResponse(
          success: true,
          message: data['message'] ?? 'Doctor retrieved successfully',
          data: data['doctor'],
        );
      } else {
        return ApiResponse(
          success: false,
          message: data['message'] ?? 'Doctor not found',
          data: null,
        );
      }
    } on SocketException catch (e) {
      print('❌ Socket error fetching doctor: $e');
      return ApiResponse(
        success: false,
        message: 'Connection failed. Check your internet connection.',
        data: null,
      );
    } catch (e) {
      print('❌ Error fetching doctor: $e');
      return ApiResponse(
        success: false,
        message: 'Network error: Unable to fetch doctor',
        data: null,
      );
    }
  }

  // Get doctors by specialty
  static Future<ApiResponse> getDoctorsBySpecialty(String specialty) async {
    try {
      print('🏥 Fetching doctors by specialty: $specialty');
      
      final response = await http.get(
        Uri.parse('${baseUrl}/doctors/specialty/$specialty'),
        headers: await _authHeaders,
      ).timeout(Duration(seconds: 30));

      if (response.body.isEmpty) {
        return ApiResponse(
          success: false, 
          message: 'Server returned empty response'
        );
      }

      final data = jsonDecode(response.body);
      
      if (response.statusCode == 200 && data['success'] == true) {
        return ApiResponse(
          success: true,
          message: data['message'] ?? 'Doctors retrieved successfully',
          data: data['doctors'],
        );
      } else {
        return ApiResponse(
          success: false,
          message: data['message'] ?? 'No doctors found for this specialty',
          data: null,
        );
      }
    } on SocketException catch (e) {
      print('❌ Socket error fetching doctors by specialty: $e');
      return ApiResponse(
        success: false,
        message: 'Connection failed. Check your internet connection.',
        data: null,
      );
    } catch (e) {
      print('❌ Error fetching doctors by specialty: $e');
      return ApiResponse(
        success: false,
        message: 'Network error: Unable to fetch doctors',
        data: null,
      );
    }
  }

  // ========== APPOINTMENT SERVICES ==========

  // Create appointment
  static Future<ApiResponse> createAppointment({
    required String doctorId,
    required DateTime appointmentDate,
    required String appointmentTime,
    String? reason,
    String paymentMethod = 'Credit/Debit Card',
    String appointmentType = 'Consultation',
  }) async {
    try {
      print('📅 Creating appointment with doctor: $doctorId');
      
      final requestBody = {
        'doctorId': doctorId,
        'appointmentDate': appointmentDate.toIso8601String(),
        'appointmentTime': appointmentTime,
        'reason': reason ?? 'General Consultation',
        'paymentMethod': paymentMethod,
        'appointmentType': appointmentType,
      };
      
      final response = await http.post(
        Uri.parse('${baseUrl}/appointments'),
        headers: await _authHeaders,
        body: jsonEncode(requestBody),
      ).timeout(Duration(seconds: 30));

      print('📅 Appointment response status: ${response.statusCode}');
      print('📅 Appointment response body: ${response.body}');

      if (response.body.isEmpty) {
        return ApiResponse(
          success: false, 
          message: 'Server returned empty response'
        );
      }

      final data = jsonDecode(response.body);
      
      if (response.statusCode == 201 && data['success'] == true) {
        return ApiResponse(
          success: true,
          message: data['message'] ?? 'Appointment created successfully',
          data: data['appointment'],
        );
      } else {
        return ApiResponse(
          success: false,
          message: data['message'] ?? 'Failed to create appointment',
          data: null,
        );
      }
    } on SocketException catch (e) {
      print('❌ Socket error creating appointment: $e');
      return ApiResponse(
        success: false,
        message: 'Connection failed. Check your internet connection.',
        data: null,
      );
    } catch (e) {
      print('❌ Error creating appointment: $e');
      return ApiResponse(
        success: false,
        message: 'Network error: Unable to create appointment',
        data: null,
      );
    }
  }

  // Get patient appointments
  static Future<ApiResponse> getPatientAppointments({String? status}) async {
    try {
      String url = '${baseUrl}/appointments/patient';
      if (status != null) {
        url += '?status=$status';
      }
      
      print('📅 Fetching patient appointments from: $url');
      
      final response = await http.get(
        Uri.parse(url),
        headers: await _authHeaders,
      ).timeout(Duration(seconds: 30));

      if (response.body.isEmpty) {
        return ApiResponse(
          success: false, 
          message: 'Server returned empty response'
        );
      }

      final data = jsonDecode(response.body);
      
      if (response.statusCode == 200 && data['success'] == true) {
        return ApiResponse(
          success: true,
          message: data['message'] ?? 'Appointments retrieved successfully',
          data: data['appointments'],
        );
      } else {
        return ApiResponse(
          success: false,
          message: data['message'] ?? 'Failed to fetch appointments',
          data: null,
        );
      }
    } on SocketException catch (e) {
      print('❌ Socket error fetching appointments: $e');
      return ApiResponse(
        success: false,
        message: 'Connection failed. Check your internet connection.',
        data: null,
      );
    } catch (e) {
      print('❌ Error fetching appointments: $e');
      return ApiResponse(
        success: false,
        message: 'Network error: Unable to fetch appointments',
        data: null,
      );
    }
  }

  // Cancel appointment
  static Future<ApiResponse> cancelAppointment({
    required String appointmentId,
    String? cancellationReason,
  }) async {
    try {
      print('❌ Cancelling appointment: $appointmentId');
      
      final response = await http.patch(
        Uri.parse('${baseUrl}/appointments/$appointmentId/cancel'),
        headers: await _authHeaders,
        body: jsonEncode({
          'cancellationReason': cancellationReason ?? 'No reason provided',
        }),
      ).timeout(Duration(seconds: 30));

      if (response.body.isEmpty) {
        return ApiResponse(
          success: false, 
          message: 'Server returned empty response'
        );
      }

      final data = jsonDecode(response.body);
      
      if (response.statusCode == 200 && data['success'] == true) {
        return ApiResponse(
          success: true,
          message: data['message'] ?? 'Appointment cancelled successfully',
          data: data['appointment'],
        );
      } else {
        return ApiResponse(
          success: false,
          message: data['message'] ?? 'Failed to cancel appointment',
          data: null,
        );
      }
    } on SocketException catch (e) {
      print('❌ Socket error cancelling appointment: $e');
      return ApiResponse(
        success: false,
        message: 'Connection failed. Check your internet connection.',
        data: null,
      );
    } catch (e) {
      print('❌ Error cancelling appointment: $e');
      return ApiResponse(
        success: false,
        message: 'Network error: Unable to cancel appointment',
        data: null,
      );
    }
  }

  // Get chatable appointments (for chat screen)
  static Future<ApiResponse> getChatableAppointments() async {
    try {
      print('💬 Fetching chatable appointments');
      
      final response = await http.get(
        Uri.parse('${baseUrl}/appointments/chat'),
        headers: await _authHeaders,
      ).timeout(Duration(seconds: 30));

      if (response.body.isEmpty) {
        return ApiResponse(
          success: false, 
          message: 'Server returned empty response'
        );
      }

      final data = jsonDecode(response.body);
      
      if (response.statusCode == 200 && data['success'] == true) {
        return ApiResponse(
          success: true,
          message: data['message'] ?? 'Chatable appointments retrieved successfully',
          data: data['appointments'],
        );
      } else {
        return ApiResponse(
          success: false,
          message: data['message'] ?? 'Failed to fetch chatable appointments',
          data: null,
        );
      }
    } on SocketException catch (e) {
      print('❌ Socket error fetching chatable appointments: $e');
      return ApiResponse(
        success: false,
        message: 'Connection failed. Check your internet connection.',
        data: null,
      );
    } catch (e) {
      print('❌ Error fetching chatable appointments: $e');
      return ApiResponse(
        success: false,
        message: 'Network error: Unable to fetch chatable appointments',
        data: null,
      );
    }
  }

  // ========== USER DATA MANAGEMENT ==========

  static Future<void> _saveUserData(Map<String, dynamic> userData) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('user_data', jsonEncode(userData));
      print('💾 User data saved to local storage');
    } catch (e) {
      print('❌ Error saving user data: $e');
    }
  }

  static Future<Map<String, dynamic>?> getUserData() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final userDataString = prefs.getString('user_data');
      if (userDataString != null) {
        return jsonDecode(userDataString);
      }
      return null;
    } catch (e) {
      print('❌ Error getting user data: $e');
      return null;
    }
  }

  static Future<void> _clearUserData() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('user_data');
      print('🗑️ User data cleared from local storage');
    } catch (e) {
      print('❌ Error clearing user data: $e');
    }
  }

  // Public method to clear user data
  static Future<void> clearUserData() async {
    await _clearUserData();
  }

  // Debug method to print current configuration
  static void printDebugInfo() {
    print('🔧 API Service Debug Info:');
    print('   Platform: ${kIsWeb ? 'Web' : (Platform.isAndroid ? 'Android' : Platform.operatingSystem)}');
    print('   Base URL: $baseUrl');
    print('   Socket URL: $socketUrl');
    print('   Current IP: 192.168.1.12');
  }

  // Method to validate network connectivity before making requests
  static Future<bool> isNetworkAvailable() async {
    try {
      final result = await InternetAddress.lookup('google.com');
      return result.isNotEmpty && result[0].rawAddress.isNotEmpty;
    } on SocketException catch (_) {
      return false;
    }
  }

  // Enhanced method to check if server is reachable
  static Future<bool> isServerReachable() async {
    try {
      final response = await http.get(
        Uri.parse('${baseUrl}/patient/test-db'),
        headers: _headers,
      ).timeout(Duration(seconds: 5));
      
      return response.statusCode == 200;
    } catch (e) {
      print('❌ Server not reachable: $e');
      return false;
    }
  }
}

// ========== API RESPONSE CLASS ==========

class ApiResponse {
  final bool success;
  final String? message;
  final dynamic data; // Changed from Map<String, dynamic>? to dynamic

  ApiResponse({
    required this.success,
    this.message,
    this.data,
  });

  @override
  String toString() {
    return 'ApiResponse{success: $success, message: $message, data: $data}';
  }

  // Helper method to check if response contains valid data
  bool get hasData => data != null;

  // Helper method to get data as Map if it's a Map
  Map<String, dynamic>? get dataAsMap {
    if (data is Map<String, dynamic>) {
      return data as Map<String, dynamic>;
    }
    return null;
  }

  // Helper method to get data as List if it's a List
  List<dynamic>? get dataAsList {
    if (data is List<dynamic>) {
      return data as List<dynamic>;
    }
    return null;
  }
}