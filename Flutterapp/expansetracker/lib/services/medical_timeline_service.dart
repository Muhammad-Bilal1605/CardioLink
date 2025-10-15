import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/medical_event.dart';

class MedicalTimelineService {
  static const String baseUrl = 'http://192.168.100.8:5001';

  // Fetch all medical events for a patient
  static Future<List<MedicalEvent>> fetchAllPatientEvents(String patientId, {String? authToken}) async {
    try {
      print('MedicalTimelineService - Fetching events for patient: $patientId');
      
      // Fetch data from all endpoints in parallel
      final futures = await Future.wait([
        _fetchVisits(patientId, authToken),
        _fetchHospitalizations(patientId, authToken),
        _fetchProcedures(patientId, authToken),
        _fetchLabs(patientId, authToken),
        _fetchImaging(patientId, authToken),
      ]);

      // Combine all events
      List<MedicalEvent> allEvents = [];
      for (var events in futures) {
        allEvents.addAll(events);
      }

      // Sort by date (oldest first)
      allEvents.sort((a, b) => a.date.compareTo(b.date));
      
      print('MedicalTimelineService - Total events fetched: ${allEvents.length}');
      return allEvents;
    } catch (e) {
      print('MedicalTimelineService - Error fetching events: $e');
      throw Exception('Failed to fetch medical timeline data: $e');
    }
  }

  // Fetch visits
  static Future<List<MedicalEvent>> _fetchVisits(String patientId, String? authToken) async {
    try {
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

      print('MedicalTimelineService - Visits API response: ${response.statusCode}');
      print('MedicalTimelineService - Visits response body: ${response.body}');
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        print('MedicalTimelineService - Visits data: $data');
        if (data['success'] == true && data['data'] != null) {
          return (data['data'] as List).map((visit) {
            return MedicalEvent(
              id: 'visit-${visit['_id']}',
              date: _safeParseDate(visit['date']),
              type: 'visits',
              typeLabel: 'Visit',
              color: '#f56565',
              icon: '👨‍⚕️',
              department: visit['facility'] ?? '',
              doctor: visit['doctor'] ?? '',
              details: visit['diagnosis'] ?? '',
              fullData: visit,
            );
          }).toList();
        }
      } else {
        print('MedicalTimelineService - Visits API error: ${response.statusCode} - ${response.body}');
      }
      return [];
    } catch (e) {
      print('Error fetching visits: $e');
      return [];
    }
  }

  // Fetch hospitalizations
  static Future<List<MedicalEvent>> _fetchHospitalizations(String patientId, String? authToken) async {
    try {
      final headers = <String, String>{
        'Content-Type': 'application/json',
      };
      
      if (authToken != null) {
        headers['Authorization'] = 'Bearer $authToken';
      }
      
      final response = await http.get(
        Uri.parse('$baseUrl/api/hospitalizations/patient/$patientId'),
        headers: headers,
      );

      print('MedicalTimelineService - Hospitalizations API response: ${response.statusCode}');
      print('MedicalTimelineService - Hospitalizations response body: ${response.body}');
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        print('MedicalTimelineService - Hospitalizations data: $data');
        if (data['success'] == true && data['data'] != null) {
          return (data['data'] as List).map((hosp) {
            return MedicalEvent(
              id: 'hospitalization-${hosp['_id']}',
              date: _safeParseDate(hosp['admissionDate']),
              type: 'hospitalizations',
              typeLabel: 'Hospitalization',
              color: '#4299e1',
              icon: '🏥',
              department: hosp['hospital'] ?? '',
              doctor: hosp['attendingPhysician'] ?? '',
              details: hosp['reason'] ?? '',
              fullData: hosp,
            );
          }).toList();
        }
      } else {
        print('MedicalTimelineService - Hospitalizations API error: ${response.statusCode} - ${response.body}');
      }
      return [];
    } catch (e) {
      print('Error fetching hospitalizations: $e');
      return [];
    }
  }

  // Fetch procedures
  static Future<List<MedicalEvent>> _fetchProcedures(String patientId, String? authToken) async {
    try {
      final headers = <String, String>{
        'Content-Type': 'application/json',
      };
      
      if (authToken != null) {
        headers['Authorization'] = 'Bearer $authToken';
      }
      
      final response = await http.get(
        Uri.parse('$baseUrl/api/procedures/patient/$patientId'),
        headers: headers,
      );

      print('MedicalTimelineService - Procedures API response: ${response.statusCode}');
      print('MedicalTimelineService - Procedures response body: ${response.body}');
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        print('MedicalTimelineService - Procedures data: $data');
        if (data['success'] == true && data['data'] != null) {
          return (data['data'] as List).map((proc) {
            return MedicalEvent(
              id: 'procedure-${proc['_id']}',
              date: _safeParseDate(proc['date']),
              type: 'procedures',
              typeLabel: 'Procedure',
              color: '#9f7aea',
              icon: '⚕️',
              department: proc['hospital'] ?? '',
              doctor: proc['physician'] ?? '',
              details: proc['procedureName'] ?? '',
              fullData: proc,
            );
          }).toList();
        }
      } else {
        print('MedicalTimelineService - Procedures API error: ${response.statusCode} - ${response.body}');
      }
      return [];
    } catch (e) {
      print('Error fetching procedures: $e');
      return [];
    }
  }

  // Fetch labs
  static Future<List<MedicalEvent>> _fetchLabs(String patientId, String? authToken) async {
    try {
      final headers = <String, String>{
        'Content-Type': 'application/json',
      };
      
      if (authToken != null) {
        headers['Authorization'] = 'Bearer $authToken';
      }
      
      final response = await http.get(
        Uri.parse('$baseUrl/api/lab-results/patient/$patientId'),
        headers: headers,
      );

      print('MedicalTimelineService - Labs API response: ${response.statusCode}');
      print('MedicalTimelineService - Labs response body: ${response.body}');
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        print('MedicalTimelineService - Labs data: $data');
        if (data['success'] == true && data['data'] != null) {
          return (data['data'] as List).map((lab) {
            return MedicalEvent(
              id: 'lab-${lab['_id']}',
              date: _safeParseDate(lab['date']),
              type: 'labs',
              typeLabel: 'Lab Test',
              color: '#38b2ac',
              icon: '🧪',
              department: lab['facility'] ?? '',
              doctor: lab['doctor'] ?? '',
              details: lab['testName'] ?? '',
              fullData: lab,
            );
          }).toList();
        }
      } else {
        print('MedicalTimelineService - Labs API error: ${response.statusCode} - ${response.body}');
      }
      return [];
    } catch (e) {
      print('Error fetching labs: $e');
      return [];
    }
  }

  // Fetch imaging
  static Future<List<MedicalEvent>> _fetchImaging(String patientId, String? authToken) async {
    try {
      final headers = <String, String>{
        'Content-Type': 'application/json',
      };
      
      if (authToken != null) {
        headers['Authorization'] = 'Bearer $authToken';
      }
      
      final response = await http.get(
        Uri.parse('$baseUrl/api/imaging/patient/$patientId'),
        headers: headers,
      );

      print('MedicalTimelineService - Imaging API response: ${response.statusCode}');
      print('MedicalTimelineService - Imaging response body: ${response.body}');
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        print('MedicalTimelineService - Imaging data: $data');
        if (data['success'] == true && data['data'] != null) {
          return (data['data'] as List).map((img) {
            return MedicalEvent(
              id: 'imaging-${img['_id']}',
              date: _safeParseDate(img['date']),
              type: 'imaging',
              typeLabel: 'Imaging',
              color: '#ecc94b',
              icon: '🔬',
              department: img['facility'] ?? '',
              doctor: img['doctor'] ?? '',
              details: img['type'] ?? '',
              fullData: img,
            );
          }).toList();
        }
      } else {
        print('MedicalTimelineService - Imaging API error: ${response.statusCode} - ${response.body}');
      }
      return [];
    } catch (e) {
      print('Error fetching imaging: $e');
      return [];
    }
  }

  // Safe date parsing with fallback
  static DateTime _safeParseDate(dynamic dateStr) {
    try {
      if (dateStr == null) return DateTime.now();
      return DateTime.parse(dateStr.toString());
    } catch (e) {
      print('Error parsing date: $dateStr, using current date');
      return DateTime.now();
    }
  }
}
