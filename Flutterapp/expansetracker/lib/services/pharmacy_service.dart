import 'dart:convert';
import 'package:http/http.dart' as http;
import 'config_service.dart';

class PharmacyService {
  static String get _baseUrl => ConfigService.instance.baseUrl;

  // Get all pharmacies
  static Future<Map<String, dynamic>> getPharmacies({
    String? status,
    String? city,
    bool? isActive,
    String? search,
    int page = 1,
    int limit = 12,
  }) async {
    try {
      final queryParams = <String, String>{
        'page': page.toString(),
        'limit': limit.toString(),
      };
      
      if (status != null) queryParams['status'] = status;
      if (city != null) queryParams['city'] = city;
      if (isActive != null) queryParams['isActive'] = isActive.toString();
      if (search != null && search.isNotEmpty) queryParams['search'] = search;

      final uri = Uri.parse('$_baseUrl/pharmacies').replace(queryParameters: queryParams);
      final response = await http.get(uri, headers: {'Content-Type': 'application/json'});

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return {
          'success': true,
          'data': data['data'] ?? [],
          'pagination': data['pagination'] ?? {},
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

  // Get pharmacy by ID
  static Future<Map<String, dynamic>> getPharmacyById(String pharmacyId) async {
    try {
      final uri = Uri.parse('$_baseUrl/pharmacies/$pharmacyId');
      final response = await http.get(uri, headers: {'Content-Type': 'application/json'});

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return {
          'success': true,
          'data': data['data'],
        };
      } else {
        return {
          'success': false,
          'message': 'Failed to fetch pharmacy',
        };
      }
    } catch (e) {
      print('Error getting pharmacy: $e');
      return {
        'success': false,
        'message': 'Error: $e',
      };
    }
  }

  // Find nearby pharmacies
  static Future<Map<String, dynamic>> findNearbyPharmacies({
    required double longitude,
    required double latitude,
    int maxDistance = 5000,
  }) async {
    try {
      final queryParams = {
        'longitude': longitude.toString(),
        'latitude': latitude.toString(),
        'maxDistance': maxDistance.toString(),
      };

      final uri = Uri.parse('$_baseUrl/pharmacies/nearby').replace(queryParameters: queryParams);
      final response = await http.get(uri, headers: {'Content-Type': 'application/json'});

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return {
          'success': true,
          'data': data['data'] ?? [],
        };
      } else {
        return {
          'success': false,
          'message': 'Failed to find nearby pharmacies',
          'data': [],
        };
      }
    } catch (e) {
      print('Error finding nearby pharmacies: $e');
      return {
        'success': false,
        'message': 'Error: $e',
        'data': [],
      };
    }
  }

  // Search pharmacies by city
  static Future<Map<String, dynamic>> searchPharmaciesByCity(String city) async {
    try {
      final uri = Uri.parse('$_baseUrl/pharmacies/search/city/$city');
      final response = await http.get(uri, headers: {'Content-Type': 'application/json'});

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return {
          'success': true,
          'data': data['data'] ?? [],
        };
      } else {
        return {
          'success': false,
          'message': 'Failed to search pharmacies',
          'data': [],
        };
      }
    } catch (e) {
      print('Error searching pharmacies: $e');
      return {
        'success': false,
        'message': 'Error: $e',
        'data': [],
      };
    }
  }
}

