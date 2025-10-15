import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:url_launcher/url_launcher.dart';

import 'lab_status_badge.dart';

class LabDetailsSheet extends StatelessWidget {
  final Map<String, dynamic> lab;

  const LabDetailsSheet({
    super.key,
    required this.lab,
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
    final reportUrl = lab['reportUrl']?.toString();
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: SingleChildScrollView(
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
                          lab['testName']?.toString() ?? 'Lab Test',
                          style: GoogleFonts.inter(
                            fontSize: 18,
                            fontWeight: FontWeight.w700,
                            color: const Color(0xFF2D3748),
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          '${_formatDate(lab['date'])} • ${lab['facility'] ?? 'Unknown Facility'}',
                          style: GoogleFonts.inter(fontSize: 13, color: Colors.grey[600]),
                        ),
                      ],
                    ),
                  ),
                  LabStatusBadge(status: lab['status']?.toString() ?? 'Unknown'),
                ],
              ),
              const SizedBox(height: 12),
              _kv('Test Type', lab['testType']?.toString()),
              _kv('Doctor', lab['doctor']?.toString()),
              const SizedBox(height: 12),
              _section('Notes', lab['notes']),
              const SizedBox(height: 12),
              if (lab['results'] is List && (lab['results'] as List).isNotEmpty) ...[
                Text('Results', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: const Color(0xFF2D3748))),
                const SizedBox(height: 8),
                ...((lab['results'] as List).map((r) => _resultRow(Map<String, dynamic>.from(r))).toList()),
                const SizedBox(height: 12),
              ],
              if (reportUrl != null && reportUrl.isNotEmpty)
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: () async {
                      final uri = Uri.tryParse(reportUrl);
                      if (uri != null && await canLaunchUrl(uri)) {
                        await launchUrl(uri, mode: LaunchMode.externalApplication);
                      }
                    },
                    icon: const Icon(Icons.picture_as_pdf, size: 16),
                    label: const Text('Open Report'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF6B8E3D),
                      foregroundColor: Colors.white,
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _resultRow(Map<String, dynamic> r) {
    final parameter = r['parameter']?.toString();
    final value = r['value']?.toString();
    final unit = r['unit']?.toString();
    final status = r['status']?.toString();
    final ref = r['referenceRange']?.toString();
    return Container(
      margin: const EdgeInsets.only(bottom: 6),
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(color: Colors.grey.shade50, borderRadius: BorderRadius.circular(8)),
      child: Row(
        children: [
          Expanded(
            child: Text(parameter ?? '-', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: const Color(0xFF2D3748))),
          ),
          Text('${value ?? '-'} ${unit ?? ''}', style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF2D3748))),
          const SizedBox(width: 12),
          if (status != null && status.isNotEmpty)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(color: Colors.orange.shade50, borderRadius: BorderRadius.circular(8), border: Border.all(color: Colors.orange.shade200)),
              child: Text(status.toUpperCase(), style: GoogleFonts.inter(fontSize: 10, color: Colors.orange.shade700, fontWeight: FontWeight.w700)),
            ),
          const SizedBox(width: 12),
          if (ref != null && ref.isNotEmpty)
            Text('Ref: $ref', style: GoogleFonts.inter(fontSize: 11, color: Colors.grey[600])),
        ],
      ),
    );
  }

  Widget _kv(String label, String? value) {
    if (value == null || value.isEmpty) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 110,
            child: Text(label, style: GoogleFonts.inter(fontSize: 12, color: Colors.grey[600], fontWeight: FontWeight.w500)),
          ),
          Expanded(
            child: Text(value, style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: const Color(0xFF2D3748))),
          ),
        ],
      ),
    );
  }

  Widget _section(String title, dynamic value) {
    final text = value?.toString() ?? '';
    if (text.isEmpty) return const SizedBox.shrink();
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(color: Colors.grey.shade50, borderRadius: BorderRadius.circular(8)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: const Color(0xFF2D3748))),
          const SizedBox(height: 4),
          Text(text, style: GoogleFonts.inter(fontSize: 12, color: Colors.grey[700])),
        ],
      ),
    );
  }
}


