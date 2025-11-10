import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'config_service.dart';

class InventoryService {
  static String get _baseUrl => ConfigService.instance.baseUrl;

  // Get authentication token
  static Future<String?> _getToken() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      return prefs.getString('auth_token') ?? prefs.getString('token');
    } catch (e) {
      return null;
    }
  }

  // Get headers with authentication
  static Future<Map<String, String>> _getHeaders() async {
    final headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    
    final token = await _getToken();
    if (token != null) {
      headers['Authorization'] = 'Bearer $token';
    }
    
    return headers;
  }

  // Get pharmacy inventory
  static Future<Map<String, dynamic>> getPharmacyInventory(
    String pharmacyId, {
    String? stockStatus,
    String? search,
    int page = 1,
    int limit = 20,
  }) async {
    try {
      final queryParams = <String, String>{
        'page': page.toString(),
        'limit': limit.toString(),
      };
      
      if (stockStatus != null) queryParams['stockStatus'] = stockStatus;
      if (search != null && search.isNotEmpty) queryParams['search'] = search;

      final uri = Uri.parse('$_baseUrl/inventory/pharmacy/$pharmacyId').replace(queryParameters: queryParams);
      final headers = await _getHeaders();
      final response = await http.get(uri, headers: headers);

      final data = json.decode(response.body);
      
      if (response.statusCode == 200) {
        return {
          'success': true,
          'data': data['data'] ?? [],
          'pagination': data['pagination'] ?? {},
        };
      } else {
        print('❌ Inventory API error: ${response.statusCode} - ${data['message'] ?? response.body}');
        return {
          'success': false,
          'message': data['message'] ?? 'Failed to fetch inventory (${response.statusCode})',
          'data': [],
        };
      }
    } catch (e) {
      print('Error getting inventory: $e');
      return {
        'success': false,
        'message': 'Error: $e',
        'data': [],
      };
    }
  }

  // Check product availability
  static Future<Map<String, dynamic>> checkAvailability(
    String pharmacyId,
    String productId, {
    int quantity = 1,
  }) async {
    try {
      final uri = Uri.parse('$_baseUrl/inventory/pharmacy/$pharmacyId/product/$productId/check')
          .replace(queryParameters: {'quantity': quantity.toString()});
      final headers = await _getHeaders();
      final response = await http.get(uri, headers: headers);

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return {
          'success': true,
          'available': data['available'] ?? false,
          'data': data['data'],
        };
      } else {
        return {
          'success': false,
          'available': false,
          'message': 'Failed to check availability',
        };
      }
    } catch (e) {
      print('Error checking availability: $e');
      return {
        'success': false,
        'available': false,
        'message': 'Error: $e',
      };
    }
  }

  // Get inventory stats
  static Future<Map<String, dynamic>> getInventoryStats(String pharmacyId) async {
    try {
      final uri = Uri.parse('$_baseUrl/inventory/pharmacy/$pharmacyId/stats');
      final headers = await _getHeaders();
      final response = await http.get(uri, headers: headers);

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return {
          'success': true,
          'data': data['data'],
        };
      } else {
        return {
          'success': false,
          'message': 'Failed to fetch inventory stats',
        };
      }
    } catch (e) {
      print('Error getting inventory stats: $e');
      return {
        'success': false,
        'message': 'Error: $e',
      };
    }
  }
}

