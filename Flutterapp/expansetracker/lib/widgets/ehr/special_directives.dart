import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class SpecialDirectives extends StatelessWidget {
  final Map<String, dynamic>? patient;

  const SpecialDirectives({
    Key? key,
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
            'Special Directives',
            style: GoogleFonts.inter(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: const Color(0xFF2D3748),
            ),
          ),
          const SizedBox(height: 16),
          if (patient != null && patient!['specialDirectives'] != null) ...[
            _buildDirectiveItem('DNR', _getDNRStatus()),
            _buildDirectiveItem('Living Will', _getLivingWillStatus()),
            _buildDirectiveItem('Organ Donor', _getOrganDonorStatus()),
            if (patient!['specialDirectives']['religiousInstructions'] != null)
              _buildDirectiveItem('Religious Instructions', patient!['specialDirectives']['religiousInstructions']),
          ] else ...[
            const Center(
              child: Text('No special directives data available'),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildDirectiveItem(String title, String value) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 4,
            offset: const Offset(0, 1),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: const Color(0xFF6B8E3D).withOpacity(0.1),
              borderRadius: BorderRadius.circular(6),
            ),
            child: const Icon(
              Icons.medical_information,
              color: Color(0xFF6B8E3D),
              size: 16,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: GoogleFonts.inter(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: const Color(0xFF2D3748),
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  value,
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    color: Colors.grey[600],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  String _getDNRStatus() {
    if (patient == null || patient!['specialDirectives'] == null) return 'Not specified';
    final dnr = patient!['specialDirectives']['dnr'] ?? false;
    return dnr ? 'Yes' : 'No';
  }

  String _getLivingWillStatus() {
    if (patient == null || patient!['specialDirectives'] == null) return 'Not specified';
    final livingWill = patient!['specialDirectives']['livingWill'] ?? false;
    return livingWill ? 'Yes' : 'No';
  }

  String _getOrganDonorStatus() {
    if (patient == null || patient!['specialDirectives'] == null) return 'Not specified';
    final organDonor = patient!['specialDirectives']['organDonor'] ?? false;
    return organDonor ? 'Yes' : 'No';
  }
}
