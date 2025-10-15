import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../imaging/imaging_card.dart';
import '../imaging/imaging_details_sheet.dart';
import '../labs/lab_card.dart';
import '../labs/lab_details_sheet.dart';
import '../procedures/procedure_card.dart';
import '../procedures/procedure_details_sheet.dart';
import '../../../services/imaging_service.dart';
import '../../../services/labs_service.dart';
import '../../../services/procedures_service.dart';
import 'package:provider/provider.dart';
import '../../../provider/auth_provider.dart';
import 'hospitalization_status_badge.dart';

class HospitalizationDetailsPage extends StatefulWidget {
  final Map<String, dynamic> hospitalization;

  const HospitalizationDetailsPage({
    super.key,
    required this.hospitalization,
  });

  @override
  State<HospitalizationDetailsPage> createState() => _HospitalizationDetailsPageState();
}

class _HospitalizationDetailsPageState extends State<HospitalizationDetailsPage>
    with TickerProviderStateMixin {
  late final TabController _tabController;
  final ImagingService _imagingService = ImagingService();
  final LabsService _labsService = LabsService();
  final ProceduresService _proceduresService = ProceduresService();

  bool _loadingAssoc = false;
  String? _assocError;
  List<Map<String, dynamic>> _assocImaging = [];
  List<Map<String, dynamic>> _assocLabs = [];
  List<Map<String, dynamic>> _assocProcedures = [];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
    _loadAssociated();
  }

  String _formatDate(dynamic dateValue) {
    if (dateValue == null) return 'Not provided';
    try {
      final date = DateTime.parse(dateValue.toString());
      return '${date.day}/${date.month}/${date.year}';
    } catch (_) {
      return dateValue.toString();
    }
  }

  Future<void> _loadAssociated() async {
    setState(() {
      _loadingAssoc = true;
      _assocError = null;
    });

    try {
      final auth = Provider.of<AuthProvider>(context, listen: false);
      final token = auth.authToken;
      final rawImaging = (widget.hospitalization['associatedImaging'] as List?) ?? const <dynamic>[];
      final rawLabs = (widget.hospitalization['associatedLabResults'] as List?) ?? const <dynamic>[];
      final rawProcs = (widget.hospitalization['associatedProcedures'] as List?) ?? const <dynamic>[];

      final imaging = <Map<String, dynamic>>[];
      for (final entry in rawImaging) {
        try {
          if (entry is String) {
            final item = await _imagingService.fetchImagingById(imagingId: entry, authToken: token);
            imaging.add(item);
          } else if (entry is Map) {
            final map = Map<String, dynamic>.from(entry);
            // If it's already a full object (has typical fields), use it directly
            if (map.containsKey('type') || map.containsKey('imageUrl')) {
              imaging.add(map);
            } else if (map['_id'] is String) {
              final item = await _imagingService.fetchImagingById(imagingId: map['_id'] as String, authToken: token);
              imaging.add(item);
            }
          }
        } catch (_) {}
      }

      final labs = <Map<String, dynamic>>[];
      for (final entry in rawLabs) {
        try {
          if (entry is String) {
            final item = await _labsService.fetchLabById(labId: entry, authToken: token);
            labs.add(item);
          } else if (entry is Map) {
            final map = Map<String, dynamic>.from(entry);
            if (map.containsKey('testName') || map.containsKey('reportUrl')) {
              labs.add(map);
            } else if (map['_id'] is String) {
              final item = await _labsService.fetchLabById(labId: map['_id'] as String, authToken: token);
              labs.add(item);
            }
          }
        } catch (_) {}
      }

      final procs = <Map<String, dynamic>>[];
      for (final entry in rawProcs) {
        try {
          if (entry is String) {
            final item = await _proceduresService.fetchProcedureById(procedureId: entry, authToken: token);
            procs.add(item);
          } else if (entry is Map) {
            final map = Map<String, dynamic>.from(entry);
            if (map.containsKey('procedureName') || map.containsKey('findings')) {
              procs.add(map);
            } else if (map['_id'] is String) {
              final item = await _proceduresService.fetchProcedureById(procedureId: map['_id'] as String, authToken: token);
              procs.add(item);
            }
          }
        } catch (_) {}
      }

      setState(() {
        _assocImaging = imaging;
        _assocLabs = labs;
        _assocProcedures = procs;
        _loadingAssoc = false;
      });
    } catch (e) {
      setState(() {
        _assocError = e.toString();
        _loadingAssoc = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final hosp = widget.hospitalization;
    return Scaffold(
      appBar: AppBar(
        backgroundColor: const Color(0xFF6B8E3D),
        elevation: 0,
        title: Text('Hospitalization Details', style: GoogleFonts.inter(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 18)),
      ),
      body: Column(
        children: [
          _header(hosp),
          TabBar(
            controller: _tabController,
            isScrollable: true,
            indicatorColor: const Color(0xFF6B8E3D),
            labelColor: const Color(0xFF6B8E3D),
            unselectedLabelColor: Colors.grey[600],
            tabs: const [
              Tab(text: 'Summary', icon: Icon(Icons.notes)),
              Tab(text: 'Imaging', icon: Icon(Icons.camera_alt)),
              Tab(text: 'Lab Results', icon: Icon(Icons.science)),
              Tab(text: 'Procedures', icon: Icon(Icons.medical_information)),
            ],
          ),
          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: [
                _summaryTab(hosp),
                _assocListTab(_assocImaging, _loadingAssoc, _assocError, (item) => ImagingCard(imaging: item, onOpen: _openImagingDetails)),
                _assocListTab(_assocLabs, _loadingAssoc, _assocError, (item) => LabCard(lab: item, onOpen: _openLabDetails)),
                _assocListTab(_assocProcedures, _loadingAssoc, _assocError, (item) => ProcedureCard(procedure: item, onOpen: _openProcedureDetails)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _header(Map<String, dynamic> hosp) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      color: const Color(0xFFF5F9FF),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  (hosp['reason']?.toString().isNotEmpty ?? false) ? hosp['reason'].toString() : 'Hospitalization',
                  style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.w700, color: const Color(0xFF2D3748)),
                ),
                const SizedBox(height: 4),
                Text(
                  '${_formatDate(hosp['date'])} • ${hosp['hospital'] ?? 'Unknown Hospital'}',
                  style: GoogleFonts.inter(fontSize: 12, color: Colors.grey[600]),
                ),
              ],
            ),
          ),
          HospitalizationStatusBadge(status: hosp['status']?.toString() ?? 'Unknown'),
        ],
      ),
    );
  }

  Widget _summaryTab(Map<String, dynamic> hosp) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _kv('Admission Type', hosp['admissionType']?.toString()),
          _kv('Attending Physician', hosp['attendingPhysician']?.toString()),
          _kv('Duration of Stay', hosp['durationOfStay']?.toString()),
          _kv('Outcome', hosp['outcome']?.toString()),
          const SizedBox(height: 12),
          _section('Reason', hosp['reason']),
          _section('Discharge Summary', hosp['dischargeSummary']),
          _section('Notes', hosp['notes']),
          const SizedBox(height: 12),
          _proceduresDone(hosp['proceduresDone']),
        ],
      ),
    );
  }

  Widget _assocListTab(
    List<Map<String, dynamic>> items,
    bool loading,
    String? error,
    Widget Function(Map<String, dynamic>) builder,
  ) {
    if (loading) {
      return const Center(child: CircularProgressIndicator());
    }
    if (error != null) {
      return Center(child: Text(error));
    }
    if (items.isEmpty) {
      return const Center(child: Text('No associated items'));
    }
    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: items.length,
      separatorBuilder: (_, __) => const SizedBox(height: 8),
      itemBuilder: (_, i) => builder(items[i]),
    );
  }

  

  Widget _kv(String label, String? value) {
    if (value == null || value.isEmpty) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(width: 140, child: Text(label, style: GoogleFonts.inter(fontSize: 12, color: Colors.grey[600], fontWeight: FontWeight.w500))),
          Expanded(child: Text(value, style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: const Color(0xFF2D3748)))),
        ],
      ),
    );
  }

  Widget _section(String title, dynamic value) {
    final text = value?.toString() ?? '';
    if (text.isEmpty) return const SizedBox.shrink();
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(12),
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(color: Colors.grey.shade50, borderRadius: BorderRadius.circular(8)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: const Color(0xFF2D3748))),
          const SizedBox(height: 4),
          Text(text, style: GoogleFonts.inter(fontSize: 12, color: Colors.grey[700])),
        ],
      ),
    );
  }

  void _openImagingDetails(Map<String, dynamic> imaging) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (_) => Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
        child: ImagingDetailsSheet(imaging: imaging),
      ),
    );
  }

  void _openLabDetails(Map<String, dynamic> lab) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (_) => Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
        child: LabDetailsSheet(lab: lab),
      ),
    );
  }

  void _openProcedureDetails(Map<String, dynamic> procedure) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (_) => Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
        child: ProcedureDetailsSheet(procedure: procedure),
      ),
    );
  }

  Widget _proceduresDone(dynamic value) {
    if (value == null) return const SizedBox.shrink();
    final list = (value as List?)?.map((e) => e.toString()).where((e) => e.isNotEmpty).toList() ?? const <String>[];
    if (list.isEmpty) return const SizedBox.shrink();
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(12),
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(color: Colors.grey.shade50, borderRadius: BorderRadius.circular(8)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Procedures Done', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: const Color(0xFF2D3748))),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: list
                .map((p) => Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: Colors.grey.shade300),
                      ),
                      child: Text(p, style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF2D3748))),
                    ))
                .toList(),
          ),
        ],
      ),
    );
  }
}


