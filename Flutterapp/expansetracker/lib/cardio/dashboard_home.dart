//dashboard home - Enhanced UI with new color palette
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../provider/auth_provider.dart';
import 'appointment_screen.dart';
import 'new_videocall_screen.dart';
import 'pharmacy_screen.dart';
import 'ambulance_screen.dart';
import 'ehr_screen.dart';
import 'patient_requestsAmbulance_screen.dart';
import 'ambulance_map_screen.dart';
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
    NewVideocallScreen(),
    PharmacyScreen(),
    AmbulanceScreen(),
    EHRScreen(),
  ];

  final Map<String, dynamic> _sampleActiveRequest = {
    'patientName': 'Sarah Johnson',
    'emergencyType': 'Heart Attack',
    'latitude': '33.6844',
    'longitude': '73.0479',
    'address': '123 Main St, Islamabad',
    'timestamp': '5 min ago',
    'phoneNumber': '+92 300 1234567',
  };

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
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _animationController.dispose();
    _tabController.dispose();
    super.dispose();
  }

  void _navigateToMapScreen(Map<String, dynamic> requestData) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => AmbulanceMapScreen(requestData: requestData),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<AuthProvider>(
      builder: (context, authProvider, child) {
        String userType = authProvider.userType ?? 'patient';

        if (userType == 'ambulance_employer') {
          return _buildAmbulanceEmployerUI();
        } else {
          return _buildPatientUI();
        }
      },
    );
  }

  Widget _buildPatientUI() {
    return Scaffold(
      body: _patientScreens[_selectedIndex],
      floatingActionButton: _selectedIndex == 2 ? _buildAnimatedVideoCallFab() : null,
      bottomNavigationBar: _buildAnimatedBottomNavBar(),
    );
  }

  Widget _buildAmbulanceEmployerUI() {
    return Scaffold(
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              Color(0xFFF5F9FF),
              Color(0xFFE8F4F8),
            ],
          ),
        ),
        child: SafeArea(
          child: Column(
            children: [
              _buildAmbulanceEmployerHeader(),
              _buildModernTabBar(),
              Expanded(
                child: TabBarView(
                  controller: _tabController,
                  children: [
                    _AmbulanceEmployerDashboardContent(
                      onViewOnMap: _navigateToMapScreen,
                    ),
                    PatientRequestsAmbulanceScreen(),
                    _AmbulanceMapTab(requestData: _sampleActiveRequest),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildAmbulanceEmployerHeader() {
    return Container(
      padding: EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [Color(0xFFFF4757), Color(0xFFFF6B6B)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        boxShadow: [
          BoxShadow(
            color: Color(0xFFFF4757).withOpacity(0.3),
            blurRadius: 20,
            offset: Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        children: [
          Row(
            children: [
              Container(
                padding: EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(15),
                  border: Border.all(
                    color: Colors.white.withOpacity(0.3),
                    width: 2,
                  ),
                ),
                child: Icon(
                  Icons.local_hospital,
                  color: Colors.white,
                  size: 32,
                ),
              ),
              SizedBox(width: 15),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'CardioLink',
                      style: GoogleFonts.poppins(
                        fontSize: 24,
                        fontWeight: FontWeight.w700,
                        color: Colors.white,
                        letterSpacing: 0.5,
                      ),
                    ),
                    Text(
                      'Ambulance Portal',
                      style: GoogleFonts.poppins(
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                        color: Colors.white.withOpacity(0.9),
                      ),
                    ),
                  ],
                ),
              ),
              InkWell(
                onTap: () => _showSettingsBottomSheet(context),
                borderRadius: BorderRadius.circular(12),
                child: Container(
                  padding: EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(
                    Icons.settings_outlined,
                    color: Colors.white,
                    size: 24,
                  ),
                ),
              ),
            ],
          ),
          
          SizedBox(height: 15),
          
          Consumer<AuthProvider>(
            builder: (context, authProvider, child) {
              return Container(
                padding: EdgeInsets.all(15),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(15),
                  border: Border.all(
                    color: Colors.white.withOpacity(0.3),
                    width: 1,
                  ),
                ),
                child: Row(
                  children: [
                    CircleAvatar(
                      radius: 25,
                      backgroundColor: Colors.white,
                      child: Icon(
                        Icons.person,
                        color: Color(0xFFFF4757),
                        size: 28,
                      ),
                    ),
                    SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            authProvider.userDisplayName,
                            style: GoogleFonts.poppins(
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                              color: Colors.white,
                            ),
                          ),
                          Text(
                            authProvider.userEmail,
                            style: GoogleFonts.poppins(
                              fontSize: 12,
                              color: Colors.white.withOpacity(0.9),
                            ),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ),
                    ),
                    Container(
                      padding: EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.3),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Container(
                            width: 8,
                            height: 8,
                            decoration: BoxDecoration(
                              color: Color(0xFF24C48E),
                              shape: BoxShape.circle,
                              boxShadow: [
                                BoxShadow(
                                  color: Color(0xFF24C48E).withOpacity(0.5),
                                  blurRadius: 4,
                                  spreadRadius: 1,
                                ),
                              ],
                            ),
                          ),
                          SizedBox(width: 6),
                          Text(
                            'Active',
                            style: GoogleFonts.poppins(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: Colors.white,
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
        ],
      ),
    );
  }

  Widget _buildModernTabBar() {
    return Container(
      margin: EdgeInsets.symmetric(horizontal: 20, vertical: 15),
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
      child: TabBar(
        controller: _tabController,
        indicator: BoxDecoration(
          gradient: LinearGradient(
            colors: [Color(0xFFFF4757), Color(0xFFFF6B6B)],
          ),
          borderRadius: BorderRadius.circular(12),
        ),
        labelColor: Colors.white,
        unselectedLabelColor: Colors.grey[600],
        labelStyle: GoogleFonts.poppins(
          fontSize: 13,
          fontWeight: FontWeight.w600,
        ),
        unselectedLabelStyle: GoogleFonts.poppins(
          fontSize: 13,
          fontWeight: FontWeight.w500,
        ),
        padding: EdgeInsets.all(4),
        tabs: [
          Tab(
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.dashboard, size: 18),
                SizedBox(width: 6),
                Text('Dashboard'),
              ],
            ),
          ),
          Tab(
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.people_outline, size: 18),
                SizedBox(width: 6),
                Text('Requests'),
              ],
            ),
          ),
          Tab(
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.map, size: 18),
                SizedBox(width: 6),
                Text('Map'),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAnimatedBottomNavBar() {
    return Container(
      decoration: BoxDecoration(
        color: Color(0xFF23446C),
        boxShadow: [
          BoxShadow(
            color: Color(0xFF23446C).withOpacity(0.3),
            blurRadius: 20,
            spreadRadius: 0,
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
        selectedItemColor: Color(0xFF24C48E),
        unselectedItemColor: Color(0xFFC0D3DF),
        backgroundColor: Color(0xFF23446C),
        elevation: 0,
        selectedFontSize: 12,
        unselectedFontSize: 10,
        showSelectedLabels: true,
        showUnselectedLabels: true,
        selectedLabelStyle: GoogleFonts.poppins(fontWeight: FontWeight.w600),
        unselectedLabelStyle: GoogleFonts.poppins(fontWeight: FontWeight.w500),
        items: [
          BottomNavigationBarItem(
            icon: Container(
              padding: EdgeInsets.all(8),
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: _selectedIndex == 0
                    ? Color(0xFF24C48E).withOpacity(0.2)
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
                    ? Color(0xFF24C48E).withOpacity(0.2)
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
                    ? Color(0xFF24C48E).withOpacity(0.2)
                    : Colors.transparent,
              ),
              child: Icon(Icons.video_call, size: 24),
            ),
            label: 'Video Call',
          ),
          BottomNavigationBarItem(
            icon: Container(
              padding: EdgeInsets.all(8),
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: _selectedIndex == 3
                    ? Color(0xFF24C48E).withOpacity(0.2)
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
                    ? Color(0xFF24C48E).withOpacity(0.2)
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
                    ? Color(0xFF24C48E).withOpacity(0.2)
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

  Widget _buildAnimatedVideoCallFab() {
    return AnimatedBuilder(
      animation: _fabAnimation,
      builder: (context, child) {
        return Transform.scale(
          scale: _fabAnimation.value,
          child: FloatingActionButton(
            onPressed: () {},
            backgroundColor: Color(0xFF24C48E),
            elevation: 8,
            child: Container(
              width: 60,
              height: 60,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: LinearGradient(
                  colors: [
                    Color(0xFF24C48E),
                    Color(0xFF1FA876),
                  ],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                boxShadow: [
                  BoxShadow(
                    color: Color(0xFF24C48E).withOpacity(0.5),
                    blurRadius: 20,
                    spreadRadius: 2,
                  ),
                ],
              ),
              child: Icon(
                Icons.video_call,
                color: Colors.white,
                size: 28,
              ),
            ),
          ),
        );
      },
    );
  }

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
            Container(
              width: 40,
              height: 4,
              margin: EdgeInsets.symmetric(vertical: 15),
              decoration: BoxDecoration(
                color: Color(0xFFC0D3DF),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            Padding(
              padding: EdgeInsets.symmetric(horizontal: 20),
              child: Row(
                children: [
                  Text(
                    'Settings',
                    style: GoogleFonts.poppins(
                      fontSize: 22,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF292942),
                    ),
                  ),
                  Spacer(),
                  IconButton(
                    onPressed: () => Navigator.pop(context),
                    icon: Icon(Icons.close, color: Color(0xFFC0D3DF)),
                  ),
                ],
              ),
            ),
            Divider(height: 1, color: Color(0xFFEFF9FE)),
            Expanded(
              child: SingleChildScrollView(
                padding: EdgeInsets.all(20),
                child: Column(
                  children: [
                    Consumer<AuthProvider>(
                      builder: (context, authProvider, child) {
                        return Container(
                          padding: EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              colors: [Color(0xFF23446C), Color(0xFF2A5380)],
                            ),
                            borderRadius: BorderRadius.circular(15),
                          ),
                          child: Row(
                            children: [
                              CircleAvatar(
                                radius: 25,
                                backgroundColor: Colors.white,
                                child: Icon(
                                  Icons.person,
                                  color: Color(0xFF23446C),
                                  size: 28,
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
                                        color: Colors.white,
                                      ),
                                    ),
                                    Text(
                                      authProvider.userEmail,
                                      style: GoogleFonts.poppins(
                                        fontSize: 14,
                                        color: Colors.white.withOpacity(0.9),
                                      ),
                                    ),
                                    Text(
                                      authProvider.isAmbulanceEmployer ? 'Ambulance Employer' : 'Patient',
                                      style: GoogleFonts.poppins(
                                        fontSize: 12,
                                        color: Color(0xFF24C48E),
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
                    _buildSettingsItem(
                      'Edit Profile',
                      Icons.person_outline,
                      Color(0xFF23446C),
                      () {
                        Navigator.pop(context);
                        _showSnackBar(context, 'Profile editing coming soon!', Color(0xFF23446C));
                      },
                    ),
                    _buildSettingsItem(
                      'Notifications',
                      Icons.notifications_outlined,
                      Color(0xFF24C48E),
                      () {
                        Navigator.pop(context);
                        _showSnackBar(context, 'Notification settings coming soon!', Color(0xFF24C48E));
                      },
                    ),
                    _buildSettingsItem(
                      'Privacy & Security',
                      Icons.security_outlined,
                      Color(0xFF292942),
                      () {
                        Navigator.pop(context);
                        _showSnackBar(context, 'Privacy settings coming soon!', Color(0xFF292942));
                      },
                    ),
                    _buildSettingsItem(
                      'Help & Support',
                      Icons.help_outline,
                      Color(0xFFC0D3DF),
                      () {
                        Navigator.pop(context);
                        _showSnackBar(context, 'Help & support coming soon!', Color(0xFFC0D3DF));
                      },
                    ),
                    SizedBox(height: 20),
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
                    Text(
                      'CardioLink v1.0.0',
                      style: GoogleFonts.poppins(
                        fontSize: 12,
                        color: Color(0xFFC0D3DF),
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
                color: Color(0xFFEFF9FE),
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
                      color: Color(0xFF292942),
                    ),
                  ),
                ),
                Icon(
                  Icons.arrow_forward_ios,
                  color: Color(0xFFC0D3DF),
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
                color: Color(0xFF292942),
              ),
            ),
            content: Text(
              'Are you sure you want to logout from your account?',
              style: GoogleFonts.poppins(
                fontSize: 14,
                color: Color(0xFFC0D3DF),
              ),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.of(context).pop(false),
                child: Text(
                  'Cancel',
                  style: GoogleFonts.poppins(
                    color: Color(0xFFC0D3DF),
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

      Navigator.pop(context);

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
                    color: Color(0xFF24C48E),
                  ),
                  SizedBox(height: 16),
                  Text(
                    'Logging out...',
                    style: GoogleFonts.poppins(
                      fontSize: 16,
                      fontWeight: FontWeight.w500,
                      color: Color(0xFF292942),
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      );

      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      bool logoutSuccess = await authProvider.logout();

      Navigator.pop(context);

      if (logoutSuccess) {
        Navigator.pushAndRemoveUntil(
          context,
          MaterialPageRoute(builder: (context) => LoginScreen()),
          (route) => false,
        );
        
        _showSnackBar(context, 'Logged out successfully', Color(0xFF24C48E));
      } else {
        _showSnackBar(context, 'Logout failed. Please try again.', Colors.red);
      }

    } catch (e) {
      print('Logout error: $e');
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

class _AmbulanceMapTab extends StatelessWidget {
  final Map<String, dynamic> requestData;

  const _AmbulanceMapTab({
    Key? key,
    required this.requestData,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return AmbulanceMapScreen(requestData: requestData);
  }
}

class _AmbulanceEmployerDashboardContent extends StatelessWidget {
  final Function(Map<String, dynamic>) onViewOnMap;

  const _AmbulanceEmployerDashboardContent({
    Key? key,
    required this.onViewOnMap,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: EdgeInsets.fromLTRB(20, 20, 20, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildQuickStatsGrid(),
          SizedBox(height: 25),
          _buildSectionHeader('Active Ambulances', Icons.local_shipping),
          SizedBox(height: 15),
          _buildActiveAmbulancesCard(context),
          SizedBox(height: 25),
          _buildSectionHeader('Recent Activity', Icons.history),
          SizedBox(height: 15),
          _buildRecentActivityList(context),
          SizedBox(height: 20),
        ],
      ),
    );
  }

  Widget _buildQuickStatsGrid() {
    return LayoutBuilder(
      builder: (context, constraints) {
        double spacing = 15;
        double availableWidth = constraints.maxWidth;
        double cardWidth = (availableWidth - spacing) / 2;
        double cardHeight = cardWidth * 0.7;

        return Wrap(
          spacing: spacing,
          runSpacing: spacing,
          children: [
            SizedBox(
              width: cardWidth,
              height: cardHeight,
              child: _buildStatCard(
                'Pending Requests',
                '12',
                Icons.pending_actions,
                Color(0xFFFFA726),
                Color(0xFFFFB74D),
              ),
            ),
            SizedBox(
              width: cardWidth,
              height: cardHeight,
              child: _buildStatCard(
                'Active Rides',
                '5',
                Icons.local_shipping,
                Color(0xFF66BB6A),
                Color(0xFF81C784),
              ),
            ),
            SizedBox(
              width: cardWidth,
              height: cardHeight,
              child: _buildStatCard(
                'Completed Today',
                '23',
                Icons.check_circle,
                Color(0xFF42A5F5),
                Color(0xFF64B5F6),
              ),
            ),
            SizedBox(
              width: cardWidth,
              height: cardHeight,
              child: _buildStatCard(
                'Total Earnings',
                '\$1,240',
                Icons.account_balance_wallet,
                Color(0xFFAB47BC),
                Color(0xFFBA68C8),
              ),
            ),
          ],
        );
      },
    );
  }

  Widget _buildStatCard(String title, String value, IconData icon, Color color1, Color color2) {
    return Container(
      padding: EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [color1, color2],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: color1.withOpacity(0.3),
            blurRadius: 15,
            offset: Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: Colors.white, size: 26),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                value,
                style: GoogleFonts.poppins(
                  fontSize: 22,
                  fontWeight: FontWeight.w700,
                  color: Colors.white,
                ),
              ),
              SizedBox(height: 4),
              Text(
                title,
                style: GoogleFonts.poppins(
                  fontSize: 11,
                  fontWeight: FontWeight.w500,
                  color: Colors.white.withOpacity(0.9),
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title, IconData icon) {
    return Row(
      children: [
        Container(
          padding: EdgeInsets.all(8),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [Color(0xFFFF4757), Color(0xFFFF6B6B)],
            ),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(icon, color: Colors.white, size: 20),
        ),
        SizedBox(width: 12),
        Text(
          title,
          style: GoogleFonts.poppins(
            fontSize: 20,
            fontWeight: FontWeight.w600,
            color: Color(0xFF292942),
          ),
        ),
      ],
    );
  }

  Widget _buildActiveAmbulancesCard(BuildContext context) {
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
        children: [
          _buildAmbulanceItem(context, 'AMB-001', 'En Route', 'John Smith', Colors.green, true, {
            'patientName': 'Sarah Johnson',
            'emergencyType': 'Heart Attack',
            'latitude': '33.6844',
            'longitude': '73.0479',
            'address': '123 Main St, Islamabad',
            'timestamp': '5 min ago',
            'phoneNumber': '+92 300 1234567',
          }),
          Divider(height: 30),
          _buildAmbulanceItem(context, 'AMB-002', 'Available', 'Sarah Johnson', Colors.blue, false, null),
          Divider(height: 30),
          _buildAmbulanceItem(context, 'AMB-003', 'En Route', 'Mike Wilson', Colors.green, true, {
            'patientName': 'Ahmed Khan',
            'emergencyType': 'Accident',
            'latitude': '33.7294',
            'longitude': '73.0931',
            'address': 'F-7 Markaz, Islamabad',
            'timestamp': '12 min ago',
            'phoneNumber': '+92 301 9876543',
          }),
          Divider(height: 30),
          _buildAmbulanceItem(context, 'AMB-004', 'Available', 'Emily Davis', Colors.blue, false, null),
          Divider(height: 30),
          _buildAmbulanceItem(context, 'AMB-005', 'Maintenance', 'Robert Brown', Colors.orange, false, null),
        ],
      ),
    );
  }

  Widget _buildAmbulanceItem(
    BuildContext context,
    String id,
    String status,
    String driver,
    Color statusColor,
    bool isEnRoute,
    Map<String, dynamic>? requestData,
  ) {
    return Row(
      children: [
        Container(
          width: 50,
          height: 50,
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [Color(0xFFFF4757), Color(0xFFFF6B6B)],
            ),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(Icons.local_shipping, color: Colors.white, size: 28),
        ),
        SizedBox(width: 15),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                id,
                style: GoogleFonts.poppins(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF292942),
                ),
              ),
              Text(
                driver,
                style: GoogleFonts.poppins(
                  fontSize: 14,
                  color: Color(0xFFC0D3DF),
                ),
              ),
            ],
          ),
        ),
        if (isEnRoute && requestData != null)
          Material(
            color: Colors.transparent,
            child: InkWell(
              onTap: () {
                onViewOnMap(requestData);
              },
              borderRadius: BorderRadius.circular(10),
              child: Container(
                padding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: Color(0xFF23446C).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(
                    color: Color(0xFF23446C).withOpacity(0.3),
                  ),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      Icons.map,
                      size: 16,
                      color: Color(0xFF23446C),
                    ),
                    SizedBox(width: 5),
                    Text(
                      'View Map',
                      style: GoogleFonts.poppins(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: Color(0xFF23446C),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        if (!isEnRoute)
          Container(
            padding: EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: statusColor.withOpacity(0.1),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: statusColor.withOpacity(0.3)),
            ),
            child: Text(
              status,
              style: GoogleFonts.poppins(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: statusColor,
              ),
            ),
          ),
      ],
    );
  }

  Widget _buildRecentActivityList(BuildContext context) {
    return Column(
      children: [
        _buildActivityCard(
          context,
          'Request Accepted',
          'AMB-001 accepted emergency request from patient #CA2024045',
          '5 min ago',
          Icons.check_circle,
          Colors.green,
          true,
          {
            'patientName': 'Emergency Patient #CA2024045',
            'emergencyType': 'Emergency Request',
            'latitude': '33.6844',
            'longitude': '73.0479',
            'address': 'Emergency Location, Islamabad',
            'timestamp': '5 min ago',
            'phoneNumber': '+92 300 1234567',
          },
        ),
        SizedBox(height: 12),
        _buildActivityCard(
          context,
          'Ride Completed',
          'AMB-003 successfully completed ride to City Hospital',
          '15 min ago',
          Icons.local_hospital,
          Colors.blue,
          false,
          null,
        ),
        SizedBox(height: 12),
        _buildActivityCard(
          context,
          'Request Declined',
          'AMB-002 declined request - ambulance unavailable',
          '32 min ago',
          Icons.cancel,
          Colors.orange,
          false,
          null,
        ),
        SizedBox(height: 12),
        _buildActivityCard(
          context,
          'Payment Received',
          'Payment of \$85 received for ride #R2024089',
          '1 hour ago',
          Icons.payment,
          Colors.purple,
          false,
          null,
        ),
      ],
    );
  }

  Widget _buildActivityCard(
    BuildContext context,
    String title,
    String description,
    String time,
    IconData icon,
    Color color,
    bool showMapButton,
    Map<String, dynamic>? requestData,
  ) {
    return Container(
      padding: EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(15),
        border: Border.all(color: Color(0xFFEFF9FE)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 10,
            offset: Offset(0, 3),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            padding: EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: color, size: 24),
          ),
          SizedBox(width: 15),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: GoogleFonts.poppins(
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF292942),
                  ),
                ),
                SizedBox(height: 4),
                Text(
                  description,
                  style: GoogleFonts.poppins(
                    fontSize: 13,
                    color: Color(0xFFC0D3DF),
                  ),
                ),
                SizedBox(height: 4),
                Row(
                  children: [
                    Text(
                      time,
                      style: GoogleFonts.poppins(
                        fontSize: 11,
                        color: Color(0xFFC0D3DF),
                      ),
                    ),
                    if (showMapButton && requestData != null) ...[
                      SizedBox(width: 10),
                      Material(
                        color: Colors.transparent,
                        child: InkWell(
                          onTap: () {
                            onViewOnMap(requestData);
                          },
                          borderRadius: BorderRadius.circular(8),
                          child: Container(
                            padding: EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: Color(0xFF23446C).withOpacity(0.1),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(
                                  Icons.map,
                                  size: 12,
                                  color: Color(0xFF23446C),
                                ),
                                SizedBox(width: 4),
                                Text(
                                  'View',
                                  style: GoogleFonts.poppins(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w600,
                                    color: Color(0xFF23446C),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _DashboardHomeContent extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Color(0xFFEFF9FE),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
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
                        color: Color(0xFF292942),
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
                              color: Color(0xFF23446C).withOpacity(0.1),
                              blurRadius: 10,
                              offset: Offset(0, 4),
                            ),
                          ],
                        ),
                        child: Icon(
                          Icons.settings_outlined,
                          color: Color(0xFF23446C),
                          size: 24,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              _buildUserProfileCard(context),
              SizedBox(height: 25),
              _buildHealthStatsRow(),
              SizedBox(height: 20),
              _buildAppointmentCard(),
              SizedBox(height: 20),
              _buildRecentRecordsSection(),
              SizedBox(height: 20),
              _buildQuickActionsSection(),
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
          colors: [Color(0xFF23446C), Color(0xFF2D5585)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Color(0xFF23446C).withOpacity(0.3),
            blurRadius: 20,
            offset: Offset(0, 8),
          ),
        ],
      ),
      child: Row(
        children: [
          Hero(
            tag: 'profile-avatar',
            child: Container(
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(
                  color: Color(0xFF24C48E),
                  width: 3,
                ),
              ),
              child: CircleAvatar(
                radius: 30,
                backgroundColor: Colors.white,
                backgroundImage: NetworkImage(
                  'https://images.unsplash.com/photo-1603415526960-f8f62b36c9a7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                ),
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
                    color: Color(0xFFC0D3DF),
                    fontSize: 14,
                  ),
                ),
                Consumer<AuthProvider>(
                  builder: (context, authProvider, child) {
                    String userName = 'Guest User';
                    
                    if (authProvider.currentUser != null) {
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
                    color: Color(0xFF24C48E),
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
          Container(
            decoration: BoxDecoration(
              color: Color(0xFF24C48E).withOpacity(0.2),
              shape: BoxShape.circle,
            ),
            padding: EdgeInsets.all(8),
            child: Badge(
              smallSize: 8,
              backgroundColor: Color(0xFF24C48E),
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
            Color(0xFF24C48E),
            isAnimated: true,
          ),
        ),
        SizedBox(width: 15),
        Expanded(
          child: _buildHealthCard(
            'Blood Pressure',
            '120/80',
            Icons.opacity,
            Color(0xFF23446C),
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
            color: color.withOpacity(0.1),
            blurRadius: 15,
            offset: Offset(0, 5),
          ),
        ],
      ),
      child: Column(
        children: [
          Container(
            padding: EdgeInsets.all(12),
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
              color: Color(0xFF292942),
            ),
          ),
          SizedBox(height: 5),
          Text(
            title,
            style: GoogleFonts.poppins(
              fontSize: 12,
              color: Color(0xFFC0D3DF),
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
      onEnd: () {},
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
            color: Color(0xFF23446C).withOpacity(0.08),
            blurRadius: 20,
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
                padding: EdgeInsets.all(10),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [Color(0xFF24C48E), Color(0xFF1FA876)],
                  ),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(
                  Icons.calendar_today,
                  color: Colors.white,
                  size: 20),
              ),
              SizedBox(width: 12),
              Text(
                'Next Appointment',
                style: GoogleFonts.poppins(
                  fontSize: 18,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF292942),
                ),
              ),
            ],
          ),
          SizedBox(height: 15),
          Container(
            padding: EdgeInsets.all(15),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  Color(0xFFEFF9FE),
                  Color(0xFFF5FBFF),
                ],
              ),
              borderRadius: BorderRadius.circular(15),
              border: Border.all(
                color: Color(0xFF24C48E).withOpacity(0.2),
                width: 1.5,
              ),
            ),
            child: InkWell(
              onTap: () {},
              borderRadius: BorderRadius.circular(15),
              child: Row(
                children: [
                  Container(
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: Color(0xFF24C48E),
                        width: 2,
                      ),
                    ),
                    child: CircleAvatar(
                      radius: 25,
                      backgroundColor: Colors.white,
                      backgroundImage: NetworkImage(
                        'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&h=150&fit=crop&crop=face',
                      ),
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
                            color: Color(0xFF292942),
                          ),
                        ),
                        Text(
                          'Cardiologist',
                          style: GoogleFonts.poppins(
                            fontSize: 14,
                            color: Color(0xFFC0D3DF),
                          ),
                        ),
                        SizedBox(height: 5),
                        Container(
                          padding: EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: Color(0xFF24C48E).withOpacity(0.1),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            'Tomorrow, 10:30 AM',
                            style: GoogleFonts.poppins(
                              fontSize: 12,
                              color: Color(0xFF24C48E),
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: Color(0xFF23446C).withOpacity(0.1),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      Icons.arrow_forward_ios,
                      color: Color(0xFF23446C),
                      size: 16,
                    ),
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
            color: Color(0xFF292942),
          ),
        ),
        SizedBox(height: 15),
        _buildRecordCard(
          'ECG Test Results',
          'Normal sinus rhythm detected',
          'May 20, 2024',
          Icons.monitor_heart,
          Color(0xFF24C48E),
        ),
        SizedBox(height: 10),
        _buildRecordCard(
          'Blood Test Report',
          'Cholesterol levels within normal range',
          'May 18, 2024',
          Icons.bloodtype,
          Color(0xFF23446C),
        ),
        SizedBox(height: 10),
        _buildRecordCard(
          'Medication Reminder',
          'Lisinopril 10mg - Take with breakfast',
          'Daily',
          Icons.medication,
          Color(0xFF292942),
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
            color: Color(0xFF292942),
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
                Color(0xFF24C48E),
              ),
            ),
            SizedBox(width: 15),
            Expanded(
              child: _buildQuickActionCard(
                'Video Consult',
                Icons.video_call,
                Color(0xFF23446C),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildRecordCard(String title, String subtitle, String date, IconData icon, Color color) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: BorderRadius.circular(15),
        onTap: () {},
        child: Container(
          padding: EdgeInsets.all(15),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(15),
            boxShadow: [
              BoxShadow(
                color: color.withOpacity(0.08),
                blurRadius: 15,
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
                  gradient: LinearGradient(
                    colors: [
                      color.withOpacity(0.1),
                      color.withOpacity(0.05),
                    ],
                  ),
                ),
                child: Icon(icon, color: color, size: 24),
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
                        color: Color(0xFF292942),
                      ),
                    ),
                    SizedBox(height: 4),
                    Text(
                      subtitle,
                      style: GoogleFonts.poppins(
                        fontSize: 14,
                        color: Color(0xFFC0D3DF),
                      ),
                    ),
                    SizedBox(height: 4),
                    Container(
                      padding: EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(
                        color: color.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        date,
                        style: GoogleFonts.poppins(
                          fontSize: 12,
                          color: color,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              Container(
                padding: EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Color(0xFFEFF9FE),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  Icons.chevron_right,
                  color: Color(0xFF23446C),
                  size: 20,
                ),
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
        onTap: () {},
        child: Container(
          padding: EdgeInsets.all(15),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(15),
            border: Border.all(
              color: color.withOpacity(0.2),
              width: 1.5,
            ),
            boxShadow: [
              BoxShadow(
                color: color.withOpacity(0.08),
                blurRadius: 15,
                offset: Offset(0, 3),
              ),
            ],
          ),
          child: Column(
            children: [
              Container(
                padding: EdgeInsets.all(14),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      color.withOpacity(0.15),
                      color.withOpacity(0.08),
                    ],
                  ),
                  shape: BoxShape.circle,
                ),
                child: Icon(icon, color: color, size: 26),
              ),
              SizedBox(height: 12),
              Text(
                title,
                style: GoogleFonts.poppins(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF292942),
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }

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
            Container(
              width: 40,
              height: 4,
              margin: EdgeInsets.symmetric(vertical: 15),
              decoration: BoxDecoration(
                color: Color(0xFFC0D3DF),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            Padding(
              padding: EdgeInsets.symmetric(horizontal: 20),
              child: Row(
                children: [
                  Text(
                    'Settings',
                    style: GoogleFonts.poppins(
                      fontSize: 22,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF292942),
                    ),
                  ),
                  Spacer(),
                  IconButton(
                    onPressed: () => Navigator.pop(context),
                    icon: Icon(Icons.close, color: Color(0xFFC0D3DF)),
                  ),
                ],
              ),
            ),
            Divider(height: 1, color: Color(0xFFEFF9FE)),
            Expanded(
              child: SingleChildScrollView(
                padding: EdgeInsets.all(20),
                child: Column(
                  children: [
                    Consumer<AuthProvider>(
                      builder: (context, authProvider, child) {
                        return Container(
                          padding: EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              colors: [Color(0xFF23446C), Color(0xFF2A5380)],
                            ),
                            borderRadius: BorderRadius.circular(15),
                          ),
                          child: Row(
                            children: [
                              Container(
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  border: Border.all(
                                    color: Color(0xFF24C48E),
                                    width: 2,
                                  ),
                                ),
                                child: CircleAvatar(
                                  radius: 25,
                                  backgroundColor: Colors.white,
                                  child: Icon(
                                    Icons.person,
                                    color: Color(0xFF23446C),
                                    size: 28,
                                  ),
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
                                        color: Colors.white,
                                      ),
                                    ),
                                    Text(
                                      authProvider.userEmail,
                                      style: GoogleFonts.poppins(
                                        fontSize: 14,
                                        color: Colors.white.withOpacity(0.9),
                                      ),
                                    ),
                                    Text(
                                      authProvider.isAmbulanceEmployer ? 'Ambulance Employer' : 'Patient',
                                      style: GoogleFonts.poppins(
                                        fontSize: 12,
                                        color: Color(0xFF24C48E),
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
                    _buildSettingsItem(
                      context,
                      'Edit Profile',
                      Icons.person_outline,
                      Color(0xFF23446C),
                      () {
                        Navigator.pop(context);
                        _showSnackBar(context, 'Profile editing coming soon!', Color(0xFF23446C));
                      },
                    ),
                    _buildSettingsItem(
                      context,
                      'Notifications',
                      Icons.notifications_outlined,
                      Color(0xFF24C48E),
                      () {
                        Navigator.pop(context);
                        _showSnackBar(context, 'Notification settings coming soon!', Color(0xFF24C48E));
                      },
                    ),
                    _buildSettingsItem(
                      context,
                      'Privacy & Security',
                      Icons.security_outlined,
                      Color(0xFF292942),
                      () {
                        Navigator.pop(context);
                        _showSnackBar(context, 'Privacy settings coming soon!', Color(0xFF292942));
                      },
                    ),
                    _buildSettingsItem(
                      context,
                      'Help & Support',
                      Icons.help_outline,
                      Color(0xFFC0D3DF),
                      () {
                        Navigator.pop(context);
                        _showSnackBar(context, 'Help & support coming soon!', Color(0xFFC0D3DF));
                      },
                    ),
                    SizedBox(height: 20),
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
                    Text(
                      'CardioLink v1.0.0',
                      style: GoogleFonts.poppins(
                        fontSize: 12,
                        color: Color(0xFFC0D3DF),
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

  Widget _buildSettingsItem(BuildContext context, String title, IconData icon, Color color, VoidCallback onTap) {
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
                color: Color(0xFFEFF9FE),
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
                      color: Color(0xFF292942),
                    ),
                  ),
                ),
                Icon(
                  Icons.arrow_forward_ios,
                  color: Color(0xFFC0D3DF),
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
                color: Color(0xFF292942),
              ),
            ),
            content: Text(
              'Are you sure you want to logout from your account?',
              style: GoogleFonts.poppins(
                fontSize: 14,
                color: Color(0xFFC0D3DF),
              ),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.of(context).pop(false),
                child: Text(
                  'Cancel',
                  style: GoogleFonts.poppins(
                    color: Color(0xFFC0D3DF),
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

      Navigator.pop(context);

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
                    color: Color(0xFF24C48E),
                  ),
                  SizedBox(height: 16),
                  Text(
                    'Logging out...',
                    style: GoogleFonts.poppins(
                      fontSize: 16,
                      fontWeight: FontWeight.w500,
                      color: Color(0xFF292942),
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      );

      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      bool logoutSuccess = await authProvider.logout();

      Navigator.pop(context);

      if (logoutSuccess) {
        Navigator.pushAndRemoveUntil(
          context,
          MaterialPageRoute(builder: (context) => LoginScreen()),
          (route) => false,
        );
        
        _showSnackBar(context, 'Logged out successfully', Color(0xFF24C48E));
      } else {
        _showSnackBar(context, 'Logout failed. Please try again.', Colors.red);
      }

    } catch (e) {
      print('Logout error: $e');
      Navigator.pop(context);
      _showSnackBar(context, 'An error occurred during logout', Colors.red);
    }
  }

  void _showSnackBar(BuildContext context, String message, Color color) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          message,
          style: GoogleFonts.poppins(
            color: Colors.white,
            fontWeight: FontWeight.w500,
          ),
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