import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../provider/auth_provider.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;
import '../services/patient_service.dart';

class SocialHistoryScreen extends StatefulWidget {
  final String? patientId;

  const SocialHistoryScreen({
    Key? key,
    this.patientId,
  }) : super(key: key);

  @override
  _SocialHistoryScreenState createState() => _SocialHistoryScreenState();
}

class _SocialHistoryScreenState extends State<SocialHistoryScreen> {
  Map<String, dynamic>? _patientData;
  bool _loading = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadPatientData();
  }

  Future<void> _loadPatientData() async {
    if (widget.patientId == null) return;
    
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      print('SocialHistoryScreen - Loading patient data for: ${widget.patientId}');
      
      // Get auth token from context
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final authToken = authProvider.authToken;
      
      final headers = <String, String>{
        'Content-Type': 'application/json',
      };
      
      if (authToken != null) {
        headers['Authorization'] = 'Bearer $authToken';
      }
      
      final response = await http.get(
        Uri.parse('http://192.168.100.8:5001/api/patients/${widget.patientId}'),
        headers: headers,
      );

      print('SocialHistoryScreen - Patient data API response: ${response.statusCode}');
      print('SocialHistoryScreen - Patient data response body: ${response.body}');
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        print('SocialHistoryScreen - Patient data: $data');
        
        if (data['success'] == true && data['data'] != null) {
          setState(() {
            _patientData = data['data'];
            _loading = false;
          });
        } else {
          setState(() {
            _error = 'No patient data available';
            _loading = false;
          });
        }
      } else {
        setState(() {
          _error = 'Failed to load patient data';
          _loading = false;
        });
      }
    } catch (e) {
      setState(() {
        _error = 'Error loading patient data: $e';
        _loading = false;
      });
      print('SocialHistoryScreen - Error loading patient data: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(
          'Social History',
          style: GoogleFonts.inter(
            fontSize: 18,
            fontWeight: FontWeight.w600,
            color: const Color(0xFF2D3748),
          ),
        ),
        backgroundColor: Colors.white,
        elevation: 0,
        iconTheme: const IconThemeData(color: Color(0xFF2D3748)),
        actions: [
          IconButton(
            icon: const Icon(Icons.edit, color: Color(0xFF2D3748)),
            onPressed: () {
              final auth = Provider.of<AuthProvider>(context, listen: false);
              final pid = (widget.patientId ?? _patientData?['_id'] ?? _patientData?['id'] ?? auth.currentUser?['_id'] ?? auth.currentUser?['id'])?.toString();
              _openEditSheet(explicitPatientId: pid);
            },
            tooltip: 'Edit',
          )
        ],
      ),
      backgroundColor: const Color(0xFFF7FAFC),
      body: _buildContent(),
    );
  }

  Widget _buildContent() {
    if (_loading) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircularProgressIndicator(),
            SizedBox(height: 16),
            Text('Loading social history...'),
          ],
        ),
      );
    }

    if (_error != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 48, color: Colors.red),
            const SizedBox(height: 16),
            Text(
              _error!,
              style: GoogleFonts.inter(color: Colors.red),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _loadPatientData,
              child: const Text('Retry'),
            ),
          ],
        ),
      );
    }

    if (_patientData == null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.info_outline, size: 48, color: Colors.grey),
            const SizedBox(height: 16),
            Text(
              'No patient data available',
              style: GoogleFonts.inter(color: Colors.grey[600]),
            ),
          ],
        ),
      );
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildSocialHistoryCard(),
        ],
      ),
    );
  }

  Widget _buildSocialHistoryCard() {
    final socialHistory = _patientData!['socialHistory'] ?? {};
    final tobaccoUse = socialHistory['tobaccoUse'] ?? 'Unknown';
    final alcoholUse = socialHistory['alcoholUse'] ?? 'Unknown';
    final illicitDrugUse = socialHistory['illicitDrugUse'] ?? 'Unknown';
    final occupation = socialHistory['occupation'] ?? '';
    
    // Check if we have any social history data
    final hasSocialHistoryData = tobaccoUse != 'Unknown' || 
      alcoholUse != 'Unknown' || 
      illicitDrugUse != 'Unknown' || 
      occupation != '';

    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Container(
            padding: const EdgeInsets.all(16),
            decoration: const BoxDecoration(
              border: Border(bottom: BorderSide(color: Color(0xFFE2E8F0))),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    const Icon(Icons.people, color: Color(0xFF6B8E3D), size: 20),
                    const SizedBox(width: 8),
                    Text(
                      'Social History',
                      style: GoogleFonts.inter(
                        fontSize: 18,
                        fontWeight: FontWeight.w600,
                        color: const Color(0xFF2D3748),
                      ),
                    ),
                  ],
                ),
                TextButton.icon(
                  onPressed: () {
                    final auth = Provider.of<AuthProvider>(context, listen: false);
                    final pid = (widget.patientId ?? _patientData?['_id'] ?? _patientData?['id'] ?? auth.currentUser?['_id'] ?? auth.currentUser?['id'])?.toString();
                    _openEditSheet(explicitPatientId: pid);
                  },
                  icon: const Icon(Icons.edit, size: 16),
                  label: Text(hasSocialHistoryData ? 'Edit' : 'Add'),
                ),
              ],
            ),
          ),
          
          // Content
          Padding(
            padding: const EdgeInsets.all(16),
            child: !hasSocialHistoryData ? 
              Column(
                children: [
                  const Icon(Icons.info_outline, size: 48, color: Colors.grey),
                  const SizedBox(height: 16),
                  Text(
                    'No social history data available',
                    style: GoogleFonts.inter(color: Colors.grey[600]),
                  ),
                  const SizedBox(height: 12),
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton.icon(
                      onPressed: () {
                        final auth = Provider.of<AuthProvider>(context, listen: false);
                        final pid = (widget.patientId ?? _patientData?['_id'] ?? _patientData?['id'] ?? auth.currentUser?['_id'] ?? auth.currentUser?['id'])?.toString();
                        _openEditSheet(explicitPatientId: pid);
                      },
                      icon: const Icon(Icons.add, size: 16),
                      label: const Text('Add Social History'),
                    ),
                  ),
                ],
              ) :
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildDetailedSocialItem('Tobacco Use', tobaccoUse, socialHistory, 'tobaccoType', 'tobaccoFrequency', Icons.smoking_rooms),
                  const SizedBox(height: 12),
                  _buildDetailedSocialItem('Alcohol Use', alcoholUse, socialHistory, 'alcoholType', 'alcoholFrequency', Icons.local_drink),
                  const SizedBox(height: 12),
                  _buildDetailedSocialItem('Illicit Drug Use', illicitDrugUse, socialHistory, 'drugType', 'drugFrequency', Icons.warning),
                  if (occupation.isNotEmpty) ...[
                    const SizedBox(height: 12),
                    _buildSocialItem('Occupation', occupation, Icons.work),
                  ],
                  if (socialHistory.isNotEmpty) ...[
                    const SizedBox(height: 16),
                    _buildAdditionalDetails(socialHistory),
                  ],
                ],
              ),
          ),
        ],
      ),
    );
  }

  Widget _buildSocialItem(String title, String value, IconData icon) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFF7FAFC),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: const Color(0xFF6B8E3D).withOpacity(0.1),
              borderRadius: BorderRadius.circular(6),
            ),
            child: Icon(
              icon,
              color: const Color(0xFF6B8E3D),
              size: 16,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: GoogleFonts.inter(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: const Color(0xFF2D3748),
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  value,
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    color: const Color(0xFF718096),
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDetailedSocialItem(String title, String status, Map<String, dynamic> socialHistory, String typeKey, String frequencyKey, IconData icon) {
    final type = socialHistory[typeKey] ?? '';
    final frequency = socialHistory[frequencyKey] ?? '';
    
    String displayValue = status;
    if (type.isNotEmpty && frequency.isNotEmpty) {
      displayValue = '$status - $type ($frequency)';
    } else if (type.isNotEmpty) {
      displayValue = '$status - $type';
    }
    
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFF7FAFC),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: const Color(0xFF6B8E3D).withOpacity(0.1),
              borderRadius: BorderRadius.circular(6),
            ),
            child: Icon(
              icon,
              color: const Color(0xFF6B8E3D),
              size: 16,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: GoogleFonts.inter(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: const Color(0xFF2D3748),
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  displayValue,
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    color: const Color(0xFF718096),
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAdditionalDetails(Map<String, dynamic> socialHistory) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFF7FAFC),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Additional Details',
            style: GoogleFonts.inter(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: const Color(0xFF2D3748),
            ),
          ),
          const SizedBox(height: 8),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(6),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: Text(
              _formatJsonData(socialHistory),
              style: GoogleFonts.inter(
                fontSize: 12,
                color: const Color(0xFF718096),
              ),
            ),
          ),
        ],
      ),
    );
  }

  String _formatJsonData(Map<String, dynamic> data) {
    final buffer = StringBuffer();
    data.forEach((key, value) {
      buffer.writeln('$key: $value');
    });
    return buffer.toString();
  }

  void _openEditSheet({String? explicitPatientId}) {
    final existing = Map<String, dynamic>.from((_patientData?['socialHistory']) ?? {});
    final form = {
      'tobaccoUse': existing['tobaccoUse'] ?? 'Unknown',
      'tobaccoType': existing['tobaccoType'] ?? '',
      'tobaccoFrequency': existing['tobaccoFrequency'] ?? '',
      'alcoholUse': existing['alcoholUse'] ?? 'Unknown',
      'alcoholType': existing['alcoholType'] ?? '',
      'alcoholFrequency': existing['alcoholFrequency'] ?? '',
      'illicitDrugUse': existing['illicitDrugUse'] ?? 'Unknown',
      'drugType': existing['drugType'] ?? '',
      'drugFrequency': existing['drugFrequency'] ?? '',
      'occupation': existing['occupation'] ?? '',
    };

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (_) => Padding(
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(context).viewInsets.bottom,
          left: 16,
          right: 16,
          top: 16,
        ),
        child: StatefulBuilder(
          builder: (context, setSheetState) {
            return SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Edit Social History', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w600)),
                      IconButton(
                        icon: const Icon(Icons.close),
                        onPressed: () => Navigator.pop(context),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  _dropdownField(
                    title: 'Tobacco Use',
                    value: form['tobaccoUse'],
                    options: const ['Never', 'Former', 'Current', 'Unknown'],
                    onChanged: (v) => setSheetState(() => form['tobaccoUse'] = v),
                  ),
                  const SizedBox(height: 8),
                  _textField('Tobacco Type', form['tobaccoType'], (v) => setSheetState(() => form['tobaccoType'] = v)),
                  const SizedBox(height: 8),
                  _textField('Tobacco Frequency', form['tobaccoFrequency'], (v) => setSheetState(() => form['tobaccoFrequency'] = v)),
                  const SizedBox(height: 12),
                  _dropdownField(
                    title: 'Alcohol Use',
                    value: form['alcoholUse'],
                    options: const ['Never', 'Former', 'Current', 'Unknown'],
                    onChanged: (v) => setSheetState(() => form['alcoholUse'] = v),
                  ),
                  const SizedBox(height: 8),
                  _textField('Alcohol Type', form['alcoholType'], (v) => setSheetState(() => form['alcoholType'] = v)),
                  const SizedBox(height: 8),
                  _textField('Alcohol Frequency', form['alcoholFrequency'], (v) => setSheetState(() => form['alcoholFrequency'] = v)),
                  const SizedBox(height: 12),
                  _dropdownField(
                    title: 'Illicit Drug Use',
                    value: form['illicitDrugUse'],
                    options: const ['Never', 'Former', 'Current', 'Unknown'],
                    onChanged: (v) => setSheetState(() => form['illicitDrugUse'] = v),
                  ),
                  const SizedBox(height: 8),
                  _textField('Drug Type', form['drugType'], (v) => setSheetState(() => form['drugType'] = v)),
                  const SizedBox(height: 8),
                  _textField('Drug Frequency', form['drugFrequency'], (v) => setSheetState(() => form['drugFrequency'] = v)),
                  const SizedBox(height: 12),
                  _textField('Occupation', form['occupation'], (v) => setSheetState(() => form['occupation'] = v)),
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: () async {
                        try {
                          final auth = Provider.of<AuthProvider>(context, listen: false);
                          final service = PatientService();
                          final pid = explicitPatientId ?? (widget.patientId ?? _patientData?['_id'] ?? _patientData?['id'] ?? auth.currentUser?['_id'] ?? auth.currentUser?['id']).toString();
                          final updated = await service.updateSocialHistory(
                            patientId: pid,
                            socialHistory: form,
                            authToken: auth.authToken,
                          );
                          if (mounted) {
                            setState(() {
                              _patientData ??= {};
                              _patientData!['socialHistory'] = updated['socialHistory'] ?? form;
                            });
                            Navigator.pop(context);
                          }
                        } catch (e) {
                          if (mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(content: Text('Failed to update: $e')),
                            );
                          }
                        }
                      },
                      icon: const Icon(Icons.save, size: 16),
                      label: const Text('Save Changes'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF6B8E3D),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                ],
              ),
            );
          },
        ),
      ),
    );
  }

  Widget _textField(String label, String initialValue, ValueChanged<String> onChanged) {
    return TextFormField(
      initialValue: initialValue,
      decoration: const InputDecoration(
        labelText: '',
        border: OutlineInputBorder(),
        isDense: true,
      ).copyWith(labelText: label),
      onChanged: onChanged,
    );
  }

  Widget _dropdownField({
    required String title,
    required String value,
    required List<String> options,
    required ValueChanged<String?> onChanged,
  }) {
    return InputDecorator(
      decoration: const InputDecoration(
        border: OutlineInputBorder(),
        isDense: true,
      ),
      child: Row(
        children: [
          Expanded(
            child: Text(title, style: GoogleFonts.inter(fontSize: 12, color: Colors.grey[700])),
          ),
          const SizedBox(width: 12),
          DropdownButton<String>(
            value: value,
            items: options.map((o) => DropdownMenuItem(value: o, child: Text(o))).toList(),
            onChanged: onChanged,
          ),
        ],
      ),
    );
  }
}
