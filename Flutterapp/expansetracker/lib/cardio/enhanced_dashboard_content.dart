// enhanced_dashboard_content.dart
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:expansetracker/provider/auth_provider.dart';
import '../screens/heartwise_chat.dart';
import 'dashboard_components.dart';
import 'dashboard_charts.dart';

class EnhancedDashboardHomeContent extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Color(0xFFF7FAFC),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildModernHeader(context),
              SizedBox(height: 24),
              _buildUserWelcomeCard(context),
              SizedBox(height: 28),
              _buildQuickStatsGrid(),
              SizedBox(height: 28),
              HealthMetricsChart(),
              SizedBox(height: 20),
              ActivityChart(),
              SizedBox(height: 28),
              _buildAppointmentSection(),
              SizedBox(height: 28),
              _buildRecentActivitySection(),
              SizedBox(height: 28),
              _buildQuickActionsSection(),
              SizedBox(height: 80),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildModernHeader(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Welcome to',
              style: GoogleFonts.inter(
                fontSize: 14,
                fontWeight: FontWeight.w500,
                color: Color(0xFF718096),
              ),
            ),
            SizedBox(height: 4),
            ShaderMask(
              shaderCallback: (bounds) => LinearGradient(
                colors: [Color(0xFF10B981), Color(0xFF3B82F6)],
              ).createShader(bounds),
              child: Text(
                'CardioLink',
                style: GoogleFonts.inter(
                  fontSize: 32,
                  fontWeight: FontWeight.w900,
                  color: Colors.white,
                  letterSpacing: -0.5,
                ),
              ),
            ),
          ],
        ),
        Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [Color(0xFF10B981), Color(0xFF059669)],
            ),
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(
                color: Color(0xFF10B981).withOpacity(0.3),
                blurRadius: 12,
                offset: Offset(0, 4),
              ),
            ],
          ),
          child: Material(
            color: Colors.transparent,
            child: InkWell(
              borderRadius: BorderRadius.circular(16),
              onTap: () {},
              child: Padding(
                padding: EdgeInsets.all(14),
                child: Icon(
                  Icons.notifications_outlined,
                  color: Colors.white,
                  size: 24,
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildUserWelcomeCard(BuildContext context) {
    return Consumer<AuthProvider>(
      builder: (context, authProvider, child) {
        return GlassContainer(
          padding: EdgeInsets.all(20),
          child: Row(
            children: [
              Container(
                width: 70,
                height: 70,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: LinearGradient(
                    colors: [Color(0xFF10B981), Color(0xFF3B82F6)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: Color(0xFF10B981).withOpacity(0.3),
                      blurRadius: 16,
                      offset: Offset(0, 6),
                    ),
                  ],
                ),
                child: Icon(
                  Icons.person,
                  color: Colors.white,
                  size: 36,
                ),
              ),
              SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Hello,',
                      style: GoogleFonts.inter(
                        color: Color(0xFF718096),
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    SizedBox(height: 2),
                    Text(
                      authProvider.userDisplayName,
                      style: GoogleFonts.inter(
                        color: Color(0xFF1A202C),
                        fontSize: 22,
                        fontWeight: FontWeight.w700,
                        letterSpacing: -0.3,
                      ),
                    ),
                    SizedBox(height: 6),
                    Container(
                      padding: EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [
                            Color(0xFF10B981).withOpacity(0.1),
                            Color(0xFF3B82F6).withOpacity(0.1),
                          ],
                        ),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        'Patient ID: #CA2024001',
                        style: GoogleFonts.inter(
                          color: Color(0xFF10B981),
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildQuickStatsGrid() {
    return GridView.count(
      shrinkWrap: true,
      physics: NeverScrollableScrollPhysics(),
      crossAxisCount: 2,
      crossAxisSpacing: 16,
      mainAxisSpacing: 16,
      childAspectRatio: 1.1,
      children: [
        AnimatedStatCard(
          title: 'Heart Rate',
          value: '72',
          subtitle: 'BPM',
          icon: Icons.favorite,
          color: Color(0xFFEF4444),
          isAnimated: true,
        ),
        AnimatedStatCard(
          title: 'Blood Pressure',
          value: '120/80',
          subtitle: 'mmHg',
          icon: Icons.opacity,
          color: Color(0xFF3B82F6),
        ),
        AnimatedStatCard(
          title: 'Steps Today',
          value: '8,542',
          subtitle: 'steps',
          icon: Icons.directions_walk,
          color: Color(0xFFF59E0B),
        ),
        AnimatedStatCard(
          title: 'Sleep',
          value: '7h 20m',
          subtitle: 'last night',
          icon: Icons.nightlight_round,
          color: Color(0xFF8B5CF6),
        ),
      ],
    );
  }

  Widget _buildAppointmentSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'Next Appointment',
              style: GoogleFonts.inter(
                fontSize: 20,
                fontWeight: FontWeight.w700,
                color: Color(0xFF1A202C),
                letterSpacing: -0.3,
              ),
            ),
            TextButton(
              onPressed: () {},
              child: Text(
                'View All',
                style: GoogleFonts.inter(
                  color: Color(0xFF10B981),
                  fontWeight: FontWeight.w600,
                  fontSize: 14,
                ),
              ),
            ),
          ],
        ),
        SizedBox(height: 12),
        GlassContainer(
          padding: EdgeInsets.all(20),
          child: Row(
            children: [
              Container(
                width: 60,
                height: 60,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: LinearGradient(
                    colors: [Color(0xFF3B82F6), Color(0xFF1D4ED8)],
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: Color(0xFF3B82F6).withOpacity(0.3),
                      blurRadius: 12,
                      offset: Offset(0, 4),
                    ),
                  ],
                ),
                child: Icon(
                  Icons.medical_services,
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
                      'Dr. Sarah Wilson',
                      style: GoogleFonts.inter(
                        fontSize: 17,
                        fontWeight: FontWeight.w700,
                        color: Color(0xFF1A202C),
                      ),
                    ),
                    SizedBox(height: 4),
                    Text(
                      'Cardiologist',
                      style: GoogleFonts.inter(
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                        color: Color(0xFF718096),
                      ),
                    ),
                    SizedBox(height: 10),
                    Container(
                      padding: EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [Color(0xFF10B981), Color(0xFF059669)],
                        ),
                        borderRadius: BorderRadius.circular(12),
                        boxShadow: [
                          BoxShadow(
                            color: Color(0xFF10B981).withOpacity(0.3),
                            blurRadius: 8,
                            offset: Offset(0, 2),
                          ),
                        ],
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.access_time, color: Colors.white, size: 14),
                          SizedBox(width: 6),
                          Text(
                            'Tomorrow, 10:30 AM',
                            style: GoogleFonts.inter(
                              fontSize: 12,
                              color: Colors.white,
                              fontWeight: FontWeight.w600,
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
        ),
      ],
    );
  }

  Widget _buildRecentActivitySection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Recent Activity',
          style: GoogleFonts.inter(
            fontSize: 20,
            fontWeight: FontWeight.w700,
            color: Color(0xFF1A202C),
            letterSpacing: -0.3,
          ),
        ),
        SizedBox(height: 16),
        ..._buildActivityItems(),
      ],
    );
  }

  List<Widget> _buildActivityItems() {
    final activities = [
      {
        'title': 'ECG Test Completed',
        'time': '2 hours ago',
        'icon': Icons.monitor_heart,
        'color': Color(0xFF10B981)
      },
      {
        'title': 'Medication Taken',
        'time': '4 hours ago',
        'icon': Icons.medication,
        'color': Color(0xFF3B82F6)
      },
      {
        'title': 'Appointment Scheduled',
        'time': '1 day ago',
        'icon': Icons.calendar_today,
        'color': Color(0xFFF59E0B)
      },
    ];

    return activities.map((activity) {
      return Container(
        margin: EdgeInsets.only(bottom: 12),
        child: GlassContainer(
          padding: EdgeInsets.all(18),
          child: Row(
            children: [
              Container(
                padding: EdgeInsets.all(12),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      activity['color'] as Color,
                      (activity['color'] as Color).withOpacity(0.7),
                    ],
                  ),
                  borderRadius: BorderRadius.circular(14),
                  boxShadow: [
                    BoxShadow(
                      color: (activity['color'] as Color).withOpacity(0.3),
                      blurRadius: 8,
                      offset: Offset(0, 2),
                    ),
                  ],
                ),
                child: Icon(
                  activity['icon'] as IconData,
                  color: Colors.white,
                  size: 22,
                ),
              ),
              SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      activity['title'] as String,
                      style: GoogleFonts.inter(
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                        color: Color(0xFF1A202C),
                      ),
                    ),
                    SizedBox(height: 4),
                    Text(
                      activity['time'] as String,
                      style: GoogleFonts.inter(
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                        color: Color(0xFF718096),
                      ),
                    ),
                  ],
                ),
              ),
              Icon(
                Icons.arrow_forward_ios,
                color: Color(0xFFCBD5E0),
                size: 16,
              ),
            ],
          ),
        ),
      );
    }).toList();
  }

  Widget _buildQuickActionsSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Quick Actions',
          style: GoogleFonts.inter(
            fontSize: 20,
            fontWeight: FontWeight.w700,
            color: Color(0xFF1A202C),
            letterSpacing: -0.3,
          ),
        ),
        SizedBox(height: 16),
        // Prominent HeartWise AI Card
        _buildHeartWiseAICard(),
        SizedBox(height: 16),
        GridView.count(
          shrinkWrap: true,
          physics: NeverScrollableScrollPhysics(),
          crossAxisCount: 4,
          crossAxisSpacing: 12,
          mainAxisSpacing: 12,
          children: [
            _buildQuickAction(Icons.emergency, 'Emergency', Color(0xFFEF4444), null),
            _buildQuickAction(Icons.video_call, 'Video Call', Color(0xFF10B981), null),
            _buildQuickAction(Icons.local_pharmacy, 'Pharmacy', Color(0xFF3B82F6), null),
            _buildQuickAction(Icons.local_hospital, 'Ambulance', Color(0xFFF59E0B), null),
          ],
        ),
      ],
    );
  }

  Widget _buildHeartWiseAICard() {
    return Builder(
      builder: (BuildContext context) {
        return Material(
          color: Colors.transparent,
          child: InkWell(
            borderRadius: BorderRadius.circular(20),
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => MedicalChatScreen()),
              );
            },
            child: Container(
              padding: EdgeInsets.all(24),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [Color(0xFFFF6B9D), Color(0xFFFF4081)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(20),
                boxShadow: [
                  BoxShadow(
                    color: Color(0xFFFF4081).withOpacity(0.4),
                    blurRadius: 20,
                    offset: Offset(0, 8),
                  ),
                ],
              ),
              child: Row(
                children: [
                  Container(
                    padding: EdgeInsets.all(18),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.2),
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: Colors.white.withOpacity(0.3),
                        width: 2,
                      ),
                    ),
                    child: Icon(
                      Icons.favorite,
                      color: Colors.white,
                      size: 36,
                    ),
                  ),
                  SizedBox(width: 18),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'HeartWise AI',
                          style: GoogleFonts.inter(
                            fontSize: 22,
                            fontWeight: FontWeight.w800,
                            color: Colors.white,
                            letterSpacing: -0.3,
                          ),
                        ),
                        SizedBox(height: 6),
                        Text(
                          'Ask your cardiac health assistant',
                          style: GoogleFonts.inter(
                            fontSize: 14,
                            fontWeight: FontWeight.w500,
                            color: Colors.white.withOpacity(0.95),
                          ),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.2),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      Icons.arrow_forward_ios,
                      color: Colors.white,
                      size: 18,
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      }
    );
  }

  Widget _buildQuickAction(IconData icon, String label, Color color, VoidCallback? onTap) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: BorderRadius.circular(18),
        onTap: onTap ?? () {},
        child: Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [
                color.withOpacity(0.15),
                color.withOpacity(0.05),
              ],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(18),
            border: Border.all(
              color: color.withOpacity(0.2),
              width: 1.5,
            ),
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: EdgeInsets.all(10),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [color, color.withOpacity(0.8)],
                  ),
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(
                      color: color.withOpacity(0.3),
                      blurRadius: 8,
                      offset: Offset(0, 2),
                    ),
                  ],
                ),
                child: Icon(icon, color: Colors.white, size: 20),
              ),
              SizedBox(height: 8),
              Text(
                label,
                style: GoogleFonts.inter(
                  fontSize: 10,
                  fontWeight: FontWeight.w600,
                  color: color,
                ),
                textAlign: TextAlign.center,
                maxLines: 2,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class EnhancedAmbulanceEmployerDashboardContent extends StatelessWidget {
  final Function(Map<String, dynamic>) onViewOnMap;

  const EnhancedAmbulanceEmployerDashboardContent({required this.onViewOnMap});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: EdgeInsets.all(20),
      child: Column(
        children: [
          _buildStatsOverview(),
          SizedBox(height: 24),
          _buildActiveAmbulances(),
          SizedBox(height: 24),
          _buildRecentRequests(),
        ],
      ),
    );
  }

  Widget _buildStatsOverview() {
    return GridView.count(
      shrinkWrap: true,
      physics: NeverScrollableScrollPhysics(),
      crossAxisCount: 2,
      crossAxisSpacing: 16,
      mainAxisSpacing: 16,
      childAspectRatio: 1.1,
      children: [
        AnimatedStatCard(
          title: 'Active Rides',
          value: '5',
          subtitle: 'ongoing',
          icon: Icons.local_shipping,
          color: Color(0xFF10B981),
        ),
        AnimatedStatCard(
          title: 'Pending',
          value: '12',
          subtitle: 'requests',
          icon: Icons.pending_actions,
          color: Color(0xFFF59E0B),
        ),
        AnimatedStatCard(
          title: 'Completed',
          value: '23',
          subtitle: 'today',
          icon: Icons.check_circle,
          color: Color(0xFF3B82F6),
        ),
        AnimatedStatCard(
          title: 'Revenue',
          value: '\$1,240',
          subtitle: 'this week',
          icon: Icons.attach_money,
          color: Color(0xFF8B5CF6),
        ),
      ],
    );
  }

  Widget _buildActiveAmbulances() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Active Ambulances',
          style: GoogleFonts.inter(
            fontSize: 20,
            fontWeight: FontWeight.w700,
            color: Color(0xFF1A202C),
            letterSpacing: -0.3,
          ),
        ),
        SizedBox(height: 16),
        ..._buildAmbulanceList(),
      ],
    );
  }

  List<Widget> _buildAmbulanceList() {
    final ambulances = [
      {'id': 'AMB-001', 'status': 'En Route', 'driver': 'John Smith', 'color': Color(0xFF10B981)},
      {'id': 'AMB-002', 'status': 'Available', 'driver': 'Sarah Wilson', 'color': Color(0xFF3B82F6)},
      {'id': 'AMB-003', 'status': 'En Route', 'driver': 'Mike Johnson', 'color': Color(0xFF10B981)},
    ];

    return ambulances.map((ambulance) {
      return Container(
        margin: EdgeInsets.only(bottom: 12),
        child: GlassContainer(
          padding: EdgeInsets.all(18),
          child: Row(
            children: [
              Container(
                width: 60,
                height: 60,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      ambulance['color'] as Color,
                      (ambulance['color'] as Color).withOpacity(0.7),
                    ],
                  ),
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(
                      color: (ambulance['color'] as Color).withOpacity(0.3),
                      blurRadius: 12,
                      offset: Offset(0, 4),
                    ),
                  ],
                ),
                child: Icon(
                  Icons.local_shipping,
                  color: Colors.white,
                  size: 30,
                ),
              ),
              SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      ambulance['id'] as String,
                      style: GoogleFonts.inter(
                        fontSize: 17,
                        fontWeight: FontWeight.w700,
                        color: Color(0xFF1A202C),
                      ),
                    ),
                    SizedBox(height: 4),
                    Text(
                      ambulance['driver'] as String,
                      style: GoogleFonts.inter(
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                        color: Color(0xFF718096),
                      ),
                    ),
                  ],
                ),
              ),
              Container(
                padding: EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      ambulance['color'] as Color,
                      (ambulance['color'] as Color).withOpacity(0.8),
                    ],
                  ),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  ambulance['status'] as String,
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: Colors.white,
                  ),
                ),
              ),
            ],
          ),
        ),
      );
    }).toList();
  }

  Widget _buildRecentRequests() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Recent Requests',
          style: GoogleFonts.inter(
            fontSize: 20,
            fontWeight: FontWeight.w700,
            color: Color(0xFF1A202C),
            letterSpacing: -0.3,
          ),
        ),
        SizedBox(height: 16),
        ..._buildRequestList(),
      ],
    );
  }

  List<Widget> _buildRequestList() {
    final requests = [
      {'patient': 'Sarah Johnson', 'type': 'Heart Attack', 'time': '5 min ago'},
      {'patient': 'Mike Wilson', 'type': 'Accident', 'time': '12 min ago'},
      {'patient': 'Emily Davis', 'type': 'Emergency', 'time': '20 min ago'},
    ];

    return requests.map((request) {
      return Container(
        margin: EdgeInsets.only(bottom: 12),
        child: GlassContainer(
          padding: EdgeInsets.all(18),
          child: Row(
            children: [
              Container(
                width: 50,
                height: 50,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: LinearGradient(
                    colors: [Color(0xFF10B981), Color(0xFF3B82F6)],
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: Color(0xFF10B981).withOpacity(0.3),
                      blurRadius: 8,
                      offset: Offset(0, 2),
                    ),
                  ],
                ),
                child: Icon(
                  Icons.person,
                  color: Colors.white,
                  size: 24,
                ),
              ),
              SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      request['patient'] as String,
                      style: GoogleFonts.inter(
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                        color: Color(0xFF1A202C),
                      ),
                    ),
                    SizedBox(height: 4),
                    Text(
                      request['type'] as String,
                      style: GoogleFonts.inter(
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                        color: Color(0xFF718096),
                      ),
                    ),
                  ],
                ),
              ),
              Text(
                request['time'] as String,
                style: GoogleFonts.inter(
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                  color: Color(0xFFA0AEC0),
                ),
              ),
            ],
          ),
        ),
      );
    }).toList();
  }
}