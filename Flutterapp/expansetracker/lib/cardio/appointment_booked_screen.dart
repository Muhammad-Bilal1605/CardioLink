import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'appointment.dart';
import 'dashboard_home.dart';
import 'appointment_screen.dart';

class AppointmentBookedScreen extends StatelessWidget {
  final Appointment appointment;

  const AppointmentBookedScreen({Key? key, required this.appointment}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAF5),
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: Center(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      _buildSuccessIcon(),
                      const SizedBox(height: 24),
                      _buildSuccessTitle(),
                      const SizedBox(height: 16),
                      _buildSuccessMessage(),
                      const SizedBox(height: 24),
                      _buildAppointmentDetails(),
                      const SizedBox(height: 20),
                      _buildJoiningCodeSection(context),
                    ],
                  ),
                ),
              ),
            ),
            _buildBottomButtons(context),
          ],
        ),
      ),
    );
  }

  Widget _buildSuccessIcon() {
    return Container(
      width: 120,
      height: 120,
      decoration: BoxDecoration(
        color: const Color(0xFF6B8E3D).withOpacity(0.2),
        borderRadius: BorderRadius.circular(60),
      ),
      child: const Icon(
        Icons.check_circle_outline,
        size: 60,
        color: Color(0xFF6B8E3D),
      ),
    );
  }

  Widget _buildSuccessTitle() {
    return const Text(
      'Appointment Booked!',
      style: TextStyle(
        fontSize: 24,
        fontWeight: FontWeight.bold,
      ),
    );
  }

  Widget _buildSuccessMessage() {
    return Text(
      'Your appointment with ${appointment.doctorName} has been confirmed.',
      textAlign: TextAlign.center,
      style: TextStyle(
        fontSize: 16,
        color: Colors.grey[600],
      ),
    );
  }

  Widget _buildAppointmentDetails() {
    return Container(
      width: double.infinity,
      constraints: const BoxConstraints(maxWidth: 350),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        children: [
          Text(
            appointment.doctorName,
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          Text(
            appointment.doctorSpecialty,
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey[600],
            ),
          ),
          const SizedBox(height: 12),
          const Divider(height: 1),
          const SizedBox(height: 12),
          _buildDetailRow(Icons.calendar_today, appointment.date),
          const SizedBox(height: 8),
          _buildDetailRow(Icons.access_time, appointment.time),
          const SizedBox(height: 8),
          _buildDetailRow(Icons.location_on, appointment.location),
        ],
      ),
    );
  }

  Widget _buildDetailRow(IconData icon, String text) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Icon(icon, size: 16, color: const Color(0xFF6B8E3D)),
        const SizedBox(width: 8),
        Text(
          text,
          style: const TextStyle(fontSize: 14),
        ),
      ],
    );
  }

  Widget _buildJoiningCodeSection(BuildContext context) {
    return Container(
      width: double.infinity,
      constraints: const BoxConstraints(maxWidth: 350),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            const Color(0xFF6B8E3D).withOpacity(0.1),
            const Color(0xFF6B8E3D).withOpacity(0.05),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(15),
        border: Border.all(
          color: const Color(0xFF6B8E3D).withOpacity(0.3),
          width: 2,
        ),
      ),
      child: Column(
        children: [
          const Icon(
            Icons.verified_user,
            size: 40,
            color: Color(0xFF6B8E3D),
          ),
          const SizedBox(height: 12),
          const Text(
            'Your Joining Code',
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.05),
                  blurRadius: 5,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Text(
              appointment.joiningCode,
              style: const TextStyle(
                fontSize: 32,
                fontWeight: FontWeight.bold,
                color: Color(0xFF6B8E3D),
                letterSpacing: 6,
              ),
            ),
          ),
          const SizedBox(height: 12),
          const Text(
            'Please save this code for your appointment',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 12,
              color: Colors.grey,
            ),
          ),
          const SizedBox(height: 12),
          OutlinedButton.icon(
            onPressed: () => _copyAppointmentDetails(context),
            icon: const Icon(Icons.copy, size: 18),
            label: const Text('Copy Details'),
            style: OutlinedButton.styleFrom(
              foregroundColor: const Color(0xFF6B8E3D),
              side: const BorderSide(color: Color(0xFF6B8E3D)),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBottomButtons(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          ElevatedButton(
            onPressed: () {
              Navigator.pushReplacement(
                context,
                MaterialPageRoute(builder: (context) => DashboardHome()),
              );
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF6B8E3D),
              minimumSize: const Size(double.infinity, 50),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            child: const Text(
              'Back to Home',
              style: TextStyle(fontSize: 16, color: Colors.white),
            ),
          ),
          const SizedBox(height: 12),
          OutlinedButton(
            onPressed: () {
              Navigator.pushReplacement(
                context,
                MaterialPageRoute(
                  builder: (context) => AppointmentScreen(),
                ),
              );
            },
            style: OutlinedButton.styleFrom(
              foregroundColor: const Color(0xFF6B8E3D), 
              side: const BorderSide(color: Color(0xFF6B8E3D)),
              minimumSize: const Size(double.infinity, 50),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            child: const Text(
              'View Appointments',
              style: TextStyle(fontSize: 16),
            ),
          ),
        ],
      ),
    );
  }

  void _copyAppointmentDetails(BuildContext context) {
    final String message = '''
Dear Patient,

We shall have consultation at the booked slot.

Your Joining Code is: ${appointment.joiningCode}

Appointment Details:
Doctor: ${appointment.doctorName}
Date: ${appointment.date}
Time: ${appointment.time}
Location: ${appointment.location}
''';
    
    Clipboard.setData(ClipboardData(text: message));
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: const Row(
          children: [
            Icon(Icons.check_circle, color: Colors.white),
            SizedBox(width: 10),
            Expanded(child: Text('Appointment details copied to clipboard!')),
          ],
        ),
        backgroundColor: const Color(0xFF6B8E3D),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(10),
        ),
        duration: const Duration(seconds: 3),
      ),
    );
  }
}