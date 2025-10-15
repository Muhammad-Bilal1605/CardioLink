// lib/cardio/appointment_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

// Local imports
import 'appointment.dart'; // Appointment model
import 'date_time_selection_screen.dart';
import 'doctor_selection_screen.dart';
import 'appointment_booked_screen.dart';
import '../provider/auth_provider.dart';
import '../services/appointment_api_service.dart'; // AppointmentApiService and AppointmentStore

class AppointmentScreen extends StatefulWidget {
  final Appointment? newAppointment;
  
  const AppointmentScreen({Key? key, this.newAppointment}) : super(key: key);

  @override
  _AppointmentScreenState createState() => _AppointmentScreenState();
}

class _AppointmentScreenState extends State<AppointmentScreen> {
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    
    // Ensure token is set from auth provider
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      if (authProvider.authToken != null && authProvider.authToken!.isNotEmpty) {
        AppointmentApiService.setAuthToken(authProvider.authToken!);
        print('✓ Token set from AuthProvider on initState');
      }
    });
    
    _loadAppointments();
  }

  Future<void> _loadAppointments() async {
    print('🔄 _loadAppointments called');
    
    setState(() {
      _isLoading = true;
    });

    try {
      // Get auth provider to ensure we have token
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      
      print('Auth Provider State:');
      print('  Token: ${authProvider.authToken != null ? 'Present (${authProvider.authToken!.length} chars)' : 'Missing'}');
      print('  User: ${authProvider.userDisplayName}');
      print('  UserId: ${authProvider.userId}');

      // If we have a token and it's not set in the service, set it
      if (authProvider.authToken != null && authProvider.authToken!.isNotEmpty) {
        if (AppointmentApiService.authToken.isEmpty) {
          AppointmentApiService.setAuthToken(authProvider.authToken!);
          print('✓ Token set from AuthProvider in _loadAppointments');
        }
      } else {
        print('❌ No token available in AuthProvider');
        setState(() {
          _isLoading = false;
        });
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Please login to view appointments'),
              backgroundColor: Colors.red,
            ),
          );
        }
        return;
      }

      // Sync appointments from server
      print('📋 Calling AppointmentApiService.syncAppointments()');
      await AppointmentApiService.syncAppointments();

      print('✅ Appointments loaded');
      print('  Upcoming: ${AppointmentStore.upcomingAppointments.length}');
      print('  Completed: ${AppointmentStore.completedAppointments.length}');
      print('  Cancelled: ${AppointmentStore.cancelledAppointments.length}');

      setState(() {
        _isLoading = false;
      });
    } catch (e) {
      print('❌ Error loading appointments: $e');
      
      setState(() {
        _isLoading = false;
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error loading appointments: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  Future<void> _cancelAppointment(Appointment appointment) async {
    final result = await AppointmentApiService.cancelAppointment(
      appointment.id,
      'Cancelled by patient'
    );

    if (result['success']) {
      setState(() {
        AppointmentStore.upcomingAppointments.remove(appointment);
        // Update status and add to cancelled
        final cancelledAppointment = Appointment(
          id: appointment.id,
          patientId: appointment.patientId,
          doctorId: appointment.doctorId,
          doctorName: appointment.doctorName,
          doctorSpecialty: appointment.doctorSpecialty,
          doctorImage: appointment.doctorImage,
          date: appointment.date,
          time: appointment.time,
          location: appointment.location,
          status: 'Cancelled',
          joiningCode: appointment.joiningCode,
        );
        AppointmentStore.cancelledAppointments.add(cancelledAppointment);
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Row(
              children: [
                Icon(Icons.check_circle, color: Colors.white),
                SizedBox(width: 10),
                Text('Appointment cancelled successfully'),
              ],
            ),
            backgroundColor: Colors.green,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.all(Radius.circular(10)),
            ),
          ),
        );
      }
    } else {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Row(
              children: [
                const Icon(Icons.error, color: Colors.white),
                const SizedBox(width: 10),
                Expanded(child: Text(result['message'] ?? 'Failed to cancel')),
              ],
            ),
            backgroundColor: Colors.red,
            behavior: SnackBarBehavior.floating,
            shape: const RoundedRectangleBorder(
              borderRadius: BorderRadius.all(Radius.circular(10)),
            ),
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        title: const Text('Appointments'),
        backgroundColor: Colors.white,
        foregroundColor: Colors.black,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: Colors.blue),
            onPressed: _loadAppointments,
          ),
          IconButton(
            icon: const Icon(Icons.add, color: Colors.blue),
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => DoctorSelectionScreen()),
              );
            },
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : DefaultTabController(
              length: 3,
              child: Column(
                children: [
                  Container(
                    color: Colors.white,
                    child: TabBar(
                      indicatorColor: Colors.blue,
                      labelColor: Colors.blue,
                      unselectedLabelColor: Colors.grey[600],
                      tabs: [
                        Tab(text: 'Upcoming (${AppointmentStore.upcomingAppointments.length})'),
                        Tab(text: 'Completed (${AppointmentStore.completedAppointments.length})'),
                        Tab(text: 'Cancelled (${AppointmentStore.cancelledAppointments.length})'),
                      ],
                    ),
                  ),
                  Expanded(
                    child: TabBarView(
                      children: [
                        _buildAppointmentList(AppointmentStore.upcomingAppointments, 'Upcoming'),
                        _buildAppointmentList(AppointmentStore.completedAppointments, 'Completed'),
                        _buildAppointmentList(AppointmentStore.cancelledAppointments, 'Cancelled'),
                      ],
                    ),
                  ),
                ],
              ),
            ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          Navigator.push(
            context,
            MaterialPageRoute(builder: (context) => DoctorSelectionScreen()),
          );
        },
        backgroundColor: Colors.blue,
        child: const Icon(Icons.add, color: Colors.white),
      ),
    );
  }

  Widget _buildAppointmentList(List<Appointment> appointments, String listType) {
    if (appointments.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.calendar_today_outlined, size: 60, color: Colors.grey),
            const SizedBox(height: 10),
            Text(
              'No $listType appointments found',
              style: TextStyle(fontSize: 16, color: Colors.grey[600]),
            ),
            if (listType == 'Upcoming') ...[
              const SizedBox(height: 20),
              ElevatedButton.icon(
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (context) => DoctorSelectionScreen()),
                  );
                },
                icon: const Icon(Icons.add, color: Colors.white),
                label: const Text('Book Appointment', style: TextStyle(color: Colors.white)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.blue,
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
              ),
            ],
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadAppointments,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: appointments.length,
        itemBuilder: (context, index) {
          final appointment = appointments[index];
          return _buildAppointmentCard(appointment);
        },
      ),
    );
  }

  Widget _buildAppointmentCard(Appointment appointment) {
    final statusColor = _getStatusColor(appointment.status);

    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(10),
      ),
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: 60,
                  height: 60,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(8),
                    image: DecorationImage(
                      image: NetworkImage(appointment.doctorImage),
                      fit: BoxFit.cover,
                    ),
                  ),
                ),
                const SizedBox(width: 15),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        appointment.doctorName,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        appointment.doctorSpecialty,
                        style: TextStyle(
                          color: Colors.grey[600],
                        ),
                      ),
                      const SizedBox(height: 5),
                      Row(
                        children: [
                          Icon(Icons.calendar_today, size: 14, color: Colors.grey[600]),
                          const SizedBox(width: 4),
                          Text(
                            '${appointment.date} • ${appointment.time}',
                            style: TextStyle(color: Colors.grey[600], fontSize: 12),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: statusColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Text(
                    appointment.status,
                    style: TextStyle(
                      color: statusColor,
                      fontSize: 10,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Icon(Icons.location_on, size: 14, color: Colors.grey[600]),
                const SizedBox(width: 4),
                Expanded(
                  child: Text(
                    appointment.location,
                    style: TextStyle(color: Colors.grey[600], fontSize: 12),
                  ),
                ),
              ],
            ),
            // Show joining code for upcoming appointments
            if (appointment.status == 'Upcoming') ...[
              const SizedBox(height: 8),
              _buildJoiningCodeSection(appointment),
            ],
            if (appointment.status == 'Upcoming') ...[
              const SizedBox(height: 12),
              _buildActionButtons(appointment),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildJoiningCodeSection(Appointment appointment) {
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: Colors.blue.shade50,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.blue.shade200),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              Icon(Icons.key, size: 16, color: Colors.blue),
              const SizedBox(width: 8),
              Text(
                'Joining Code: ',
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.grey[700],
                ),
              ),
              Text(
                appointment.joiningCode,
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  color: Colors.blue,
                  letterSpacing: 2,
                ),
              ),
            ],
          ),
          InkWell(
            onTap: () => _copyJoiningCode(appointment.joiningCode),
            child: Container(
              padding: const EdgeInsets.all(4),
              child: const Icon(Icons.copy, size: 16, color: Colors.blue),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActionButtons(Appointment appointment) {
    return Row(
      children: [
        Expanded(
          child: OutlinedButton(
            onPressed: () => _showCancelDialog(appointment),
            style: OutlinedButton.styleFrom(
              foregroundColor: Colors.red,
              side: const BorderSide(color: Colors.red),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
              ),
              padding: const EdgeInsets.symmetric(vertical: 8),
            ),
            child: const Text('Cancel', style: TextStyle(fontSize: 12)),
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: ElevatedButton(
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => DoctorSelectionScreen(),
                ),
              );
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.blue,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
              ),
              padding: const EdgeInsets.symmetric(vertical: 8),
            ),
            child: const Text('Reschedule',
                style: TextStyle(fontSize: 12, color: Colors.white)),
          ),
        ),
      ],
    );
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'Upcoming':
        return Colors.blue;
      case 'Completed':
        return Colors.green;
      case 'Cancelled':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  void _copyJoiningCode(String code) {
    Clipboard.setData(ClipboardData(text: code));
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: const Row(
          children: [
            Icon(Icons.check_circle, color: Colors.white, size: 18),
            SizedBox(width: 8),
            Text('Code copied!'),
          ],
        ),
        backgroundColor: Colors.green,
        behavior: SnackBarBehavior.floating,
        duration: const Duration(seconds: 2),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(10),
        ),
      ),
    );
  }

  void _showCancelDialog(Appointment appointment) {
    showDialog(
      context: context,
      builder: (BuildContext dialogContext) {
        return AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
          title: Row(
            children: [
              const Icon(Icons.warning_amber_rounded, color: Colors.orange, size: 28),
              const SizedBox(width: 10),
              const Text('Cancel Appointment', style: TextStyle(fontSize: 18)),
            ],
          ),
          content: Text(
            'Are you sure you want to cancel this appointment with ${appointment.doctorName}?',
            style: const TextStyle(fontSize: 15),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(dialogContext),
              child: const Text('No', style: TextStyle(color: Colors.grey)),
            ),
            ElevatedButton(
              onPressed: () {
                Navigator.pop(dialogContext);
                _cancelAppointment(appointment);
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.red,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
              child: const Text('Yes, Cancel', style: TextStyle(color: Colors.white)),
            ),
          ],
        );
      },
    );
  }
}