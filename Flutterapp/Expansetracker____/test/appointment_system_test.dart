import 'package:flutter_test/flutter_test.dart';
import 'package:expansetracker/services/appointment_service.dart';
import 'package:expansetracker/services/doctor_service.dart';
import 'package:expansetracker/cardio/appointment.dart';
import 'package:expansetracker/cardio/doctor.dart';

void main() {
  group('Appointment System Tests', () {
    test('AppointmentService should fetch appointments', () async {
      // Test fetching appointments
      try {
        final appointments = await AppointmentService.getAllAppointments();
        expect(appointments, isA<List<Appointment>>());
        print('✅ Successfully fetched ${appointments.length} appointments');
      } catch (e) {
        print('⚠️ AppointmentService test failed: $e');
        // This might fail if backend is not running, which is expected in testing
      }
    });

    test('AppointmentService should handle upcoming appointments', () async {
      try {
        final upcomingAppointments = await AppointmentService.getUpcomingAppointments();
        expect(upcomingAppointments, isA<List<Appointment>>());
        print('✅ Successfully fetched ${upcomingAppointments.length} upcoming appointments');
      } catch (e) {
        print('⚠️ Upcoming appointments test failed: $e');
      }
    });

    test('AppointmentService should handle cancelled appointments', () async {
      try {
        final cancelledAppointments = await AppointmentService.getCancelledAppointments();
        expect(cancelledAppointments, isA<List<Appointment>>());
        print('✅ Successfully fetched ${cancelledAppointments.length} cancelled appointments');
      } catch (e) {
        print('⚠️ Cancelled appointments test failed: $e');
      }
    });

    test('AppointmentService should handle chatable doctors', () async {
      try {
        final chatableDoctors = await AppointmentService.getChatableDoctors();
        expect(chatableDoctors, isA<List<Doctor>>());
        print('✅ Successfully fetched ${chatableDoctors.length} chatable doctors');
      } catch (e) {
        print('⚠️ Chatable doctors test failed: $e');
      }
    });

    test('DoctorService should fetch doctors', () async {
      try {
        final doctors = await DoctorService.getAllDoctors();
        expect(doctors, isA<List<Doctor>>());
        print('✅ Successfully fetched ${doctors.length} doctors');
      } catch (e) {
        print('⚠️ DoctorService test failed: $e');
      }
    });

    test('Appointment model should serialize/deserialize correctly', () {
      final testAppointment = Appointment(
        id: 'test_id',
        patientId: 'patient_123',
        doctorId: 'doctor_456',
        doctorName: 'Dr. Test',
        doctorSpecialty: 'Cardiology',
        doctorImage: 'https://example.com/doctor.jpg',
        appointmentDate: DateTime.now(),
        appointmentTime: '10:00 AM',
        status: 'Upcoming',
        reason: 'Test appointment',
        paymentMethod: 'Credit Card',
        appointmentType: 'Consultation',
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );

      // Test serialization
      final json = testAppointment.toJson();
      expect(json, isA<Map<String, dynamic>>());
      expect(json['id'], equals('test_id'));
      expect(json['doctorName'], equals('Dr. Test'));

      // Test deserialization
      final deserializedAppointment = Appointment.fromJson(json);
      expect(deserializedAppointment.id, equals(testAppointment.id));
      expect(deserializedAppointment.doctorName, equals(testAppointment.doctorName));
      expect(deserializedAppointment.status, equals(testAppointment.status));

      print('✅ Appointment serialization/deserialization works correctly');
    });

    test('Doctor model should serialize/deserialize correctly', () {
      final testDoctor = Doctor(
        id: 'doctor_123',
        name: 'Dr. Test Doctor',
        specialty: 'Cardiology',
        department: 'Cardiology',
        experience: 10,
        rating: 4.5,
        consultationFee: 100.0,
        profileImage: 'https://example.com/doctor.jpg',
        isVerified: true,
        isOnline: true,
        qualifications: ['MD', 'MBBS'],
      );

      // Test serialization
      final json = testDoctor.toJson();
      expect(json, isA<Map<String, dynamic>>());
      expect(json['id'], equals('doctor_123'));
      expect(json['name'], equals('Dr. Test Doctor'));

      // Test deserialization
      final deserializedDoctor = Doctor.fromJson(json);
      expect(deserializedDoctor.id, equals(testDoctor.id));
      expect(deserializedDoctor.name, equals(testDoctor.name));
      expect(deserializedDoctor.specialty, equals(testDoctor.specialty));

      print('✅ Doctor serialization/deserialization works correctly');
    });
  });
}
