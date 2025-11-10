import 'dart:convert';
import 'package:http/http.dart' as http;
import 'config_service.dart';

class ProductCategoryService {
  static String get _baseUrl => ConfigService.instance.baseUrl;

  // Get all categories
  static Future<Map<String, dynamic>> getCategories({
    String? parentCategory,
    bool? isActive,
    bool? isFeatured,
    int page = 1,
    int limit = 50,
  }) async {
    try {
      final queryParams = <String, String>{
        'page': page.toString(),
        'limit': limit.toString(),
      };
      
      if (parentCategory != null) queryParams['parentCategory'] = parentCategory;
      if (isActive != null) queryParams['isActive'] = isActive.toString();
      if (isFeatured != null) queryParams['isFeatured'] = isFeatured.toString();

      final uri = Uri.parse('$_baseUrl/product-categories').replace(queryParameters: queryParams);
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
          'message': 'Failed to fetch categories',
          'data': [],
        };
      }
    } catch (e) {
      print('Error getting categories: $e');
      return {
        'success': false,
        'message': 'Error: $e',
        'data': [],
      };
    }
  }

  // Get category by ID
  static Future<Map<String, dynamic>> getCategoryById(String categoryId) async {
    try {
      final uri = Uri.parse('$_baseUrl/product-categories/$categoryId');
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
          'message': 'Failed to fetch category',
        };
      }
    } catch (e) {
      print('Error getting category: $e');
      return {
        'success': false,
        'message': 'Error: $e',
      };
    }
  }

  // Get category tree
  static Future<Map<String, dynamic>> getCategoryTree() async {
    try {
      final uri = Uri.parse('$_baseUrl/product-categories/tree');
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
          'message': 'Failed to fetch category tree',
          'data': [],
        };
      }
    } catch (e) {
      print('Error getting category tree: $e');
      return {
        'success': false,
        'message': 'Error: $e',
        'data': [],
      };
    }
  }

  // Get featured categories
  static Future<Map<String, dynamic>> getFeaturedCategories() async {
    try {
      final uri = Uri.parse('$_baseUrl/product-categories/featured');
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
          'message': 'Failed to fetch featured categories',
          'data': [],
        };
      }
    } catch (e) {
      print('Error getting featured categories: $e');
      return {
        'success': false,
        'message': 'Error: $e',
        'data': [],
      };
    }
  }
}

