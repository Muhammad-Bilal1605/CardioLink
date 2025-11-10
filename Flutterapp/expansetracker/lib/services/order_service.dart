import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'config_service.dart';

class OrderService {
  static String get _baseUrl => ConfigService.instance.baseUrl;

  static Future<String?> _getToken() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      return prefs.getString('auth_token') ?? prefs.getString('token');
    } catch (e) {
      return null;
    }
  }

  static Future<Map<String, dynamic>> getMyOrders({
    String? status,
    int page = 1,
    int limit = 20,
  }) async {
    try {
      final query = <String, String>{
        'page': page.toString(),
        'limit': limit.toString(),
      };
      if (status != null && status.isNotEmpty) query['status'] = status;

      final uri = Uri.parse('$_baseUrl/orders/user').replace(queryParameters: query);
      final resp = await http.get(uri, headers: await _headers());
      final data = jsonDecode(resp.body);
      if (resp.statusCode == 200 && data['success'] == true) {
        return {'success': true, 'data': data['data'], 'pagination': data['pagination']};
      }
      return {'success': false, 'message': data['message'] ?? 'Failed to load orders'};
    } catch (e) {
      return {'success': false, 'message': 'Unable to load orders'};
    }
  }

  static Future<Map<String, dynamic>> reorderToCart(String orderId) async {
    try {
      final resp = await http.post(
        Uri.parse('$_baseUrl/orders/$orderId/reorder'),
        headers: await _headers(),
      );
      final data = jsonDecode(resp.body);
      if (resp.statusCode == 200 && data['success'] == true) {
        return {'success': true, 'data': data['data']};
      }
      return {'success': false, 'message': data['message'] ?? 'Failed to reorder'};
    } catch (e) {
      return {'success': false, 'message': 'Unable to reorder'};
    }
  }

  static Future<Map<String, String>> _headers() async {
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

  static Future<Map<String, dynamic>> createOrderFromCart({
    required String cartId,
    required String pharmacyId,
    required Map<String, dynamic> deliveryAddress,
    String deliveryType = 'Standard',
    String paymentMethod = 'Cash on Delivery',
    String? specialInstructions,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/orders/create'),
        headers: await _headers(),
        body: jsonEncode({
          'cartId': cartId,
          'deliveryAddress': deliveryAddress,
          'deliveryType': deliveryType,
          'paymentMethod': paymentMethod,
          'specialInstructions': specialInstructions,
        }),
      );

      final decoded = jsonDecode(response.body);

      if (response.statusCode == 201 && decoded['success'] == true) {
        return {
          'success': true,
          'message': decoded['message'] ?? 'Order created successfully',
          'data': decoded['data'],
        };
      }

      return {
        'success': false,
        'message': decoded['message'] ?? 'Failed to place order',
      };
    } catch (e) {
      print('Error creating order: $e');
      return {
        'success': false,
        'message': 'Unable to place order. Please try again.',
      };
    }
  }
}

