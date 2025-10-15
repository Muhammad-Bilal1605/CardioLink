import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../../provider/auth_provider.dart';
import '../../../services/vitals_service.dart';

class VitalsPage extends StatelessWidget {
  final String? patientId;

  const VitalsPage({
    Key? key,
    this.patientId,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context, listen: false);
    final pid = patientId ?? auth.currentUser?['_id'] ?? auth.currentUser?['id'];
    return Container(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Vital Signs',
            style: GoogleFonts.inter(
              fontSize: 20,
              fontWeight: FontWeight.w600,
              color: const Color(0xFF2D3748),
            ),
          ),
          const SizedBox(height: 16),
          Align(
            alignment: Alignment.centerRight,
            child: OutlinedButton.icon(
              onPressed: () => _openAddVitalsSheet(context, pid),
              icon: const Icon(Icons.add, size: 16),
              label: const Text('Add Vital Signs'),
            ),
          ),
          const SizedBox(height: 12),
          Expanded(
            child: GridView.count(
              crossAxisCount: 2,
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
              children: [
                _buildVitalCard('Blood Pressure', '120/80', 'Normal', Colors.green, Icons.monitor_heart),
                _buildVitalCard('Heart Rate', '72 bpm', 'Normal', Colors.green, Icons.favorite),
                _buildVitalCard('Temperature', '98.6°F', 'Normal', Colors.green, Icons.thermostat),
                _buildVitalCard('Weight', '70 kg', 'Normal', Colors.green, Icons.monitor_weight),
                _buildVitalCard('Height', '175 cm', 'Normal', Colors.green, Icons.height),
                _buildVitalCard('Oxygen', '98%', 'Normal', Colors.green, Icons.air),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildVitalCard(String title, String value, String status, Color statusColor, IconData icon) {
    return Container(
      padding: const EdgeInsets.all(16),
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
          Row(
            children: [
              Icon(
                icon,
                color: statusColor,
                size: 20,
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  title,
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                    color: Colors.grey[600],
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            value,
            style: GoogleFonts.inter(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: const Color(0xFF2D3748),
            ),
          ),
          const SizedBox(height: 4),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: statusColor.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(
              status,
              style: GoogleFonts.inter(
                fontSize: 10,
                fontWeight: FontWeight.w500,
                color: statusColor,
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _openAddVitalsSheet(BuildContext context, String? pid) {
    if (pid == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('No patient selected')));
      return;
    }

    String _defaultUnit(String type) {
      switch (type) {
        case 'blood_pressure':
          return 'mmHg';
        case 'heart_rate':
        case 'respiratory_rate':
          return 'bpm';
        case 'temperature':
          return 'C';
        case 'oxygen_saturation':
          return '%';
        case 'weight':
          return 'kg';
        case 'height':
          return 'cm';
        case 'blood_glucose':
          return 'mg/dL';
        default:
          return '';
      }
    }

    final form = {
      'vitalType': 'blood_pressure',
      'value': '',
      'unit': _defaultUnit('blood_pressure'),
      'date': DateTime.now(),
      'time': TimeOfDay.now(),
      'notes': '',
      'recordedBy': 'Patient',
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
                      Text('Add Vital Signs', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w600)),
                      IconButton(
                        icon: const Icon(Icons.close),
                        onPressed: () => Navigator.pop(context),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  // Vital Type
                  InputDecorator(
                    decoration: const InputDecoration(border: OutlineInputBorder(), isDense: true, labelText: 'Vital Type'),
                    child: DropdownButton<String>(
                      value: form['vitalType'] as String,
                      isExpanded: true,
                      underline: const SizedBox.shrink(),
                      items: const [
                        DropdownMenuItem(value: 'blood_pressure', child: Text('Blood Pressure')),
                        DropdownMenuItem(value: 'heart_rate', child: Text('Heart Rate')),
                        DropdownMenuItem(value: 'respiratory_rate', child: Text('Respiratory Rate')),
                        DropdownMenuItem(value: 'temperature', child: Text('Temperature')),
                        DropdownMenuItem(value: 'oxygen_saturation', child: Text('Oxygen Saturation')),
                        DropdownMenuItem(value: 'weight', child: Text('Weight')),
                        DropdownMenuItem(value: 'height', child: Text('Height')),
                        DropdownMenuItem(value: 'blood_glucose', child: Text('Blood Glucose')),
                      ],
                      onChanged: (v) {
                        if (v == null) return;
                        setSheetState(() {
                          form['vitalType'] = v;
                          form['unit'] = _defaultUnit(v);
                          form['value'] = '';
                        });
                      },
                    ),
                  ),
                  const SizedBox(height: 8),
                  // Value and unit
                  Row(
                    children: [
                      Expanded(child: _textField('Value', form['value'] as String, (v) => setSheetState(() => form['value'] = v))),
                      const SizedBox(width: 8),
                      SizedBox(
                        width: 90,
                        child: TextFormField(
                          initialValue: form['unit'] as String,
                          readOnly: true,
                          decoration: const InputDecoration(labelText: 'Unit', border: OutlineInputBorder(), isDense: true),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  // Date and time pickers
                  Row(
                    children: [
                      Expanded(
                        child: InkWell(
                          onTap: () async {
                            final picked = await showDatePicker(
                              context: context,
                              initialDate: form['date'] as DateTime,
                              firstDate: DateTime(1900),
                              lastDate: DateTime.now().add(const Duration(days: 3650)),
                            );
                            if (picked != null) setSheetState(() => form['date'] = picked);
                          },
                          child: InputDecorator(
                            decoration: const InputDecoration(border: OutlineInputBorder(), isDense: true, labelText: 'Date'),
                            child: Text('${(form['date'] as DateTime).day}/${(form['date'] as DateTime).month}/${(form['date'] as DateTime).year}'),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: InkWell(
                          onTap: () async {
                            final picked = await showTimePicker(context: context, initialTime: form['time'] as TimeOfDay);
                            if (picked != null) setSheetState(() => form['time'] = picked);
                          },
                          child: InputDecorator(
                            decoration: const InputDecoration(border: OutlineInputBorder(), isDense: true, labelText: 'Time'),
                            child: Text((form['time'] as TimeOfDay).format(context)),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  _textField('Recorded By', form['recordedBy'] as String, (v) => setSheetState(() => form['recordedBy'] = v)),
                  const SizedBox(height: 8),
                  _textField('Notes', form['notes'] as String, (v) => setSheetState(() => form['notes'] = v)),
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: () async {
                        // Validate
                        final missing = <String>[];
                        if ((form['value'] as String).trim().isEmpty) missing.add('Value');
                        if ((form['recordedBy'] as String).trim().isEmpty) missing.add('Recorded By');
                        if (missing.isNotEmpty) {
                          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Please fill: ${missing.join(', ')}')));
                          return;
                        }
                        // Range validation (basic)
                        bool outOfRange = false;
                        String? rangeMsg;
                        double? numValue;
                        if (form['vitalType'] != 'blood_pressure') {
                          numValue = double.tryParse(form['value'] as String);
                          if (numValue == null) {
                            ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Value must be a number')));
                            return;
                          }
                          Map<String, List<double>> ranges = {
                            'heart_rate': [30, 220],
                            'respiratory_rate': [8, 40],
                            'temperature': [34, 42],
                            'oxygen_saturation': [70, 100],
                            'weight': [1, 500],
                            'height': [30, 250],
                            'blood_glucose': [30, 500],
                          };
                          final r = ranges[form['vitalType'] as String];
                          if (r != null && (numValue < r[0] || numValue > r[1])) {
                            outOfRange = true;
                            rangeMsg = 'Value must be between ${r[0]} and ${r[1]} ${form['unit']}';
                          }
                        } else {
                          if (!(form['value'] as String).contains('/')) {
                            ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Blood pressure must be systolic/diastolic')));
                            return;
                          }
                        }
                        if (outOfRange) {
                          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(rangeMsg!)));
                          return;
                        }
                        try {
                          final auth = Provider.of<AuthProvider>(context, listen: false);
                          final service = VitalsService();
                          final DateTime dt = DateTime(
                            (form['date'] as DateTime).year,
                            (form['date'] as DateTime).month,
                            (form['date'] as DateTime).day,
                            (form['time'] as TimeOfDay).hour,
                            (form['time'] as TimeOfDay).minute,
                          );
                          final payload = {
                            'patientId': pid,
                            'date': dt.toIso8601String(),
                            'notes': form['notes'],
                            'recordedBy': form['recordedBy'],
                          };
                          final type = form['vitalType'] as String;
                          if (type == 'blood_pressure') {
                            final parts = (form['value'] as String).split('/');
                            final systolic = int.tryParse(parts.first.trim());
                            final diastolic = int.tryParse(parts.last.trim());
                            payload['bloodPressure'] = {
                              'systolic': systolic,
                              'diastolic': diastolic,
                              'unit': 'mmHg',
                            };
                          } else {
                            final mapKey = {
                              'heart_rate': 'heartRate',
                              'respiratory_rate': 'respiratoryRate',
                              'temperature': 'temperature',
                              'oxygen_saturation': 'oxygenSaturation',
                              'weight': 'weight',
                              'height': 'height',
                              'blood_glucose': 'bloodGlucose',
                            }[type];
                            payload[mapKey!] = {
                              'value': numValue,
                              'unit': form['unit'],
                            };
                          }
                          await service.createVitalSign(vitalSign: payload, authToken: auth.authToken);
                          if (context.mounted) {
                            Navigator.pop(context);
                            ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Vital signs added')));
                          }
                        } catch (e) {
                          if (context.mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to add: $e')));
                          }
                        }
                      },
                      icon: const Icon(Icons.save, size: 16),
                      label: const Text('Save Vital Signs'),
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

  Widget _numberField(String label, dynamic initialValue, ValueChanged<String> onChanged, {String? suffix}) {
    return TextFormField(
      initialValue: initialValue?.toString() ?? '',
      keyboardType: TextInputType.number,
      decoration: InputDecoration(
        labelText: label,
        border: const OutlineInputBorder(),
        isDense: true,
        suffixText: suffix,
      ),
      onChanged: onChanged,
    );
  }
}
