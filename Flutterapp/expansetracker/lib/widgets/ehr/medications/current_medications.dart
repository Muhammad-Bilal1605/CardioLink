import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../../provider/auth_provider.dart';
import '../../../services/medication_service.dart';

class CurrentMedications extends StatefulWidget {
  final String? patientId;

  const CurrentMedications({
    Key? key,
    this.patientId,
  }) : super(key: key);

  @override
  State<CurrentMedications> createState() => _CurrentMedicationsState();
}

class _CurrentMedicationsState extends State<CurrentMedications> {
  final MedicationService _service = MedicationService();
  bool _loading = false;
  String? _error;
  List<Map<String, dynamic>> _items = [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final auth = Provider.of<AuthProvider>(context, listen: false);
      final token = auth.authToken;
      final pid = widget.patientId ?? auth.currentUser?['_id'] ?? auth.currentUser?['id'];
      if (pid == null) {
        setState(() {
          _error = 'No patient selected';
          _loading = false;
        });
        return;
      }
      final list = await _service.fetchPatientMedications(patientId: pid, authToken: token);
      setState(() {
        _items = list.where((m) => (m['status']?.toString().toLowerCase() ?? 'active') != 'discontinued').toList();
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Current Medications',
                style: GoogleFonts.inter(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: const Color(0xFF2D3748),
                ),
              ),
              IconButton(
                onPressed: _openAddSheet,
                icon: const Icon(
                  Icons.add,
                  color: Color(0xFF6B8E3D),
                ),
                tooltip: 'Add Medication',
              ),
            ],
          ),
          const SizedBox(height: 12),
          if (_loading)
            const Center(child: CircularProgressIndicator())
          else if (_error != null)
            Center(child: Text(_error!))
          else if (_items.isEmpty)
            Center(
              child: Column(
                children: [
                  const Icon(Icons.info_outline, size: 36, color: Colors.grey),
                  const SizedBox(height: 8),
                  Text('No active medications', style: GoogleFonts.inter(color: Colors.grey[600])),
                ],
              ),
            )
          else
            Expanded(
              child: ListView.builder(
                itemCount: _items.length,
                itemBuilder: (context, index) {
                  final m = _items[index];
                  return _buildMedicationCard(
                    m['name'] ?? 'Medication',
                    m['dosage'] ?? 'Not specified',
                    m['frequency'] ?? 'Not specified',
                    m['reason'] ?? m['indication'] ?? '',
                  );
                },
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildMedicationCard(String name, String dosage, String frequency, String purpose) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
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
              Icons.medication,
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
                  name,
                  style: GoogleFonts.inter(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: const Color(0xFF2D3748),
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  '$dosage • $frequency',
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    color: Colors.grey[600],
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  purpose,
                  style: GoogleFonts.inter(
                    fontSize: 11,
                    color: Colors.grey[500],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  void _openAddSheet() {
    final auth = Provider.of<AuthProvider>(context, listen: false);
    final pid = widget.patientId ?? auth.currentUser?['_id'] ?? auth.currentUser?['id'];
    if (pid == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('No patient selected')));
      return;
    }

    final form = {
      'name': '',
      'dosage': '',
      'frequency': '',
      'status': 'Active',
      'reason': '',
      'startDate': DateTime.now().toIso8601String(),
      'prescribedBy': '',
      'patientId': pid,
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
                      Text('Add Medication', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w600)),
                      IconButton(
                        icon: const Icon(Icons.close),
                        onPressed: () => Navigator.pop(context),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  _textField('Name', form['name'], (v) => setSheetState(() => form['name'] = v)),
                  const SizedBox(height: 8),
                  _textField('Dosage', form['dosage'], (v) => setSheetState(() => form['dosage'] = v)),
                  const SizedBox(height: 8),
                  _textField('Frequency', form['frequency'], (v) => setSheetState(() => form['frequency'] = v)),
                  const SizedBox(height: 8),
                  _textField('Prescribed By', form['prescribedBy'], (v) => setSheetState(() => form['prescribedBy'] = v)),
                  const SizedBox(height: 8),
                  _textField('Reason', form['reason'], (v) => setSheetState(() => form['reason'] = v)),
                  const SizedBox(height: 8),
                  _dateField(
                    context: context,
                    label: 'Start Date',
                    dateIso: form['startDate'] as String,
                    onChanged: (iso) => setSheetState(() => form['startDate'] = iso),
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: () async {
                        try {
                          // Validate required fields per model
                          final missing = <String>[];
                          if ((form['name'] as String).trim().isEmpty) missing.add('Name');
                          if ((form['dosage'] as String).trim().isEmpty) missing.add('Dosage');
                          if ((form['frequency'] as String).trim().isEmpty) missing.add('Frequency');
                          if ((form['prescribedBy'] as String).trim().isEmpty) missing.add('Prescribed By');
                          if ((form['reason'] as String).trim().isEmpty) missing.add('Reason');
                          if ((form['startDate'] as String).isEmpty) missing.add('Start Date');
                          if (missing.isNotEmpty) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(content: Text('Please fill: ${missing.join(', ')}')),
                            );
                            return;
                          }
                          final created = await _service.createMedication(medication: form, authToken: auth.authToken);
                          if (mounted) {
                            setState(() {
                              _items.insert(0, created);
                            });
                            Navigator.pop(context);
                          }
                        } catch (e) {
                          if (mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to add: $e')));
                          }
                        }
                      },
                      icon: const Icon(Icons.save, size: 16),
                      label: const Text('Save Medication'),
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

  Widget _dateField({
    required BuildContext context,
    required String label,
    required String dateIso,
    required ValueChanged<String> onChanged,
  }) {
    DateTime parsed;
    try {
      parsed = DateTime.parse(dateIso);
    } catch (_) {
      parsed = DateTime.now();
    }
    final display = '${parsed.day}/${parsed.month}/${parsed.year}';
    return InkWell(
      onTap: () async {
        final picked = await showDatePicker(
          context: context,
          initialDate: parsed,
          firstDate: DateTime(1900),
          lastDate: DateTime.now().add(const Duration(days: 3650)),
        );
        if (picked != null) {
          onChanged(picked.toIso8601String());
        }
      },
      child: InputDecorator(
        decoration: const InputDecoration(
          border: OutlineInputBorder(),
          isDense: true,
        ),
        child: Row(
          children: [
            Expanded(child: Text('$label: $display', style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF2D3748)))),
            const Icon(Icons.calendar_today, size: 16),
          ],
        ),
      ),
    );
  }
}
