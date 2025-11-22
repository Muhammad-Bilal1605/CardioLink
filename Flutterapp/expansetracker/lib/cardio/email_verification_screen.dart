import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../provider/auth_provider.dart';
import 'dashboard_home.dart';

class EmailVerificationScreen extends StatefulWidget {
  final String email;

  const EmailVerificationScreen({
    super.key,
    required this.email,
  });

  @override
  State<EmailVerificationScreen> createState() => _EmailVerificationScreenState();
}

class _EmailVerificationScreenState extends State<EmailVerificationScreen> {
  final List<TextEditingController> _codeControllers = List.generate(6, (_) => TextEditingController());
  final List<FocusNode> _focusNodes = List.generate(6, (_) => FocusNode());

  @override
  void dispose() {
    for (var controller in _codeControllers) {
      controller.dispose();
    }
    for (var node in _focusNodes) {
      node.dispose();
    }
    super.dispose();
  }

  void _onCodeChanged(int index, String value) {
    if (value.length > 1) {
      // Handle paste
      final code = value.replaceAll(RegExp(r'[^0-9]'), '');
      for (int i = 0; i < 6 && i < code.length; i++) {
        _codeControllers[i].text = code[i];
      }
      if (code.length >= 6) {
        _focusNodes[5].unfocus();
        _verifyEmail();
      } else {
        _focusNodes[code.length].requestFocus();
      }
      return;
    }

    if (value.isNotEmpty && index < 5) {
      _focusNodes[index + 1].requestFocus();
    } else if (value.isEmpty && index > 0) {
      _focusNodes[index - 1].requestFocus();
    }

    // Auto-verify when all fields are filled
    if (_codeControllers.every((controller) => controller.text.isNotEmpty)) {
      _verifyEmail();
    }
  }

  Future<void> _verifyEmail() async {
    final code = _codeControllers.map((c) => c.text).join();
    
    if (code.length != 6) {
      _showSnackBar('Please enter the complete 6-digit code', Colors.red);
      return;
    }

    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    
    final success = await authProvider.verifyEmail(
      email: widget.email,
      code: code,
    );

    if (success && mounted) {
      _showSnackBar('Email verified successfully!', Colors.green);
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (context) => DashboardHome()),
      );
    } else if (mounted) {
      _showSnackBar(
        authProvider.errorMessage ?? 'Verification failed. Please try again.',
        Colors.red,
      );
    }
  }

  void _showSnackBar(String message, Color backgroundColor) {
    if (!mounted) return;

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          message,
          style: GoogleFonts.poppins(),
        ),
        backgroundColor: backgroundColor,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(10),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Stack(
          children: [
            // Background
            Positioned.fill(
              child: Container(
                decoration: const BoxDecoration(
                  image: DecorationImage(
                    image: AssetImage('assets/images/loginpage.png'),
                    fit: BoxFit.cover,
                  ),
                ),
              ),
            ),

            // Gradient overlay
            Positioned.fill(
              child: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [
                      Colors.white.withOpacity(0.85),
                      Colors.white.withOpacity(0.92),
                    ],
                  ),
                ),
              ),
            ),

            // Main content
            SingleChildScrollView(
              padding: const EdgeInsets.all(24.0),
              child: Consumer<AuthProvider>(
                builder: (context, authProvider, child) {
                  if (authProvider.errorMessage != null) {
                    WidgetsBinding.instance.addPostFrameCallback((_) {
                      _showSnackBar(
                        authProvider.errorMessage!,
                        Colors.red,
                      );
                      authProvider.clearError();
                    });
                  }

                  return Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      const SizedBox(height: 40),

                      // Back button
                      Align(
                        alignment: Alignment.centerLeft,
                        child: IconButton(
                          onPressed: () => Navigator.pop(context),
                          icon: Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: Colors.white.withOpacity(0.9),
                              borderRadius: BorderRadius.circular(12),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withOpacity(0.1),
                                  blurRadius: 8,
                                  offset: const Offset(0, 2),
                                ),
                              ],
                            ),
                            child: const Icon(
                              Icons.arrow_back_ios_new,
                              color: Color(0xFF4CAF50),
                              size: 20,
                            ),
                          ),
                        ),
                      ),

                      const SizedBox(height: 20),

                      // Icon
                      Container(
                        height: 120,
                        width: 120,
                        decoration: BoxDecoration(
                          color: const Color(0xFF4CAF50).withOpacity(0.1),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(
                          Icons.email_outlined,
                          size: 60,
                          color: Color(0xFF4CAF50),
                        ),
                      ),

                      const SizedBox(height: 32),

                      // Title
                      Text(
                        'Verify Your Email',
                        style: GoogleFonts.poppins(
                          fontSize: 32,
                          fontWeight: FontWeight.bold,
                          color: Colors.black87,
                        ),
                        textAlign: TextAlign.center,
                      ),

                      const SizedBox(height: 12),

                      // Description
                      Text(
                        'We\'ve sent a verification code to',
                        style: GoogleFonts.poppins(
                          fontSize: 14,
                          color: Colors.grey[600],
                        ),
                        textAlign: TextAlign.center,
                      ),

                      const SizedBox(height: 4),

                      Text(
                        widget.email,
                        style: GoogleFonts.poppins(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                          color: const Color(0xFF4CAF50),
                        ),
                        textAlign: TextAlign.center,
                      ),

                      const SizedBox(height: 8),

                      Text(
                        'Please enter the 6-digit code below',
                        style: GoogleFonts.poppins(
                          fontSize: 14,
                          color: Colors.grey[600],
                        ),
                        textAlign: TextAlign.center,
                      ),

                      const SizedBox(height: 40),

                      // Verification code input
                      Container(
                        padding: const EdgeInsets.all(24),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.7),
                          borderRadius: BorderRadius.circular(24),
                          border: Border.all(
                            color: Colors.white.withOpacity(0.5),
                            width: 1.5,
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.1),
                              blurRadius: 30,
                              offset: const Offset(0, 15),
                            ),
                          ],
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                          children: List.generate(6, (index) {
                            return SizedBox(
                              width: 45,
                              height: 60,
                              child: TextFormField(
                                controller: _codeControllers[index],
                                focusNode: _focusNodes[index],
                                textAlign: TextAlign.center,
                                keyboardType: TextInputType.number,
                                maxLength: 1,
                                style: GoogleFonts.poppins(
                                  fontSize: 24,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.black87,
                                ),
                                decoration: InputDecoration(
                                  counterText: '',
                                  border: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(12),
                                    borderSide: BorderSide(
                                      color: Colors.grey[300]!,
                                      width: 2,
                                    ),
                                  ),
                                  enabledBorder: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(12),
                                    borderSide: BorderSide(
                                      color: Colors.grey[300]!,
                                      width: 2,
                                    ),
                                  ),
                                  focusedBorder: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(12),
                                    borderSide: const BorderSide(
                                      color: Color(0xFF4CAF50),
                                      width: 2,
                                    ),
                                  ),
                                  filled: true,
                                  fillColor: Colors.white,
                                ),
                                onChanged: (value) => _onCodeChanged(index, value),
                              ),
                            );
                          }),
                        ),
                      ),

                      const SizedBox(height: 32),

                      // Verify button
                      SizedBox(
                        width: double.infinity,
                        height: 56,
                        child: ElevatedButton(
                          onPressed: authProvider.isLoading ? null : _verifyEmail,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF4CAF50),
                            foregroundColor: Colors.white,
                            elevation: 8,
                            shadowColor: const Color(0xFF4CAF50).withOpacity(0.4),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(30),
                            ),
                            disabledBackgroundColor: const Color(0xFF4CAF50).withOpacity(0.6),
                          ),
                          child: authProvider.isLoading
                              ? const SizedBox(
                                  width: 24,
                                  height: 24,
                                  child: CircularProgressIndicator(
                                    color: Colors.white,
                                    strokeWidth: 2,
                                  ),
                                )
                              : Text(
                                  'Verify Email',
                                  style: GoogleFonts.poppins(
                                    fontSize: 18,
                                    fontWeight: FontWeight.w600,
                                    letterSpacing: 0.5,
                                  ),
                                ),
                        ),
                      ),

                      const SizedBox(height: 24),

                      // Resend code option
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            "Didn't receive the code? ",
                            style: GoogleFonts.poppins(
                              color: Colors.grey[600],
                              fontSize: 14,
                            ),
                          ),
                          TextButton(
                            onPressed: () {
                              _showSnackBar(
                                'Please check your email inbox and spam folder',
                                Colors.orange,
                              );
                            },
                            style: TextButton.styleFrom(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 8,
                                vertical: 4,
                              ),
                            ),
                            child: Text(
                              'Resend Code',
                              style: GoogleFonts.poppins(
                                color: const Color(0xFF4CAF50),
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ],
                      ),

                      const SizedBox(height: 20),
                    ],
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}

