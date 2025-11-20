import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

import 'config_service.dart';

class AIPredictionService {
  AIPredictionService();

  String get _baseUrl => ConfigService.instance.baseUrl;

  Future<Map<String, String>> _buildHeaders({String? authToken}) async {
    String? token = authToken;

    if (token == null || token.isEmpty) {
      try {
        final prefs = await SharedPreferences.getInstance();
        token = prefs.getString('auth_token') ?? prefs.getString('token');
      } catch (_) {
        token = null;
      }
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

  Future<bool> checkUserHealthData({String? authToken}) async {
    final uri = Uri.parse('$_baseUrl/ai-prediction/check-data');
    final headers = await _buildHeaders(authToken: authToken);

    try {
      final response = await http
          .get(uri, headers: headers)
          .timeout(const Duration(seconds: 30));

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data is Map && data['success'] == true) {
          return data['hasData'] ?? false;
        }
      }
      return false;
    } catch (e) {
      print('Error checking health data: $e');
      return false;
    }
  }

  Future<Map<String, dynamic>> predictHeartDisease({String? authToken}) async {
    final uri = Uri.parse('$_baseUrl/ai-prediction/predict');
    final headers = await _buildHeaders(authToken: authToken);

    try {
      final response = await http
          .post(uri, headers: headers)
          .timeout(const Duration(seconds: 60));

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = json.decode(response.body);
        if (data is Map && data['success'] == true) {
          return Map<String, dynamic>.from(data['data'] ?? <String, dynamic>{});
        }
        throw Exception(data['message'] ?? 'Failed to get prediction');
      }

      throw Exception(
          'Failed to generate prediction (${response.statusCode}): ${response.body}');
    } catch (e) {
      print('Error predicting heart disease: $e');
      rethrow;
    }
  }
}
