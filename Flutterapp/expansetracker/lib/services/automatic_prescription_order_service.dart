import 'dart:convert';
import 'package:http/http.dart' as http;
import 'config_service.dart';

class AutomaticPrescriptionOrderService {
  static String get _baseUrl => ConfigService.instance.baseUrl;

  // Get patient's automatic prescription orders
  static Future<Map<String, dynamic>> getPatientOrders({
    required String patientId,
    String? status,
  }) async {
    try {
      String url = '$_baseUrl/automatic-prescription-orders/patient/$patientId';
      if (status != null && status.isNotEmpty) {
        url += '?status=$status';
      }

      final uri = Uri.parse(url);
      final response = await http.get(
        uri,
        headers: {'Content-Type': 'application/json'},
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return {
          'success': true,
          'data': data['data'] ?? [],
        };
      } else {
        return {
          'success': false,
          'message': 'Failed to fetch automatic prescription orders',
          'data': [],
        };
      }
    } catch (e) {
      print('Error getting automatic prescription orders: $e');
      return {
        'success': false,
        'message': 'Error: $e',
        'data': [],
      };
    }
  }

  // Get single order by ID
  static Future<Map<String, dynamic>> getOrderById(String orderId) async {
    try {
      final uri = Uri.parse('$_baseUrl/automatic-prescription-orders/$orderId');
      final response = await http.get(
        uri,
        headers: {'Content-Type': 'application/json'},
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return {
          'success': true,
          'data': data['data'],
        };
      } else {
        return {
          'success': false,
          'message': 'Failed to fetch order',
        };
      }
    } catch (e) {
      print('Error getting order: $e');
      return {
        'success': false,
        'message': 'Error: $e',
      };
    }
  }

  // Mark order as read
  static Future<Map<String, dynamic>> markOrderAsRead(String orderId) async {
    try {
      final uri = Uri.parse('$_baseUrl/automatic-prescription-orders/$orderId/read');
      final response = await http.put(
        uri,
        headers: {'Content-Type': 'application/json'},
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return {
          'success': true,
          'message': data['message'] ?? 'Order marked as read',
        };
      } else {
        return {
          'success': false,
          'message': 'Failed to mark order as read',
        };
      }
    } catch (e) {
      print('Error marking order as read: $e');
      return {
        'success': false,
        'message': 'Error: $e',
      };
    }
  }
}

