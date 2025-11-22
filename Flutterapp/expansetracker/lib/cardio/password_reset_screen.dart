import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../provider/auth_provider.dart';
import 'login_screen.dart';

class PasswordResetScreen extends StatefulWidget {
  final String email;

  const PasswordResetScreen({
    super.key,
    required this.email,
  });

  @override
  State<PasswordResetScreen> createState() => _PasswordResetScreenState();
}

class _PasswordResetScreenState extends State<PasswordResetScreen> {
  final _formKey = GlobalKey<FormState>();
  final List<TextEditingController> _codeControllers = List.generate(6, (_) => TextEditingController());
  final List<FocusNode> _focusNodes = List.generate(6, (_) => FocusNode());
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  bool _isPasswordVisible = false;
  bool _isConfirmPasswordVisible = false;
  bool _codeVerified = false;
  String? _verifiedCode;

  @override
  void dispose() {
    for (var controller in _codeControllers) {
      controller.dispose();
    }
    for (var node in _focusNodes) {
      node.dispose();
    }
    _passwordController.dispose();
    _confirmPasswordController.dispose();
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
        _verifyCode();
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
      _verifyCode();
    }
  }

  Future<void> _verifyCode() async {
    final code = _codeControllers.map((c) => c.text).join();
    
    if (code.length != 6) {
      _showSnackBar('Please enter the complete 6-digit code', Colors.red);
      return;
    }

    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    
    final success = await authProvider.verifyPasswordResetCode(
      email: widget.email,
      code: code,
    );

    if (success && mounted) {
      setState(() {
        _codeVerified = true;
        _verifiedCode = code;
      });
      _showSnackBar('Code verified successfully!', Colors.green);
    } else if (mounted) {
      _showSnackBar(
        authProvider.errorMessage ?? 'Invalid or expired code. Please try again.',
        Colors.red,
      );
    }
  }

  Future<void> _resetPassword() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    if (!_codeVerified || _verifiedCode == null) {
      _showSnackBar('Please verify the code first', Colors.orange);
      return;
    }

    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    
    final success = await authProvider.resetPassword(
      email: widget.email,
      code: _verifiedCode!,
      password: _passwordController.text,
    );

    if (success && mounted) {
      _showSnackBar('Password reset successfully!', Colors.green);
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (context) => const LoginScreen()),
      );
    } else if (mounted) {
      _showSnackBar(
        authProvider.errorMessage ?? 'Password reset failed. Please try again.',
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
                          Icons.lock_reset_outlined,
                          size: 60,
                          color: Color(0xFF4CAF50),
                        ),
                      ),

                      const SizedBox(height: 32),

                      // Title
                      Text(
                        _codeVerified ? 'Set New Password' : 'Enter Verification Code',
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
                        _codeVerified
                            ? 'Please enter your new password'
                            : 'We\'ve sent a verification code to',
                        style: GoogleFonts.poppins(
                          fontSize: 14,
                          color: Colors.grey[600],
                        ),
                        textAlign: TextAlign.center,
                      ),

                      if (!_codeVerified) ...[
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
                      ],

                      const SizedBox(height: 40),

                      if (!_codeVerified) ...[
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
                            onPressed: authProvider.isLoading ? null : _verifyCode,
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
                                    'Verify Code',
                                    style: GoogleFonts.poppins(
                                      fontSize: 18,
                                      fontWeight: FontWeight.w600,
                                      letterSpacing: 0.5,
                                    ),
                                  ),
                          ),
                        ),
                      ] else ...[
                        // Password reset form
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
                          child: Form(
                            key: _formKey,
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.stretch,
                              children: [
                                // New Password
                                Text(
                                  'New Password',
                                  style: GoogleFonts.poppins(
                                    fontSize: 14,
                                    color: Colors.grey[700],
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                                const SizedBox(height: 8),
                                TextFormField(
                                  controller: _passwordController,
                                  obscureText: !_isPasswordVisible,
                                  style: GoogleFonts.poppins(fontSize: 15),
                                  decoration: InputDecoration(
                                    hintText: 'Enter new password',
                                    hintStyle: GoogleFonts.poppins(
                                      color: Colors.grey[400],
                                      fontSize: 15,
                                    ),
                                    filled: true,
                                    fillColor: Colors.white.withOpacity(0.8),
                                    suffixIcon: IconButton(
                                      icon: Icon(
                                        _isPasswordVisible
                                            ? Icons.visibility_off_outlined
                                            : Icons.visibility_outlined,
                                        color: Colors.grey[600],
                                        size: 22,
                                      ),
                                      onPressed: () {
                                        setState(() {
                                          _isPasswordVisible = !_isPasswordVisible;
                                        });
                                      },
                                    ),
                                    border: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(12),
                                      borderSide: BorderSide.none,
                                    ),
                                    enabledBorder: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(12),
                                      borderSide: BorderSide(
                                        color: Colors.grey[200]!,
                                      ),
                                    ),
                                    focusedBorder: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(12),
                                      borderSide: const BorderSide(
                                        color: Color(0xFF4CAF50),
                                        width: 2,
                                      ),
                                    ),
                                    contentPadding: const EdgeInsets.symmetric(
                                      horizontal: 16,
                                      vertical: 16,
                                    ),
                                  ),
                                  validator: (value) {
                                    if (value == null || value.isEmpty) {
                                      return 'Please enter a password';
                                    }
                                    if (value.length < 6) {
                                      return 'Password must be at least 6 characters';
                                    }
                                    return null;
                                  },
                                ),

                                const SizedBox(height: 20),

                                // Confirm Password
                                Text(
                                  'Confirm Password',
                                  style: GoogleFonts.poppins(
                                    fontSize: 14,
                                    color: Colors.grey[700],
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                                const SizedBox(height: 8),
                                TextFormField(
                                  controller: _confirmPasswordController,
                                  obscureText: !_isConfirmPasswordVisible,
                                  style: GoogleFonts.poppins(fontSize: 15),
                                  decoration: InputDecoration(
                                    hintText: 'Confirm new password',
                                    hintStyle: GoogleFonts.poppins(
                                      color: Colors.grey[400],
                                      fontSize: 15,
                                    ),
                                    filled: true,
                                    fillColor: Colors.white.withOpacity(0.8),
                                    suffixIcon: IconButton(
                                      icon: Icon(
                                        _isConfirmPasswordVisible
                                            ? Icons.visibility_off_outlined
                                            : Icons.visibility_outlined,
                                        color: Colors.grey[600],
                                        size: 22,
                                      ),
                                      onPressed: () {
                                        setState(() {
                                          _isConfirmPasswordVisible = !_isConfirmPasswordVisible;
                                        });
                                      },
                                    ),
                                    border: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(12),
                                      borderSide: BorderSide.none,
                                    ),
                                    enabledBorder: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(12),
                                      borderSide: BorderSide(
                                        color: Colors.grey[200]!,
                                      ),
                                    ),
                                    focusedBorder: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(12),
                                      borderSide: const BorderSide(
                                        color: Color(0xFF4CAF50),
                                        width: 2,
                                      ),
                                    ),
                                    contentPadding: const EdgeInsets.symmetric(
                                      horizontal: 16,
                                      vertical: 16,
                                    ),
                                  ),
                                  validator: (value) {
                                    if (value == null || value.isEmpty) {
                                      return 'Please confirm your password';
                                    }
                                    if (value != _passwordController.text) {
                                      return 'Passwords do not match';
                                    }
                                    return null;
                                  },
                                ),

                                const SizedBox(height: 32),

                                // Reset Password button
                                SizedBox(
                                  width: double.infinity,
                                  height: 56,
                                  child: ElevatedButton(
                                    onPressed: authProvider.isLoading ? null : _resetPassword,
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
                                            'Reset Password',
                                            style: GoogleFonts.poppins(
                                              fontSize: 18,
                                              fontWeight: FontWeight.w600,
                                              letterSpacing: 0.5,
                                            ),
                                          ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],

                      const SizedBox(height: 24),

                      // Resend code option (only if code not verified)
                      if (!_codeVerified)
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

