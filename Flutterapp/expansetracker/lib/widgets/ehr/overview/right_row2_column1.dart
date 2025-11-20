import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../../provider/auth_provider.dart';
import '../../../config/api_config.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;
import '../../../services/patient_service.dart';

class RightRow2Column1 extends StatefulWidget {
  final String? patientId;

  const RightRow2Column1({
    Key? key,
    this.patientId,
  }) : super(key: key);

  @override
  _RightRow2Column1State createState() => _RightRow2Column1State();
}

class _RightRow2Column1State extends State<RightRow2Column1> {
  Map<String, dynamic> _allergyData = {
    'medicinal': [],
    'environmental': [],
    'food': []
  };
  bool _loading = false;
  String? _error;
  Map<String, bool> _expandedCategories = {
    'medicinal': true,
    'environmental': true,
    'food': true
  };

  @override
  void initState() {
    super.initState();
    _loadAllergies();
  }

  Future<void> _loadAllergies() async {
    if (widget.patientId == null) return;

    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      print(
          'RightRow2Column1 - Loading allergies for patient: ${widget.patientId}');

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

      print(
          'RightRow2Column1 - Allergies API response: ${response.statusCode}');
      print('RightRow2Column1 - Allergies response body: ${response.body}');

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        print('RightRow2Column1 - Allergies data: $data');

        if (data['success'] == true && data['data'] != null) {
          final patient = data['data'];

          setState(() {
            if (patient['allergies'] != null) {
              _allergyData = {
                'medicinal': patient['allergies']['medicinal'] ?? [],
                'environmental': patient['allergies']['environmental'] ?? [],
                'food': patient['allergies']['food'] ?? []
              };
            } else {
              _allergyData = {'medicinal': [], 'environmental': [], 'food': []};
            }
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
          _error = 'Failed to load allergies data';
          _loading = false;
        });
      }
    } catch (e) {
      setState(() {
        _error = 'Error loading allergies: $e';
        _loading = false;
      });
      print('RightRow2Column1 - Error loading allergies: $e');
    }
  }

  void _toggleCategory(String category) {
    setState(() {
      _expandedCategories[category] = !(_expandedCategories[category] ?? false);
    });
  }

  bool _hasAllergies() {
    return _allergyData.values
        .any((category) => category is List && category.isNotEmpty);
  }

  String _formatCategoryName(String category) {
    return category[0].toUpperCase() + category.substring(1);
  }

  Color _getCriticalityColor(String criticality) {
    switch (criticality?.toLowerCase()) {
      case 'high':
        return Colors.red;
      case 'medium':
        return Colors.orange;
      case 'low':
        return Colors.green;
      default:
        return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity, // Take full width for mobile
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
                Text(
                  'Allergies',
                  style: GoogleFonts.inter(
                    fontSize: 18,
                    fontWeight: FontWeight.w600,
                    color: const Color(0xFF2D3748),
                  ),
                ),
                TextButton.icon(
                  onPressed: () => _openAddAllergySheet(context),
                  icon: const Icon(Icons.add, size: 16),
                  label: const Text('Add Allergy'),
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

  void _openAddAllergySheet(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context, listen: false);
    final patientId =
        widget.patientId ?? auth.currentUser?['_id'] ?? auth.currentUser?['id'];
    if (patientId == null) {
      ScaffoldMessenger.of(context)
          .showSnackBar(const SnackBar(content: Text('No patient selected')));
      return;
    }

    final form = {
      'category': 'medicinal',
      'name': '',
      'reaction': '',
      'criticality': 'Medium',
      'notes': '',
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
                      Text('Add Allergy',
                          style: GoogleFonts.inter(
                              fontSize: 16, fontWeight: FontWeight.w600)),
                      IconButton(
                          icon: const Icon(Icons.close),
                          onPressed: () => Navigator.pop(context)),
                    ],
                  ),
                  const SizedBox(height: 12),
                  // Category
                  InputDecorator(
                    decoration: const InputDecoration(
                        border: OutlineInputBorder(),
                        isDense: true,
                        labelText: 'Category'),
                    child: DropdownButton<String>(
                      value: form['category'] as String,
                      isExpanded: true,
                      underline: const SizedBox.shrink(),
                      items: const [
                        DropdownMenuItem(
                            value: 'medicinal', child: Text('Medicinal')),
                        DropdownMenuItem(
                            value: 'environmental',
                            child: Text('Environmental')),
                        DropdownMenuItem(value: 'food', child: Text('Food')),
                      ],
                      onChanged: (v) => setSheetState(
                          () => form['category'] = v ?? 'medicinal'),
                    ),
                  ),
                  const SizedBox(height: 8),
                  // Fields
                  _textField('Name', form['name'] as String,
                      (v) => setSheetState(() => form['name'] = v)),
                  const SizedBox(height: 8),
                  _textField('Reaction', form['reaction'] as String,
                      (v) => setSheetState(() => form['reaction'] = v)),
                  const SizedBox(height: 8),
                  InputDecorator(
                    decoration: const InputDecoration(
                        border: OutlineInputBorder(),
                        isDense: true,
                        labelText: 'Criticality'),
                    child: DropdownButton<String>(
                      value: form['criticality'] as String,
                      isExpanded: true,
                      underline: const SizedBox.shrink(),
                      items: const [
                        DropdownMenuItem(value: 'Low', child: Text('Low')),
                        DropdownMenuItem(
                            value: 'Medium', child: Text('Medium')),
                        DropdownMenuItem(value: 'High', child: Text('High')),
                      ],
                      onChanged: (v) => setSheetState(
                          () => form['criticality'] = v ?? 'Medium'),
                    ),
                  ),
                  const SizedBox(height: 8),
                  _textField('Notes', form['notes'] as String,
                      (v) => setSheetState(() => form['notes'] = v)),
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: () async {
                        // Basic validation
                        if ((form['name'] as String).trim().isEmpty) {
                          ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                  content: Text('Name is required')));
                          return;
                        }
                        try {
                          final auth =
                              Provider.of<AuthProvider>(context, listen: false);
                          final service = PatientService();
                          // Merge new allergy into existing structure
                          final current = {
                            'medicinal': List<Map<String, dynamic>>.from(
                                _allergyData['medicinal'] ?? []),
                            'environmental': List<Map<String, dynamic>>.from(
                                _allergyData['environmental'] ?? []),
                            'food': List<Map<String, dynamic>>.from(
                                _allergyData['food'] ?? []),
                          };
                          final category = form['category'] as String;
                          current[category]!.add({
                            'name': form['name'],
                            'reaction': form['reaction'],
                            'criticality': form['criticality'],
                            'notes': form['notes'],
                          });
                          final updated = await service.updateAllergies(
                            patientId: patientId,
                            allergies: current,
                            authToken: auth.authToken,
                          );
                          if (mounted) {
                            setState(() {
                              _allergyData = {
                                'medicinal': updated['allergies']
                                        ?['medicinal'] ??
                                    current['medicinal'],
                                'environmental': updated['allergies']
                                        ?['environmental'] ??
                                    current['environmental'],
                                'food': updated['allergies']?['food'] ??
                                    current['food'],
                              };
                            });
                            Navigator.pop(context);
                            ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(content: Text('Allergy added')));
                          }
                        } catch (e) {
                          if (mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(content: Text('Failed to add: $e')));
                          }
                        }
                      },
                      icon: const Icon(Icons.save, size: 16),
                      label: const Text('Save Allergy'),
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

  Widget _textField(
      String label, String initialValue, ValueChanged<String> onChanged) {
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

  Widget _buildContent() {
    if (_loading) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircularProgressIndicator(),
            SizedBox(height: 16),
            Text('Loading allergies...'),
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
              onPressed: _loadAllergies,
              child: const Text('Retry'),
            ),
          ],
        ),
      );
    }

    if (!_hasAllergies()) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.info_outline, size: 48, color: Colors.grey),
            const SizedBox(height: 16),
            Text(
              'No allergies data available',
              style: GoogleFonts.inter(color: Colors.grey[600]),
            ),
          ],
        ),
      );
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: _allergyData.entries.map((entry) {
          final category = entry.key;
          final items = entry.value as List;

          if (items.isEmpty) return const SizedBox.shrink();

          return _buildCategorySection(category, items);
        }).toList(),
      ),
    );
  }

  Widget _buildCategorySection(String category, List items) {
    final isExpanded = _expandedCategories[category] ?? false;

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        border: Border.all(color: const Color(0xFFE2E8F0)),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        children: [
          // Category header
          InkWell(
            onTap: () => _toggleCategory(category),
            borderRadius: const BorderRadius.only(
              topLeft: Radius.circular(8),
              topRight: Radius.circular(8),
            ),
            child: Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFF7FAFC),
                borderRadius: const BorderRadius.only(
                  topLeft: Radius.circular(8),
                  topRight: Radius.circular(8),
                ),
              ),
              child: Row(
                children: [
                  Icon(
                    isExpanded ? Icons.expand_less : Icons.expand_more,
                    size: 16,
                    color: const Color(0xFF4A5568),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    _formatCategoryName(category),
                    style: GoogleFonts.inter(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: const Color(0xFF2D3748),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: const Color(0xFFE2E8F0),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Text(
                      '${items.length}',
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                        color: const Color(0xFF4A5568),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Category items
          if (isExpanded)
            Container(
              padding: const EdgeInsets.all(12),
              child: Column(
                children: items
                    .map<Widget>((item) => _buildAllergyItem(item))
                    .toList(),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildAllergyItem(Map<String, dynamic> item) {
    final criticality = item['criticality'] ?? 'Unknown';
    final criticalityColor = _getCriticalityColor(criticality);

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFFF7FAFC),
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item['name'] ?? 'Unknown',
                  style: GoogleFonts.inter(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: const Color(0xFF2D3748),
                  ),
                ),
                if (item['reaction'] != null &&
                    item['reaction'].isNotEmpty) ...[
                  const SizedBox(height: 4),
                  Text(
                    'Reaction: ${item['reaction']}',
                    style: GoogleFonts.inter(
                      fontSize: 12,
                      color: const Color(0xFF718096),
                    ),
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(width: 12),
          // Criticality indicator
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: criticalityColor.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: criticalityColor.withOpacity(0.3)),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 6,
                  height: 6,
                  decoration: BoxDecoration(
                    color: criticalityColor,
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 4),
                Text(
                  criticality,
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                    color: criticalityColor,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActivityItem(
      String title, String doctor, String date, IconData icon) {
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
                const SizedBox(height: 2),
                Text(
                  doctor,
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    color: Colors.grey[600],
                  ),
                ),
              ],
            ),
          ),
          Text(
            date,
            style: GoogleFonts.inter(
              fontSize: 10,
              color: Colors.grey[500],
            ),
          ),
        ],
      ),
    );
  }
}
