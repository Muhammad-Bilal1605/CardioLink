import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import 'hospitalization_status_badge.dart';

class HospitalizationCard extends StatelessWidget {
  final Map<String, dynamic> hosp;
  final void Function(Map<String, dynamic> hosp)? onOpen;

  const HospitalizationCard({
    super.key,
    required this.hosp,
    this.onOpen,
  });

  String _formatDate(dynamic dateValue) {
    if (dateValue == null) return 'Not specified';
    try {
      final date = DateTime.parse(dateValue.toString());
      return '${date.day}/${date.month}/${date.year}';
    } catch (_) {
      return dateValue.toString();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      (hosp['reason']?.toString().isNotEmpty ?? false) ? hosp['reason'].toString() : 'Hospitalization',
                      style: GoogleFonts.inter(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: const Color(0xFF2D3748),
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${_formatDate(hosp['date'])} • ${hosp['hospital'] ?? 'Unknown Hospital'}',
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        color: Colors.grey[600],
                      ),
                    ),
                  ],
                ),
              ),
              HospitalizationStatusBadge(status: hosp['status']?.toString() ?? 'Unknown'),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _info('Admitting Physician', hosp['admittingPhysician']?.toString() ?? 'Not specified'),
              ),
              Expanded(
                child: _info('Department', hosp['department']?.toString() ?? 'Not specified'),
              ),
            ],
          ),
          const SizedBox(height: 8),
          _section('Clinical Summary', hosp['clinicalSummary']),
          if (hosp['dischargeInstructions']?.toString().isNotEmpty ?? false) ...[
            const SizedBox(height: 8),
            _section('Discharge Instructions', hosp['dischargeInstructions'])
          ],
          const SizedBox(height: 12),
          Align(
            alignment: Alignment.centerRight,
            child: ElevatedButton.icon(
              onPressed: onOpen == null ? null : () => onOpen!(hosp),
              icon: const Icon(Icons.visibility, size: 16),
              label: const Text('Open'),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF6B8E3D),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              ),
            ),
          )
        ],
      ),
    );
  }

  Widget _info(String label, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: GoogleFonts.inter(
            fontSize: 12,
            color: Colors.grey[600],
            fontWeight: FontWeight.w500,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          value,
          style: GoogleFonts.inter(
            fontSize: 13,
            color: const Color(0xFF2D3748),
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    );
  }

  Widget _section(String title, dynamic value) {
    final text = value?.toString() ?? '';
    if (text.isEmpty) return const SizedBox.shrink();
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.grey.shade50,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: GoogleFonts.inter(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: const Color(0xFF2D3748),
            ),
          ),
          const SizedBox(height: 4),
          Text(
            text,
            style: GoogleFonts.inter(
              fontSize: 12,
              color: Colors.grey[700],
            ),
          ),
        ],
      ),
    );
  }
}


