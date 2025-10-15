import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

import '../services/config_service.dart';

class ProceduresService {
  ProceduresService();

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

  Future<List<Map<String, dynamic>>> fetchPatientProcedures({
    required String patientId,
    String? authToken,
  }) async {
    final uri = Uri.parse('$_baseUrl/procedures/patient/$patientId');
    final headers = await _buildHeaders(authToken: authToken);
    final res = await http
        .get(uri, headers: headers)
        .timeout(const Duration(seconds: 30));

    if (res.statusCode == 200) {
      final data = json.decode(res.body);
      if (data is Map && data['success'] == true) {
        final list = (data['data'] as List?) ?? <dynamic>[];
        return list.map<Map<String, dynamic>>((e) => Map<String, dynamic>.from(e)).toList();
      }
      return <Map<String, dynamic>>[];
    }

    throw Exception('Failed to load procedures (${res.statusCode})');
  }

  Future<Map<String, dynamic>> fetchProcedureById({
    required String procedureId,
    String? authToken,
  }) async {
    final uri = Uri.parse('$_baseUrl/procedures/$procedureId');
    final headers = await _buildHeaders(authToken: authToken);
    final res = await http
        .get(uri, headers: headers)
        .timeout(const Duration(seconds: 30));

    if (res.statusCode == 200) {
      final data = json.decode(res.body);
      if (data is Map && data['success'] == true) {
        return Map<String, dynamic>.from(data['data'] as Map);
      }
    }

    throw Exception('Failed to load procedure (${res.statusCode})');
  }
}


