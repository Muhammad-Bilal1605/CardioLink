import 'dart:convert';
import 'dart:io';

import 'package:http/http.dart' as http;
import 'package:path_provider/path_provider.dart';
import 'package:open_file/open_file.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'config_service.dart';

class HealthTrackerService {
  HealthTrackerService();

  String get _baseUrl => ConfigService.instance.baseUrl;

  Future<Map<String, String>> _buildHeaders({String? authToken}) async {
    String? token = authToken;

    if (token == null || token.isEmpty) {
      try {
        final prefs = await SharedPreferences.getInstance();
        token = prefs.getString('auth_token') ?? prefs.getString('token');
      } catch (_) {
        token = null;
      }
    }

    final headers = <String, String>{
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (token != null && token.isNotEmpty) {
      headers['Authorization'] = 'Bearer $token';
    }

    return headers;
  }

  Future<Map<String, dynamic>> fetchTrackerData({
    String? entryType,
    String? authToken,
    int? limit,
  }) async {
    final queryParameters = <String, String>{};
    if (entryType != null && entryType.isNotEmpty) {
      queryParameters['entryType'] = entryType;
    }
    if (limit != null) {
      queryParameters['limit'] = '$limit';
    }

    final uri = Uri.parse('$_baseUrl/health-tracker').replace(
      queryParameters: queryParameters.isEmpty ? null : queryParameters,
    );

    final headers = await _buildHeaders(authToken: authToken);
    final response = await http
        .get(uri, headers: headers)
        .timeout(const Duration(seconds: 30));

    if (response.statusCode == 200) {
      final body = json.decode(response.body);
      if (body is Map && body['success'] == true) {
        final data = body['data'];
        if (data is Map) {
          return Map<String, dynamic>.from(data);
        }
        if (data is List) {
          return {
            'items': data
                .map((entry) =>
                    entry is Map ? Map<String, dynamic>.from(entry) : entry)
                .toList(),
          };
        }
        return <String, dynamic>{};
      }
      return <String, dynamic>{};
    }

    throw Exception(
      'Failed to load tracker data (${response.statusCode}): ${response.body}',
    );
  }

  Future<Map<String, dynamic>> createEntry({
    required String entryType,
    required Map<String, dynamic> payload,
    DateTime? recordedAt,
    String? authToken,
  }) async {
    final uri = Uri.parse('$_baseUrl/health-tracker');
    final headers = await _buildHeaders(authToken: authToken);
    final body = <String, dynamic>{
      'entryType': entryType,
      'payload': payload,
    };
    if (recordedAt != null) {
      body['recordedAt'] = recordedAt.toIso8601String();
    }

    final response = await http
        .post(uri, headers: headers, body: json.encode(body))
        .timeout(const Duration(seconds: 30));

    if (response.statusCode == 201 || response.statusCode == 200) {
      final data = json.decode(response.body);
      if (data is Map && data['success'] == true) {
        return Map<String, dynamic>.from(data['data'] ?? <String, dynamic>{});
      }
    }

    throw Exception(
      'Failed to create entry (${response.statusCode}): ${response.body}',
    );
  }

  Future<Map<String, dynamic>> updateEntry(
    String entryId, {
    required Map<String, dynamic> payload,
    DateTime? recordedAt,
    String? authToken,
  }) async {
    final uri = Uri.parse('$_baseUrl/health-tracker/$entryId');
    final headers = await _buildHeaders(authToken: authToken);
    final body = <String, dynamic>{
      'payload': payload,
    };

    if (recordedAt != null) {
      body['recordedAt'] = recordedAt.toIso8601String();
    }

    final response = await http
        .patch(uri, headers: headers, body: json.encode(body))
        .timeout(const Duration(seconds: 30));

    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      if (data is Map && data['success'] == true) {
        return Map<String, dynamic>.from(data['data'] ?? <String, dynamic>{});
      }
    }

    throw Exception(
      'Failed to update entry (${response.statusCode}): ${response.body}',
    );
  }

  Future<void> deleteEntry(
    String entryId, {
    String? authToken,
  }) async {
    final uri = Uri.parse('$_baseUrl/health-tracker/$entryId');
    final headers = await _buildHeaders(authToken: authToken);

    final response = await http
        .delete(uri, headers: headers)
        .timeout(const Duration(seconds: 30));

    if (response.statusCode != 200) {
      throw Exception(
        'Failed to delete entry (${response.statusCode}): ${response.body}',
      );
    }
  }

  Future<Map<String, dynamic>> generateAiReport({
    String? entryId,
    String? authToken,
  }) async {
    final uri = Uri.parse('$_baseUrl/health-tracker/report');
    final headers = await _buildHeaders(authToken: authToken);
    final body = entryId != null ? {'entryId': entryId} : <String, dynamic>{};

    final response = await http
        .post(uri, headers: headers, body: json.encode(body))
        .timeout(const Duration(seconds: 60));

    if (response.statusCode == 201 || response.statusCode == 200) {
      final data = json.decode(response.body);
      if (data is Map && data['success'] == true) {
        return Map<String, dynamic>.from(data['data'] ?? <String, dynamic>{});
      }
    }

    throw Exception(
      'Failed to generate AI report (${response.statusCode}): ${response.body}',
    );
  }

  Future<List<Map<String, dynamic>>> fetchReports({String? authToken}) async {
    final uri = Uri.parse('$_baseUrl/health-tracker/reports');
    final headers = await _buildHeaders(authToken: authToken);

    final response = await http
        .get(uri, headers: headers)
        .timeout(const Duration(seconds: 30));

    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      if (data is Map && data['success'] == true) {
        final list = data['data'];
        if (list is List) {
          return list
              .whereType<Map>()
              .map((item) => Map<String, dynamic>.from(item))
              .toList();
        }
      }
      return <Map<String, dynamic>>[];
    }

    throw Exception(
      'Failed to fetch AI reports (${response.statusCode}): ${response.body}',
    );
  }

  Future<void> downloadReportPdf(
    String reportId, {
    String? authToken,
  }) async {
    final uri = Uri.parse('$_baseUrl/health-tracker/reports/$reportId/pdf');
    final headers = await _buildHeaders(authToken: authToken);
    headers['Accept'] = 'application/pdf';

    final response = await http
        .get(uri, headers: headers)
        .timeout(const Duration(seconds: 60));

    if (response.statusCode == 200) {
      final rootDirectory = await getApplicationDocumentsDirectory();
      final reportsDirectory = Directory(
        '${rootDirectory.path}/heartwise_reports',
      );

      if (!await reportsDirectory.exists()) {
        await reportsDirectory.create(recursive: true);
      }

      final filePath =
          '${reportsDirectory.path}/heartwise-report-$reportId.pdf';

      // Write the PDF to a file
      final file = File(filePath);
      await file.writeAsBytes(response.bodyBytes, flush: true);

      final result = await OpenFile.open(
        filePath,
        type: 'application/pdf',
      );

      if (result.type != ResultType.done) {
        throw Exception('Unable to open report PDF: ${result.message}');
      }
    } else {
      throw Exception(
        'Failed to download report PDF (${response.statusCode}): ${response.body}',
      );
    }
  }

  Future<Map<String, dynamic>> generateMonthlyReport({
    int? month,
    int? year,
    String? authToken,
  }) async {
    final uri = Uri.parse('$_baseUrl/health-tracker/report/monthly');
    final headers = await _buildHeaders(authToken: authToken);
    final body = <String, dynamic>{};
    if (month != null) body['month'] = month;
    if (year != null) body['year'] = year;

    final response = await http
        .post(uri, headers: headers, body: json.encode(body))
        .timeout(const Duration(seconds: 90));

    if (response.statusCode == 201 || response.statusCode == 200) {
      final data = json.decode(response.body);
      if (data is Map && data['success'] == true) {
        return Map<String, dynamic>.from(data['data'] ?? <String, dynamic>{});
      }
    }

    throw Exception(
      'Failed to generate monthly report (${response.statusCode}): ${response.body}',
    );
  }

  Future<void> deleteReport(
    String reportId, {
    String? authToken,
  }) async {
    final uri = Uri.parse('$_baseUrl/health-tracker/reports/$reportId');
    final headers = await _buildHeaders(authToken: authToken);

    final response = await http
        .delete(uri, headers: headers)
        .timeout(const Duration(seconds: 30));

    if (response.statusCode != 200) {
      throw Exception(
        'Failed to delete report (${response.statusCode}): ${response.body}',
      );
    }
  }
}
