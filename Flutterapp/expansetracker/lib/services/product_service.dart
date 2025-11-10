import 'dart:convert';
import 'package:http/http.dart' as http;
import 'config_service.dart';

class ProductService {
  static String get _baseUrl => ConfigService.instance.baseUrl;

  // Get all products
  static Future<Map<String, dynamic>> getProducts({
    String? search,
    String? category,
    bool? requiresPrescription,
    String? manufacturer,
    double? minPrice,
    double? maxPrice,
    int page = 1,
    int limit = 20,
    String sortBy = 'createdAt',
    String sortOrder = 'desc',
  }) async {
    try {
      final queryParams = <String, String>{
        'page': page.toString(),
        'limit': limit.toString(),
        'sortBy': sortBy,
        'sortOrder': sortOrder,
      };
      
      if (search != null && search.isNotEmpty) queryParams['search'] = search;
      if (category != null) queryParams['category'] = category;
      if (requiresPrescription != null) queryParams['requiresPrescription'] = requiresPrescription.toString();
      if (manufacturer != null) queryParams['manufacturer'] = manufacturer;
      if (minPrice != null) queryParams['minPrice'] = minPrice.toString();
      if (maxPrice != null) queryParams['maxPrice'] = maxPrice.toString();

      final uri = Uri.parse('$_baseUrl/products').replace(queryParameters: queryParams);
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
          'message': 'Failed to fetch products',
          'data': [],
        };
      }
    } catch (e) {
      print('Error getting products: $e');
      return {
        'success': false,
        'message': 'Error: $e',
        'data': [],
      };
    }
  }

  // Get product by ID
  static Future<Map<String, dynamic>> getProductById(String productId) async {
    try {
      final uri = Uri.parse('$_baseUrl/products/$productId');
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
          'message': 'Failed to fetch product',
        };
      }
    } catch (e) {
      print('Error getting product: $e');
      return {
        'success': false,
        'message': 'Error: $e',
      };
    }
  }

  // Get featured products
  static Future<Map<String, dynamic>> getFeaturedProducts({int limit = 10}) async {
    try {
      final uri = Uri.parse('$_baseUrl/products/featured').replace(queryParameters: {'limit': limit.toString()});
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
          'message': 'Failed to fetch featured products',
          'data': [],
        };
      }
    } catch (e) {
      print('Error getting featured products: $e');
      return {
        'success': false,
        'message': 'Error: $e',
        'data': [],
      };
    }
  }

  // Get trending products
  static Future<Map<String, dynamic>> getTrendingProducts({int limit = 10}) async {
    try {
      final uri = Uri.parse('$_baseUrl/products/trending').replace(queryParameters: {'limit': limit.toString()});
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
          'message': 'Failed to fetch trending products',
          'data': [],
        };
      }
    } catch (e) {
      print('Error getting trending products: $e');
      return {
        'success': false,
        'message': 'Error: $e',
        'data': [],
      };
    }
  }

  // Search products
  static Future<Map<String, dynamic>> searchProducts(String query) async {
    try {
      final uri = Uri.parse('$_baseUrl/products/search').replace(queryParameters: {'query': query});
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
          'message': 'Failed to search products',
          'data': [],
        };
      }
    } catch (e) {
      print('Error searching products: $e');
      return {
        'success': false,
        'message': 'Error: $e',
        'data': [],
      };
    }
  }
}

