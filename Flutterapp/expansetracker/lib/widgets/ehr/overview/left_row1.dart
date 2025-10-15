import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class LeftRow1 extends StatelessWidget {
  final String? patientId;
  final Map<String, dynamic>? patient;

  const LeftRow1({
    Key? key,
    this.patientId,
    this.patient,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Patient Information',
            style: GoogleFonts.inter(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: const Color(0xFF2D3748),
            ),
          ),
          const SizedBox(height: 16),
          if (patient != null) ...[
            _buildInfoRow('Name', '${patient!['firstName'] ?? ''} ${patient!['lastName'] ?? ''}'),
            _buildInfoRow('Age', _calculateAge()),
            _buildInfoRow('Gender', patient!['gender'] ?? 'Not specified'),
            _buildInfoRow('DOB', _formatDate(patient!['dateOfBirth'])),
            _buildInfoRow('Phone', patient!['phoneNumber'] ?? 'Not provided'),
            _buildInfoRow('Email', patient!['email'] ?? 'Not provided'),
          ] else ...[
            const Center(
              child: Text('No patient data available'),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: GoogleFonts.inter(
              fontSize: 12,
              fontWeight: FontWeight.w500,
              color: Colors.grey[600],
            ),
          ),
          const SizedBox(height: 2),
          Text(
            value,
            style: GoogleFonts.inter(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: const Color(0xFF2D3748),
            ),
          ),
        ],
      ),
    );
  }

  String _calculateAge() {
    if (patient == null || patient!['dateOfBirth'] == null) return 'Unknown';
    
    try {
      final dob = DateTime.parse(patient!['dateOfBirth']);
      final now = DateTime.now();
      int age = now.year - dob.year;
      if (now.month < dob.month || (now.month == dob.month && now.day < dob.day)) {
        age--;
      }
      return '$age years';
    } catch (e) {
      return 'Unknown';
    }
  }

  String _formatDate(String? dateString) {
    if (dateString == null) return 'Not provided';
    
    try {
      final date = DateTime.parse(dateString);
      return '${date.day}/${date.month}/${date.year}';
    } catch (e) {
      return 'Invalid date';
    }
  }
}
