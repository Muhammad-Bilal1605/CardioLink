import 'doctor.dart';
import 'appointment.dart';
import 'medical_record.dart';
import 'medication.dart';

// Sample Doctors Data
final List<Doctor> doctors = [
  Doctor(
    id: 1,
    name: 'Dr. Sarah Wilson',
    specialty: 'Cardiologist',
    imageUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&h=150&fit=crop&crop=face',
    rating: 4.8,
    reviews: 124,
    roomNumber: 101,
    isOnline: true,
  ),
  Doctor(
    id: 2,
    name: 'Dr. Michael Chen',
    specialty: 'Cardiac Surgeon',
    imageUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&h=150&fit=crop&crop=face',
    rating: 4.9,
    reviews: 98,
    roomNumber: 205,
    isOnline: true,
  ),
  Doctor(
    id: 3,
    name: 'Dr. Emily Rodriguez',
    specialty: 'Pediatric Cardiologist',
    imageUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop&crop=face',
    rating: 4.7,
    reviews: 87,
    roomNumber: 312,
  ),
  Doctor(
    id: 4,
    name: 'Dr. James Peterson',
    specialty: 'Interventional Cardiologist',
    imageUrl: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=150&h=150&fit=crop&crop=face',
    rating: 4.6,
    reviews: 112,
    roomNumber: 104,
    isOnline: false,
  ),
  Doctor(
    id: 5,
    name: 'Dr. Olivia Thompson',
    specialty: 'Electrophysiologist',
    imageUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face',
    rating: 4.5,
    reviews: 76,
    roomNumber: 208,
    isOnline: false,
  ),
];

// Sample Medications Data
final List<Medication> medications = [
  Medication(
    id: 'MED001',
    name: 'Lisinopril',
    dosage: '10mg',
    frequency: 'Once daily',
    purpose: 'Blood pressure control',
    imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=100&h=100&fit=crop',
  ),
  Medication(
    id: 'MED002',
    name: 'Atorvastatin',
    dosage: '20mg',
    frequency: 'Once at bedtime',
    purpose: 'Cholesterol management',
    imageUrl: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=100&h=100&fit=crop',
  ),
  Medication(
    id: 'MED003',
    name: 'Metoprolol',
    dosage: '25mg',
    frequency: 'Twice daily',
    purpose: 'Heart rate control',
    imageUrl: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=100&h=100&fit=crop',
  ),
];

// Sample Appointments Data
List<Appointment> upcomingAppointments = [
  Appointment(
    id: 'CA20240001',
    doctorName: 'Dr. Sarah Wilson',
    doctorSpecialty: 'Cardiologist',
    doctorImage: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&h=150&fit=crop&crop=face',
    date: '15/06/2024',
    time: '10:30 AM',
    location: 'CardioLink Hospital, Room 101',
    status: 'Upcoming',
  ),
  Appointment(
    id: 'CA20240002',
    doctorName: 'Dr. Michael Chen',
    doctorSpecialty: 'Cardiac Surgeon',
    doctorImage: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&h=150&fit=crop&crop=face',
    date: '18/06/2024',
    time: '02:15 PM',
    location: 'CardioLink Hospital, Room 205',
    status: 'Upcoming',
  ),
];

List<Appointment> completedAppointments = [
  Appointment(
    id: 'CA20240003',
    doctorName: 'Dr. Emily Rodriguez',
    doctorSpecialty: 'Pediatric Cardiologist',
    doctorImage: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop&crop=face',
    date: '05/05/2024',
    time: '09:00 AM',
    location: 'CardioLink Hospital, Room 312',
    status: 'Completed',
  ),
];

List<Appointment> cancelledAppointments = [
  Appointment(
    id: 'CA20240004',
    doctorName: 'Dr. James Peterson',
    doctorSpecialty: 'Interventional Cardiologist',
    doctorImage: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=150&h=150&fit=crop&crop=face',
    date: '20/04/2024',
    time: '11:30 AM',
    location: 'CardioLink Hospital, Room 104',
    status: 'Cancelled',
  ),
];

// Sample Health Metrics
final Map<String, dynamic> healthMetrics = {
  'heartRate': 72,
  'bloodPressure': '120/80',
  'cholesterol': {
    'total': 180,
    'hdl': 55,
    'ldl': 100,
    'triglycerides': 120,
  },
  'weight': 68.5, // kg
  'height': 175, // cm
  'bmi': 22.4,
};

// Sample Medical Records
final List<MedicalRecord> medicalRecords = [
  MedicalRecord(
    id: 'REC001',
    title: 'ECG Test Results',
    date: '10/05/2024',
    description: 'Normal sinus rhythm detected',
    type: 'Test Result',
    fileUrl: 'https://example.com/records/ecg_20240510.pdf',
  ),
  MedicalRecord(
    id: 'REC002',
    title: 'Blood Test Report',
    date: '08/05/2024',
    description: 'Complete blood count and lipid profile',
    type: 'Lab Report',
    fileUrl: 'https://example.com/records/bloodtest_20240508.pdf',
  ),
  MedicalRecord(
    id: 'REC003',
    title: 'Cardiology Consultation',
    date: '05/05/2024',
    description: 'Follow-up consultation with Dr. Wilson',
    type: 'Consultation Note',
    fileUrl: 'https://example.com/records/consult_20240505.pdf',

  ),
];