//dashboard screen
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../provider/auth_provider.dart';
import 'appointment_screen.dart';
import 'chat_screen.dart';
import 'pharmacy_screen.dart';
import 'ambulance_screen.dart';
import 'ehr_screen.dart';
import 'health_tracker_screen.dart';
import 'ai_heart_disease_prediction_screen.dart';
import 'simple_chat_screen.dart';

class DashboardHome extends StatefulWidget {
  @override
  _DashboardHomeState createState() => _DashboardHomeState();
}

class _DashboardHomeState extends State<DashboardHome> with SingleTickerProviderStateMixin {
  int _selectedIndex = 0;
  late AnimationController _animationController;
  late Animation<double> _fabAnimation;

  final List<Widget> _screens = [
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
  }

  @override
void dispose() {
  _emailController.dispose();
  _passwordController.dispose();
  _confirmPasswordController.dispose(); // Add this line
  _nameController.dispose();
  _phoneController.dispose();
  _emergencyContactController.dispose();
  super.dispose();
}
  @override
  Widget build(BuildContext context) {
    // Add this TextFormField after the password field
TextFormField(
  controller: _confirmPasswordController,
  obscureText: true,
  decoration: InputDecoration(
    labelText: 'Confirm Password',
    prefixIcon: Icon(Icons.lock_outline),
    border: OutlineInputBorder(
      borderRadius: BorderRadius.circular(10),
    ),
  ),
  validator: (value) {
    // In your form validation
if (_formKey.currentState!.validate()) {
  if (_passwordController.text != _confirmPassword) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Passwords do not match')),
    );
    return;
  }
  // Rest of your signup logic
}
    if (value == null || value.isEmpty) {
      return 'Please confirm your password';
    }
    if (value != _passwordController.text) {
      return 'Passwords do not match';
    }
    return null;
  },
  onChanged: (value) {
    setState(() {
      _confirmPassword = value;
    });
  },
),
    return Scaffold(
      body: _screens[_selectedIndex],
      floatingActionButton: _selectedIndex == 2 ? _buildAnimatedChatFab() : null,
      bottomNavigationBar: _buildAnimatedBottomNavBar(),
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
                    Container(
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
    child: Consumer<AuthProvider>(
      builder: (context, authProvider, _) {
        // Debug print to see the current user data
        print('Current User Data: ${authProvider.currentUser}');
        
        // Get user name with fallback to email if name is not available
        String userName = 'Guest User';
        String userEmail = '';
        
        if (authProvider.currentUser != null) {
          // Try different possible field names for the name
          final user = authProvider.currentUser!;
          userName = user['name'] ?? 
                    user['fullName'] ?? 
                    user['userName'] ?? 
                    'Guest User';
          
          // Get email if available
          userEmail = user['email']?.toString() ?? '';
          
          // If we have email but no name, use the part before @ as name
          if ((userName == 'Guest User' || userName.isEmpty) && userEmail.isNotEmpty) {
            userName = userEmail.split('@').first;
          }
          
          print('Resolved user name: $userName');
        }

        return Row(
          children: [
            Hero(
              tag: 'profile-avatar',
              child: CircleAvatar(
                radius: 30,
                backgroundColor: Colors.white,
                backgroundImage: NetworkImage(
                  'https://ui-avatars.com/api/?name=$userName&background=3366FF&color=fff&size=128',
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
                  Text(
                    userName,
                    style: GoogleFonts.poppins(
                      color: Colors.white,
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  if (userEmail.isNotEmpty) ...[
                    SizedBox(height: 2),
                    Text(
                      userEmail,
                      style: GoogleFonts.poppins(
                        color: Colors.white.withOpacity(0.8),
                        fontSize: 12,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
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
        );
      },
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
  Appointment? nextAppointment = AppointmentStore.getNextAppointment();

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
        
        // Check if there's an appointment
        if (nextAppointment == null)
          // No appointment - show empty state
          Container(
            padding: EdgeInsets.all(30),
            decoration: BoxDecoration(
              color: Color(0xFFF5F9FF),
              borderRadius: BorderRadius.circular(15),
              border: Border.all(
                color: Color(0xFF3366FF).withOpacity(0.1),
                width: 1,
              ),
            ),
            child: Center(
              child: Column(
                children: [
                  Icon(
                    Icons.event_busy,
                    size: 48,
                    color: Colors.grey[400],
                  ),
                  SizedBox(height: 10),
                  Text(
                    'No upcoming appointments',
                    style: GoogleFonts.poppins(
                      fontSize: 14,
                      color: Colors.grey[600],
                    ),
                  ),
                  SizedBox(height: 10),
                  TextButton(
                    onPressed: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (context) => AppointmentScreen()),
                      );
                    },
                    child: Text(
                      'Book Appointment',
                      style: GoogleFonts.poppins(
                        color: Color(0xFF3366FF),
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          )
        else
          // Has appointment - show appointment details
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
            child: Column(
              children: [
                InkWell(
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (context) => AppointmentScreen()),
                    );
                  },
                  borderRadius: BorderRadius.circular(15),
                  child: Row(
                    children: [
                      CircleAvatar(
                        radius: 25,
                        backgroundColor: Color(0xFF3366FF),
                        backgroundImage: NetworkImage(nextAppointment.doctorImage),
                      ),
                      SizedBox(width: 15),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              nextAppointment.doctorName,
                              style: GoogleFonts.poppins(
                                fontSize: 16,
                                fontWeight: FontWeight.w600,
                                color: Color(0xFF2E3A59),
                              ),
                            ),
                            Text(
                              nextAppointment.doctorSpecialty,
                              style: GoogleFonts.poppins(
                                fontSize: 14,
                                color: Colors.grey[600],
                              ),
                            ),
                            SizedBox(height: 5),
                            Row(
                              children: [
                                Icon(
                                  Icons.calendar_today,
                                  size: 12,
                                  color: Color(0xFF3366FF),
                                ),
                                SizedBox(width: 4),
                                Text(
                                  '${nextAppointment.date} • ${nextAppointment.time}',
                                  style: GoogleFonts.poppins(
                                    fontSize: 13,
                                    color: Color(0xFF3366FF),
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ],
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
                SizedBox(height: 15),
                Divider(height: 1, color: Colors.grey[300]),
                SizedBox(height: 15),
                
                // Joining Code Section
                Container(
                  padding: EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: Color(0xFF3366FF).withOpacity(0.2),
                      width: 1.5,
                    ),
                  ),
                  child: Row(
                    children: [
                      Container(
                        padding: EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: Color(0xFF3366FF).withOpacity(0.1),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Icon(
                          Icons.key,
                          color: Color(0xFF3366FF),
                          size: 20,
                        ),
                      ),
                      SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Joining Code',
                              style: GoogleFonts.poppins(
                                fontSize: 11,
                                color: Colors.grey[600],
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                            SizedBox(height: 2),
                            Text(
                              nextAppointment.joiningCode,
                              style: GoogleFonts.poppins(
                                fontSize: 20,
                                fontWeight: FontWeight.bold,
                                color: Color(0xFF3366FF),
                                letterSpacing: 4,
                              ),
                            ),
                          ],
                        ),
                      ),
                      InkWell(
                        onTap: () {
                          Clipboard.setData(
                            ClipboardData(text: nextAppointment.joiningCode),
                          );
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Row(
                                children: [
                                  Icon(Icons.check_circle, color: Colors.white, size: 18),
                                  SizedBox(width: 8),
                                  Text('Code copied to clipboard!'),
                                ],
                              ),
                              backgroundColor: Colors.green,
                              behavior: SnackBarBehavior.floating,
                              duration: Duration(seconds: 2),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(10),
                              ),
                              margin: EdgeInsets.all(10),
                            ),
                          );
                        },
                        child: Container(
                          padding: EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: Color(0xFF3366FF),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Icon(
                            Icons.copy,
                            color: Colors.white,
                            size: 18,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
      ],
    ),
  );



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
    final quickActions = [
      _QuickActionItem(
        title: 'HeartWise AI',
        subtitle: 'Ask your cardiac health assistant',
        icon: Icons.favorite,
        gradient: [Color(0xFFFF5F6D), Color(0xFFFF8A5C)],
        onTap: (context) {
          Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => SimpleChatScreen()),
          );
        },
      ),
      _QuickActionItem(
        title: 'Health Tracker',
        subtitle: 'Track activity, diet & medications',
        icon: Icons.monitor_heart,
        gradient: [Color(0xFF0BA5EC), Color(0xFF2563EB)],
        onTap: (context) {
          Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => HealthTrackerScreen()),
          );
        },
      ),
      _QuickActionItem(
        title: 'AI Heart Disease Prediction',
        subtitle: 'Get AI-powered risk assessment',
        icon: Icons.auto_awesome,
        gradient: [Color(0xFFEF4444), Color(0xFFBE123C)],
        onTap: (context) {
          Navigator.push(
            context,
            MaterialPageRoute(
                builder: (_) => AIHeartDiseasePredictionScreen()),
          );
        },
      ),
    ];

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
        ...quickActions.map(
          (action) => _buildQuickActionTile(context, action),
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

  Widget _buildQuickActionTile(BuildContext context, _QuickActionItem action) {
    return Padding(
      padding: EdgeInsets.only(bottom: 16),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(24),
        child: InkWell(
          borderRadius: BorderRadius.circular(24),
          onTap: () => action.onTap?.call(context),
          child: Container(
            padding: EdgeInsets.all(22),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(24),
              gradient: LinearGradient(
                colors: action.gradient,
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              boxShadow: [
                BoxShadow(
                  color: action.gradient.last.withOpacity(0.3),
                  blurRadius: 20,
                  offset: Offset(0, 12),
                ),
              ],
            ),
            child: Row(
              children: [
                Container(
                  padding: EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: Colors.white.withOpacity(0.25),
                  ),
                  child: Icon(
                    action.icon,
                    color: Colors.white,
                    size: 28,
                  ),
                ),
                SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        action.title,
                        style: GoogleFonts.poppins(
                          color: Colors.white,
                          fontSize: 18,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      SizedBox(height: 6),
                      Text(
                        action.subtitle,
                        style: GoogleFonts.poppins(
                          color: Colors.white.withOpacity(0.95),
                          fontSize: 13,
                          height: 1.3,
                        ),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.25),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    Icons.arrow_forward_ios,
                    color: Colors.white,
                    size: 16,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _QuickActionItem {
  final String title;
  final String subtitle;
  final IconData icon;
  final List<Color> gradient;
  final void Function(BuildContext)? onTap;

  _QuickActionItem({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.gradient,
    this.onTap,
  });
}