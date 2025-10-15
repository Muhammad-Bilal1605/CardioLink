import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class VisitFilters extends StatefulWidget {
  final Function(Map<String, dynamic>) onFilterChange;
  final VoidCallback onClearFilters;
  final int activeFilterCount;

  const VisitFilters({
    Key? key,
    required this.onFilterChange,
    required this.onClearFilters,
    required this.activeFilterCount,
  }) : super(key: key);

  @override
  _VisitFiltersState createState() => _VisitFiltersState();
}

class _VisitFiltersState extends State<VisitFilters> {
  Map<String, dynamic> _filters = {
    'visitType': [],
    'department': [],
    'dateRange': 'all',
    'visitStatus': [],
    'customDateStart': '',
    'customDateEnd': '',
  };

  Map<String, bool> _expandedSections = {
    'visitType': false,
    'department': false,
    'dateRange': false,
    'visitStatus': false,
  };

  final List<String> _visitTypes = [
    'Routine Checkup',
    'Emergency',
    'Follow-up',
    'Surgery',
    'Lab Test',
    'Telehealth / Video Consultation'
  ];

  final List<String> _departments = [
    'Cardiology',
    'Neurology',
    'Orthopedics',
    'Psychiatry',
    'Pediatrics',
    'General Medicine'
  ];

  final List<Map<String, String>> _dateRanges = [
    {'id': 'all', 'label': 'All Time'},
    {'id': 'today', 'label': 'Today'},
    {'id': 'week', 'label': 'Past Week'},
    {'id': 'month', 'label': 'Past Month'},
    {'id': 'custom', 'label': 'Custom Date Range'},
  ];

  final List<String> _visitStatuses = [
    'Upcoming',
    'Completed',
    'Cancelled',
    'In Progress'
  ];

  @override
  void initState() {
    super.initState();
    widget.onFilterChange(_filters);
  }

  void _handleFilterChange(String filterType, dynamic value) {
    setState(() {
      if (filterType == 'dateRange') {
        _filters['dateRange'] = value;
        if (value != 'custom') {
          _filters['customDateStart'] = '';
          _filters['customDateEnd'] = '';
        }
      } else if (filterType == 'customDateStart' || filterType == 'customDateEnd') {
        _filters[filterType] = value;
      } else {
        // Handle arrays (checkboxes)
        final currentList = List<String>.from(_filters[filterType]);
        if (currentList.contains(value)) {
          currentList.remove(value);
        } else {
          currentList.add(value);
        }
        _filters[filterType] = currentList;
      }
    });
    
    widget.onFilterChange(_filters);
  }

  void _toggleSection(String section) {
    setState(() {
      _expandedSections[section] = !_expandedSections[section]!;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Container(
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
        children: [
          // Header
          Container(
            padding: const EdgeInsets.all(16),
            decoration: const BoxDecoration(
              border: Border(bottom: BorderSide(color: Color(0xFFE2E8F0))),
            ),
            child: Row(
              children: [
                const Icon(Icons.filter_list, color: Color(0xFF6B8E3D), size: 20),
                const SizedBox(width: 8),
                Text(
                  'Filter Visits',
                  style: GoogleFonts.inter(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: const Color(0xFF2D3748),
                  ),
                ),
                if (widget.activeFilterCount > 0) ...[
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(
                      color: const Color(0xFF6B8E3D),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      '${widget.activeFilterCount}',
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        color: Colors.white,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
                const Spacer(),
                if (widget.activeFilterCount > 0)
                  TextButton(
                    onPressed: widget.onClearFilters,
                    child: Text(
                      'Clear All',
                      style: GoogleFonts.inter(
                        fontSize: 14,
                        color: Colors.red[600],
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
              ],
            ),
          ),
          
          // Filter Sections
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                _buildFilterSection(
                  'Visit Type',
                  Icons.medical_services,
                  'visitType',
                  _visitTypes,
                ),
                const SizedBox(height: 16),
                _buildFilterSection(
                  'Department / Specialty',
                  Icons.local_hospital,
                  'department',
                  _departments,
                ),
                const SizedBox(height: 16),
                _buildDateRangeSection(),
                const SizedBox(height: 16),
                _buildFilterSection(
                  'Visit Status',
                  Icons.check_circle,
                  'visitStatus',
                  _visitStatuses,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterSection(String title, IconData icon, String filterType, List<String> options) {
    final isExpanded = _expandedSections[filterType]!;
    final selectedCount = (_filters[filterType] as List).length;
    
    return Container(
      decoration: BoxDecoration(
        color: Colors.grey.shade50,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Column(
        children: [
          InkWell(
            onTap: () => _toggleSection(filterType),
            borderRadius: BorderRadius.circular(8),
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Row(
                children: [
                  Icon(icon, size: 18, color: const Color(0xFF6B8E3D)),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      title,
                      style: GoogleFonts.inter(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: const Color(0xFF2D3748),
                      ),
                    ),
                  ),
                  if (selectedCount > 0) ...[
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: const Color(0xFF6B8E3D),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Text(
                        '$selectedCount',
                        style: GoogleFonts.inter(
                          fontSize: 11,
                          color: Colors.white,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                  ],
                  Icon(
                    isExpanded ? Icons.keyboard_arrow_up : Icons.keyboard_arrow_down,
                    size: 20,
                    color: Colors.grey[600],
                  ),
                ],
              ),
            ),
          ),
          if (isExpanded) ...[
            const Divider(height: 1),
            Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                children: options.map((option) => 
                  _buildCheckboxOption(option, filterType)).toList(),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildCheckboxOption(String option, String filterType) {
    final isSelected = (_filters[filterType] as List).contains(option);
    
    return InkWell(
      onTap: () => _handleFilterChange(filterType, option),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 8),
        child: Row(
          children: [
            Container(
              width: 20,
              height: 20,
              decoration: BoxDecoration(
                color: isSelected ? const Color(0xFF6B8E3D) : Colors.white,
                borderRadius: BorderRadius.circular(4),
                border: Border.all(
                  color: isSelected ? const Color(0xFF6B8E3D) : Colors.grey.shade400,
                  width: 1.5,
                ),
              ),
              child: isSelected
                  ? const Icon(Icons.check, size: 14, color: Colors.white)
                  : null,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                option,
                style: GoogleFonts.inter(
                  fontSize: 13,
                  color: const Color(0xFF2D3748),
                  fontWeight: isSelected ? FontWeight.w500 : FontWeight.w400,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDateRangeSection() {
    final isExpanded = _expandedSections['dateRange']!;
    final selectedRange = _dateRanges.firstWhere(
      (range) => range['id'] == _filters['dateRange'],
      orElse: () => _dateRanges.first,
    );
    
    return Container(
      decoration: BoxDecoration(
        color: Colors.grey.shade50,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Column(
        children: [
          InkWell(
            onTap: () => _toggleSection('dateRange'),
            borderRadius: BorderRadius.circular(8),
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Row(
                children: [
                  const Icon(Icons.calendar_today, size: 18, color: Color(0xFF6B8E3D)),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Date Range',
                      style: GoogleFonts.inter(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: const Color(0xFF2D3748),
                      ),
                    ),
                  ),
                  Text(
                    selectedRange['label']!,
                    style: GoogleFonts.inter(
                      fontSize: 12,
                      color: const Color(0xFF6B8E3D),
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Icon(
                    isExpanded ? Icons.keyboard_arrow_up : Icons.keyboard_arrow_down,
                    size: 20,
                    color: Colors.grey[600],
                  ),
                ],
              ),
            ),
          ),
          if (isExpanded) ...[
            const Divider(height: 1),
            Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                children: _dateRanges.map((range) => 
                  _buildRadioOption(range['label']!, range['id']!)).toList(),
              ),
            ),
            if (_filters['dateRange'] == 'custom') ...[
              const Divider(height: 1),
              Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Start Date',
                                style: GoogleFonts.inter(
                                  fontSize: 12,
                                  color: Colors.grey[600],
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                              const SizedBox(height: 4),
                              InkWell(
                                onTap: () => _selectDate('customDateStart'),
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                  decoration: BoxDecoration(
                                    color: Colors.white,
                                    borderRadius: BorderRadius.circular(6),
                                    border: Border.all(color: Colors.grey.shade300),
                                  ),
                                  child: Row(
                                    children: [
                                      Expanded(
                                        child: Text(
                                          _filters['customDateStart'].isEmpty 
                                            ? 'Select start date' 
                                            : _filters['customDateStart'],
                                          style: GoogleFonts.inter(
                                            fontSize: 13,
                                            color: _filters['customDateStart'].isEmpty 
                                              ? Colors.grey[500] 
                                              : const Color(0xFF2D3748),
                                          ),
                                        ),
                                      ),
                                      const Icon(Icons.calendar_today, size: 16, color: Colors.grey),
                                    ],
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'End Date',
                                style: GoogleFonts.inter(
                                  fontSize: 12,
                                  color: Colors.grey[600],
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                              const SizedBox(height: 4),
                              InkWell(
                                onTap: () => _selectDate('customDateEnd'),
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                  decoration: BoxDecoration(
                                    color: Colors.white,
                                    borderRadius: BorderRadius.circular(6),
                                    border: Border.all(color: Colors.grey.shade300),
                                  ),
                                  child: Row(
                                    children: [
                                      Expanded(
                                        child: Text(
                                          _filters['customDateEnd'].isEmpty 
                                            ? 'Select end date' 
                                            : _filters['customDateEnd'],
                                          style: GoogleFonts.inter(
                                            fontSize: 13,
                                            color: _filters['customDateEnd'].isEmpty 
                                              ? Colors.grey[500] 
                                              : const Color(0xFF2D3748),
                                          ),
                                        ),
                                      ),
                                      const Icon(Icons.calendar_today, size: 16, color: Colors.grey),
                                    ],
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ],
        ],
      ),
    );
  }

  Widget _buildRadioOption(String label, String value) {
    final isSelected = _filters['dateRange'] == value;
    
    return InkWell(
      onTap: () => _handleFilterChange('dateRange', value),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 8),
        child: Row(
          children: [
            Container(
              width: 20,
              height: 20,
              decoration: BoxDecoration(
                color: isSelected ? const Color(0xFF6B8E3D) : Colors.white,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(
                  color: isSelected ? const Color(0xFF6B8E3D) : Colors.grey.shade400,
                  width: 1.5,
                ),
              ),
              child: isSelected
                  ? const Icon(Icons.check, size: 12, color: Colors.white)
                  : null,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                label,
                style: GoogleFonts.inter(
                  fontSize: 13,
                  color: const Color(0xFF2D3748),
                  fontWeight: isSelected ? FontWeight.w500 : FontWeight.w400,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _selectDate(String dateType) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: DateTime.now(),
      firstDate: DateTime(2020),
      lastDate: DateTime.now(),
    );
    
    if (picked != null) {
      final formattedDate = '${picked.year}-${picked.month.toString().padLeft(2, '0')}-${picked.day.toString().padLeft(2, '0')}';
      _handleFilterChange(dateType, formattedDate);
    }
  }
}
