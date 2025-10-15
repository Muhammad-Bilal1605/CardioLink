import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../provider/auth_provider.dart';
import '../widgets/ehr/visits/visit_details.dart';
import '../widgets/ehr/visits/visit_filters.dart';
import '../services/visit_service.dart';

class VisitsScreen extends StatefulWidget {
  final String? patientId;

  const VisitsScreen({
    Key? key,
    this.patientId,
  }) : super(key: key);

  @override
  _VisitsScreenState createState() => _VisitsScreenState();
}

class _VisitsScreenState extends State<VisitsScreen> {
  List<Map<String, dynamic>> _visits = [];
  List<Map<String, dynamic>> _filteredVisits = [];
  bool _loading = false;
  String? _error;
  Map<String, dynamic>? _selectedVisit;
  bool _showFilters = false;
  Map<String, dynamic> _filters = {
    'visitType': [],
    'department': [],
    'dateRange': 'all',
    'visitStatus': [],
    'customDateStart': '',
    'customDateEnd': '',
  };

  @override
  void initState() {
    super.initState();
    _loadVisits();
  }

  Future<void> _loadVisits() async {
    if (widget.patientId == null) return;
    
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      print('VisitsScreen - Loading visits for: ${widget.patientId}');
      
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final authToken = authProvider.authToken;
      
      final visitService = VisitService();
      final visits = await visitService.fetchPatientVisits(widget.patientId!, authToken);
      
      setState(() {
        _visits = visits;
        _filteredVisits = visits;
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'Error loading visits: $e';
        _loading = false;
      });
      print('VisitsScreen - Error loading visits: $e');
    }
  }

  void _applyFilters(Map<String, dynamic> filters) {
    setState(() {
      _filters = filters;
    });
    
    List<Map<String, dynamic>> results = List.from(_visits);

    // Apply visit type filter
    if (filters['visitType'].isNotEmpty) {
      results = results.where((visit) => 
        filters['visitType'].contains(visit['type'])).toList();
    }

    // Apply department filter
    if (filters['department'].isNotEmpty) {
      results = results.where((visit) => 
        filters['department'].contains(visit['department'])).toList();
    }

    // Apply visit status filter
    if (filters['visitStatus'].isNotEmpty) {
      results = results.where((visit) => 
        filters['visitStatus'].contains(visit['status'])).toList();
    }

    // Apply date range filter
    if (filters['dateRange'] != 'all') {
      final today = DateTime.now();
      today.copyWith(hour: 0, minute: 0, second: 0, millisecond: 0);

      if (filters['dateRange'] == 'today') {
        results = results.where((visit) {
          final visitDate = DateTime.parse(visit['date']);
          return visitDate.year == today.year && 
                 visitDate.month == today.month && 
                 visitDate.day == today.day;
        }).toList();
      } else if (filters['dateRange'] == 'week') {
        final weekAgo = today.subtract(const Duration(days: 7));
        results = results.where((visit) {
          final visitDate = DateTime.parse(visit['date']);
          return visitDate.isAfter(weekAgo) && visitDate.isBefore(today.add(const Duration(days: 1)));
        }).toList();
      } else if (filters['dateRange'] == 'month') {
        final monthAgo = DateTime(today.year, today.month - 1, today.day);
        results = results.where((visit) {
          final visitDate = DateTime.parse(visit['date']);
          return visitDate.isAfter(monthAgo) && visitDate.isBefore(today.add(const Duration(days: 1)));
        }).toList();
      } else if (filters['dateRange'] == 'custom' && 
                 filters['customDateStart'].isNotEmpty && 
                 filters['customDateEnd'].isNotEmpty) {
        final startDate = DateTime.parse(filters['customDateStart']);
        final endDate = DateTime.parse(filters['customDateEnd']).add(const Duration(days: 1));
        results = results.where((visit) {
          final visitDate = DateTime.parse(visit['date']);
          return visitDate.isAfter(startDate) && visitDate.isBefore(endDate);
        }).toList();
      }
    }

    setState(() {
      _filteredVisits = results;
    });
  }

  void _clearFilters() {
    final resetFilters = {
      'visitType': [],
      'department': [],
      'dateRange': 'all',
      'visitStatus': [],
      'customDateStart': '',
      'customDateEnd': '',
    };
    _applyFilters(resetFilters);
  }

  int _getActiveFilterCount() {
    int count = 0;
    count += (_filters['visitType'] as List).length;
    count += (_filters['department'] as List).length;
    count += (_filters['visitStatus'] as List).length;
    if (_filters['dateRange'] != 'all') count += 1;
    return count;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: const Color(0xFF6B8E3D),
        elevation: 0,
        title: Text(
          'Patient Visits',
          style: GoogleFonts.inter(
            color: Colors.white,
            fontWeight: FontWeight.w600,
            fontSize: 18,
          ),
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.filter_list, color: Colors.white),
            onPressed: () {
              setState(() {
                _showFilters = !_showFilters;
              });
            },
          ),
        ],
      ),
      body: Container(
        color: const Color(0xFFF5F9FF),
        child: Column(
          children: [
            // Filter Section
            if (_showFilters) ...[
              Container(
                margin: const EdgeInsets.all(16),
                child: VisitFilters(
                  onFilterChange: _applyFilters,
                  onClearFilters: _clearFilters,
                  activeFilterCount: _getActiveFilterCount(),
                ),
              ),
            ],
            
            // Active Filters Pills
            if (_getActiveFilterCount() > 0) ...[
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: [
                      ..._filters['visitType'].map<Widget>((type) => 
                        _buildFilterPill(type, 'visitType', Colors.green)),
                      ..._filters['department'].map<Widget>((dept) => 
                        _buildFilterPill(dept, 'department', Colors.blue)),
                      ..._filters['visitStatus'].map<Widget>((status) => 
                        _buildFilterPill(status, 'visitStatus', Colors.purple)),
                      if (_filters['dateRange'] != 'all')
                        _buildFilterPill(_getDateRangeLabel(), 'dateRange', Colors.amber),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 8),
            ],
            
            // Visits Content
            Expanded(
              child: _selectedVisit != null
                  ? VisitDetails(
                      visit: _selectedVisit!,
                      onClose: () {
                        setState(() {
                          _selectedVisit = null;
                        });
                      },
                    )
                  : _buildVisitsList(),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFilterPill(String label, String filterType, Color color) {
    return Container(
      margin: const EdgeInsets.only(right: 8),
      child: Chip(
        label: Text(
          label,
          style: GoogleFonts.inter(
            fontSize: 12,
            color: color,
            fontWeight: FontWeight.w500,
          ),
        ),
        backgroundColor: color.withOpacity(0.1),
        deleteIcon: Icon(Icons.close, size: 16, color: color),
        onDeleted: () {
          if (filterType == 'dateRange') {
            _applyFilters({..._filters, 'dateRange': 'all'});
          } else {
            final updatedFilters = {..._filters};
            updatedFilters[filterType] = List.from(updatedFilters[filterType])
              ..remove(label);
            _applyFilters(updatedFilters);
          }
        },
      ),
    );
  }

  String _getDateRangeLabel() {
    switch (_filters['dateRange']) {
      case 'today':
        return 'Today';
      case 'week':
        return 'Past Week';
      case 'month':
        return 'Past Month';
      case 'custom':
        return 'Custom Date';
      default:
        return 'All Time';
    }
  }

  Widget _buildVisitsList() {
    if (_loading) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircularProgressIndicator(),
            SizedBox(height: 16),
            Text('Loading visits...'),
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
              onPressed: _loadVisits,
              child: const Text('Retry'),
            ),
          ],
        ),
      );
    }

    if (_filteredVisits.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.medical_services, size: 48, color: Colors.grey),
            const SizedBox(height: 16),
            Text(
              _visits.isEmpty ? 'No visits found' : 'No visits match your filters',
              style: GoogleFonts.inter(
                fontSize: 16,
                fontWeight: FontWeight.w500,
                color: Colors.grey[600],
              ),
            ),
            const SizedBox(height: 8),
            Text(
              _visits.isEmpty 
                ? 'This patient has no recorded visits yet.'
                : 'Try adjusting your filters to see more results.',
              style: GoogleFonts.inter(color: Colors.grey[500]),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _filteredVisits.length,
      itemBuilder: (context, index) {
        final visit = _filteredVisits[index];
        return _buildVisitCard(visit);
      },
    );
  }

  Widget _buildVisitCard(Map<String, dynamic> visit) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
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
      child: InkWell(
        onTap: () {
          setState(() {
            _selectedVisit = visit;
          });
        },
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: const Color(0xFF6B8E3D).withOpacity(0.1),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: const Icon(
                      Icons.medical_services,
                      color: Color(0xFF6B8E3D),
                      size: 20,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '${visit['type']?.toString().toUpperCase() ?? 'VISIT'}',
                          style: GoogleFonts.inter(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                            color: const Color(0xFF2D3748),
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          visit['provider'] ?? 'Unknown Provider',
                          style: GoogleFonts.inter(
                            fontSize: 14,
                            color: Colors.grey[600],
                          ),
                        ),
                      ],
                    ),
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(
                        _formatDate(visit['date']),
                        style: GoogleFonts.inter(
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                          color: const Color(0xFF2D3748),
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        _formatTime(visit['date']),
                        style: GoogleFonts.inter(
                          fontSize: 11,
                          color: Colors.grey[500],
                        ),
                      ),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  _buildStatusBadge(visit['status'] ?? 'unknown'),
                  const SizedBox(width: 8),
                  if (visit['department'] != null) ...[
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.blue.shade50,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Colors.blue.shade200),
                      ),
                      child: Text(
                        visit['department'],
                        style: GoogleFonts.inter(
                          fontSize: 11,
                          color: Colors.blue.shade700,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                  ],
                ],
              ),
              if (visit['reason'] != null) ...[
                const SizedBox(height: 8),
                Text(
                  'Reason: ${visit['reason']}',
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    color: Colors.grey[600],
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
              const SizedBox(height: 8),
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  Text(
                    'Tap to view details',
                    style: GoogleFonts.inter(
                      fontSize: 11,
                      color: const Color(0xFF6B8E3D),
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  const SizedBox(width: 4),
                  const Icon(
                    Icons.arrow_forward_ios,
                    size: 12,
                    color: Color(0xFF6B8E3D),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatusBadge(String status) {
    Color backgroundColor;
    Color textColor;
    
    switch (status.toLowerCase()) {
      case 'completed':
        backgroundColor = Colors.green.shade50;
        textColor = Colors.green.shade700;
        break;
      case 'scheduled':
        backgroundColor = Colors.blue.shade50;
        textColor = Colors.blue.shade700;
        break;
      case 'cancelled':
        backgroundColor = Colors.red.shade50;
        textColor = Colors.red.shade700;
        break;
      case 'no-show':
        backgroundColor = Colors.orange.shade50;
        textColor = Colors.orange.shade700;
        break;
      default:
        backgroundColor = Colors.grey.shade50;
        textColor = Colors.grey.shade700;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: textColor.withOpacity(0.3)),
      ),
      child: Text(
        status.toUpperCase(),
        style: GoogleFonts.inter(
          fontSize: 11,
          color: textColor,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }

  String _formatDate(String dateString) {
    try {
      final date = DateTime.parse(dateString);
      return '${date.day}/${date.month}/${date.year}';
    } catch (e) {
      return dateString;
    }
  }

  String _formatTime(String dateString) {
    try {
      final date = DateTime.parse(dateString);
      return '${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}';
    } catch (e) {
      return '';
    }
  }
}
