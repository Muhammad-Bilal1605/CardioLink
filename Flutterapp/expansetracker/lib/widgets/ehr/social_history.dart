import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../services/patient_service.dart';
import '../../provider/auth_provider.dart';

class SocialHistory extends StatefulWidget {
  final Map<String, dynamic>? patient;

  const SocialHistory({
    Key? key,
    this.patient,
  }) : super(key: key);

  @override
  State<SocialHistory> createState() => _SocialHistoryState();
}

class _SocialHistoryState extends State<SocialHistory> {
  bool _saving = false;
  Map<String, dynamic>? _localPatient;

  @override
  Widget build(BuildContext context) {
    final patient = _localPatient ?? widget.patient;
    final auth = Provider.of<AuthProvider>(context, listen: false);
    final resolvedPatientId = (patient?['_id'] ?? patient?['id'] ?? auth.currentUser?['_id'] ?? auth.currentUser?['id'])?.toString();
    final hasSocial = patient != null && patient['socialHistory'] != null;
    return Container(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Social History',
                style: GoogleFonts.inter(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: const Color(0xFF2D3748),
                ),
              ),
              TextButton.icon(
                onPressed: _saving ? null : () => _openEditSheet(context, explicitPatientId: resolvedPatientId),
                icon: const Icon(Icons.edit, size: 16),
                label: Text(_saving ? 'Saving...' : (hasSocial ? 'Edit' : 'Add')),
              ),
            ],
          ),
          const SizedBox(height: 16),
          if (hasSocial) ...[
            _buildSocialItem('Tobacco Use', _getTobaccoUse()),
            _buildSocialItem('Alcohol Use', _getAlcoholUse()),
            _buildSocialItem('Drug Use', _getDrugUse()),
            _buildSocialItem('Occupation', patient['socialHistory']['occupation'] ?? 'Not specified'),
          ] else ...[
            Column(
              children: [
                const Center(
                  child: Text('No social history data available'),
                ),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton.icon(
                    onPressed: _saving ? null : () => _openEditSheet(context, explicitPatientId: resolvedPatientId),
                    icon: const Icon(Icons.add, size: 16),
                    label: const Text('Add Social History'),
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildSocialItem(String title, String value) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 4,
            offset: const Offset(0, 1),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: const Color(0xFF6B8E3D).withOpacity(0.1),
              borderRadius: BorderRadius.circular(6),
            ),
            child: const Icon(
              Icons.person,
              color: Color(0xFF6B8E3D),
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
                const SizedBox(height: 2),
                Text(
                  value,
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    color: Colors.grey[600],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  String _getTobaccoUse() {
    final patient = widget.patient;
    if (patient == null || patient['socialHistory'] == null) return 'Not specified';
    final socialHistory = patient['socialHistory'];
    final tobaccoUse = socialHistory['tobaccoUse'] ?? 'Never';
    if (tobaccoUse == 'Never') return 'Never used tobacco';
    return '$tobaccoUse - ${socialHistory['tobaccoType'] ?? 'Not specified'}';
  }

  String _getAlcoholUse() {
    final patient = widget.patient;
    if (patient == null || patient['socialHistory'] == null) return 'Not specified';
    final socialHistory = patient['socialHistory'];
    final alcoholUse = socialHistory['alcoholUse'] ?? 'Never';
    if (alcoholUse == 'Never') return 'Never used alcohol';
    return '$alcoholUse - ${socialHistory['alcoholType'] ?? 'Not specified'}';
  }

  String _getDrugUse() {
    final patient = widget.patient;
    if (patient == null || patient['socialHistory'] == null) return 'Not specified';
    final socialHistory = patient['socialHistory'];
    final drugUse = socialHistory['illicitDrugUse'] ?? 'Never';
    if (drugUse == 'Never') return 'Never used illicit drugs';
    return '$drugUse - ${socialHistory['drugType'] ?? 'Not specified'}';
  }

  void _openEditSheet(BuildContext context, {String? explicitPatientId}) {
    final existing = Map<String, dynamic>.from(widget.patient?['socialHistory'] ?? {});
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
                      onPressed: _saving ? null : () async {
                        setState(() => _saving = true);
                        try {
                          final auth = Provider.of<AuthProvider>(context, listen: false);
                          final service = PatientService();
                          // Resolve patientId: explicit from caller, widget, or auth
                          final patientId = explicitPatientId ?? (widget.patient?['_id'] ?? widget.patient?['id'] ?? auth.currentUser?['_id'] ?? auth.currentUser?['id']).toString();
                          final updated = await service.updateSocialHistory(
                            patientId: patientId,
                            socialHistory: form,
                            authToken: auth.authToken,
                          );
                          // Update local patient map if possible
                          if (mounted) {
                            setState(() {
                              // Build a local copy to reflect in UI
                              final local = Map<String, dynamic>.from(widget.patient ?? <String, dynamic>{});
                              local['socialHistory'] = updated['socialHistory'] ?? form;
                              // Rebuild by replacing via Navigator pop + callback is not available, so set State uses local only
                              // You likely consume this widget with fresh patient after refetch; for now, we reflect using local variable
                              // by reassigning to a field is not possible since widget.patient is final
                              // Instead, we temporarily store in a private field
                              _localPatient = local;
                              _saving = false;
                            });
                            Navigator.pop(context);
                          }
                        } catch (e) {
                          if (mounted) {
                            setState(() => _saving = false);
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(content: Text('Failed to update: $e')),
                            );
                          }
                        }
                      },
                      icon: const Icon(Icons.save, size: 16),
                      label: Text(_saving ? 'Saving...' : 'Save Changes'),
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
      decoration: InputDecoration(
        labelText: label,
        border: const OutlineInputBorder(),
        isDense: true,
      ),
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
