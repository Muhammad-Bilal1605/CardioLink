import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

import '../../../provider/auth_provider.dart';
import '../../../services/hospitalization_service.dart';
import 'hospitalization_card.dart';
import 'hospitalization_details_page.dart';

class HospitalizationList extends StatefulWidget {
  final String? patientId;

  const HospitalizationList({
    super.key,
    this.patientId,
  });

  @override
  State<HospitalizationList> createState() => _HospitalizationListState();
}

class _HospitalizationListState extends State<HospitalizationList> {
  final HospitalizationService _service = HospitalizationService();
  bool _loading = false;
  String? _error;
  List<Map<String, dynamic>> _items = [];
  String _query = '';
  String _status = 'all';

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

      final list = await _service.fetchPatientHospitalizations(patientId: pid, authToken: token);
      setState(() {
        _items = list;
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  List<Map<String, dynamic>> get _filtered {
    final q = _query.trim().toLowerCase();
    return _items.where((e) {
      final statusOk = _status == 'all' || (e['status']?.toString().toLowerCase() == _status);
      if (!statusOk) return false;
      if (q.isEmpty) return true;
      final hay = [
        e['reason'],
        e['hospital'],
        e['admittingPhysician'],
        e['department'],
        e['clinicalSummary'],
      ].whereType<String>().map((s) => s.toLowerCase()).join(' ');
      return hay.contains(q);
    }).toList();
  }

  void _openDetails(Map<String, dynamic> hosp) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => HospitalizationDetailsPage(hospitalization: hosp),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Center(child: CircularProgressIndicator());
    }
    if (_error != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 48, color: Colors.red),
            const SizedBox(height: 12),
            Text(
              'Failed to load hospitalizations',
              style: GoogleFonts.inter(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: const Color(0xFF2D3748),
              ),
            ),
            const SizedBox(height: 8),
            Text(
              _error!,
              style: GoogleFonts.inter(
                fontSize: 13,
                color: Colors.grey[600],
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 12),
            ElevatedButton(
              onPressed: _load,
              child: const Text('Retry'),
            )
          ],
        ),
      );
    }

    if (_items.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.local_hospital, size: 48, color: Colors.grey),
            const SizedBox(height: 12),
            Text(
              'No hospitalizations found',
              style: GoogleFonts.inter(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: Colors.grey[600],
              ),
            ),
          ],
        ),
      );
    }

    return Column(
      children: [
        _toolbar(),
        const SizedBox(height: 8),
        Align(
          alignment: Alignment.centerLeft,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8),
            child: Text(
              'Total: ${_filtered.length}',
              style: GoogleFonts.inter(fontSize: 12, color: Colors.grey[600]),
            ),
          ),
        ),
        const SizedBox(height: 8),
        Expanded(
          child: ListView.builder(
            itemCount: _filtered.length,
            itemBuilder: (context, index) {
              final item = _filtered[index];
              return HospitalizationCard(
                hosp: item,
                onOpen: _openDetails,
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _toolbar() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 8),
      child: Row(
        children: [
          Expanded(
            child: TextField(
              decoration: const InputDecoration(
                isDense: true,
                prefixIcon: Icon(Icons.search),
                hintText: 'Search hospitalizations...',
                border: OutlineInputBorder(),
              ),
              onChanged: (v) => setState(() => _query = v),
            ),
          ),
          const SizedBox(width: 8),
          DropdownButton<String>(
            value: _status,
            items: const [
              DropdownMenuItem(value: 'all', child: Text('All')),
              DropdownMenuItem(value: 'admitted', child: Text('Admitted')),
              DropdownMenuItem(value: 'in treatment', child: Text('In Treatment')),
              DropdownMenuItem(value: 'discharged', child: Text('Discharged')),
              DropdownMenuItem(value: 'cancelled', child: Text('Cancelled')),
            ],
            onChanged: (v) => setState(() => _status = v ?? 'all'),
          ),
        ],
      ),
    );
  }
}


