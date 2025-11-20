import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../../provider/auth_provider.dart';
import '../../../config/api_config.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;
import '../../../services/patient_service.dart';

class RightRow3 extends StatefulWidget {
  final String? patientId;

  const RightRow3({
    Key? key,
    this.patientId,
  }) : super(key: key);

  @override
  _RightRow3State createState() => _RightRow3State();
}

class _RightRow3State extends State<RightRow3> {
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
      print('RightRow3 - Loading patient data for: ${widget.patientId}');

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
        Uri.parse('${ApiConfig.baseUrl}/patients/${widget.patientId}'),
        headers: headers,
      );

      print('RightRow3 - Patient data API response: ${response.statusCode}');
      print('RightRow3 - Patient data response body: ${response.body}');

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        print('RightRow3 - Patient data: $data');

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
      print('RightRow3 - Error loading patient data: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
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
                    const Icon(Icons.medical_information,
                        color: Color(0xFF6B8E3D), size: 20),
                    const SizedBox(width: 8),
                    Text(
                      'Special Directives',
                      style: GoogleFonts.inter(
                        fontSize: 18,
                        fontWeight: FontWeight.w600,
                        color: const Color(0xFF2D3748),
                      ),
                    ),
                  ],
                ),
                TextButton.icon(
                  onPressed: () => _openEditDirectivesSheet(context),
                  icon: const Icon(Icons.edit, size: 16),
                  label: const Text('Edit'),
                ),
              ],
            ),
          ),

          // Content
          Expanded(
            child: _buildContent(),
          ),
        ],
      ),
    );
  }

  void _openEditDirectivesSheet(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context, listen: false);
    final patientId =
        widget.patientId ?? auth.currentUser?['_id'] ?? auth.currentUser?['id'];
    if (patientId == null) {
      ScaffoldMessenger.of(context)
          .showSnackBar(const SnackBar(content: Text('No patient selected')));
      return;
    }

    final existing =
        Map<String, dynamic>.from(_patientData?['specialDirectives'] ?? {});
    bool dnr = existing['dnr'] ?? false;
    bool livingWill = existing['livingWill'] ?? false;
    bool organDonor = existing['organDonor'] ?? false;
    String religiousInstructions = existing['religiousInstructions'] ?? '';

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
                      Text('Edit Special Directives',
                          style: GoogleFonts.inter(
                              fontSize: 16, fontWeight: FontWeight.w600)),
                      IconButton(
                          icon: const Icon(Icons.close),
                          onPressed: () => Navigator.pop(context)),
                    ],
                  ),
                  const SizedBox(height: 12),
                  SwitchListTile(
                    title: const Text('Do Not Resuscitate (DNR)'),
                    value: dnr,
                    onChanged: (v) => setSheetState(() => dnr = v),
                  ),
                  SwitchListTile(
                    title: const Text('Living Will'),
                    value: livingWill,
                    onChanged: (v) => setSheetState(() => livingWill = v),
                  ),
                  SwitchListTile(
                    title: const Text('Organ Donor'),
                    value: organDonor,
                    onChanged: (v) => setSheetState(() => organDonor = v),
                  ),
                  const SizedBox(height: 8),
                  TextFormField(
                    initialValue: religiousInstructions,
                    decoration: const InputDecoration(
                      labelText: 'Religious Instructions',
                      border: OutlineInputBorder(),
                      isDense: true,
                    ),
                    maxLines: 3,
                    onChanged: (v) =>
                        setSheetState(() => religiousInstructions = v),
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: () async {
                        try {
                          final service = PatientService();
                          final authP =
                              Provider.of<AuthProvider>(context, listen: false);
                          final payload = {
                            'dnr': dnr,
                            'livingWill': livingWill,
                            'organDonor': organDonor,
                            'religiousInstructions': religiousInstructions,
                          };
                          final updated = await service.updateSpecialDirectives(
                            patientId: patientId,
                            specialDirectives: payload,
                            authToken: authP.authToken,
                          );
                          if (mounted) {
                            setState(() {
                              _patientData = updated;
                            });
                            Navigator.pop(context);
                            ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                    content:
                                        Text('Special directives updated')));
                          }
                        } catch (e) {
                          if (mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                                content: Text('Failed to update: $e')));
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

  Widget _buildContent() {
    if (_loading) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircularProgressIndicator(),
            SizedBox(height: 16),
            Text('Loading special directives...'),
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

    if (_patientData == null || _patientData!['specialDirectives'] == null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.info_outline, size: 48, color: Colors.grey),
            const SizedBox(height: 16),
            Text(
              'No special directives data available',
              style: GoogleFonts.inter(color: Colors.grey[600]),
            ),
          ],
        ),
      );
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          _buildDirectiveItem('Do Not Resuscitate (DNR)', _getDNRStatus()),
          const SizedBox(height: 12),
          _buildDirectiveItem('Living Will', _getLivingWillStatus()),
          const SizedBox(height: 12),
          _buildDirectiveItem('Organ Donor', _getOrganDonorStatus()),
          if (_patientData!['specialDirectives']['religiousInstructions'] !=
              null) ...[
            const SizedBox(height: 12),
            _buildReligiousInstructions(),
          ],
        ],
      ),
    );
  }

  Widget _buildDirectiveItem(String title, String status) {
    final isActive = status.toLowerCase() == 'yes';

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isActive ? const Color(0xFFF0F9FF) : const Color(0xFFF7FAFC),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: isActive ? const Color(0xFF3B82F6) : const Color(0xFFE2E8F0),
          width: 1,
        ),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color:
                  isActive ? const Color(0xFF3B82F6) : const Color(0xFFE2E8F0),
              borderRadius: BorderRadius.circular(6),
            ),
            child: Icon(
              isActive ? Icons.check : Icons.close,
              color: isActive ? Colors.white : const Color(0xFF718096),
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
                  status,
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    color: isActive
                        ? const Color(0xFF3B82F6)
                        : const Color(0xFF718096),
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

  Widget _buildReligiousInstructions() {
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
            'Religious Instructions',
            style: GoogleFonts.inter(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: const Color(0xFF2D3748),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            _patientData!['specialDirectives']['religiousInstructions'],
            style: GoogleFonts.inter(
              fontSize: 12,
              color: const Color(0xFF718096),
            ),
          ),
        ],
      ),
    );
  }

  String _getDNRStatus() {
    if (_patientData == null || _patientData!['specialDirectives'] == null)
      return 'Not specified';
    final dnr = _patientData!['specialDirectives']['dnr'] ?? false;
    return dnr ? 'Yes' : 'No';
  }

  String _getLivingWillStatus() {
    if (_patientData == null || _patientData!['specialDirectives'] == null)
      return 'Not specified';
    final livingWill =
        _patientData!['specialDirectives']['livingWill'] ?? false;
    return livingWill ? 'Yes' : 'No';
  }

  String _getOrganDonorStatus() {
    if (_patientData == null || _patientData!['specialDirectives'] == null)
      return 'Not specified';
    final organDonor =
        _patientData!['specialDirectives']['organDonor'] ?? false;
    return organDonor ? 'Yes' : 'No';
  }
}
