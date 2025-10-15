import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../../models/medical_event.dart';
import '../../../services/medical_timeline_service.dart';
import '../../../provider/auth_provider.dart';

class RightRow1 extends StatefulWidget {
  final String? patientId;

  const RightRow1({
    Key? key,
    this.patientId,
  }) : super(key: key);

  @override
  _RightRow1State createState() => _RightRow1State();
}

class _RightRow1State extends State<RightRow1> {
  List<MedicalEvent> _allEvents = [];
  List<MedicalEvent> _filteredEvents = [];
  List<String> _activeEventTypes = EventType.eventTypes.map((e) => e.key).toList();
  String _viewMode = 'years';
  int _activeYear = DateTime.now().year;
  int _activeMonth = DateTime.now().month;
  // int _activeDay = DateTime.now().day; // Reserved for future use
  bool _loading = false;
  String? _error;
  MedicalEvent? _selectedEvent;
  bool _showEventDetails = false;
  Map<int, bool> _expandedYears = {}; // Track which years are expanded

  @override
  void initState() {
    super.initState();
    _loadEvents();
  }

  Future<void> _loadEvents() async {
    if (widget.patientId == null) return;
    
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      print('RightRow1 - Loading events for patient: ${widget.patientId}');
      
      // Get auth token from context
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final authToken = authProvider.authToken;
      
      print('RightRow1 - Auth token available: ${authToken != null}');
      
      final events = await MedicalTimelineService.fetchAllPatientEvents(
        widget.patientId!, 
        authToken: authToken
      );
      
      setState(() {
        _allEvents = events;
        _filteredEvents = _getFilteredEvents();
        _loading = false;
      });
      
      print('RightRow1 - Loaded ${events.length} events');
    } catch (e) {
      setState(() {
        _error = e.toString();
        _loading = false;
      });
      print('RightRow1 - Error loading events: $e');
    }
  }

  List<MedicalEvent> _getFilteredEvents() {
    List<MedicalEvent> filtered = _allEvents.where((event) => 
      _activeEventTypes.contains(event.type)
    ).toList();

    // Apply timeframe filtering
    switch (_viewMode) {
      case 'years':
        return filtered;
      case 'months':
        return filtered.where((event) => 
          event.date.year == _activeYear
        ).toList();
      case 'days':
        return filtered.where((event) => 
          event.date.year == _activeYear && 
          event.date.month == _activeMonth
        ).toList();
      default:
        return filtered;
    }
  }

  void _toggleEventType(String eventType) {
    setState(() {
      if (_activeEventTypes.contains(eventType)) {
        if (_activeEventTypes.length > 1) {
          _activeEventTypes.remove(eventType);
        }
      } else {
        _activeEventTypes.add(eventType);
      }
      _filteredEvents = _getFilteredEvents();
    });
  }

  void _changeViewMode(String mode) {
    setState(() {
      _viewMode = mode;
      _filteredEvents = _getFilteredEvents();
    });
  }

  void _navigateToYear(int year) {
    setState(() {
      _viewMode = 'months';
      _activeYear = year;
      _filteredEvents = _getFilteredEvents();
    });
  }

  void _toggleYearExpansion(int year) {
    setState(() {
      _expandedYears[year] = !(_expandedYears[year] ?? false);
    });
  }

  bool _isYearExpanded(int year) {
    return _expandedYears[year] ?? false;
  }

  void _navigateToMonth(int month) {
    setState(() {
      _viewMode = 'days';
      _activeMonth = month;
      _filteredEvents = _getFilteredEvents();
    });
  }

  void _goBack() {
    setState(() {
      switch (_viewMode) {
        case 'months':
          _viewMode = 'years';
          break;
        case 'days':
          _viewMode = 'months';
          break;
        default:
          _viewMode = 'years';
      }
      _filteredEvents = _getFilteredEvents();
    });
  }

  void _showAllEventTypes() {
    setState(() {
      _activeEventTypes = EventType.eventTypes.map((e) => e.key).toList();
      _filteredEvents = _getFilteredEvents();
    });
  }

  void _resetToYearsView() {
    setState(() {
      _viewMode = 'years';
      _filteredEvents = _getFilteredEvents();
    });
  }

  void _handleEventClick(MedicalEvent event) {
    setState(() {
      _selectedEvent = event;
      _showEventDetails = true;
    });
  }

  void _closeEventDetails() {
    setState(() {
      _showEventDetails = false;
      _selectedEvent = null;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        Container(
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
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        // Back button (only show if not in years view)
                        if (_viewMode != 'years')
                          Padding(
                            padding: const EdgeInsets.only(right: 12),
                            child: IconButton(
                              onPressed: _goBack,
                              icon: const Icon(Icons.arrow_back, size: 20),
                              style: IconButton.styleFrom(
                                backgroundColor: const Color(0xFFF7FAFC),
                                foregroundColor: const Color(0xFF4A5568),
                              ),
                            ),
                          ),
                        Expanded(
                          child: Text(
                            'Patient Medical Timeline',
                            style: GoogleFonts.inter(
                              fontSize: 18,
                              fontWeight: FontWeight.w600,
                              color: const Color(0xFF2D3748),
                            ),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        const SizedBox(width: 8),
                        TextButton.icon(
                          onPressed: _resetToYearsView,
                          icon: const Icon(Icons.refresh, size: 16),
                          label: const Text('Reset'),
                          style: TextButton.styleFrom(
                            backgroundColor: const Color(0xFFEBF8FF),
                            foregroundColor: const Color(0xFF2B6CB0),
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          ),
                        ),
                      ],
                    ),
                    
                    const SizedBox(height: 16),
                    
                    // View mode tabs
                    Row(
                      children: ['years', 'months', 'days'].map((mode) => 
                        Expanded(
                          child: Padding(
                            padding: const EdgeInsets.only(right: 4),
                            child: ElevatedButton(
                              onPressed: () => _changeViewMode(mode),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: _viewMode == mode 
                                  ? const Color(0xFF2B6CB0) 
                                  : const Color(0xFFF7FAFC),
                                foregroundColor: _viewMode == mode 
                                  ? Colors.white 
                                  : const Color(0xFF4A5568),
                                elevation: 0,
                                padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 4),
                              ),
                              child: Text(
                                mode.toUpperCase(),
                                style: GoogleFonts.inter(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w500,
                                ),
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ),
                        ),
                      ).toList(),
                    ),
                    
                    const SizedBox(height: 16),
                    
                    // Event type filters
                    Text(
                      'Filter Events:',
                      style: GoogleFonts.inter(
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                        color: const Color(0xFF4A5568),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 6,
                      runSpacing: 6,
                      children: [
                        ...EventType.eventTypes.map((type) => 
                          FilterChip(
                            label: Text(
                              '${type.icon} ${type.label}',
                              style: GoogleFonts.inter(fontSize: 11),
                              overflow: TextOverflow.ellipsis,
                            ),
                            selected: _activeEventTypes.contains(type.key),
                            onSelected: (_) => _toggleEventType(type.key),
                            selectedColor: Color(int.parse(type.color.replaceFirst('#', '0xFF'))),
                            checkmarkColor: Colors.white,
                            backgroundColor: Color(int.parse(type.color.replaceFirst('#', '0xFF'))).withOpacity(0.1),
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          ),
                        ),
                        ActionChip(
                          label: const Text(
                            'Show All',
                            style: TextStyle(fontSize: 11),
                            overflow: TextOverflow.ellipsis,
                          ),
                          onPressed: _showAllEventTypes,
                          backgroundColor: const Color(0xFFE2E8F0),
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        ),
                      ],
                    ),
                    
                    const SizedBox(height: 16),
                    
                    // Navigation info and event count
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            _getNavigationTitle(),
                            style: GoogleFonts.inter(
                              fontSize: 14,
                              fontWeight: FontWeight.w500,
                              color: const Color(0xFF4A5568),
                            ),
                            overflow: TextOverflow.ellipsis,
                            maxLines: 2,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF7FAFC),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            '${_filteredEvents.length} Events',
                            style: GoogleFonts.inter(
                              fontSize: 12,
                              color: const Color(0xFF4A5568),
                            ),
                          ),
                        ),
                      ],
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
        ),
        
        // Event details modal
        if (_showEventDetails && _selectedEvent != null)
          _buildEventDetailsModal(),
      ],
    );
  }

  String _getNavigationTitle() {
    switch (_viewMode) {
      case 'years':
        return 'All Years - Toggle to show events, click arrow to navigate';
      case 'months':
        return '$_activeYear - Click month to see days';
      case 'days':
        return '${_getMonthName(_activeMonth)} $_activeYear - Daily view';
      default:
        return 'Timeline';
    }
  }

  String _getMonthName(int month) {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month - 1];
  }

  Widget _buildContent() {
    if (_loading) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircularProgressIndicator(),
            SizedBox(height: 16),
            Text('Loading medical timeline data...'),
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
              'Error: $_error',
              style: GoogleFonts.inter(color: Colors.red),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _loadEvents,
              child: const Text('Retry'),
            ),
          ],
        ),
      );
    }

    if (_filteredEvents.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.search_off, size: 48, color: Colors.grey),
            const SizedBox(height: 16),
            Text(
              'No events match your current filters.',
              style: GoogleFonts.inter(color: Colors.grey[600]),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _showAllEventTypes,
              child: const Text('Show All Event Types'),
            ),
          ],
        ),
      );
    }

    return _buildTimeline();
  }

  Widget _buildTimeline() {
    // Group events by timeframe unit
    Map<String, List<MedicalEvent>> eventsByUnit = {};
    
    for (var event in _filteredEvents) {
      String unitKey;
      switch (_viewMode) {
        case 'years':
          unitKey = event.date.year.toString();
          break;
        case 'months':
          unitKey = _getMonthName(event.date.month);
          break;
        case 'days':
          unitKey = event.date.day.toString();
          break;
        default:
          unitKey = event.date.year.toString();
      }
      
      eventsByUnit.putIfAbsent(unitKey, () => []).add(event);
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Timeline units
          ...eventsByUnit.entries.map((entry) => 
            _buildTimelineUnit(entry.key, entry.value)
          ),
        ],
      ),
    );
  }

  Widget _buildClickableUnitHeader(String unitKey, List<MedicalEvent> events) {
    if (_viewMode == 'years') {
      // Special handling for years view - show toggle button and navigation
      final year = int.parse(unitKey);
      final isExpanded = _isYearExpanded(year);
      
      return Container(
        margin: const EdgeInsets.only(bottom: 8),
        child: Row(
          children: [
            // Year header with toggle button
            Expanded(
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: const Color(0xFFF7FAFC),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: Text(
                        unitKey,
                        style: GoogleFonts.inter(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: const Color(0xFF2D3748),
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    const SizedBox(width: 8),
                    // Toggle button to show/hide events
                    IconButton(
                      onPressed: () => _toggleYearExpansion(year),
                      icon: Icon(
                        isExpanded ? Icons.expand_less : Icons.expand_more,
                        size: 20,
                        color: const Color(0xFF4A5568),
                      ),
                      style: IconButton.styleFrom(
                        backgroundColor: const Color(0xFFE2E8F0),
                        padding: const EdgeInsets.all(4),
                        minimumSize: const Size(24, 24),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(width: 8),
            // Navigate to year button
            Container(
              decoration: BoxDecoration(
                color: const Color(0xFF2B6CB0),
                borderRadius: BorderRadius.circular(8),
              ),
              child: IconButton(
                onPressed: () => _navigateToYear(year),
                icon: const Icon(
                  Icons.arrow_forward,
                  size: 16,
                  color: Colors.white,
                ),
                style: IconButton.styleFrom(
                  padding: const EdgeInsets.all(8),
                  minimumSize: const Size(32, 32),
                ),
              ),
            ),
          ],
        ),
      );
    }
    
    // Handle months and days views (existing logic)
    bool isClickable = false;
    VoidCallback? onTap;
    
    switch (_viewMode) {
      case 'months':
        // Months are clickable to navigate to days
        isClickable = true;
        onTap = () => _navigateToMonth(_getMonthNumber(unitKey));
        break;
      case 'days':
        // Days are not clickable (final level)
        isClickable = false;
        break;
      default:
        isClickable = false;
    }

    Widget headerWidget = Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: isClickable ? const Color(0xFFEBF8FF) : const Color(0xFFF7FAFC),
        borderRadius: BorderRadius.circular(8),
        border: isClickable ? Border.all(color: const Color(0xFF2B6CB0).withOpacity(0.2)) : null,
      ),
      child: Row(
        children: [
          Text(
            unitKey,
            style: GoogleFonts.inter(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: isClickable ? const Color(0xFF2B6CB0) : const Color(0xFF2D3748),
            ),
          ),
          if (isClickable) ...[
            const Spacer(),
            Icon(
              Icons.chevron_right,
              size: 16,
              color: const Color(0xFF2B6CB0),
            ),
          ],
        ],
      ),
    );

    if (isClickable) {
      return InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(8),
        child: headerWidget,
      );
    } else {
      return headerWidget;
    }
  }

  int _getMonthNumber(String monthName) {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months.indexOf(monthName) + 1;
  }

  Widget _buildTimelineUnit(String unitKey, List<MedicalEvent> events) {
    return Container(
      margin: const EdgeInsets.only(bottom: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Unit header - make clickable based on view mode
          _buildClickableUnitHeader(unitKey, events),
          
          // Show events only if expanded (for years view) or always (for other views)
          if (_viewMode != 'years' || _isYearExpanded(int.parse(unitKey))) ...[
            const SizedBox(height: 12),
            // Events for this unit
            ...events.map((event) => _buildEventCard(event)),
          ],
        ],
      ),
    );
  }

  Widget _buildEventCard(MedicalEvent event) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      child: Material(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8),
        elevation: 1,
        child: InkWell(
          onTap: () => _handleEventClick(event),
          borderRadius: BorderRadius.circular(8),
          child: Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(8),
              border: Border.all(
                color: Color(int.parse(event.color.replaceFirst('#', '0xFF'))).withOpacity(0.2),
              ),
            ),
            child: Row(
              children: [
                // Event icon
                Container(
                  width: 32,
                  height: 32,
                  decoration: BoxDecoration(
                    color: Color(int.parse(event.color.replaceFirst('#', '0xFF'))),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Center(
                    child: Text(
                      event.icon,
                      style: const TextStyle(fontSize: 16),
                    ),
                  ),
                ),
                
                const SizedBox(width: 12),
                
                // Event details
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        event.details,
                        style: GoogleFonts.inter(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: const Color(0xFF2D3748),
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 2),
                      Text(
                        '${event.typeLabel} • ${event.department}',
                        style: GoogleFonts.inter(
                          fontSize: 12,
                          color: const Color(0xFF718096),
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        '${event.date.day}/${event.date.month}/${event.date.year} ${event.date.hour.toString().padLeft(2, '0')}:${event.date.minute.toString().padLeft(2, '0')}',
                        style: GoogleFonts.inter(
                          fontSize: 11,
                          color: const Color(0xFFA0AEC0),
                        ),
                      ),
                    ],
                  ),
                ),
                
                // Arrow icon
                Icon(
                  Icons.chevron_right,
                  color: Colors.grey[400],
                  size: 20,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildEventDetailsModal() {
    return Positioned.fill(
      child: Container(
        color: Colors.black.withOpacity(0.5),
        child: Center(
          child: Container(
            margin: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.2),
                  blurRadius: 20,
                  offset: const Offset(0, 10),
                ),
              ],
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Header
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Color(int.parse(_selectedEvent!.color.replaceFirst('#', '0xFF'))).withOpacity(0.1),
                    borderRadius: const BorderRadius.only(
                      topLeft: Radius.circular(12),
                      topRight: Radius.circular(12),
                    ),
                  ),
                  child: Row(
                    children: [
                      Text(
                        _selectedEvent!.icon,
                        style: const TextStyle(fontSize: 24),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              '${_selectedEvent!.typeLabel} - ${_selectedEvent!.department}',
                              style: GoogleFonts.inter(
                                fontSize: 16,
                                fontWeight: FontWeight.w600,
                                color: const Color(0xFF2D3748),
                              ),
                            ),
                            Text(
                              '${_selectedEvent!.date.day}/${_selectedEvent!.date.month}/${_selectedEvent!.date.year}',
                              style: GoogleFonts.inter(
                                fontSize: 14,
                                color: const Color(0xFF718096),
                              ),
                            ),
                          ],
                        ),
                      ),
                      IconButton(
                        onPressed: _closeEventDetails,
                        icon: const Icon(Icons.close),
                        color: Colors.grey[600],
                      ),
                    ],
                  ),
                ),
                
                // Content
                Flexible(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.all(16),
                    child: _buildEventDetailsContent(),
                  ),
                ),
                
                // Footer
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: const BoxDecoration(
                    border: Border(top: BorderSide(color: Color(0xFFE2E8F0))),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      TextButton(
                        onPressed: _closeEventDetails,
                        child: const Text('Close'),
                      ),
                      const SizedBox(width: 8),
                      ElevatedButton(
                        onPressed: _closeEventDetails,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF2B6CB0),
                          foregroundColor: Colors.white,
                        ),
                        child: const Text('Done'),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildEventDetailsContent() {
    if (_selectedEvent == null) return const SizedBox();
    
    switch (_selectedEvent!.type) {
      case 'visits':
        return _buildVisitDetails();
      case 'hospitalizations':
        return _buildHospitalizationDetails();
      case 'procedures':
        return _buildProcedureDetails();
      case 'labs':
        return _buildLabDetails();
      case 'imaging':
        return _buildImagingDetails();
      default:
        return Text(
          'No detailed information available for this event.',
          style: GoogleFonts.inter(color: Colors.grey[600]),
        );
    }
  }

  Widget _buildVisitDetails() {
    final visit = _selectedEvent!.fullData;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildDetailRow('Doctor:', visit['doctor'] ?? 'Not specified'),
        _buildDetailRow('Symptoms:', visit['symptoms'] ?? 'Not specified'),
        _buildDetailRow('Diagnosis:', visit['diagnosis'] ?? 'Not specified'),
        _buildDetailRow('Prescribed Medicine:', visit['prescribedMedicine'] ?? 'Not specified'),
        if (visit['prescribedTests'] != null)
          _buildDetailRow('Tests Ordered:', visit['prescribedTests']),
        if (visit['doctorComments'] != null)
          _buildDetailRow('Doctor Comments:', visit['doctorComments']),
      ],
    );
  }

  Widget _buildHospitalizationDetails() {
    final hosp = _selectedEvent!.fullData;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildDetailRow('Reason:', hosp['reason'] ?? 'Not specified'),
        _buildDetailRow('Admission Type:', hosp['admissionType'] ?? 'Not specified'),
        _buildDetailRow('Physician:', hosp['attendingPhysician'] ?? 'Not specified'),
        _buildDetailRow('Duration:', hosp['durationOfStay'] ?? 'Not specified'),
        _buildDetailRow('Procedures:', 
          hosp['proceduresDone'] != null && (hosp['proceduresDone'] as List).isNotEmpty
            ? (hosp['proceduresDone'] as List).join(', ')
            : 'None'
        ),
        _buildDetailRow('Outcome:', hosp['outcome'] ?? 'Not specified'),
        if (hosp['dischargeSummary'] != null)
          _buildDetailRow('Discharge Summary:', hosp['dischargeSummary']),
      ],
    );
  }

  Widget _buildProcedureDetails() {
    final procedure = _selectedEvent!.fullData;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildDetailRow('Procedure:', procedure['procedureName'] ?? 'Not specified', isBold: true),
        _buildDetailRow('Physician:', procedure['physician'] ?? 'Not specified'),
        _buildDetailRow('Indication:', procedure['indication'] ?? 'Not specified'),
        _buildDetailRow('Findings:', procedure['findings'] ?? 'Not specified'),
        if (procedure['complications'] != null)
          _buildDetailRow('Complications:', procedure['complications']),
        if (procedure['followUpPlan'] != null)
          _buildDetailRow('Follow-up Plan:', procedure['followUpPlan']),
      ],
    );
  }

  Widget _buildLabDetails() {
    final lab = _selectedEvent!.fullData;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildDetailRow('Test:', lab['testName'] ?? 'Not specified', isBold: true),
        _buildDetailRow('Ordered By:', lab['doctor'] ?? 'Not specified'),
        if (lab['results'] != null && (lab['results'] as List).isNotEmpty)
          _buildLabResults(lab['results'] as List)
        else
          _buildDetailRow('Results:', 'No results available'),
      ],
    );
  }

  Widget _buildLabResults(List results) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Results:',
          style: GoogleFonts.inter(
            fontSize: 14,
            fontWeight: FontWeight.w500,
            color: const Color(0xFF4A5568),
          ),
        ),
        const SizedBox(height: 8),
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: const Color(0xFFF7FAFC),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Column(
            children: results.map<Widget>((result) => 
              Container(
                padding: const EdgeInsets.symmetric(vertical: 8),
                decoration: const BoxDecoration(
                  border: Border(bottom: BorderSide(color: Color(0xFFE2E8F0))),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          result['parameter'] ?? 'Unknown',
                          style: GoogleFonts.inter(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            color: const Color(0xFF2D3748),
                          ),
                        ),
                        Text(
                          '${result['value'] ?? ''} ${result['unit'] ?? ''}',
                          style: GoogleFonts.inter(
                            fontSize: 14,
                            color: const Color(0xFF2D3748),
                          ),
                        ),
                      ],
                    ),
                    if (result['referenceRange'] != null)
                      Text(
                        'Reference: ${result['referenceRange']}',
                        style: GoogleFonts.inter(
                          fontSize: 12,
                          color: const Color(0xFF718096),
                        ),
                      ),
                    const SizedBox(height: 4),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(
                        color: _getStatusColor(result['status']).withOpacity(0.1),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        'Status: ${result['status'] ?? 'Unknown'}',
                        style: GoogleFonts.inter(
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                          color: _getStatusColor(result['status']),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ).toList(),
          ),
        ),
      ],
    );
  }

  Color _getStatusColor(String? status) {
    switch (status?.toLowerCase()) {
      case 'normal':
        return Colors.green;
      case 'high':
        return Colors.red;
      case 'low':
        return Colors.orange;
      default:
        return Colors.grey;
    }
  }

  Widget _buildImagingDetails() {
    final image = _selectedEvent!.fullData;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildDetailRow('Image Type:', image['type'] ?? 'Not specified', isBold: true),
        _buildDetailRow('Ordered By:', image['doctor'] ?? 'Not specified'),
        if (image['results'] != null)
          _buildImagingResults(image['results'])
        else
          _buildDetailRow('Results:', 'No results available'),
      ],
    );
  }

  Widget _buildImagingResults(Map results) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Results:',
          style: GoogleFonts.inter(
            fontSize: 14,
            fontWeight: FontWeight.w500,
            color: const Color(0xFF4A5568),
          ),
        ),
        const SizedBox(height: 8),
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: const Color(0xFFF7FAFC),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (results['findings'] != null)
                _buildDetailRow('Findings:', results['findings'], isSubDetail: true),
              if (results['impression'] != null)
                _buildDetailRow('Impression:', results['impression'], isSubDetail: true),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildDetailRow(String label, String value, {bool isBold = false, bool isSubDetail = false}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: GoogleFonts.inter(
              fontSize: isSubDetail ? 12 : 14,
              fontWeight: FontWeight.w500,
              color: const Color(0xFF4A5568),
            ),
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: GoogleFonts.inter(
              fontSize: isSubDetail ? 12 : 14,
              fontWeight: isBold ? FontWeight.w600 : FontWeight.w400,
              color: const Color(0xFF2D3748),
            ),
          ),
        ],
      ),
    );
  }
}
