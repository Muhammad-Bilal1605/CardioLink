//dashboard home
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../provider/auth_provider.dart';
import 'appointment_screen.dart';
import 'chat_screen.dart';
import 'pharmacy_screen.dart';
import 'ambulance_screen.dart';
import 'ehr_screen.dart';
import 'patient_requestsAmbulance_screen.dart';
import 'login_screen.dart';

class DashboardHome extends StatefulWidget {
  @override
  _DashboardHomeState createState() => _DashboardHomeState();
}

class _DashboardHomeState extends State<DashboardHome> with TickerProviderStateMixin {
  int _selectedIndex = 0;
  late AnimationController _animationController;
  late Animation<double> _fabAnimation;
  late TabController _tabController;

  final List<Widget> _patientScreens = [
    _DashboardHomeContent(),
    AppointmentScreen(),
    ChatScreen(),
    PharmacyScreen(),
    AmbulanceScreen(),
    EHRScreen(),
  ];

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      vsync: this,
      duration: Duration(milliseconds: 300),
    );
    _fabAnimation = Tween<double>(begin: 1.0, end: 1.2).animate(
      CurvedAnimation(
        parent: _animationController,
        curve: Curves.easeInOut,
      ),
    );
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _animationController.dispose();
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<AuthProvider>(
      builder: (context, authProvider, child) {
        // Debug: Print current user data
        print('Current User: ${authProvider.currentUser}');
        print('AuthProvider UserType: ${authProvider.userType}');
        
        // Use the userType directly from AuthProvider instead of currentUser map
        String userType = authProvider.userType ?? 'patient';
        
        print('Detected User Type: $userType');

        // Show different UI based on user type
        if (userType == 'ambulance_employer') {
          print('Showing Ambulance Employer UI');
          return _buildAmbulanceEmployerUI();
        } else {
          print('Showing Patient UI');
          return _buildPatientUI();
        }
      },
    );
  }

  Widget _buildPatientUI() {
    return Scaffold(
      body: _patientScreens[_selectedIndex],
      floatingActionButton: _selectedIndex == 2 ? _buildAnimatedChatFab() : null,
      bottomNavigationBar: _buildAnimatedBottomNavBar(),
    );
  }

  Widget _buildAmbulanceEmployerUI() {
    return Scaffold(
      backgroundColor: Color(0xFFF5F9FF),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: Text(
          'CardioLink - Ambulance Portal',
          style: GoogleFonts.poppins(
            fontSize: 20,
            fontWeight: FontWeight.w600,
            color: Color(0xFF2E3A59),
          ),
        ),
        bottom: TabBar(
          controller: _tabController,
          labelColor: Color(0xFF3366FF),
          unselectedLabelColor: Colors.grey[600],
          indicatorColor: Color(0xFF3366FF),
          indicatorWeight: 3,
          labelStyle: GoogleFonts.poppins(
            fontSize: 16,
            fontWeight: FontWeight.w600,
          ),
          unselectedLabelStyle: GoogleFonts.poppins(
            fontSize: 16,
            fontWeight: FontWeight.w500,
          ),
          tabs: [
            Tab(
              icon: Icon(Icons.dashboard),
              text: 'Dashboard',
            ),
            Tab(
              icon: Icon(Icons.people_outline),
              text: 'Patient Requests',
            ),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _DashboardHomeContent(), // Same dashboard content
          PatientRequestsAmbulanceScreen(), // New patient requests screen
        ],
      ),
    );
  }

  Widget _buildAnimatedBottomNavBar() {
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            Color(0xFF0F0C29).withOpacity(0.9),
            Color(0xFF302B63).withOpacity(0.9),
          ],
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.3),
            blurRadius: 15,
            spreadRadius: 2,
            offset: Offset(0, -5),
          ),
        ],
      ),
      child: BottomNavigationBar(
        currentIndex: _selectedIndex,
        onTap: (index) {
          setState(() {
            _selectedIndex = index;
            if (index == 2) {
              _animationController.forward().then((_) => _animationController.reverse());
            }
          });
        },
        type: BottomNavigationBarType.fixed,
        selectedItemColor: Color(0xFF00CCFF),
        unselectedItemColor: Colors.white.withOpacity(0.6),
        backgroundColor: Colors.transparent,
        elevation: 0,
        selectedFontSize: 12,
        unselectedFontSize: 10,
        showSelectedLabels: true,
        showUnselectedLabels: true,
        selectedLabelStyle: TextStyle(fontWeight: FontWeight.w600),
        items: [
          BottomNavigationBarItem(
            icon: Container(
              padding: EdgeInsets.all(8),
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: _selectedIndex == 0
                    ? Color(0xFF3366FF).withOpacity(0.2)
                    : Colors.transparent,
              ),
              child: Icon(Icons.dashboard, size: 24),
            ),
            label: 'Dashboard',
          ),
          BottomNavigationBarItem(
            icon: Container(
              padding: EdgeInsets.all(8),
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: _selectedIndex == 1
                    ? Color(0xFF00CCFF).withOpacity(0.2)
                    : Colors.transparent,
              ),
              child: Icon(Icons.calendar_today, size: 24),
            ),
            label: 'Appointments',
          ),
          BottomNavigationBarItem(
            icon: Container(
              padding: EdgeInsets.all(8),
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: _selectedIndex == 2
                    ? Color(0xFF00CCFF).withOpacity(0.2)
                    : Colors.transparent,
              ),
              child: Icon(Icons.chat_bubble_outline_sharp, size: 24),
            ),
            label: 'Chat',
          ),
          BottomNavigationBarItem(
            icon: Container(
              padding: EdgeInsets.all(8),
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: _selectedIndex == 3
                    ? Color(0xFF6B8E3D).withOpacity(0.2)
                    : Colors.transparent,
              ),
              child: Icon(Icons.local_pharmacy, size: 24),
            ),
            label: 'Pharmacy',
          ),
          BottomNavigationBarItem(
            icon: Container(
              padding: EdgeInsets.all(8),
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: _selectedIndex == 4
                    ? Color(0xFFFF4757).withOpacity(0.2)
                    : Colors.transparent,
              ),
              child: Icon(Icons.local_hospital, size: 24),
            ),
            label: 'Ambulance',
          ),
          BottomNavigationBarItem(
            icon: Container(
              padding: EdgeInsets.all(8),
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: _selectedIndex == 5
                    ? Color(0xFF8A2BE2).withOpacity(0.2)
                    : Colors.transparent,
              ),
              child: Icon(Icons.folder_shared, size: 24),
            ),
            label: 'EHR',
          ),
        ],
      ),
    );
  }

  Widget _buildAnimatedChatFab() {
    return AnimatedBuilder(
      animation: _fabAnimation,
      builder: (context, child) {
        return Transform.scale(
          scale: _fabAnimation.value,
          child: FloatingActionButton(
            onPressed: () {},
            backgroundColor: Color(0xFF00CCFF),
            elevation: 5,
            child: Container(
              width: 60,
              height: 60,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: LinearGradient(
                  colors: [
                    Color(0xFF00CCFF),
                    Color(0xFF3366FF),
                  ],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                boxShadow: [
                  BoxShadow(
                    color: Color(0xFF00CCFF).withOpacity(0.4),
                    blurRadius: 15,
                    spreadRadius: 2,
                  ),
                ],
              ),
              child: Icon(
                Icons.chat,
                color: Colors.white,
                size: 28,
              ),
            ),
          ),
        );
      },
    );
  }
}

// Extract the original dashboard content into a separate widget
class _DashboardHomeContent extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Color(0xFFF5F9FF),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // App Header with Gradient
              Container(
                margin: EdgeInsets.only(bottom: 20),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'CardioLink',
                      style: GoogleFonts.poppins(
                        fontSize: 28,
                        fontWeight: FontWeight.w700,
                        color: Color(0xFF2E3A59),
                        letterSpacing: 0.5,
                      ),
                    ),
                    InkWell(
                      onTap: () => _showSettingsBottomSheet(context),
                      borderRadius: BorderRadius.circular(25),
                      child: Container(
                        padding: EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          shape: BoxShape.circle,
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.1),
                              blurRadius: 10,
                              offset: Offset(0, 4),
                            ),
                          ],
                        ),
                        child: Icon(
                          Icons.settings_outlined,
                          color: Color(0xFF3366FF),
                          size: 24,
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              // User Profile Card with Animated Gradient
              _buildUserProfileCard(context),

              SizedBox(height: 25),

              // Health Stats with Pulse Animation
              _buildHealthStatsRow(),

              SizedBox(height: 20),

              // Next Appointment Card
              _buildAppointmentCard(),

              SizedBox(height: 20),

              // Recent Records Section
              _buildRecentRecordsSection(),

              SizedBox(height: 20),

              // Quick Actions Section
              _buildQuickActionsSection(),

              // Add bottom padding for nav bar
              SizedBox(height: 80),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildUserProfileCard(BuildContext context) {
    return Container(
      padding: EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [Color(0xFF3366FF), Color(0xFF00CCFF)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Color(0xFF3366FF).withOpacity(0.3),
            blurRadius: 15,
            offset: Offset(0, 5),
          ),
        ],
      ),
      child: Row(
        children: [
          Hero(
            tag: 'profile-avatar',
            child: CircleAvatar(
              radius: 30,
              backgroundColor: Colors.white,
              backgroundImage: NetworkImage(
                'https://images.unsplash.com/photo-1603415526960-f8f62b36c9a7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
              ),
            ),
          ),
          SizedBox(width: 15),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Welcome Back!',
                  style: GoogleFonts.poppins(
                    color: Colors.white.withOpacity(0.9),
                    fontSize: 14,
                  ),
                ),
                Consumer<AuthProvider>(
                  builder: (context, authProvider, child) {
                    // Fixed: Handle currentUser as Map<String, dynamic>
                    String userName = 'Guest User';
                    
                    if (authProvider.currentUser != null) {
                      // Access the name from the Map
                      userName = authProvider.currentUser!['name']?.toString() ?? 'Guest User';
                    }
                    
                    return Text(
                      userName,
                      style: GoogleFonts.poppins(
                        color: Colors.white,
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                      ),
                    );
                  },
                ),
                Text(
                  'Patient ID: #CA2024001',
                  style: GoogleFonts.poppins(
                    color: Colors.white.withOpacity(0.8),
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
          Container(
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.2),
              shape: BoxShape.circle,
            ),
            padding: EdgeInsets.all(8),
            child: Badge(
              smallSize: 8,
              backgroundColor: Colors.red,
              child: Icon(
                Icons.notifications_outlined,
                color: Colors.white,
                size: 24,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHealthStatsRow() {
    return Row(
      children: [
        Expanded(
          child: _buildHealthCard(
            'Heart Rate',
            '72 BPM',
            Icons.favorite,
            Colors.red,
            isAnimated: true,
          ),
        ),
        SizedBox(width: 15),
        Expanded(
          child: _buildHealthCard(
            'Blood Pressure',
            '120/80',
            Icons.opacity,
            Colors.blue,
          ),
        ),
      ],
    );
  }

  Widget _buildHealthCard(String title, String value, IconData icon, Color color, {bool isAnimated = false}) {
    return Container(
      padding: EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(15),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: Offset(0, 5),
          ),
        ],
      ),
      child: Column(
        children: [
          Container(
            padding: EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: isAnimated
                ? _buildPulseIcon(icon, color)
                : Icon(icon, color: color, size: 24),
          ),
          SizedBox(height: 15),
          Text(
            value,
            style: GoogleFonts.poppins(
              fontSize: 20,
              fontWeight: FontWeight.w600,
              color: Color(0xFF2E3A59),
            ),
          ),
          SizedBox(height: 5),
          Text(
            title,
            style: GoogleFonts.poppins(
              fontSize: 12,
              color: Colors.grey[600],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPulseIcon(IconData icon, Color color) {
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 1.0, end: 1.2),
      duration: Duration(seconds: 1),
      curve: Curves.easeInOut,
      builder: (context, value, child) {
        return Transform.scale(
          scale: value,
          child: Icon(icon, color: color, size: 24),
        );
      },
    );
  }

  Widget _buildAppointmentCard() {
    return Container(
      padding: EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 15,
            offset: Offset(0, 5),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Color(0xFF3366FF).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(
                  Icons.calendar_today,
                  color: Color(0xFF3366FF),
                  size: 24,
                ),
              ),
              SizedBox(width: 10),
              Text(
                'Next Appointment',
                style: GoogleFonts.poppins(
                  fontSize: 18,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF2E3A59),
                ),
              ),
            ],
          ),
          SizedBox(height: 15),
          Container(
            padding: EdgeInsets.all(15),
            decoration: BoxDecoration(
              color: Color(0xFFF5F9FF),
              borderRadius: BorderRadius.circular(15),
              border: Border.all(
                color: Color(0xFF3366FF).withOpacity(0.1),
                width: 1,
              ),
            ),
            child: InkWell(
              onTap: () {
                // Handle appointment tap
              },
              borderRadius: BorderRadius.circular(15),
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 25,
                    backgroundColor: Color(0xFF3366FF),
                    backgroundImage: NetworkImage(
                      'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&h=150&fit=crop&crop=face',
                    ),
                  ),
                  SizedBox(width: 15),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Dr. Sarah Wilson',
                          style: GoogleFonts.poppins(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                            color: Color(0xFF2E3A59),
                          ),
                        ),
                        Text(
                          'Cardiologist',
                          style: GoogleFonts.poppins(
                            fontSize: 14,
                            color: Colors.grey[600],
                          ),
                        ),
                        SizedBox(height: 5),
                        Text(
                          'Tomorrow, 10:30 AM',
                          style: GoogleFonts.poppins(
                            fontSize: 14,
                            color: Color(0xFF3366FF),
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Icon(
                    Icons.arrow_forward_ios,
                    color: Color(0xFF3366FF),
                    size: 18,
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRecentRecordsSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Recent Records',
          style: GoogleFonts.poppins(
            fontSize: 20,
            fontWeight: FontWeight.w600,
            color: Color(0xFF2E3A59),
          ),
        ),
        SizedBox(height: 15),
        _buildRecordCard(
          'ECG Test Results',
          'Normal sinus rhythm detected',
          'May 20, 2024',
          Icons.monitor_heart,
          Colors.green,
          'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=100&h=100&fit=crop',
        ),
        SizedBox(height: 10),
        _buildRecordCard(
          'Blood Test Report',
          'Cholesterol levels within normal range',
          'May 18, 2024',
          Icons.bloodtype,
          Colors.orange,
          'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=100&h=100&fit=crop',
        ),
        SizedBox(height: 10),
        _buildRecordCard(
          'Medication Reminder',
          'Lisinopril 10mg - Take with breakfast',
          'Daily',
          Icons.medication,
          Colors.purple,
          'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=100&h=100&fit=crop',
        ),
      ],
    );
  }

  Widget _buildQuickActionsSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Quick Actions',
          style: GoogleFonts.poppins(
            fontSize: 20,
            fontWeight: FontWeight.w600,
            color: Color(0xFF2E3A59),
          ),
        ),
        SizedBox(height: 15),
        Row(
          children: [
            Expanded(
              child: _buildQuickActionCard(
                'Emergency Call',
                Icons.phone,
                Colors.red,
              ),
            ),
            SizedBox(width: 15),
            Expanded(
              child: _buildQuickActionCard(
                'Find Pharmacy',
                Icons.local_pharmacy,
                Colors.green,
              ),
            ),
            SizedBox(width: 15),
            Expanded(
              child: _buildQuickActionCard(
                'Video Consult',
                Icons.video_call,
                Colors.blue,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildRecordCard(String title, String subtitle, String date, IconData icon, Color color, [String? imageUrl]) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: BorderRadius.circular(15),
        onTap: () {
          // Handle record tap
        },
        child: Container(
          padding: EdgeInsets.all(15),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(15),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.05),
                blurRadius: 10,
                offset: Offset(0, 3),
              ),
            ],
          ),
          child: Row(
            children: [
              Container(
                width: 50,
                height: 50,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(12),
                  color: color.withOpacity(0.1),
                ),
                child: imageUrl != null
                    ? ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: Image.network(
                    imageUrl,
                    width: 50,
                    height: 50,
                    fit: BoxFit.cover,
                    errorBuilder: (context, error, stackTrace) {
                      return Center(
                        child: Icon(icon, color: color, size: 24),
                      );
                    },
                  ),
                )
                    : Center(
                  child: Icon(icon, color: color, size: 24),
                ),
              ),
              SizedBox(width: 15),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: GoogleFonts.poppins(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: Color(0xFF2E3A59),
                      ),
                    ),
                    SizedBox(height: 4),
                    Text(
                      subtitle,
                      style: GoogleFonts.poppins(
                        fontSize: 14,
                        color: Colors.grey[600],
                      ),
                    ),
                    SizedBox(height: 4),
                    Text(
                      date,
                      style: GoogleFonts.poppins(
                        fontSize: 12,
                        color: Color(0xFF3366FF),
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),
              Icon(
                Icons.chevron_right,
                color: Colors.grey[400],
                size: 24,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildQuickActionCard(String title, IconData icon, Color color) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: BorderRadius.circular(15),
        onTap: () {
          // Handle quick action tap
        },
        child: Container(
          padding: EdgeInsets.all(15),
          decoration: BoxDecoration(
            color: color.withOpacity(0.1),
            borderRadius: BorderRadius.circular(15),
            border: Border.all(color: color.withOpacity(0.2), width: 1),
          ),
          child: Column(
            children: [
              Container(
                padding: EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.2),
                  shape: BoxShape.circle,
                ),
                child: Icon(icon, color: color, size: 24),
              ),
              SizedBox(height: 10),
              Text(
                title,
                style: GoogleFonts.poppins(
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                  color: color,
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }

  // Settings Bottom Sheet
  void _showSettingsBottomSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        height: MediaQuery.of(context).size.height * 0.6,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.only(
            topLeft: Radius.circular(25),
            topRight: Radius.circular(25),
          ),
        ),
        child: Column(
          children: [
            // Handle bar
            Container(
              width: 40,
              height: 4,
              margin: EdgeInsets.symmetric(vertical: 15),
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
                    'Settings',
                    style: GoogleFonts.poppins(
                      fontSize: 22,
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
            
            Divider(height: 1, color: Colors.grey[200]),
            
            // Settings Options
            Expanded(
              child: SingleChildScrollView(
                padding: EdgeInsets.all(20),
                child: Column(
                  children: [
                    // User Profile Section
                    Consumer<AuthProvider>(
                      builder: (context, authProvider, child) {
                        return Container(
                          padding: EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: Color(0xFFF5F9FF),
                            borderRadius: BorderRadius.circular(15),
                            border: Border.all(
                              color: Color(0xFF3366FF).withOpacity(0.1),
                            ),
                          ),
                          child: Row(
                            children: [
                              CircleAvatar(
                                radius: 25,
                                backgroundColor: Color(0xFF3366FF),
                                backgroundImage: NetworkImage(
                                  'https://images.unsplash.com/photo-1603415526960-f8f62b36c9a7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                                ),
                              ),
                              SizedBox(width: 15),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      authProvider.userDisplayName,
                                      style: GoogleFonts.poppins(
                                        fontSize: 16,
                                        fontWeight: FontWeight.w600,
                                        color: Color(0xFF2E3A59),
                                      ),
                                    ),
                                    Text(
                                      authProvider.userEmail,
                                      style: GoogleFonts.poppins(
                                        fontSize: 14,
                                        color: Colors.grey[600],
                                      ),
                                    ),
                                    Text(
                                      authProvider.isAmbulanceEmployer ? 'Ambulance Employer' : 'Patient',
                                      style: GoogleFonts.poppins(
                                        fontSize: 12,
                                        color: Color(0xFF3366FF),
                                        fontWeight: FontWeight.w500,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        );
                      },
                    ),
                    
                    SizedBox(height: 20),
                    
                    // Settings Menu Items
                    _buildSettingsItem(
                      'Edit Profile',
                      Icons.person_outline,
                      Color(0xFF3366FF),
                      () {
                        Navigator.pop(context);
                        // TODO: Navigate to profile edit screen
                        _showSnackBar(context, 'Profile editing coming soon!', Colors.blue);
                      },
                    ),
                    
                    _buildSettingsItem(
                      'Notifications',
                      Icons.notifications_outlined,
                      Colors.orange,
                      () {
                        Navigator.pop(context);
                        // TODO: Navigate to notifications settings
                        _showSnackBar(context, 'Notification settings coming soon!', Colors.orange);
                      },
                    ),
                    
                    _buildSettingsItem(
                      'Privacy & Security',
                      Icons.security_outlined,
                      Colors.purple,
                      () {
                        Navigator.pop(context);
                        // TODO: Navigate to privacy settings
                        _showSnackBar(context, 'Privacy settings coming soon!', Colors.purple);
                      },
                    ),
                    
                    _buildSettingsItem(
                      'Help & Support',
                      Icons.help_outline,
                      Colors.blue,
                      () {
                        Navigator.pop(context);
                        // TODO: Navigate to help screen
                        _showSnackBar(context, 'Help & support coming soon!', Colors.blue);
                      },
                    ),
                    
                    SizedBox(height: 20),
                    
                    // Logout Button
                    Container(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        onPressed: () => _handleLogout(context),
                        icon: Icon(Icons.logout, size: 20),
                        label: Text(
                          'Logout',
                          style: GoogleFonts.poppins(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.red,
                          foregroundColor: Colors.white,
                          padding: EdgeInsets.symmetric(vertical: 15),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                          elevation: 2,
                        ),
                      ),
                    ),
                    
                    SizedBox(height: 20),
                    
                    // App Version
                    Text(
                      'CardioLink v1.0.0',
                      style: GoogleFonts.poppins(
                        fontSize: 12,
                        color: Colors.grey[500],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSettingsItem(String title, IconData icon, Color color, VoidCallback onTap) {
    return Container(
      margin: EdgeInsets.only(bottom: 12),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(12),
          onTap: onTap,
          child: Container(
            padding: EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: Colors.grey[200]!,
                width: 1,
              ),
            ),
            child: Row(
              children: [
                Container(
                  padding: EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: color.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(icon, color: color, size: 24),
                ),
                SizedBox(width: 15),
                Expanded(
                  child: Text(
                    title,
                    style: GoogleFonts.poppins(
                      fontSize: 16,
                      fontWeight: FontWeight.w500,
                      color: Color(0xFF2E3A59),
                    ),
                  ),
                ),
                Icon(
                  Icons.arrow_forward_ios,
                  color: Colors.grey[400],
                  size: 16,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _handleLogout(BuildContext context) async {
    try {
      // Show confirmation dialog
      bool shouldLogout = await showDialog<bool>(
        context: context,
        builder: (BuildContext context) {
          return AlertDialog(
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
            ),
            title: Text(
              'Logout',
              style: GoogleFonts.poppins(
                fontSize: 18,
                fontWeight: FontWeight.w600,
                color: Color(0xFF2E3A59),
              ),
            ),
            content: Text(
              'Are you sure you want to logout from your account?',
              style: GoogleFonts.poppins(
                fontSize: 14,
                color: Colors.grey[600],
              ),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.of(context).pop(false),
                child: Text(
                  'Cancel',
                  style: GoogleFonts.poppins(
                    color: Colors.grey[600],
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
              ElevatedButton(
                onPressed: () => Navigator.of(context).pop(true),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.red,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                child: Text(
                  'Logout',
                  style: GoogleFonts.poppins(
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          );
        },
      ) ?? false;

      if (!shouldLogout) return;

      // Close the settings bottom sheet first
      Navigator.pop(context);

      // Show loading indicator
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (BuildContext context) {
          return Center(
            child: Container(
              padding: EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  CircularProgressIndicator(
                    color: Color(0xFF3366FF),
                  ),
                  SizedBox(height: 16),
                  Text(
                    'Logging out...',
                    style: GoogleFonts.poppins(
                      fontSize: 16,
                      fontWeight: FontWeight.w500,
                      color: Color(0xFF2E3A59),
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      );

      // Perform logout
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      bool logoutSuccess = await authProvider.logout();

      // Close loading dialog
      Navigator.pop(context);

      if (logoutSuccess) {
        // Navigate to login screen and clear all previous routes
        Navigator.pushAndRemoveUntil(
          context,
          MaterialPageRoute(builder: (context) => LoginScreen()),
          (route) => false,
        );
        
        _showSnackBar(context, 'Logged out successfully', Colors.green);
      } else {
        _showSnackBar(context, 'Logout failed. Please try again.', Colors.red);
      }

    } catch (e) {
      print('Logout error: $e');
      // Close any open dialogs
      Navigator.pop(context);
      _showSnackBar(context, 'An error occurred during logout', Colors.red);
    }
  }

  void _showSnackBar(BuildContext context, String message, Color color) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          message,
          style: GoogleFonts.poppins(color: Colors.white),
        ),
        backgroundColor: color,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(10),
        ),
        margin: EdgeInsets.all(16),
      ),
    );
  }
}