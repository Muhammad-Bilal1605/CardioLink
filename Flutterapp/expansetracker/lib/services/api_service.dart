import 'package:http/http.dart' as http;
import 'dart:convert';
import '../services/config_service.dart';

class ApiService {
  String? _authToken;

  // Get base URL from config service
  String get baseUrl => ConfigService.instance.baseUrl;

  void setAuthToken(String token) {
    _authToken = token;
  }

  Map<String, String> get _headers {
    final headers = {
      'Content-Type': 'application/json',
    };
    
    if (_authToken != null) {
      headers['Authorization'] = 'Bearer $_authToken';
    }
    
    return headers;
  }

  Future<http.Response> get(String endpoint) async {
    final url = Uri.parse('$baseUrl$endpoint');
    print('🌐 API GET: $url');
    return await http.get(url, headers: _headers);
  }

  Future<http.Response> post(String endpoint, Map<String, dynamic> data) async {
    final url = Uri.parse('$baseUrl$endpoint');
    print('🌐 API POST: $url');
    return await http.post(
      url,
      headers: _headers,
      body: json.encode(data),
    );
  }

  Future<http.Response> put(String endpoint, Map<String, dynamic> data) async {
    final url = Uri.parse('$baseUrl$endpoint');
    print('🌐 API PUT: $url');
    return await http.put(
      url,
      headers: _headers,
      body: json.encode(data),
    );
  }

  Future<http.Response> delete(String endpoint) async {
    final url = Uri.parse('$baseUrl$endpoint');
    print('🌐 API DELETE: $url');
    return await http.delete(url, headers: _headers);
  }
}