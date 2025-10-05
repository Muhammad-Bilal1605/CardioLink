//patient_requestsAmbulance_screen.dart
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'dart:async';
import '../services/config_service.dart';

class PatientRequestsAmbulanceScreen extends StatefulWidget {
  @override
  _PatientRequestsAmbulanceScreenState createState() => _PatientRequestsAmbulanceScreenState();
}

class _PatientRequestsAmbulanceScreenState extends State<PatientRequestsAmbulanceScreen> {
  String _selectedFilter = 'All';
  List<Map<String, dynamic>> _patientRequests = [];
  bool _isLoading = true;
  String? _errorMessage;
  Timer? _refreshTimer;
  
  // Get base URL from config service
  String get baseUrl => ConfigService.instance.baseUrl;

  @override
  void initState() {
    super.initState();
    _fetchPatientRequests();
    // Set up auto-refresh every 30 seconds
    _refreshTimer = Timer.periodic(const Duration(seconds: 30), (timer) {
      _fetchPatientRequests();
    });
  }

  @override
  void dispose() {
    _refreshTimer?.cancel();
    super.dispose();
  }

  Future<void> _fetchPatientRequests() async {
    try {
      print('🔄 Fetching patient requests from API: $baseUrl/ambulance-requests');
      
      final response = await http.get(
        Uri.parse('$baseUrl/ambulance-requests'),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ).timeout(const Duration(seconds: 15));

      print('📥 Response status: ${response.statusCode}');
      print('📥 Response body: ${response.body}');

      if (response.statusCode == 200) {
        final responseData = json.decode(response.body);
        
        if (responseData['success'] == true) {
          setState(() {
            _patientRequests = List<Map<String, dynamic>>.from(
              responseData['requests'] ?? []
            );
            _isLoading = false;
            _errorMessage = null;
          });
          print('✅ Successfully loaded ${_patientRequests.length} requests');
        } else {
          setState(() {
            _errorMessage = responseData['message'] ?? 'Failed to load requests';
            _isLoading = false;
          });
          print('❌ API error: ${responseData['message']}');
        }
      } else {
        setState(() {
          _errorMessage = 'Server error: ${response.statusCode}';
          _isLoading = false;
        });
        print('❌ HTTP error: ${response.statusCode}');
      }
    } catch (e) {
      setState(() {
        _errorMessage = 'Network error: Unable to connect to server';
        _isLoading = false;
      });
      print('❌ Exception: $e');
    }
  }

  Future<void> _refreshRequests() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });
    await _fetchPatientRequests();
  }

  List<Map<String, dynamic>> get _filteredRequests {
    if (_selectedFilter == 'All') {
      return _patientRequests;
    }
    return _patientRequests.where((request) => request['status'] == _selectedFilter).toList();
  }

  String _calculateDistance(Map<String, dynamic> request) {
    // For now, return a mock distance
    // You can implement actual distance calculation using location data
    final distances = ['1.2 km', '2.5 km', '3.8 km', '4.2 km', '5.1 km', '6.3 km'];
    return distances[request['id'].hashCode % distances.length];
  }

  String _formatRequestTime(String? timestamp) {
    if (timestamp == null) return 'Unknown';
    
    try {
      final requestTime = DateTime.parse(timestamp);
      final now = DateTime.now();
      final difference = now.difference(requestTime);

      if (difference.inMinutes < 1) {
        return 'Just now';
      } else if (difference.inMinutes < 60) {
        return '${difference.inMinutes} mins ago';
      } else if (difference.inHours < 24) {
        return '${difference.inHours} hours ago';
      } else {
        return '${difference.inDays} days ago';
      }
    } catch (e) {
      return 'Unknown';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Color(0xFFF5F9FF),
      body: SafeArea(
        child: Column(
          children: [
            // Header Section
            _buildHeaderSection(),
            
            // Filter Section
            _buildFilterSection(),
            
            // Requests List
            Expanded(
              child: _buildRequestsList(),
            ),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _refreshRequests,
        backgroundColor: Color(0xFF3366FF),
        child: _isLoading 
          ? SizedBox(
              width: 20,
              height: 20,
              child: CircularProgressIndicator(
                color: Colors.white,
                strokeWidth: 2,
              ),
            )
          : Icon(Icons.refresh, color: Colors.white),
      ),
    );
  }

  Widget _buildHeaderSection() {
    return Container(
      padding: EdgeInsets.all(20),
      child: Row(
        children: [
          Container(
            padding: EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Color(0xFF3366FF).withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(
              Icons.local_hospital,
              color: Color(0xFF3366FF),
              size: 28,
            ),
          ),
          SizedBox(width: 15),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Patient Requests',
                  style: GoogleFonts.poppins(
                    fontSize: 22,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF2E3A59),
                  ),
                ),
                Text(
                  _isLoading 
                    ? 'Loading requests...'
                    : '${_filteredRequests.length} active requests',
                  style: GoogleFonts.poppins(
                    fontSize: 14,
                    color: Colors.grey[600],
                  ),
                ),
              ],
            ),
          ),
          Container(
            padding: EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Colors.white,
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.1),
                  blurRadius: 8,
                  offset: Offset(0, 2),
                ),
              ],
            ),
            child: Badge(
              smallSize: 8,
              backgroundColor: _patientRequests.where((r) => r['status'] == 'Pending').isNotEmpty 
                  ? Colors.red 
                  : Colors.grey,
              child: Icon(
                Icons.notifications_outlined,
                color: Color(0xFF3366FF),
                size: 20,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterSection() {
    final filters = ['All', 'Pending', 'Assigned', 'Completed'];
    
    return Container(
      height: 50,
      margin: EdgeInsets.symmetric(horizontal: 20),
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        itemCount: filters.length,
        itemBuilder: (context, index) {
          final filter = filters[index];
          final isSelected = _selectedFilter == filter;
          
          return Container(
            margin: EdgeInsets.only(right: 10),
            child: FilterChip(
              label: Text(filter),
              selected: isSelected,
              onSelected: (selected) {
                setState(() {
                  _selectedFilter = filter;
                });
              },
              backgroundColor: Colors.white,
              selectedColor: Color(0xFF3366FF).withOpacity(0.1),
              labelStyle: GoogleFonts.poppins(
                color: isSelected ? Color(0xFF3366FF) : Colors.grey[600],
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
              ),
              side: BorderSide(
                color: isSelected ? Color(0xFF3366FF) : Colors.grey[300]!,
                width: 1,
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildRequestsList() {
    if (_isLoading) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircularProgressIndicator(
              color: Color(0xFF3366FF),
            ),
            SizedBox(height: 16),
            Text(
              'Loading patient requests...',
              style: GoogleFonts.poppins(
                fontSize: 16,
                color: Colors.grey[600],
              ),
            ),
          ],
        ),
      );
    }

    if (_errorMessage != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.red[50],
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.error_outline,
                size: 48,
                color: Colors.red[400],
              ),
            ),
            SizedBox(height: 16),
            Text(
              'Error Loading Requests',
              style: GoogleFonts.poppins(
                fontSize: 18,
                fontWeight: FontWeight.w600,
                color: Colors.red[600],
              ),
            ),
            SizedBox(height: 8),
            Text(
              _errorMessage!,
              style: GoogleFonts.poppins(
                fontSize: 14,
                color: Colors.grey[600],
              ),
              textAlign: TextAlign.center,
            ),
            SizedBox(height: 16),
            ElevatedButton.icon(
              onPressed: _refreshRequests,
              icon: Icon(Icons.refresh),
              label: Text('Try Again'),
              style: ElevatedButton.styleFrom(
                backgroundColor: Color(0xFF3366FF),
                foregroundColor: Colors.white,
              ),
            ),
          ],
        ),
      );
    }

    if (_filteredRequests.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.grey[100],
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.inbox_outlined,
                size: 48,
                color: Colors.grey[400],
              ),
            ),
            SizedBox(height: 16),
            Text(
              'No ${_selectedFilter.toLowerCase()} requests',
              style: GoogleFonts.poppins(
                fontSize: 18,
                fontWeight: FontWeight.w500,
                color: Colors.grey[600],
              ),
            ),
            SizedBox(height: 8),
            Text(
              'Patient requests will appear here when submitted',
              style: GoogleFonts.poppins(
                fontSize: 14,
                color: Colors.grey[500],
              ),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _refreshRequests,
      color: Color(0xFF3366FF),
      child: ListView.builder(
        padding: EdgeInsets.symmetric(horizontal: 20, vertical: 10),
        itemCount: _filteredRequests.length,
        itemBuilder: (context, index) {
          final request = _filteredRequests[index];
          return _buildRequestCard(request);
        },
      ),
    );
  }

  Widget _buildRequestCard(Map<String, dynamic> request) {
    Color urgencyColor = _getUrgencyColor(request['urgency'] ?? 'Medium');
    Color statusColor = _getStatusColor(request['status'] ?? 'Pending');
    String distance = _calculateDistance(request);
    String requestTime = _formatRequestTime(request['requestTime']);
    
    // Extract location info
    final location = request['location'] ?? {};
    final address = location['address'] ?? 'Unknown location';
    
    return Container(
      margin: EdgeInsets.only(bottom: 15),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: () => _showRequestDetails(request),
          child: Container(
            padding: EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.08),
                  blurRadius: 12,
                  offset: Offset(0, 4),
                ),
              ],
              border: Border.all(
                color: urgencyColor.withOpacity(0.2),
                width: 1,
              ),
            ),
            child: Column(
              children: [
                // Header Row
                Row(
                  children: [
                    CircleAvatar(
                      radius: 25,
                      backgroundColor: Color(0xFF3366FF),
                      child: Text(
                        (request['patientName'] ?? 'Unknown')[0].toUpperCase(),
                        style: GoogleFonts.poppins(
                          color: Colors.white,
                          fontSize: 18,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                    SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Text(
                                request['patientName'] ?? 'Unknown Patient',
                                style: GoogleFonts.poppins(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w600,
                                  color: Color(0xFF2E3A59),
                                ),
                              ),
                              SizedBox(width: 8),
                              Container(
                                padding: EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                decoration: BoxDecoration(
                                  color: urgencyColor.withOpacity(0.1),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Text(
                                  request['urgency'] ?? 'Medium',
                                  style: GoogleFonts.poppins(
                                    fontSize: 10,
                                    fontWeight: FontWeight.w600,
                                    color: urgencyColor,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          Text(
                            request['patientId'] ?? request['id'] ?? 'Unknown ID',
                            style: GoogleFonts.poppins(
                              fontSize: 12,
                              color: Colors.grey[600],
                            ),
                          ),
                        ],
                      ),
                    ),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Container(
                          padding: EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: statusColor.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            request['status'] ?? 'Pending',
                            style: GoogleFonts.poppins(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: statusColor,
                            ),
                          ),
                        ),
                        SizedBox(height: 4),
                        Text(
                          requestTime,
                          style: GoogleFonts.poppins(
                            fontSize: 11,
                            color: Colors.grey[500],
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
                
                SizedBox(height: 12),
                Divider(height: 1, color: Colors.grey[200]),
                SizedBox(height: 12),
                
                // Details Row
                Row(
                  children: [
                    Expanded(
                      flex: 2,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Icon(Icons.medical_services_outlined, size: 16, color: Colors.grey[600]),
                              SizedBox(width: 6),
                              Text(
                                request['condition'] ?? 'Emergency Request',
                                style: GoogleFonts.poppins(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w500,
                                  color: Color(0xFF2E3A59),
                                ),
                              ),
                            ],
                          ),
                          SizedBox(height: 6),
                          Row(
                            children: [
                              Icon(Icons.location_on_outlined, size: 16, color: Colors.grey[600]),
                              SizedBox(width: 6),
                              Expanded(
                                child: Text(
                                  address,
                                  style: GoogleFonts.poppins(
                                    fontSize: 12,
                                    color: Colors.grey[600],
                                  ),
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                    SizedBox(width: 10),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.navigation_outlined, size: 16, color: Color(0xFF3366FF)),
                            SizedBox(width: 4),
                            Text(
                              distance,
                              style: GoogleFonts.poppins(
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                                color: Color(0xFF3366FF),
                              ),
                            ),
                          ],
                        ),
                        SizedBox(height: 8),
                        if (request['status'] == 'Pending')
                          Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              _buildActionButton(
                                'Accept',
                                Icons.check,
                                Colors.green,
                                () => _handleAcceptRequest(request),
                              ),
                              SizedBox(width: 8),
                              _buildActionButton(
                                'Decline',
                                Icons.close,
                                Colors.red,
                                () => _handleDeclineRequest(request),
                              ),
                            ],
                          ),
                      ],
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildActionButton(String label, IconData icon, Color color, VoidCallback onPressed) {
    return SizedBox(
      width: 70,
      height: 32,
      child: ElevatedButton(
        onPressed: onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: color,
          foregroundColor: Colors.white,
          padding: EdgeInsets.symmetric(horizontal: 8),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
          ),
          elevation: 2,
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 14),
            SizedBox(width: 4),
            Text(
              label,
              style: GoogleFonts.poppins(
                fontSize: 10,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Color _getUrgencyColor(String urgency) {
    switch (urgency) {
      case 'High':
        return Colors.red;
      case 'Medium':
        return Colors.orange;
      case 'Low':
        return Colors.green;
      default:
        return Colors.grey;
    }
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'Pending':
        return Colors.orange;
      case 'Assigned':
        return Colors.blue;
      case 'Completed':
        return Colors.green;
      default:
        return Colors.grey;
    }
  }

  Future<void> _handleAcceptRequest(Map<String, dynamic> request) async {
    try {
      print('🔄 Accepting request: $baseUrl/ambulance-requests/${request['id'] ?? request['_id']}/accept');
      
      final response = await http.put(
        Uri.parse('$baseUrl/ambulance-requests/${request['id'] ?? request['_id']}/accept'),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      );

      print('📥 Accept response status: ${response.statusCode}');
      print('📥 Accept response body: ${response.body}');

      if (response.statusCode == 200) {
        setState(() {
          request['status'] = 'Assigned';
        });
        
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Request accepted for ${request['patientName']}'),
            backgroundColor: Colors.green,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          ),
        );
      } else {
        final responseData = json.decode(response.body);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to accept request: ${responseData['message']}'),
            backgroundColor: Colors.red,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } catch (e) {
      print('❌ Accept request exception: $e');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Network error: Failed to accept request'),
          backgroundColor: Colors.red,
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  Future<void> _handleDeclineRequest(Map<String, dynamic> request) async {
    try {
      print('🔄 Declining request: $baseUrl/ambulance-requests/${request['id'] ?? request['_id']}');
      
      final response = await http.delete(
        Uri.parse('$baseUrl/ambulance-requests/${request['id'] ?? request['_id']}'),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      );

      print('📥 Decline response status: ${response.statusCode}');
      print('📥 Decline response body: ${response.body}');

      if (response.statusCode == 200) {
        setState(() {
          _patientRequests.removeWhere((r) => r['id'] == request['id'] || r['_id'] == request['_id']);
        });
        
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Request declined for ${request['patientName']}'),
            backgroundColor: Colors.red,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          ),
        );
      } else {
        final responseData = json.decode(response.body);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to decline request: ${responseData['message']}'),
            backgroundColor: Colors.red,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } catch (e) {
      print('❌ Decline request exception: $e');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Network error: Failed to decline request'),
          backgroundColor: Colors.red,
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  void _showRequestDetails(Map<String, dynamic> request) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => _buildRequestDetailsModal(request),
    );
  }

  Widget _buildRequestDetailsModal(Map<String, dynamic> request) {
    final location = request['location'] ?? {};
    final address = location['address'] ?? 'Unknown location';
    final coordinates = location['coordinates'] ?? 'N/A';
    
    return Container(
      height: MediaQuery.of(context).size.height * 0.8,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.only(
          topLeft: Radius.circular(20),
          topRight: Radius.circular(20),
        ),
      ),
      child: Column(
        children: [
          // Handle bar
          Container(
            width: 40,
            height: 4,
            margin: EdgeInsets.symmetric(vertical: 12),
            decoration: BoxDecoration(
              color: Colors.grey[300],
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          
          // Header
          Padding(
            padding: EdgeInsets.symmetric(horizontal: 20),
            child: Row(
              children: [
                Text(
                  'Request Details',
                  style: GoogleFonts.poppins(
                    fontSize: 20,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF2E3A59),
                  ),
                ),
                Spacer(),
                IconButton(
                  onPressed: () => Navigator.pop(context),
                  icon: Icon(Icons.close, color: Colors.grey[600]),
                ),
              ],
            ),
          ),
          
          Divider(height: 1),
          
          // Content
          Expanded(
            child: SingleChildScrollView(
              padding: EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Patient Info
                  Row(
                    children: [
                      CircleAvatar(
                        radius: 30,
                        backgroundColor: Color(0xFF3366FF),
                        child: Text(
                          (request['patientName'] ?? 'Unknown')[0].toUpperCase(),
                          style: GoogleFonts.poppins(
                            color: Colors.white,
                            fontSize: 24,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                      SizedBox(width: 15),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              request['patientName'] ?? 'Unknown Patient',
                              style: GoogleFonts.poppins(
                                fontSize: 18,
                                fontWeight: FontWeight.w600,
                                color: Color(0xFF2E3A59),
                              ),
                            ),
                            Text(
                              request['patientId'] ?? request['id'] ?? 'Unknown ID',
                              style: GoogleFonts.poppins(
                                fontSize: 14,
                                color: Colors.grey[600],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  
                  SizedBox(height: 20),
                  
                  // Request Details
                  _buildDetailRow('Medical Condition', request['condition'] ?? 'Emergency Request', Icons.medical_services),
                  _buildDetailRow('Urgency Level', request['urgency'] ?? 'Medium', Icons.priority_high),
                  _buildDetailRow('Location', address, Icons.location_on),
                  _buildDetailRow('Coordinates', coordinates, Icons.map),
                  _buildDetailRow('Distance', _calculateDistance(request), Icons.navigation),
                  _buildDetailRow('Contact Number', request['phoneNumber'] ?? 'N/A', Icons.phone),
                  _buildDetailRow('Request Time', _formatRequestTime(request['requestTime']), Icons.access_time),
                  _buildDetailRow('Status', request['status'] ?? 'Pending', Icons.info_outline),
                  
                  if (request['patientEmail'] != null)
                    _buildDetailRow('Email', request['patientEmail'], Icons.email),
                  
                  if (request['age'] != null)
                    _buildDetailRow('Age', '${request['age']} years', Icons.cake),
                  
                  if (request['gender'] != null)
                    _buildDetailRow('Gender', request['gender'], Icons.person),
                  
                  if (request['bloodType'] != null && request['bloodType'].isNotEmpty)
                    _buildDetailRow('Blood Type', request['bloodType'], Icons.bloodtype),
                  
                  if (request['allergies'] != null && (request['allergies'] as List).isNotEmpty)
                    _buildDetailRow('Allergies', (request['allergies'] as List).join(', '), Icons.warning),
                  
                  if (request['emergencyContact'] != null && request['emergencyContact'].isNotEmpty)
                    _buildDetailRow('Emergency Contact', request['emergencyContact'], Icons.contact_phone),
                  
                  SizedBox(height: 20),
                  
                  // Action Buttons
                  if (request['status'] == 'Pending')
                    Row(
                      children: [
                        Expanded(
                          child: ElevatedButton.icon(
                            onPressed: () {
                              Navigator.pop(context);
                              _handleAcceptRequest(request);
                            },
                            icon: Icon(Icons.check, size: 18),
                            label: Text('Accept Request'),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.green,
                              foregroundColor: Colors.white,
                              padding: EdgeInsets.symmetric(vertical: 12),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(10),
                              ),
                            ),
                          ),
                        ),
                        SizedBox(width: 12),
                        Expanded(
                          child: OutlinedButton.icon(
                            onPressed: () {
                              Navigator.pop(context);
                              _handleDeclineRequest(request);
                            },
                            icon: Icon(Icons.close, size: 18),
                            label: Text('Decline'),
                            style: OutlinedButton.styleFrom(
                              foregroundColor: Colors.red,
                              side: BorderSide(color: Colors.red),
                              padding: EdgeInsets.symmetric(vertical: 12),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(10),
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDetailRow(String label, String value, IconData icon) {
    return Padding(
      padding: EdgeInsets.symmetric(vertical: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Color(0xFF3366FF).withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, size: 18, color: Color(0xFF3366FF)),
          ),
          SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: GoogleFonts.poppins(
                    fontSize: 12,
                    color: Colors.grey[600],
                    fontWeight: FontWeight.w500,
                  ),
                ),
                SizedBox(height: 2),
                Text(
                  value,
                  style: GoogleFonts.poppins(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF2E3A59),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// patient_requestsAmbulance_screen.dart
