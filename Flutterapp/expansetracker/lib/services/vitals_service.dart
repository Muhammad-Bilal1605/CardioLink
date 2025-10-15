import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

import 'config_service.dart';

class VitalsService {
  VitalsService();

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

  Future<Map<String, dynamic>> createVitalSign({
    required Map<String, dynamic> vitalSign,
    String? authToken,
  }) async {
    final uri = Uri.parse('$_baseUrl/vital-signs');
    final headers = await _buildHeaders(authToken: authToken);
    final res = await http
        .post(uri, headers: headers, body: json.encode(vitalSign))
        .timeout(const Duration(seconds: 30));

    if (res.statusCode == 201 || res.statusCode == 200) {
      final data = json.decode(res.body);
      if (data is Map && data['success'] == true) {
        return Map<String, dynamic>.from(data['data'] as Map);
      }
    }
    throw Exception('Failed to create vital sign (${res.statusCode})');
  }
}


