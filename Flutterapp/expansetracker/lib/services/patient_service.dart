import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

import 'config_service.dart';

class PatientService {
  PatientService();

  String get _baseUrl => ConfigService.instance.baseUrl;

  Future<Map<String, String>> _buildHeaders({String? authToken}) async {
    String? token = authToken;
    if (token == null) {
      try {
        final prefs = await SharedPreferences.getInstance();
        token = prefs.getString('auth_token') ?? prefs.getString('token');
      } catch (_) {}
    }

    final headers = <String, String>{
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    if (token != null && token.isNotEmpty) {
      headers['Authorization'] = 'Bearer $token';
    }
    return headers;
  }

  Future<Map<String, dynamic>> updateSocialHistory({
    required String patientId,
    required Map<String, dynamic> socialHistory,
    String? authToken,
  }) async {
    // Backend supports PUT /patients/:id (no /social-history, no PATCH)
    final uri = Uri.parse('$_baseUrl/patients/$patientId');
    final headers = await _buildHeaders(authToken: authToken);
    final body = json.encode({'socialHistory': socialHistory});

    final res = await http
        .put(uri, headers: headers, body: body)
        .timeout(const Duration(seconds: 30));

    if (res.statusCode == 200) {
      final data = json.decode(res.body);
      if (data is Map && data['success'] == true) {
        return Map<String, dynamic>.from(data['data'] as Map);
      }
    }

    throw Exception('Failed to update social history');
  }

  Future<Map<String, dynamic>> updateAllergies({
    required String patientId,
    required Map<String, dynamic> allergies,
    String? authToken,
  }) async {
    final uri = Uri.parse('$_baseUrl/patients/$patientId');
    final headers = await _buildHeaders(authToken: authToken);
    final body = json.encode({'allergies': allergies});

    final res = await http
        .put(uri, headers: headers, body: body)
        .timeout(const Duration(seconds: 30));

    if (res.statusCode == 200) {
      final data = json.decode(res.body);
      if (data is Map && data['success'] == true) {
        return Map<String, dynamic>.from(data['data'] as Map);
      }
    }

    throw Exception('Failed to update allergies');
  }

  Future<Map<String, dynamic>> updateSpecialDirectives({
    required String patientId,
    required Map<String, dynamic> specialDirectives,
    String? authToken,
  }) async {
    final uri = Uri.parse('$_baseUrl/patients/$patientId');
    final headers = await _buildHeaders(authToken: authToken);
    final body = json.encode({'specialDirectives': specialDirectives});

    final res = await http
        .put(uri, headers: headers, body: body)
        .timeout(const Duration(seconds: 30));

    if (res.statusCode == 200) {
      final data = json.decode(res.body);
      if (data is Map && data['success'] == true) {
        return Map<String, dynamic>.from(data['data'] as Map);
      }
    }

    throw Exception('Failed to update special directives');
  }
}