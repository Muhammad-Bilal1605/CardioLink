import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../services/config_service.dart';

class AuthService {
  // Get base URL from config service
  static String get baseUrl => ConfigService.instance.baseUrl;

  static Future<Map<String, dynamic>> signup({
    required String email,
    required String password,
    required String name,
    required String userType, // 'patient' or 'ambulance-employer'
    // Add other required fields here
  }) async {
    try {
      print('🔄 AuthService signup with URL: $baseUrl');
      
      final response = await http.post(
        Uri.parse('$baseUrl/auth/signup'),
        headers: {
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'email': email,
          'password': password,
          'name': name,
          'role': userType,
          // Add other fields here
        }),
      );

      final responseData = jsonDecode(response.body);
      
      if (response.statusCode == 201) {
        // Save token and user data
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('token', responseData['token']);
        await prefs.setString('user', jsonEncode(responseData['user']));
        
        print('✅ AuthService signup successful');
        return {'success': true, 'data': responseData};
      } else {
        print('❌ AuthService signup failed: ${responseData['message']}');
        return {
          'success': false,
          'message': responseData['message'] ?? 'Signup failed'
        };
      }
    } catch (e) {
      print('❌ AuthService signup exception: $e');
      return {'success': false, 'message': e.toString()};
    }
  }

  static Future<Map<String, dynamic>> login({
    required String email,
    required String password,
  }) async {
    try {
      print('🔄 AuthService login with URL: $baseUrl');
      
      final response = await http.post(
        Uri.parse('$baseUrl/auth/login'),
        headers: {
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'email': email,
          'password': password,
        }),
      );

      final responseData = jsonDecode(response.body);
      
      if (response.statusCode == 200) {
        // Save token and user data
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('token', responseData['token']);
        await prefs.setString('user', jsonEncode(responseData['user']));
        
        print('✅ AuthService login successful');
        return {'success': true, 'data': responseData};
      } else {
        print('❌ AuthService login failed: ${responseData['message']}');
        return {
          'success': false,
          'message': responseData['message'] ?? 'Login failed'
        };
      }
    } catch (e) {
      print('❌ AuthService login exception: $e');
      return {'success': false, 'message': e.toString()};
    }
  }

  static Future<bool> logout() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('token');
      await prefs.remove('user');
      
      print('✅ AuthService logout successful');
      return true;
    } catch (e) {
      print('❌ AuthService logout exception: $e');
      return false;
    }
  }

  static Future<String?> getToken() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      return prefs.getString('token');
    } catch (e) {
      print('❌ AuthService getToken exception: $e');
      return null;
    }
  }

  static Future<Map<String, dynamic>?> getUser() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final userString = prefs.getString('user');
      if (userString != null) {
        return jsonDecode(userString);
      }
      return null;
    } catch (e) {
      print('❌ AuthService getUser exception: $e');
      return null;
    }
  }

  static Future<Map<String, dynamic>> verifyEmail({
    required String email,
    required String code,
  }) async {
    try {
      print('🔄 AuthService verifyEmail with URL: $baseUrl');
      
      final response = await http.post(
        Uri.parse('$baseUrl/auth/patient/verify-email'),
        headers: {
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'email': email,
          'code': code,
        }),
      );

      final responseData = jsonDecode(response.body);
      
      if (response.statusCode == 200) {
        // Save token and user data
        final prefs = await SharedPreferences.getInstance();
        if (responseData['token'] != null) {
          await prefs.setString('token', responseData['token']);
        }
        if (responseData['patient'] != null) {
          await prefs.setString('user', jsonEncode(responseData['patient']));
        }
        
        print('✅ AuthService verifyEmail successful');
        return {'success': true, 'data': responseData};
      } else {
        print('❌ AuthService verifyEmail failed: ${responseData['message']}');
        return {
          'success': false,
          'message': responseData['message'] ?? 'Email verification failed'
        };
      }
    } catch (e) {
      print('❌ AuthService verifyEmail exception: $e');
      return {'success': false, 'message': e.toString()};
    }
  }

  static Future<Map<String, dynamic>> forgotPassword({
    required String email,
  }) async {
    try {
      print('🔄 AuthService forgotPassword with URL: $baseUrl');
      
      final response = await http.post(
        Uri.parse('$baseUrl/auth/patient/forgot-password'),
        headers: {
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'email': email,
        }),
      );

      final responseData = jsonDecode(response.body);
      
      if (response.statusCode == 200) {
        print('✅ AuthService forgotPassword successful');
        return {'success': true, 'message': responseData['message'] ?? 'Password reset email sent'};
      } else {
        print('❌ AuthService forgotPassword failed: ${responseData['message']}');
        return {
          'success': false,
          'message': responseData['message'] ?? 'Failed to send password reset email'
        };
      }
    } catch (e) {
      print('❌ AuthService forgotPassword exception: $e');
      return {'success': false, 'message': e.toString()};
    }
  }

  static Future<Map<String, dynamic>> verifyPasswordResetCode({
    required String email,
    required String code,
  }) async {
    try {
      print('🔄 AuthService verifyPasswordResetCode with URL: $baseUrl');
      
      final response = await http.post(
        Uri.parse('$baseUrl/auth/patient/verify-reset-code'),
        headers: {
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'email': email,
          'code': code,
        }),
      );

      final responseData = jsonDecode(response.body);
      
      if (response.statusCode == 200) {
        print('✅ AuthService verifyPasswordResetCode successful');
        return {'success': true, 'message': responseData['message'] ?? 'Verification code is valid'};
      } else {
        print('❌ AuthService verifyPasswordResetCode failed: ${responseData['message']}');
        return {
          'success': false,
          'message': responseData['message'] ?? 'Invalid verification code'
        };
      }
    } catch (e) {
      print('❌ AuthService verifyPasswordResetCode exception: $e');
      return {'success': false, 'message': e.toString()};
    }
  }

  static Future<Map<String, dynamic>> resetPassword({
    required String email,
    required String code,
    required String password,
  }) async {
    try {
      print('🔄 AuthService resetPassword with URL: $baseUrl');
      
      final response = await http.post(
        Uri.parse('$baseUrl/auth/patient/reset-password'),
        headers: {
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'email': email,
          'code': code,
          'password': password,
        }),
      );

      final responseData = jsonDecode(response.body);
      
      if (response.statusCode == 200) {
        print('✅ AuthService resetPassword successful');
        return {'success': true, 'message': responseData['message'] ?? 'Password reset successful'};
      } else {
        print('❌ AuthService resetPassword failed: ${responseData['message']}');
        return {
          'success': false,
          'message': responseData['message'] ?? 'Password reset failed'
        };
      }
    } catch (e) {
      print('❌ AuthService resetPassword exception: $e');
      return {'success': false, 'message': e.toString()};
    }
  }
}