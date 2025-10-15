import 'dart:convert';
import 'package:http/http.dart' as http;

class VisitService {
  static const String baseUrl = 'http://192.168.100.8:5001';

  Future<List<Map<String, dynamic>>> fetchPatientVisits(String patientId, String? authToken) async {
    try {
      print('VisitService - Fetching visits for patient: $patientId');
      
      final headers = <String, String>{
        'Content-Type': 'application/json',
      };
      
      if (authToken != null) {
        headers['Authorization'] = 'Bearer $authToken';
      }
      
      final response = await http.get(
        Uri.parse('$baseUrl/api/visits/patient/$patientId'),
        headers: headers,
      );

      print('VisitService - Visits API response: ${response.statusCode}');
      print('VisitService - Visits response body: ${response.body}');
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        print('VisitService - Visits data: $data');
        
        if (data['success'] == true && data['data'] != null) {
          final visits = List<Map<String, dynamic>>.from(data['data']);
          print('VisitService - Found ${visits.length} visits');
          return visits;
        } else {
          throw Exception('No visits data available: ${data['message'] ?? 'Unknown error'}');
        }
      } else {
        throw Exception('Failed to load visits: ${response.statusCode} - ${response.body}');
      }
    } catch (e) {
      print('VisitService - Error fetching visits: $e');
      throw Exception('Error loading visits: $e');
    }
  }

  Future<List<Map<String, dynamic>>> fetchLabResults(List<dynamic> labResultIds, String? authToken) async {
    try {
      print('VisitService - Fetching lab results: $labResultIds');
      print('VisitService - Lab result IDs type: ${labResultIds.runtimeType}');
      print('VisitService - Lab result IDs length: ${labResultIds.length}');
      
      final headers = <String, String>{
        'Content-Type': 'application/json',
      };
      
      if (authToken != null) {
        headers['Authorization'] = 'Bearer $authToken';
        print('VisitService - Using auth token for lab results');
      } else {
        print('VisitService - No auth token for lab results');
      }
      
      final List<Map<String, dynamic>> labResults = [];
      
      for (int i = 0; i < labResultIds.length; i++) {
        final id = labResultIds[i];
        print('VisitService - Processing lab result $i: $id (type: ${id.runtimeType})');
        
        try {
          // Handle both string IDs and object IDs
          String labId;
          if (id is String) {
            labId = id;
          } else if (id is Map && id.containsKey('_id')) {
            labId = id['_id'];
          } else if (id is Map && id.containsKey('id')) {
            labId = id['id'];
          } else {
            print('VisitService - Skipping invalid lab result ID: $id');
            continue;
          }
          
          print('VisitService - Fetching lab result with ID: $labId');
          
          final response = await http.get(
            Uri.parse('$baseUrl/api/lab-results/$labId'),
            headers: headers,
          );
          
          print('VisitService - Lab result API response for $labId: ${response.statusCode}');
          print('VisitService - Lab result response body: ${response.body}');
          
          if (response.statusCode == 200) {
            final data = json.decode(response.body);
            print('VisitService - Lab result data: $data');
            if (data['success'] == true && data['data'] != null) {
              labResults.add(data['data']);
              print('VisitService - Added lab result: ${data['data']['testName'] ?? 'Unknown'}');
            } else {
              print('VisitService - Lab result API returned unsuccessful response: ${data['message'] ?? 'Unknown error'}');
            }
          } else {
            print('VisitService - Lab result API error: ${response.statusCode} - ${response.body}');
          }
        } catch (e) {
          print('VisitService - Error fetching lab result $id: $e');
        }
      }
      
      print('VisitService - Found ${labResults.length} lab results');
      return labResults;
    } catch (e) {
      print('VisitService - Error fetching lab results: $e');
      throw Exception('Error loading lab results: $e');
    }
  }

  Future<List<Map<String, dynamic>>> fetchImagingResults(List<dynamic> imagingIds, String? authToken) async {
    try {
      print('VisitService - Fetching imaging results: $imagingIds');
      print('VisitService - Imaging IDs type: ${imagingIds.runtimeType}');
      print('VisitService - Imaging IDs length: ${imagingIds.length}');
      
      final headers = <String, String>{
        'Content-Type': 'application/json',
      };
      
      if (authToken != null) {
        headers['Authorization'] = 'Bearer $authToken';
        print('VisitService - Using auth token for imaging results');
      } else {
        print('VisitService - No auth token for imaging results');
      }
      
      final List<Map<String, dynamic>> imagingResults = [];
      
      for (int i = 0; i < imagingIds.length; i++) {
        final id = imagingIds[i];
        print('VisitService - Processing imaging $i: $id (type: ${id.runtimeType})');
        
        try {
          // Handle both string IDs and object IDs
          String imagingId;
          if (id is String) {
            imagingId = id;
          } else if (id is Map && id.containsKey('_id')) {
            imagingId = id['_id'];
          } else if (id is Map && id.containsKey('id')) {
            imagingId = id['id'];
          } else {
            print('VisitService - Skipping invalid imaging ID: $id');
            continue;
          }
          
          print('VisitService - Fetching imaging with ID: $imagingId');
          
          final response = await http.get(
            Uri.parse('$baseUrl/api/imaging/$imagingId'),
            headers: headers,
          );
          
          print('VisitService - Imaging API response for $imagingId: ${response.statusCode}');
          print('VisitService - Imaging response body: ${response.body}');
          
          if (response.statusCode == 200) {
            final data = json.decode(response.body);
            print('VisitService - Imaging data: $data');
            if (data['success'] == true && data['data'] != null) {
              imagingResults.add(data['data']);
              print('VisitService - Added imaging: ${data['data']['type'] ?? 'Unknown'}');
            } else {
              print('VisitService - Imaging API returned unsuccessful response: ${data['message'] ?? 'Unknown error'}');
            }
          } else {
            print('VisitService - Imaging API error: ${response.statusCode} - ${response.body}');
          }
        } catch (e) {
          print('VisitService - Error fetching imaging $id: $e');
        }
      }
      
      print('VisitService - Found ${imagingResults.length} imaging results');
      return imagingResults;
    } catch (e) {
      print('VisitService - Error fetching imaging results: $e');
      throw Exception('Error loading imaging results: $e');
    }
  }

  Future<Map<String, dynamic>> fetchVisitDetails(String visitId, String? authToken) async {
    try {
      print('VisitService - Fetching visit details for: $visitId');
      
      final headers = <String, String>{
        'Content-Type': 'application/json',
      };
      
      if (authToken != null) {
        headers['Authorization'] = 'Bearer $authToken';
      }
      
      final response = await http.get(
        Uri.parse('$baseUrl/api/visits/$visitId'),
        headers: headers,
      );

      print('VisitService - Visit details API response: ${response.statusCode}');
      print('VisitService - Visit details response body: ${response.body}');
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        print('VisitService - Visit details data: $data');
        
        if (data['success'] == true && data['data'] != null) {
          return data['data'];
        } else {
          throw Exception('No visit details available: ${data['message'] ?? 'Unknown error'}');
        }
      } else {
        throw Exception('Failed to load visit details: ${response.statusCode} - ${response.body}');
      }
    } catch (e) {
      print('VisitService - Error fetching visit details: $e');
      throw Exception('Error loading visit details: $e');
    }
  }
}
