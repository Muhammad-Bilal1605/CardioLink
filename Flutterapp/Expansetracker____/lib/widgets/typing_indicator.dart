import 'package:flutter/material.dart';

class TypingIndicator extends StatelessWidget {
  final bool isVisible;
  final String doctorImageUrl;
  final AnimationController typingController;
  final Animation<double> typingOpacity;

  const TypingIndicator({
    Key? key,
    required this.isVisible,
    required this.doctorImageUrl,
    required this.typingController,
    required this.typingOpacity,
  }) : super(key: key);

  Widget _buildTypingDot(int delay) {
    return AnimatedBuilder(
      animation: typingController,
      builder: (context, child) {
        return Transform.scale(
          scale: 0.5 + 0.5 * typingOpacity.value,
          child: Container(
            width: 8,
            height: 8,
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(typingOpacity.value),
              shape: BoxShape.circle,
            ),
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    if (!isVisible) return SizedBox.shrink();
    
    return AnimatedBuilder(
      animation: typingController,
      builder: (context, child) {
        return Opacity(
          opacity: typingController.value,
          child: Container(
            margin: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(
              children: [
                CircleAvatar(
                  radius: 16,
                  backgroundImage: NetworkImage(doctorImageUrl),
                ),
                SizedBox(width: 8),
                Container(
                  padding: EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  decoration: BoxDecoration(
                    color: Color(0xFF2C3E50),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      _buildTypingDot(0),
                      SizedBox(width: 4),
                      _buildTypingDot(200),
                      SizedBox(width: 4),
                      _buildTypingDot(400),
                    ],
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
