class Appointment {
  final String id;
  final String doctorId;
  final String doctorName;
  final String doctorSpecialty;
  final String doctorImage;
  final String date;
  final String time;
  final String location;
  late final String status;

  Appointment({
    required this.id,
    required this.doctorId,
    required this.doctorName,
    required this.doctorSpecialty,
    required this.doctorImage,
    required this.date,
    required this.time,
    required this.location,
    required this.status,
  });
}

// Simple in-memory store to share appointments across screens
class AppointmentStore {
  static List<Appointment> upcomingAppointments = [];
  static List<Appointment> completedAppointments = [];
  static List<Appointment> cancelledAppointments = [];
}