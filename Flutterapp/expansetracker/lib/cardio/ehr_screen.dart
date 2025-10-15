import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../provider/auth_provider.dart';
import '../widgets/ehr/overview/right_row1.dart';
import '../widgets/ehr/overview/right_row2_column1.dart';
import '../widgets/ehr/overview/right_row2_column2.dart';
import '../widgets/ehr/overview/right_row3.dart';
import 'social_history_screen.dart';
import 'visits_screen.dart';
import '../widgets/ehr/imaging/imaging_list.dart';
import '../widgets/ehr/labs/lab_list.dart';
import '../widgets/ehr/procedures/procedure_list.dart';
import '../widgets/ehr/hospitalizations/hospitalization_list.dart';
import '../widgets/ehr/medications/current_medications.dart';
import '../widgets/ehr/vitals/vitals_page.dart';

class EHRScreen extends StatefulWidget {
  @override
  _EHRScreenState createState() => _EHRScreenState();
}

class _EHRScreenState extends State<EHRScreen> {
  String _activePage = 'overview';
  Map<String, dynamic>? _patient;
  bool _loading = true;
  String? _error;
  String? _patientId;
  bool _drawerOpen = false;

  @override
  void initState() {
    super.initState();
    _loadPatientData();
  }

  Future<void> _loadPatientData() async {
    try {
      setState(() {
        _loading = true;
        _error = null;
      });

      // Get current user from AuthProvider
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final currentUser = authProvider.currentUser;
      
      print('EHR Screen - Loading patient data...');
      print('Current user: $currentUser');
      print('User type: ${authProvider.userType}');
      
      if (currentUser != null) {
        setState(() {
          _patient = currentUser;
          _patientId = currentUser['_id'] ?? currentUser['id'];
          _loading = false;
        });
        print('Patient data loaded successfully: $_patientId');
      } else {
        setState(() {
          _error = 'No patient data available. Please log in again.';
          _loading = false;
        });
        print('No patient data available');
      }
    } catch (e) {
      print('Error loading patient data: $e');
      setState(() {
        _error = 'Failed to load patient data: ${e.toString()}';
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    print('EHR Screen - Building widget...');
    print('Loading: $_loading');
    print('Error: $_error');
    print('Patient: $_patient');
    
    if (_loading) {
      print('EHR Screen - Showing loading state');
    return Scaffold(
        backgroundColor: const Color(0xFFF5F9FF),
        appBar: AppBar(
          backgroundColor: const Color(0xFF6B8E3D),
          elevation: 0,
          leading: IconButton(
            onPressed: () => Navigator.pop(context),
            icon: const Icon(Icons.arrow_back, color: Colors.white),
          ),
          title: Text(
            'Electronic Health Record',
            style: GoogleFonts.inter(
                    color: Colors.white,
                    fontWeight: FontWeight.w600,
              fontSize: 18,
                    ),
                  ),
                ),
        body: const Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              CircularProgressIndicator(
                valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF6B8E3D)),
              ),
              SizedBox(height: 16),
              Text(
                'Loading EHR...',
                style: TextStyle(
                  fontSize: 16,
                  color: Color(0xFF2D3748),
                ),
              ),
          ],
        ),
      ),
      );
    }

    if (_error != null) {
    return Scaffold(
        backgroundColor: const Color(0xFFF5F9FF),
        appBar: AppBar(
          backgroundColor: const Color(0xFF6B8E3D),
          elevation: 0,
          leading: IconButton(
            onPressed: () => Navigator.pop(context),
            icon: const Icon(Icons.arrow_back, color: Colors.white),
          ),
          title: Text(
            'Electronic Health Record',
            style: GoogleFonts.inter(
                    color: Colors.white,
                    fontWeight: FontWeight.w600,
                fontSize: 18,
            ),
          ),
        ),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
      child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
        children: [
                Icon(
                  Icons.error_outline,
                  size: 64,
                  color: Colors.red[300],
                ),
                const SizedBox(height: 16),
          Text(
                  'Error Loading EHR',
                  style: GoogleFonts.inter(
                    fontSize: 20,
              fontWeight: FontWeight.w600,
                    color: const Color(0xFF2D3748),
                  ),
                ),
                const SizedBox(height: 8),
          Text(
                  _error!,
                  style: GoogleFonts.inter(
                    fontSize: 14,
                    color: Colors.grey[600],
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 24),
                ElevatedButton(
                  onPressed: _loadPatientData,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF6B8E3D),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
                  ),
            child: Text(
                    'Retry',
                    style: GoogleFonts.inter(
                      color: Colors.white,
                        fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: () => Navigator.pop(context),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.grey[300],
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
            child: Text(
                    'Go Back',
                    style: GoogleFonts.inter(
                      color: Colors.white,
                fontWeight: FontWeight.w600,
                    ),
                  ),
              ),
            ],
          ),
        ),
      ),
    );
  }

    print('EHR Screen - Building main content');
    return Scaffold(
      backgroundColor: const Color(0xFFF5F9FF),
      appBar: AppBar(
        backgroundColor: const Color(0xFF6B8E3D),
        elevation: 0,
        leading: IconButton(
          onPressed: () => Navigator.pop(context),
          icon: const Icon(Icons.arrow_back, color: Colors.white),
        ),
        title: Text(
          'Electronic Health Record',
          style: GoogleFonts.inter(
            color: Colors.white,
                            fontWeight: FontWeight.w600,
              fontSize: 18,
          ),
        ),
        actions: [
          IconButton(
            onPressed: () {
              setState(() {
                _drawerOpen = !_drawerOpen;
              });
            },
            icon: const Icon(Icons.menu, color: Colors.white),
                        ),
                      ],
                    ),
      body: Stack(
        children: [
          // Main Content
          SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: _buildMainContent(),
          ),
          
          // Drawer Overlay
          if (_drawerOpen)
                  Container(
              color: Colors.black.withOpacity(0.5),
              child: GestureDetector(
                onTap: () {
                  setState(() {
                    _drawerOpen = false;
                  });
                },
                child: Align(
                  alignment: Alignment.centerLeft,
                  child: Container(
                    width: MediaQuery.of(context).size.width * 0.8,
                    height: double.infinity,
                    color: Colors.white,
                    child: _buildDrawer(),
                  ),
                      ),
                    ),
                  ),
                ],
      ),
    );
  }

  Widget _buildDrawer() {
    final menuItems = [
      {'id': 'overview', 'title': 'Overview', 'icon': Icons.dashboard},
      {'id': 'social_history', 'title': 'Social History', 'icon': Icons.people},
      {'id': 'visits', 'title': 'Visits', 'icon': Icons.medical_services},
      {'id': 'labs', 'title': 'Labs', 'icon': Icons.science},
      {'id': 'imaging', 'title': 'Medical Imaging', 'icon': Icons.camera_alt},
      {'id': 'procedures', 'title': 'Procedures', 'icon': Icons.medical_information},
      {'id': 'medications', 'title': 'Medications', 'icon': Icons.medication},
      {'id': 'vitals', 'title': 'Vital Signs', 'icon': Icons.monitor_heart},
      {'id': 'hospitalizations', 'title': 'Hospitalizations', 'icon': Icons.local_hospital},
    ];

    return Column(
            children: [
        // Header
              Container(
          padding: const EdgeInsets.all(20),
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              colors: [Color(0xFF6B8E3D), Color(0xFF4A7C59)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
      ),
      child: Row(
        children: [
              const Icon(Icons.person, color: Colors.white, size: 24),
              const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                      'EHR Navigation',
                      style: GoogleFonts.inter(
                        color: Colors.white,
                        fontWeight: FontWeight.w600,
                        fontSize: 18,
                      ),
                    ),
                    if (_patient != null)
                Text(
                        '${_patient!['firstName'] ?? ''} ${_patient!['lastName'] ?? ''}',
                        style: GoogleFonts.inter(
                          color: Colors.white70,
                        fontSize: 14,
                  ),
                ),
              ],
            ),
          ),
              IconButton(
                onPressed: () {
                  setState(() {
                    _drawerOpen = false;
                  });
                },
                icon: const Icon(Icons.close, color: Colors.white),
              ),
            ],
          ),
        ),
        
        // Menu Items
        Expanded(
          child: ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: menuItems.length,
            itemBuilder: (context, index) {
              final item = menuItems[index];
              final isActive = _activePage == item['id'];
              
              return Container(
                margin: const EdgeInsets.only(bottom: 8),
                child: Material(
                  color: isActive 
                      ? const Color(0xFF6B8E3D).withOpacity(0.1)
                      : Colors.transparent,
                  borderRadius: BorderRadius.circular(8),
      child: InkWell(
                    borderRadius: BorderRadius.circular(8),
        onTap: () {
          if (item['id'] == 'social_history') {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => SocialHistoryScreen(patientId: _patientId),
              ),
            );
          } else if (item['id'] == 'visits') {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => VisitsScreen(patientId: _patientId),
              ),
            );
          } else {
            setState(() {
              _activePage = item['id'] as String;
              _drawerOpen = false;
            });
          }
        },
        child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      child: Row(
            children: [
                          Icon(
                            item['icon'] as IconData,
                            size: 20,
                            color: isActive 
                                ? const Color(0xFF6B8E3D)
                                : Colors.grey[600],
                          ),
                          const SizedBox(width: 16),
                  Expanded(
            child: Text(
                              item['title'] as String,
                              style: GoogleFonts.inter(
                            fontSize: 16,
                                fontWeight: isActive ? FontWeight.w600 : FontWeight.w500,
                                color: isActive 
                                    ? const Color(0xFF6B8E3D)
                                    : const Color(0xFF2D3748),
                              ),
                            ),
                          ),
                          if (isActive)
                            Icon(
                              Icons.arrow_forward_ios,
                              size: 16,
                              color: const Color(0xFF6B8E3D),
          ),
        ],
      ),
                  ),
                  ),
                ),
              );
            },
                ),
              ),
            ],
    );
  }

  Widget _buildMainContent() {
    print('EHR Screen - Building main content for page: $_activePage');
    
    // For now, let's just return a simple test widget to see if the issue is with the complex components
    if (_activePage == 'overview') {
      print('EHR Screen - Building overview page');
      return _buildSimpleOverviewPage();
    }
    
    // Imaging section
    if (_activePage == 'imaging') {
      return SizedBox(
        height: 600,
        child: ImagingList(patientId: _patientId),
      );
    }

    // Labs section
    if (_activePage == 'labs') {
      return SizedBox(
        height: 600,
        child: LabList(patientId: _patientId),
      );
    }

    // Procedures section
    if (_activePage == 'procedures') {
      return SizedBox(
        height: 600,
        child: ProcedureList(patientId: _patientId),
      );
    }

    // Medications section
    if (_activePage == 'medications') {
      return SizedBox(
        height: 600,
        child: CurrentMedications(patientId: _patientId),
      );
    }

    // Hospitalizations section
    if (_activePage == 'hospitalizations') {
      return SizedBox(
        height: 600,
        child: HospitalizationList(patientId: _patientId),
      );
    }

    // Vital Signs section
    if (_activePage == 'vitals') {
      return SizedBox(
        height: 600,
        child: VitalsPage(patientId: _patientId),
      );
    }

    // Labs page placeholder for now (existing implementation can be added similarly)
    return Container(
      padding: const EdgeInsets.all(20),
      child: Column(
        children: [
          Text(
            'EHR Section: $_activePage',
            style: GoogleFonts.inter(
              fontSize: 24,
              fontWeight: FontWeight.w600,
              color: const Color(0xFF2D3748),
            ),
          ),
          const SizedBox(height: 16),
          Text(
            'This section is under development',
            style: GoogleFonts.inter(
              fontSize: 16,
              color: Colors.grey[600],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSimpleOverviewPage() {
    print('EHR Screen - Building simple overview page');
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Patient Information Card
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(20),
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
                Text(
                'Patient Information',
                style: GoogleFonts.inter(
                  fontSize: 20,
                    fontWeight: FontWeight.w600,
                  color: const Color(0xFF2D3748),
                ),
              ),
              const SizedBox(height: 16),
              if (_patient != null) ...[
                _buildPatientInfoRow('Name', '${_patient!['firstName'] ?? ''} ${_patient!['lastName'] ?? ''}'),
                _buildPatientInfoRow('Age', _calculateAge()),
                _buildPatientInfoRow('Gender', _patient!['gender'] ?? 'Not specified'),
                _buildPatientInfoRow('Date of Birth', _formatDate(_patient!['dateOfBirth'])),
                _buildPatientInfoRow('Phone', _patient!['phoneNumber'] ?? 'Not provided'),
                _buildPatientInfoRow('Email', _patient!['email'] ?? 'Not provided'),
              ] else ...[
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: Colors.grey[100],
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Column(
                    children: [
                      Icon(
                        Icons.person_outline,
                        size: 48,
                        color: Colors.grey[400],
                      ),
                      const SizedBox(height: 12),
                Text(
                        'No patient data available',
                        style: GoogleFonts.inter(
                          fontSize: 16,
                          fontWeight: FontWeight.w500,
                    color: Colors.grey[600],
                  ),
                ),
                      const SizedBox(height: 8),
                Text(
                        'Please ensure you are logged in as a patient',
                        style: GoogleFonts.inter(
                          fontSize: 14,
                          color: Colors.grey[500],
                        ),
                        textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
              ],
            ],
          ),
        ),
        
        const SizedBox(height: 16),
        
        // Medical Timeline - This is the main feature!
        SizedBox(
          height: 600, // Fixed height for the timeline
          child: RightRow1(patientId: _patientId),
        ),
        
        const SizedBox(height: 16),
        
            // Allergies Section - Full width for mobile
            SizedBox(
              height: 400, // Fixed height for the allergies
              child: RightRow2Column1(patientId: _patientId),
            ),
            
            const SizedBox(height: 16),
            
            // Vital Signs Section - Full width for mobile
            SizedBox(
              height: 400, // Adjusted height for the vital signs
              child: RightRow2Column2(patientId: _patientId),
            ),
            
            const SizedBox(height: 16),
            
            // Special Directives Section - Full width for mobile
            SizedBox(
              height: 300, // Fixed height for the special directives
              child: RightRow3(patientId: _patientId),
            ),
      ],
    );
  }

  Widget _buildPatientInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
          SizedBox(
            width: 100,
            child: Text(
              label,
              style: GoogleFonts.inter(
                    fontSize: 14,
                fontWeight: FontWeight.w500,
                    color: Colors.grey[600],
                  ),
                ),
          ),
          Expanded(
            child: Text(
              value,
              style: GoogleFonts.inter(
                          fontSize: 14,
                    fontWeight: FontWeight.w600,
                color: const Color(0xFF2D3748),
                    ),
                  ),
                ),
              ],
            ),
    );
  }

  String _calculateAge() {
    if (_patient == null || _patient!['dateOfBirth'] == null) return 'Unknown';
    
    try {
      final dob = DateTime.parse(_patient!['dateOfBirth']);
      final now = DateTime.now();
      int age = now.year - dob.year;
      if (now.month < dob.month || (now.month == dob.month && now.day < dob.day)) {
        age--;
      }
      return '$age years';
    } catch (e) {
      return 'Unknown';
    }
  }

  String _formatDate(String? dateString) {
    if (dateString == null) return 'Not provided';
    
    try {
      final date = DateTime.parse(dateString);
      return '${date.day}/${date.month}/${date.year}';
    } catch (e) {
      return 'Invalid date';
    }
  }


}