import 'package:flutter/material.dart';
import 'appointment.dart';
import 'doctor.dart';
import 'appointment_booked_screen.dart';

class AppointmentConfirmationScreen extends StatefulWidget {
  final Doctor doctor;
  final DateTime date;
  final String time;

  AppointmentConfirmationScreen({
    required this.doctor,
    required this.date,
    required this.time,
  });

  @override
  _AppointmentConfirmationScreenState createState() => _AppointmentConfirmationScreenState();
}

class _AppointmentConfirmationScreenState extends State<AppointmentConfirmationScreen> {
  String selectedPayment = 'Credit/Debit Card';
  final TextEditingController reasonController = TextEditingController();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        title: Text('Confirm Appointment'),
        backgroundColor: Colors.white,
        foregroundColor: Colors.black,
        elevation: 0,
      ),
      body: Column(
        children: [
          Expanded(
            child: SingleChildScrollView(
              padding: EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Doctor Info Card - Pharmacy Style
                  Card(
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                    elevation: 2,
                    child: Padding(
                      padding: EdgeInsets.all(12),
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
                              SizedBox(width: 15),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      widget.doctor.name,
                                      style: TextStyle(
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
                                    SizedBox(height: 4),
                                    Row(
                                      children: [
                                        Icon(Icons.star, size: 14, color: Colors.amber),
                                        SizedBox(width: 4),
                                        Text(
                                          widget.doctor.rating.toString(),
                                          style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                                        ),
                                        SizedBox(width: 8),
                                        Text(
                                          '\$${widget.doctor.consultationFee}',
                                          style: TextStyle(
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
                          SizedBox(height: 12),
                          Divider(height: 1, color: Colors.grey[200]),
                          SizedBox(height: 12),
                          Row(
                            children: [
                              Icon(Icons.calendar_today, size: 16, color: Colors.blue),
                              SizedBox(width: 8),
                              Text(
                                '${_getDayName(widget.date.weekday)}, ${widget.date.day} ${_getMonthName(widget.date.month)} ${widget.date.year}',
                                style: TextStyle(fontSize: 14),
                              ),
                            ],
                          ),
                          SizedBox(height: 8),
                          Row(
                            children: [
                              Icon(Icons.access_time, size: 16, color: Colors.blue),
                              SizedBox(width: 8),
                              Text(
                                widget.time,
                                style: TextStyle(fontSize: 14),
                              ),
                            ],
                          ),
                          SizedBox(height: 8),
                          Row(
                            children: [
                              Icon(Icons.location_on, size: 16, color: Colors.blue),
                              SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  'CardioLink Hospital, Room ${widget.doctor.roomNumber}',
                                  style: TextStyle(fontSize: 14),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                  SizedBox(height: 20),

                  // Appointment Details Section
                  Text(
                    'Appointment Details',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  SizedBox(height: 10),
                  Container(
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(10),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.grey.withOpacity(0.2),
                          spreadRadius: 2,
                          blurRadius: 5,
                          offset: Offset(0, 3),
                        ),
                      ],
                    ),
                    child: TextField(
                      controller: reasonController,
                      decoration: InputDecoration(
                        hintText: 'Reason for visit (optional)',
                        border: InputBorder.none,
                        contentPadding: EdgeInsets.all(15),
                      ),
                      maxLines: 3,
                    ),
                  ),
                  SizedBox(height: 20),

                  // Payment Method Section
                  Text(
                    'Payment Method',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  SizedBox(height: 10),
                  _buildPaymentMethod('Credit/Debit Card', Icons.credit_card),
                  _buildPaymentMethod('PayPal', Icons.payment),
                  _buildPaymentMethod('Insurance', Icons.health_and_safety),
                  SizedBox(height: 20),

                  // Cost Breakdown
                  Card(
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                    elevation: 2,
                    child: Padding(
                      padding: EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Cost Breakdown',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          SizedBox(height: 12),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text('Consultation Fee'),
                              Text('\$${widget.doctor.consultationFee}'),
                            ],
                          ),
                          SizedBox(height: 8),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text('Booking Fee'),
                              Text('\$5'),
                            ],
                          ),
                          Divider(height: 20),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                'Total',
                                style: TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 16,
                                ),
                              ),
                              Text(
                                '\$${widget.doctor.consultationFee + 5}',
                                style: TextStyle(
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

          // Bottom Confirmation Button - Pharmacy Style
          Container(
            padding: EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              boxShadow: [
                BoxShadow(
                  color: Colors.grey.withOpacity(0.2),
                  spreadRadius: 2,
                  blurRadius: 5,
                  offset: Offset(0, -3),
                ),
              ],
            ),
            child: SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () {
                  // Create appointment with proper format and all required data
                  final appointment = Appointment(
                    id: 'APT${DateTime.now().millisecondsSinceEpoch}',
                    doctorId: widget.doctor.id,
                    doctorName: widget.doctor.name,
                    doctorSpecialty: widget.doctor.specialty,
                    doctorImage: widget.doctor.imageUrl,
                    date: '${widget.date.day.toString().padLeft(2, '0')}/${widget.date.month.toString().padLeft(2, '0')}/${widget.date.year}',
                    time: widget.time,
                    location: 'Room ${widget.doctor.roomNumber}',
                    status: 'Upcoming',
                  );

                  // Add to AppointmentStore to ensure it shows regardless of navigation path
                  final exists = AppointmentStore.upcomingAppointments.any((a) =>
                    a.doctorId == appointment.doctorId &&
                    a.date == appointment.date &&
                    a.time == appointment.time
                  );
                  
                  if (!exists) {
                    AppointmentStore.upcomingAppointments.add(appointment);
                  }

                  // Navigate to appointment booked screen
                  Navigator.pushReplacement(
                    context,
                    MaterialPageRoute(
                      builder: (context) => AppointmentBookedScreen(appointment: appointment),
                    ),
                  );
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.blue,
                  padding: EdgeInsets.symmetric(vertical: 15),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
                child: Text(
                  'Confirm Appointment - \$${widget.doctor.consultationFee + 5}',
                  style: TextStyle(fontSize: 16, color: Colors.white),
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
        margin: EdgeInsets.only(bottom: 8),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(10),
          side: isSelected
              ? BorderSide(color: Colors.blue, width: 2)
              : BorderSide.none,
        ),
        elevation: isSelected ? 3 : 1,
        child: Padding(
          padding: EdgeInsets.all(12),
          child: Row(
            children: [
              Icon(icon,
                  size: 20,
                  color: isSelected ? Colors.blue : Colors.grey[600]
              ),
              SizedBox(width: 12),
              Text(
                title,
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: isSelected ? FontWeight.w500 : FontWeight.normal,
                  color: isSelected ? Colors.blue : Colors.black,
                ),
              ),
              Spacer(),
              if (isSelected)
                Icon(Icons.check_circle, color: Colors.blue, size: 20)
              else
                Icon(Icons.chevron_right, color: Colors.grey, size: 20),
            ],
          ),
        ),
      ),
    );
  }

  String _getDayName(int weekday) {
    switch (weekday) {
      case 1: return 'Monday';
      case 2: return 'Tuesday';
      case 3: return 'Wednesday';
      case 4: return 'Thursday';
      case 5: return 'Friday';
      case 6: return 'Saturday';
      case 7: return 'Sunday';
      default: return '';
    }
  }

  String _getMonthName(int month) {
    switch (month) {
      case 1: return 'January';
      case 2: return 'February';
      case 3: return 'March';
      case 4: return 'April';
      case 5: return 'May';
      case 6: return 'June';
      case 7: return 'July';
      case 8: return 'August';
      case 9: return 'September';
      case 10: return 'October';
      case 11: return 'November';
      case 12: return 'December';
      default: return '';
    }
  }
}