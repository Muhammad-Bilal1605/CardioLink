import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'config_service.dart';

class CartService {
  static String get _baseUrl => ConfigService.instance.baseUrl;

  static Future<String?> _getToken() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      return prefs.getString('auth_token') ?? prefs.getString('token');
    } catch (e) {
      return null;
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

  static Map<String, dynamic> _defaultCart(String pharmacyId) {
    return {
      'id': null,
      'pharmacyId': pharmacyId,
      'pharmacy': null,
      'items': <Map<String, dynamic>>[],
      'itemCount': 0,
      'itemsTotal': 0.0,
      'totalDiscount': 0.0,
      'deliveryCharges': 0.0,
      'taxAmount': 0.0,
      'totalAmount': 0.0,
      'requiresPrescription': false,
      'appliedCoupon': null,
    };
  }

  static Map<String, dynamic> _parseCartData(dynamic data, String pharmacyId) {
    if (data is Map<String, dynamic>) {
      return {
        'id': data['id'],
        'pharmacyId': data['pharmacyId'] ?? pharmacyId,
        'pharmacy': data['pharmacy'],
        'items': List<Map<String, dynamic>>.from(data['items'] ?? []),
        'itemCount': data['itemCount'] ?? 0,
        'itemsTotal': (data['itemsTotal'] ?? 0).toDouble(),
        'totalDiscount': (data['totalDiscount'] ?? 0).toDouble(),
        'deliveryCharges': (data['deliveryCharges'] ?? 0).toDouble(),
        'taxAmount': (data['taxAmount'] ?? 0).toDouble(),
        'totalAmount': (data['totalAmount'] ?? 0).toDouble(),
        'requiresPrescription': data['requiresPrescription'] ?? false,
        'appliedCoupon': data['appliedCoupon'],
      };
    }
    return _defaultCart(pharmacyId);
  }

  static Future<Map<String, dynamic>> getCart(String pharmacyId) async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/cart/pharmacy/$pharmacyId'),
        headers: await _headers(),
      );

      final decoded = jsonDecode(response.body);
      if (response.statusCode == 200 && decoded['success'] == true) {
        final cartData = _parseCartData(decoded['data'], pharmacyId);
        return {
          'success': true,
          'data': cartData,
        };
      }

      return {
        'success': false,
        'message': decoded['message'] ?? 'Failed to load cart',
        'data': _defaultCart(pharmacyId),
      };
    } catch (e) {
      print('Error fetching cart: $e');
      return {
        'success': false,
        'message': 'Unable to load cart. Please check your connection.',
        'data': _defaultCart(pharmacyId),
      };
    }
  }

  static Future<Map<String, dynamic>> addToCart({
    required String pharmacyId,
    required String productId,
    int quantity = 1,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/cart/pharmacy/$pharmacyId/items'),
        headers: await _headers(),
        body: jsonEncode({
          'productId': productId,
          'quantity': quantity,
        }),
      );

      final decoded = jsonDecode(response.body);
      if (response.statusCode == 200 && decoded['success'] == true) {
        return {
          'success': true,
          'message': decoded['message'] ?? 'Item added to cart',
          'data': _parseCartData(decoded['data'], pharmacyId),
        };
      }

      return {
        'success': false,
        'message': decoded['message'] ?? 'Failed to add item to cart',
      };
    } catch (e) {
      print('Error adding item to cart: $e');
      return {
        'success': false,
        'message': 'Unable to add item to cart. Please try again.',
      };
    }
  }

  static Future<Map<String, dynamic>> updateItemQuantity({
    required String pharmacyId,
    required String productId,
    required int quantity,
  }) async {
    try {
      final response = await http.patch(
        Uri.parse('$_baseUrl/cart/pharmacy/$pharmacyId/items/$productId'),
        headers: await _headers(),
        body: jsonEncode({'quantity': quantity}),
      );

      final decoded = jsonDecode(response.body);
      if (response.statusCode == 200 && decoded['success'] == true) {
        return {
          'success': true,
          'message': decoded['message'] ?? 'Cart updated',
          'data': _parseCartData(decoded['data'], pharmacyId),
        };
      }

      return {
        'success': false,
        'message': decoded['message'] ?? 'Failed to update cart item',
      };
    } catch (e) {
      print('Error updating cart item: $e');
      return {
        'success': false,
        'message': 'Unable to update cart item. Please try again.',
      };
    }
  }

  static Future<Map<String, dynamic>> removeItem({
    required String pharmacyId,
    required String productId,
  }) async {
    try {
      final response = await http.delete(
        Uri.parse('$_baseUrl/cart/pharmacy/$pharmacyId/items/$productId'),
        headers: await _headers(),
      );

      final decoded = jsonDecode(response.body);
      if (response.statusCode == 200 && decoded['success'] == true) {
        return {
          'success': true,
          'message': decoded['message'] ?? 'Item removed from cart',
          'data': _parseCartData(decoded['data'], pharmacyId),
        };
      }

      return {
        'success': false,
        'message': decoded['message'] ?? 'Failed to remove item from cart',
      };
    } catch (e) {
      print('Error removing cart item: $e');
      return {
        'success': false,
        'message': 'Unable to remove item from cart. Please try again.',
      };
    }
  }

  static Future<Map<String, dynamic>> clearCart(String pharmacyId) async {
    try {
      final response = await http.delete(
        Uri.parse('$_baseUrl/cart/pharmacy/$pharmacyId'),
        headers: await _headers(),
      );

      final decoded = jsonDecode(response.body);
      if (response.statusCode == 200 && decoded['success'] == true) {
        return {
          'success': true,
          'message': decoded['message'] ?? 'Cart cleared',
          'data': _parseCartData(decoded['data'], pharmacyId),
        };
      }

      return {
        'success': false,
        'message': decoded['message'] ?? 'Failed to clear cart',
      };
    } catch (e) {
      print('Error clearing cart: $e');
      return {
        'success': false,
        'message': 'Unable to clear cart. Please try again.',
      };
    }
  }

  static Future<int> getCartItemCount(String pharmacyId) async {
    try {
      final result = await getCart(pharmacyId);
      if (result['success'] == true) {
        final data = result['data'] as Map<String, dynamic>;
        return data['itemCount'] ?? 0;
      }
      return 0;
    } catch (e) {
      return 0;
    }
  }
}

