// lib/cardio/appointment_confirmation_screen.dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

// Local imports
import 'doctor.dart';
import 'appointment.dart'; // Appointment model
import 'appointment_booked_screen.dart';
import '../provider/auth_provider.dart';
import '../services/appointment_api_service.dart'; // AppointmentApiService and AppointmentStore

class AppointmentConfirmationScreen extends StatefulWidget {
  final Doctor doctor;
  final DateTime date;
  final String time;

  const AppointmentConfirmationScreen({
    Key? key,
    required this.doctor,
    required this.date,
    required this.time,
  }) : super(key: key);

  @override
  _AppointmentConfirmationScreenState createState() => 
      _AppointmentConfirmationScreenState();
}

class _AppointmentConfirmationScreenState extends State<AppointmentConfirmationScreen> {
  String selectedPayment = 'Credit/Debit Card';
  final TextEditingController reasonController = TextEditingController();
  bool _isLoading = false;

  void _showErrorSnackBar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(Icons.error, color: Colors.white),
            const SizedBox(width: 10),
            Expanded(child: Text(message)),
          ],
        ),
        backgroundColor: Colors.red,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(10),
        ),
      ),
    );
  }

  void _showSuccessSnackBar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(Icons.check_circle, color: Colors.white),
            const SizedBox(width: 10),
            Expanded(child: Text(message)),
          ],
        ),
        backgroundColor: Colors.green,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(10),
        ),
      ),
    );
  }

  Future<void> _confirmAppointment() async {
    setState(() {
      _isLoading = true;
    });

    try {
      // Get auth provider
      final authProvider = Provider.of<AuthProvider>(context, listen: false);

      print('========== APPOINTMENT CONFIRMATION DEBUG ==========');
      print('Starting appointment confirmation');
      print('Auth Token: ${authProvider.authToken != null ? 'Present (${authProvider.authToken!.length} chars)' : 'MISSING'}');
      print('Doctor ID: ${widget.doctor.id}');
      print('Doctor Name: ${widget.doctor.name}');
      print('User Type: ${authProvider.userType}');
      print('User ID: ${authProvider.userId}');
      print('=====================================================');

      // Validate authentication
      if (authProvider.authToken == null || authProvider.authToken!.isEmpty) {
        print('❌ Authentication token is missing');
        _showErrorSnackBar('Authentication failed. Please login again.');
        setState(() {
          _isLoading = false;
        });
        return;
      }

      // CRITICAL: Set token in AppointmentApiService
      AppointmentApiService.setAuthToken(authProvider.authToken!);
      print('✓ Token set in AppointmentApiService');

      // Format date as DD/MM/YYYY
      final formattedDate = 
          '${widget.date.day.toString().padLeft(2, '0')}/'
          '${widget.date.month.toString().padLeft(2, '0')}/'
          '${widget.date.year}';

      print('Appointment Details:');
      print('  Date: $formattedDate');
      print('  Time: ${widget.time}');
      print('  Reason: ${reasonController.text.isEmpty ? "General Consultation" : reasonController.text}');
      print('  Payment: $selectedPayment');

      // Call API to create appointment
      final result = await AppointmentApiService.createAppointment(
        doctorId: widget.doctor.id,
        doctorName: widget.doctor.name,
        doctorSpecialty: widget.doctor.specialty,
        doctorImage: widget.doctor.imageUrl,
        appointmentDate: widget.date,
        appointmentTime: widget.time,
        formattedDate: formattedDate,
        reason: reasonController.text.isEmpty 
            ? 'General Consultation' 
            : reasonController.text,
        paymentMethod: selectedPayment,
        consultationFee: widget.doctor.consultationFee.toInt(),
        location: 'CardioLink Hospital, Room ${widget.doctor.roomNumber}',
        roomNumber: widget.doctor.roomNumber.toString(),
      );

      print('API Response:');
      print('  Success: ${result["success"]}');
      print('  Message: ${result["message"]}');

      setState(() {
        _isLoading = false;
      });

      if (result['success']) {
        print('✅ Appointment created successfully');

        // Get appointment data from API response
        final apiAppointment = result['appointment'] ?? {};

        print('Appointment Response Data:');
        print('  ID: ${apiAppointment['id']}');
        print('  Joining Code: ${apiAppointment['joiningCode']}');
        print('  Status: ${apiAppointment['status']}');

        // Create appointment object with data from backend
        final patientId = authProvider.userId ?? 'UNKNOWN';

        final appointment = Appointment(
          id: apiAppointment['id']?.toString() ?? 
              'APT${DateTime.now().millisecondsSinceEpoch}',
          patientId: patientId,
          doctorId: apiAppointment['doctorId']?.toString() ?? 
              widget.doctor.id,
          doctorName: apiAppointment['doctorName']?.toString() ?? 
              widget.doctor.name,
          doctorSpecialty: apiAppointment['doctorSpecialty']?.toString() ?? 
              widget.doctor.specialty,
          doctorImage: apiAppointment['doctorImage']?.toString() ?? 
              widget.doctor.imageUrl,
          date: apiAppointment['date']?.toString() ?? formattedDate,
          time: apiAppointment['time']?.toString() ?? widget.time,
          location: apiAppointment['location']?.toString() ?? 
              'CardioLink Hospital, Room ${widget.doctor.roomNumber}',
          status: apiAppointment['status']?.toString() ?? 'Upcoming',
          joiningCode: apiAppointment['joiningCode']?.toString() ?? '0000',
        );

        print('Final Appointment Object:');
        print('  patientId: ${appointment.patientId}');
        print('  doctorId: ${appointment.doctorId}');
        print('  joiningCode: ${appointment.joiningCode}');

        // Add to local store
        final exists = AppointmentStore.upcomingAppointments.any((a) =>
            a.doctorId == appointment.doctorId &&
            a.date == appointment.date &&
            a.time == appointment.time);

        if (!exists) {
          AppointmentStore.upcomingAppointments.add(appointment);
          print('✓ Appointment added to local store');
        }

        _showSuccessSnackBar('Appointment booked successfully!');
        print('✅ Navigating to appointment booked screen');

        // Navigate to success screen
        if (mounted) {
          Navigator.pushReplacement(
            context,
            MaterialPageRoute(
              builder: (context) => AppointmentBookedScreen(
                appointment: appointment,
              ),
            ),
          );
        }
      } else {
        print('❌ Appointment creation failed');
        final errorMsg = result['message'] ?? 'Failed to book appointment';
        _showErrorSnackBar(errorMsg);
      }
    } catch (e) {
      print('❌ Exception during appointment confirmation: $e');
      print('Stack trace: ${StackTrace.current}');

      setState(() {
        _isLoading = false;
      });

      _showErrorSnackBar('Error: ${e.toString()}');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        title: const Text('Confirm Appointment'),
        backgroundColor: Colors.white,
        foregroundColor: Colors.black,
        elevation: 0,
      ),
      body: Column(
        children: [
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Doctor Info Card
                  Card(
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                    elevation: 2,
                    child: Padding(
                      padding: const EdgeInsets.all(12),
                      child: Column(
                        children: [
                          Row(
                            children: [
                              Container(
                                width: 60,
                                height: 60,
                                decoration: BoxDecoration(
                                  borderRadius: BorderRadius.circular(8),
                                  image: DecorationImage(
                                    image: NetworkImage(widget.doctor.imageUrl),
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
                                      widget.doctor.name,
                                      style: const TextStyle(
                                        fontSize: 16,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                    Text(
                                      widget.doctor.specialty,
                                      style: TextStyle(
                                        color: Colors.grey[600],
                                      ),
                                    ),
                                    const SizedBox(height: 4),
                                    Row(
                                      children: [
                                        const Icon(
                                          Icons.star,
                                          size: 14,
                                          color: Colors.amber,
                                        ),
                                        const SizedBox(width: 4),
                                        Text(
                                          widget.doctor.rating.toString(),
                                          style: TextStyle(
                                            fontSize: 12,
                                            color: Colors.grey[600],
                                          ),
                                        ),
                                        const SizedBox(width: 8),
                                        Text(
                                          '\$${widget.doctor.consultationFee}',
                                          style: const TextStyle(
                                            fontSize: 14,
                                            fontWeight: FontWeight.w600,
                                            color: Colors.blue,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          Divider(height: 1, color: Colors.grey[200]),
                          const SizedBox(height: 12),
                          Row(
                            children: [
                              const Icon(
                                Icons.calendar_today,
                                size: 16,
                                color: Colors.blue,
                              ),
                              const SizedBox(width: 8),
                              Text(
                                '${_getDayName(widget.date.weekday)}, '
                                '${widget.date.day} '
                                '${_getMonthName(widget.date.month)} '
                                '${widget.date.year}',
                                style: const TextStyle(fontSize: 14),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              const Icon(
                                Icons.access_time,
                                size: 16,
                                color: Colors.blue,
                              ),
                              const SizedBox(width: 8),
                              Text(
                                widget.time,
                                style: const TextStyle(fontSize: 14),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              const Icon(
                                Icons.location_on,
                                size: 16,
                                color: Colors.blue,
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  'CardioLink Hospital, Room ${widget.doctor.roomNumber}',
                                  style: const TextStyle(fontSize: 14),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),
                  const Text(
                    'Appointment Details',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 10),
                  Container(
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(10),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.grey.withOpacity(0.2),
                          spreadRadius: 2,
                          blurRadius: 5,
                          offset: const Offset(0, 3),
                        ),
                      ],
                    ),
                    child: TextField(
                      controller: reasonController,
                      decoration: const InputDecoration(
                        hintText: 'Reason for visit (optional)',
                        border: InputBorder.none,
                        contentPadding: EdgeInsets.all(15),
                      ),
                      maxLines: 3,
                    ),
                  ),
                  const SizedBox(height: 20),
                  const Text(
                    'Payment Method',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 10),
                  _buildPaymentMethod('Credit/Debit Card', Icons.credit_card),
                  _buildPaymentMethod('PayPal', Icons.payment),
                  _buildPaymentMethod('Insurance', Icons.health_and_safety),
                  const SizedBox(height: 20),
                  Card(
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                    elevation: 2,
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Cost Breakdown',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 12),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Text('Consultation Fee'),
                              Text('\$${widget.doctor.consultationFee}'),
                            ],
                          ),
                          const SizedBox(height: 8),
                          const Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text('Booking Fee'),
                              Text('\$5'),
                            ],
                          ),
                          const Divider(height: 20),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Text(
                                'Total',
                                style: TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 16,
                                ),
                              ),
                              Text(
                                '\$${widget.doctor.consultationFee + 5}',
                                style: const TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 16,
                                  color: Colors.blue,
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
            ),
          ),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              boxShadow: [
                BoxShadow(
                  color: Colors.grey.withOpacity(0.2),
                  spreadRadius: 2,
                  blurRadius: 5,
                  offset: const Offset(0, -3),
                ),
              ],
            ),
            child: SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _isLoading ? null : _confirmAppointment,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.blue,
                  padding: const EdgeInsets.symmetric(vertical: 15),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
                child: _isLoading
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          valueColor: AlwaysStoppedAnimation<Color>(
                            Colors.white,
                          ),
                        ),
                      )
                    : Text(
                        'Confirm Appointment - \$${widget.doctor.consultationFee + 5}',
                        style: const TextStyle(
                          fontSize: 16,
                          color: Colors.white,
                        ),
                      ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPaymentMethod(String title, IconData icon) {
    bool isSelected = selectedPayment == title;

    return GestureDetector(
      onTap: () {
        setState(() {
          selectedPayment = title;
        });
      },
      child: Card(
        margin: const EdgeInsets.only(bottom: 8),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(10),
          side: isSelected
              ? const BorderSide(color: Colors.blue, width: 2)
              : BorderSide.none,
        ),
        elevation: isSelected ? 3 : 1,
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Row(
            children: [
              Icon(
                icon,
                size: 20,
                color: isSelected ? Colors.blue : Colors.grey[600],
              ),
              const SizedBox(width: 12),
              Text(
                title,
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: isSelected ? FontWeight.w500 : FontWeight.normal,
                  color: isSelected ? Colors.blue : Colors.black,
                ),
              ),
              const Spacer(),
              if (isSelected)
                const Icon(Icons.check_circle, color: Colors.blue, size: 20)
              else
                const Icon(Icons.chevron_right, color: Colors.grey, size: 20),
            ],
          ),
        ),
      ),
    );
  }

  String _getDayName(int weekday) {
    const days = [
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday'
    ];
    return weekday >= 1 && weekday <= 7 ? days[weekday - 1] : '';
  }

  String _getMonthName(int month) {
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December'
    ];
    return month >= 1 && month <= 12 ? months[month - 1] : '';
  }

  @override
  void dispose() {
    reasonController.dispose();
    super.dispose();
  }
}