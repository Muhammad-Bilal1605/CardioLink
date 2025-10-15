import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class LeftRow2 extends StatelessWidget {
  final String activePage;
  final Function(String) onPageChange;

  const LeftRow2({
    Key? key,
    required this.activePage,
    required this.onPageChange,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final pages = [
      {'id': 'overview', 'title': 'Overview', 'icon': Icons.dashboard},
      {'id': 'visits', 'title': 'Visits', 'icon': Icons.medical_services},
      {'id': 'labs', 'title': 'Labs', 'icon': Icons.science},
      {'id': 'imaging', 'title': 'Imaging', 'icon': Icons.camera_alt},
      {'id': 'medications', 'title': 'Medications', 'icon': Icons.medication},
      {'id': 'vitals', 'title': 'Vitals', 'icon': Icons.monitor_heart},
      {'id': 'hospitalizations', 'title': 'Hospitalizations', 'icon': Icons.local_hospital},
      {'id': 'procedures', 'title': 'Procedures', 'icon': Icons.medical_information},
    ];

    return Container(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Navigation',
            style: GoogleFonts.inter(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: const Color(0xFF2D3748),
            ),
          ),
          const SizedBox(height: 12),
          Expanded(
            child: ListView.builder(
              itemCount: pages.length,
              itemBuilder: (context, index) {
                final page = pages[index];
                final isActive = activePage == page['id'];
                
                return Container(
                  margin: const EdgeInsets.only(bottom: 8),
                  child: Material(
                    color: isActive 
                        ? const Color(0xFF6B8E3D).withOpacity(0.1)
                        : Colors.transparent,
                    borderRadius: BorderRadius.circular(8),
                    child: InkWell(
                      borderRadius: BorderRadius.circular(8),
                      onTap: () => onPageChange(page['id'] as String),
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        child: Row(
                          children: [
                            Icon(
                              page['icon'] as IconData,
                              size: 20,
                              color: isActive 
                                  ? const Color(0xFF6B8E3D)
                                  : Colors.grey[600],
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Text(
                                page['title'] as String,
                                style: GoogleFonts.inter(
                                  fontSize: 14,
                                  fontWeight: isActive ? FontWeight.w600 : FontWeight.w500,
                                  color: isActive 
                                      ? const Color(0xFF6B8E3D)
                                      : const Color(0xFF2D3748),
                                ),
                              ),
                            ),
                            if (isActive)
                              Icon(
                                Icons.arrow_forward_ios,
                                size: 12,
                                color: const Color(0xFF6B8E3D),
                              ),
                          ],
                        ),
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
