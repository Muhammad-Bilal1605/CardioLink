import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:url_launcher/url_launcher.dart';

import 'hospitalization_status_badge.dart';

class HospitalizationDetailsSheet extends StatelessWidget {
  final Map<String, dynamic> hosp;

  const HospitalizationDetailsSheet({
    super.key,
    required this.hosp,
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
    final dischargeUrl = hosp['dischargeReportUrl']?.toString();
    final additionalDocs = (hosp['additionalDocuments'] as List?)?.map((e) => Map<String, dynamic>.from(e)).toList() ?? const <Map<String, dynamic>>[];
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
                          (hosp['reason']?.toString().isNotEmpty ?? false) ? hosp['reason'].toString() : 'Hospitalization',
                          style: GoogleFonts.inter(
                            fontSize: 18,
                            fontWeight: FontWeight.w700,
                            color: const Color(0xFF2D3748),
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          '${_formatDate(hosp['date'])} • ${hosp['hospital'] ?? 'Unknown Hospital'}',
                          style: GoogleFonts.inter(fontSize: 13, color: Colors.grey[600]),
                        ),
                      ],
                    ),
                  ),
                  HospitalizationStatusBadge(status: hosp['status']?.toString() ?? 'Unknown'),
                ],
              ),
              const SizedBox(height: 12),
              _kv('Admitting Physician', hosp['admittingPhysician']?.toString()),
              _kv('Department', hosp['department']?.toString()),
              const SizedBox(height: 12),
              _section('Clinical Summary', hosp['clinicalSummary']),
              _section('Discharge Instructions', hosp['dischargeInstructions']),
              const SizedBox(height: 16),
              if (dischargeUrl != null && dischargeUrl.isNotEmpty)
                _fileRow('Discharge Report', dischargeUrl),
              if (additionalDocs.isNotEmpty) ...[
                const SizedBox(height: 8),
                Text('Additional Documents', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: const Color(0xFF2D3748))),
                const SizedBox(height: 8),
                ...additionalDocs.map((d) => _fileRow(d['name']?.toString() ?? 'Document', d['url']?.toString() ?? '')).toList(),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _fileRow(String name, String url) {
    if (url.isEmpty) return const SizedBox.shrink();
    return Container(
      margin: const EdgeInsets.only(bottom: 6),
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(color: Colors.grey.shade50, borderRadius: BorderRadius.circular(8)),
      child: Row(
        children: [
          const Icon(Icons.insert_drive_file, size: 18, color: Colors.grey),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              name,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF2D3748)),
            ),
          ),
          TextButton.icon(
            onPressed: () async {
              final uri = Uri.tryParse(url);
              if (uri != null && await canLaunchUrl(uri)) {
                await launchUrl(uri, mode: LaunchMode.externalApplication);
              }
            },
            icon: const Icon(Icons.open_in_new, size: 16),
            label: const Text('Open'),
          )
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
            width: 140,
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


