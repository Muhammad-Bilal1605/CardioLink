import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'login_screen.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  late Animation<double> _fadeAnimation;
  late Animation<double> _scaleAnimation;
  late Animation<double> _pulseAnimation;
  late Animation<Color?> _colorAnimation;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 3),
    );

    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _animationController,
        curve: const Interval(0.0, 0.5, curve: Curves.easeInOut),
      ),
    );

    _scaleAnimation = Tween<double>(begin: 0.8, end: 1.0).animate(
      CurvedAnimation(
        parent: _animationController,
        curve: const Interval(0.3, 1.0, curve: Curves.elasticOut),
      ),
    );

    _pulseAnimation = Tween<double>(begin: 1.0, end: 1.1).animate(
      CurvedAnimation(
        parent: _animationController,
        curve: const Interval(0.5, 1.0, curve: Curves.easeInOut),
      ),
    );

    _colorAnimation = ColorTween(
      begin: const Color(0xFF3366FF),
      end: const Color(0xFFFF4757),
    ).animate(
      CurvedAnimation(
        parent: _animationController,
        curve: Curves.easeInOut,
      ),
    );

    _animationController.forward();

    // Navigate to login screen after 4 seconds
    Future.delayed(const Duration(seconds: 4), () {
      if (mounted) {
        Navigator.pushReplacement(
          context,
          PageRouteBuilder(
            pageBuilder: (context, animation, secondaryAnimation) =>
            const LoginScreen(),
            transitionsBuilder: (context, animation, secondaryAnimation, child) {
              var curve = Curves.easeInOutQuart;
              var curvedAnimation = CurvedAnimation(
                parent: animation,
                curve: curve,
              );

              return FadeTransition(
                opacity: curvedAnimation,
                child: ScaleTransition(
                  scale: Tween<double>(begin: 0.95, end: 1.0).animate(curvedAnimation),
                  child: child,
                ),
              );
            },
            transitionDuration: const Duration(milliseconds: 1000),
          ),
        );
      }
    });
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: AnimatedBuilder(
        animation: _animationController,
        builder: (context, child) {
          return Container(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  Colors.black,
                  Color(0xFF0F0C29),
                  Colors.black,
                ],
                stops: [0.0, 0.5, 1.0],
              ),
            ),
            child: Stack(
              children: [
                // Background network image with dark overlay
                Positioned.fill(
                  child: ColorFiltered(
                    colorFilter: ColorFilter.mode(
                      Colors.black.withOpacity(0.7),
                      BlendMode.darken,
                    ),
                    child: Image.network(
                      'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&h=1600&fit=crop',
                      fit: BoxFit.cover,
                      errorBuilder: (context, error, stackTrace) => Container(),
                    ),
                  ),
                ),

                // Pulsing ECG line animation
                Positioned(
                  top: MediaQuery.of(context).size.height * 0.3,
                  left: 0,
                  right: 0,
                  child: AnimatedBuilder(
                    animation: _pulseAnimation,
                    builder: (context, child) {
                      return Transform.scale(
                        scale: _pulseAnimation.value,
                        child: Image.network(
                          'https://i.imgur.com/Jg8Z3zN.png', // ECG line image
                          height: 40,
                          color: Colors.white.withOpacity(0.8),
                          errorBuilder: (context, error, stackTrace) => Container(
                            height: 40,
                            child: CustomPaint(
                              painter: ECGLinePainter(),
                            ),
                          ),
                        ),
                      );
                    },
                  ),
                ),

                Center(
                  child: FadeTransition(
                    opacity: _fadeAnimation,
                    child: ScaleTransition(
                      scale: _scaleAnimation,
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          // Animated heart icon
                          AnimatedBuilder(
                            animation: _colorAnimation,
                            builder: (context, child) {
                              return Container(
                                width: 150,
                                height: 150,
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  shape: BoxShape.circle,
                                  boxShadow: [
                                    BoxShadow(
                                      color: _colorAnimation.value!.withOpacity(0.5),
                                      blurRadius: 30,
                                      spreadRadius: 5,
                                    ),
                                  ],
                                ),
                                child: Center(
                                  child: Icon(
                                    Icons.favorite,
                                    size: 70,
                                    color: _colorAnimation.value,
                                  ),
                                ),
                              );
                            },
                          ),
                          const SizedBox(height: 30),

                          // CardioLink logo text
                          Text(
                            'CardioLink',
                            style: GoogleFonts.poppins(
                              fontSize: 36,
                              fontWeight: FontWeight.w700,
                              color: Colors.white,
                              letterSpacing: 1.5,
                              shadows: [
                                Shadow(
                                  blurRadius: 10,
                                  color: Colors.black.withOpacity(0.5),
                                  offset: const Offset(0, 2),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 10),

                          // Tagline
                          Text(
                            'Advanced Heart Care',
                            style: GoogleFonts.poppins(
                              fontSize: 16,
                              color: Colors.white.withOpacity(0.9),
                              letterSpacing: 1.2,
                            ),
                          ),
                          const SizedBox(height: 50),

                          // Loading indicator with custom color
                          SizedBox(
                            width: 30,
                            height: 30,
                            child: CircularProgressIndicator(
                              valueColor: AlwaysStoppedAnimation<Color>(
                                  _colorAnimation.value ?? Colors.white),
                              strokeWidth: 3,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}

// Custom ECG Line Painter as fallback
class ECGLinePainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.white.withOpacity(0.8)
      ..strokeWidth = 2
      ..style = PaintingStyle.stroke;

    final path = Path();
    final width = size.width;
    final height = size.height;
    final midY = height / 2;

    // Draw ECG-like pattern
    path.moveTo(0, midY);
    path.lineTo(width * 0.1, midY);
    path.lineTo(width * 0.15, midY - height * 0.3);
    path.lineTo(width * 0.2, midY + height * 0.4);
    path.lineTo(width * 0.25, midY - height * 0.2);
    path.lineTo(width * 0.3, midY);
    path.lineTo(width * 0.4, midY);
    path.lineTo(width * 0.45, midY + height * 0.1);
    path.lineTo(width * 0.5, midY - height * 0.1);
    path.lineTo(width * 0.55, midY);
    path.lineTo(width, midY);

    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(CustomPainter oldDelegate) => false;
}