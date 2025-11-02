// services/ambulance_service.dart
import 'dart:convert';
import 'package:http/http.dart' as http;

class AmbulanceService {
  static final AmbulanceService _instance = AmbulanceService._internal();
  factory AmbulanceService() => _instance;
  AmbulanceService._internal();

  static const String baseUrl = 'http://192.168.1.4:5001/api';

  Future<List<dynamic>> getAmbulanceRequests() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/ambulance-requests'),
        headers: {
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return data is List ? data : [];
      } else {
        throw Exception('Failed to load ambulance requests: ${response.statusCode}');
      }
    } catch (e) {
      print('Error fetching ambulance requests: $e');
      throw e;
    }
  }

  Future<Map<String, dynamic>?> getLatestPendingRequest() async {
    try {
      final requests = await getAmbulanceRequests();
      
      // Filter pending requests and get the latest one
      final pendingRequests = requests.where((request) => 
        request['status'] == 'Pending' || request['status'] == 'Accepted'
      ).toList();
      
      if (pendingRequests.isNotEmpty) {
        // Sort by requestTime to get the latest
        pendingRequests.sort((a, b) {
          final timeA = DateTime.parse(a['requestTime'] ?? '');
          final timeB = DateTime.parse(b['requestTime'] ?? '');
          return timeB.compareTo(timeA);
        });
        
        return pendingRequests.first;
      }
      
      return null;
    } catch (e) {
      print('Error getting latest request: $e');
      return null;
    }
  }
}