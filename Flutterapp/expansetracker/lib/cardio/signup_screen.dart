import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../provider/auth_provider.dart';
import 'login_screen.dart';
import 'dashboard_home.dart';

class SignupScreen extends StatefulWidget {
  const SignupScreen({super.key});

  @override
  State<SignupScreen> createState() => _SignupScreenState();
}

class _SignupScreenState extends State<SignupScreen> with SingleTickerProviderStateMixin {
  final _formKey = GlobalKey<FormState>();
  final _fullNameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  final _ageController = TextEditingController();
  final _emergencyContactController = TextEditingController();
  final _companyNameController = TextEditingController();
  final _licenseNumberController = TextEditingController();
  final _serviceAreaController = TextEditingController();

  bool _isPasswordVisible = false;
  bool _isConfirmPasswordVisible = false;
  bool _agreeToTerms = false;
  String _selectedGender = 'Male';
  String _selectedUserType = 'Patient';
  String? _selectedBloodType;
  List<String> _allergies = [];
  final _allergyController = TextEditingController();
  
  // Animation controllers
  late AnimationController _animationController;
  late Animation<double> _scaleAnimation;

  final List<String> _bloodTypes = [
    'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'
  ];
  final List<String> _genderOptions = ['Male', 'Female', 'Other'];
  final List<String> _userTypeOptions = ['Patient', 'Ambulance Employer'];

  @override
  void initState() {
    super.initState();
    
    // Initialize animation controller
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2000),
    );

    _scaleAnimation = Tween<double>(
      begin: 1.1,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _animationController,
      curve: Curves.easeInOut,
    ));

    _animationController.forward();
  }

  @override
  void dispose() {
    _fullNameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    _ageController.dispose();
    _emergencyContactController.dispose();
    _companyNameController.dispose();
    _licenseNumberController.dispose();
    _serviceAreaController.dispose();
    _allergyController.dispose();
    _animationController.dispose();
    super.dispose();
  }

  Future<void> _handleSignup() async {
    try {
      print('Signup button pressed for user type: $_selectedUserType');

      if (!_formKey.currentState!.validate()) {
        print('Form validation failed');
        return;
      }

      if (!_agreeToTerms) {
        print('Terms not agreed');
        _showSnackBar(
          'Please agree to the terms and conditions',
          Colors.red,
        );
        return;
      }

      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      print('AuthProvider obtained: ${authProvider != null}');

      int? age;
      if (_ageController.text.isNotEmpty) {
        age = int.tryParse(_ageController.text);
        if (age == null || age <= 0 || age > 120) {
          _showSnackBar(
            'Please enter a valid age (1-120)',
            Colors.red,
          );
          return;
        }
        print('Age parsed: $age');
      }

      DateTime? dateOfBirth;
      if (age != null) {
        final now = DateTime.now();
        dateOfBirth = DateTime(now.year - age, now.month, now.day);
        print('Date of birth calculated: $dateOfBirth');
      }

      print('Calling signup method for $_selectedUserType...');

      bool success = false;

      if (_selectedUserType == 'Patient') {
        success = await authProvider.signup(
          email: _emailController.text.trim(),
          password: _passwordController.text,
          confirmPassword: _confirmPasswordController.text,
          name: _fullNameController.text.trim(),
          phoneNumber: _phoneController.text.trim().isNotEmpty
              ? _phoneController.text.trim()
              : null,
          gender: _selectedGender,
          age: age,
          dateOfBirth: dateOfBirth,
          bloodType: _selectedBloodType,
          allergies: _allergies.isNotEmpty ? _allergies : null,
          emergencyContact: _emergencyContactController.text.trim().isNotEmpty
              ? _emergencyContactController.text.trim()
              : null,
        );
      } else if (_selectedUserType == 'Ambulance Employer') {
        success = await authProvider.ambulanceEmployerSignup(
          email: _emailController.text.trim(),
          password: _passwordController.text,
          name: _fullNameController.text.trim(),
          phoneNumber: _phoneController.text.trim().isNotEmpty
              ? _phoneController.text.trim()
              : null,
          gender: _selectedGender,
          age: age,
          dateOfBirth: dateOfBirth,
          companyName: _companyNameController.text.trim().isNotEmpty
              ? _companyNameController.text.trim()
              : null,
          licenseNumber: _licenseNumberController.text.trim().isNotEmpty
              ? _licenseNumberController.text.trim()
              : null,
          serviceArea: _serviceAreaController.text.trim().isNotEmpty
              ? _serviceAreaController.text.trim()
              : null,
          emergencyContact: _emergencyContactController.text.trim().isNotEmpty
              ? _emergencyContactController.text.trim()
              : null,
        );
      }

      print('Signup result: $success');

      if (success && mounted) {
        print('Navigating to dashboard...');
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (context) => DashboardHome()),
        );
      } else {
        print('Signup failed or widget not mounted');
      }
    } catch (e) {
      print('Error in _handleSignup: $e');
      _showSnackBar(
        'An error occurred during signup: ${e.toString()}',
        Colors.red,
      );
    }
  }

  void _addAllergy() {
    final allergy = _allergyController.text.trim();
    if (allergy.isNotEmpty && !_allergies.contains(allergy)) {
      setState(() {
        _allergies.add(allergy);
        _allergyController.clear();
      });
    }
  }

  void _removeAllergy(int index) {
    setState(() {
      _allergies.removeAt(index);
    });
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

  Widget _buildInputField({
    required TextEditingController controller,
    required String label,
    TextInputType? keyboardType,
    bool obscureText = false,
    bool isPassword = false,
    VoidCallback? toggleVisibility,
    String? Function(String?)? validator,
    int maxLines = 1,
    String? helperText,
    IconData? prefixIcon,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: GoogleFonts.poppins(
            fontSize: 15,
            color: const Color(0xFF4A5568),
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 10),
        TextFormField(
          controller: controller,
          keyboardType: keyboardType,
          obscureText: obscureText,
          maxLines: maxLines,
          style: GoogleFonts.poppins(
            fontSize: 16,
            color: const Color(0xFF2D3748),
            fontWeight: FontWeight.w500,
          ),
          decoration: InputDecoration(
            hintText: helperText,
            hintStyle: GoogleFonts.poppins(
              color: const Color(0xFFA0AEC0),
              fontSize: 14,
              fontWeight: FontWeight.w400,
            ),
            filled: true,
            fillColor: Colors.white.withOpacity(0.9),
            suffixIcon: isPassword
                ? IconButton(
                    icon: Icon(
                      obscureText ? Icons.visibility_rounded : Icons.visibility_off_rounded,
                      color: const Color(0xFF718096),
                      size: 22,
                    ),
                    onPressed: toggleVisibility,
                  )
                : null,
            prefixIcon: prefixIcon != null
                ? Icon(
                    prefixIcon,
                    color: const Color(0xFF667eea),
                    size: 22,
                  )
                : null,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(16),
              borderSide: BorderSide.none,
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(16),
              borderSide: BorderSide(
                color: const Color(0xFFE2E8F0),
                width: 1.5,
              ),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(16),
              borderSide: const BorderSide(
                color: Color(0xFF667eea),
                width: 2.5,
              ),
            ),
            contentPadding: const EdgeInsets.symmetric(
              horizontal: 20,
              vertical: 18,
            ),
            errorStyle: GoogleFonts.poppins(
              color: Colors.red,
              fontSize: 12,
            ),
          ),
          validator: validator,
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    final isSmallScreen = size.width < 380;

    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: Container(
          margin: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.9),
            borderRadius: BorderRadius.circular(12),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.1),
                blurRadius: 10,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: IconButton(
            icon: const Icon(
              Icons.arrow_back_ios_rounded,
              color: Color(0xFF4A5568),
              size: 20,
            ),
            onPressed: () => Navigator.pop(context),
          ),
        ),
        title: Text(
          'Create Account',
          style: GoogleFonts.poppins(
            color: const Color(0xFF2D3748),
            fontWeight: FontWeight.w700,
            fontSize: 20,
          ),
        ),
        centerTitle: true,
      ),
      body: SafeArea(
        child: Stack(
          children: [
            // FIXED: Animated Image Background with perfect scaling
            Positioned.fill(
              child: AnimatedBuilder(
                animation: _animationController,
                builder: (context, child) {
                  return Transform.scale(
                    scale: _scaleAnimation.value,
                    child: Container(
                      width: MediaQuery.of(context).size.width,
                      height: MediaQuery.of(context).size.height,
                      decoration: BoxDecoration(
                        image: DecorationImage(
                          image: AssetImage('assets/images/signupscreen.png'),
                          fit: BoxFit.cover,
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),

            // Clean glass effect overlay
            Positioned.fill(
              child: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [
                      Colors.white.withOpacity(0.15),
                      Colors.white.withOpacity(0.25),
                      Colors.white.withOpacity(0.35),
                      Colors.white.withOpacity(0.45),
                    ],
                    stops: const [0.0, 0.3, 0.7, 1.0],
                  ),
                ),
              ),
            ),

            // Main content
            SingleChildScrollView(
              padding: EdgeInsets.symmetric(
                horizontal: isSmallScreen ? 20.0 : 24.0,
                vertical: 16.0,
              ),
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
                      // Enhanced Illustration with glass effect
                      Container(
                        height: isSmallScreen ? 140 : 160,
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(24),
                          gradient: LinearGradient(
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                            colors: [
                              Colors.white.withOpacity(0.4),
                              Colors.white.withOpacity(0.2),
                            ],
                          ),
                          border: Border.all(
                            color: Colors.white.withOpacity(0.3),
                            width: 1.5,
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.1),
                              blurRadius: 25,
                              offset: const Offset(0, 15),
                            ),
                          ],
                        ),
                        child: Center(
                          child: Image.network(
                            'https://cdni.iconscout.com/illustration/premium/thumb/groceries-shopping-illustration-download-in-svg-png-gif-file-formats--grocery-store-supermarket-pack-e-commerce-shopping-illustrations-6430554.png?f=webp',
                            height: isSmallScreen ? 120 : 140,
                            fit: BoxFit.contain,
                            errorBuilder: (context, error, stackTrace) =>
                                const Icon(
                              Icons.shopping_basket_rounded,
                              size: 70,
                              color: Color(0xFF667eea),
                            ),
                          ),
                        ),
                      ),

                      SizedBox(height: isSmallScreen ? 24 : 32),

                      // Clean Header - No background color
                      Text(
                        'Join Us Today',
                        style: GoogleFonts.poppins(
                          fontSize: isSmallScreen ? 26 : 32,
                          fontWeight: FontWeight.w700,
                          color: const Color(0xFF2D3748),
                          height: 1.2,
                        ),
                        textAlign: TextAlign.center,
                      ),
                      SizedBox(height: isSmallScreen ? 8 : 12),
                      Text(
                        'Create your account to get started',
                        style: GoogleFonts.poppins(
                          fontSize: isSmallScreen ? 14 : 16,
                          color: const Color(0xFF718096),
                          height: 1.4,
                          fontWeight: FontWeight.w500,
                        ),
                        textAlign: TextAlign.center,
                      ),

                      SizedBox(height: isSmallScreen ? 24 : 32),

                      // Enhanced User Type Selection with glass effect
                      Container(
                        padding: const EdgeInsets.all(4),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.8),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(
                            color: Colors.white.withOpacity(0.6),
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.08),
                              blurRadius: 20,
                              offset: const Offset(0, 10),
                            ),
                          ],
                        ),
                        child: Row(
                          children: _userTypeOptions.map((type) {
                            final isSelected = _selectedUserType == type;
                            return Expanded(
                              child: GestureDetector(
                                onTap: () {
                                  setState(() {
                                    _selectedUserType = type;
                                    _allergies.clear();
                                    _selectedBloodType = null;
                                    _companyNameController.clear();
                                    _licenseNumberController.clear();
                                    _serviceAreaController.clear();
                                  });
                                },
                                child: Container(
                                  padding: const EdgeInsets.symmetric(
                                    vertical: 16,
                                    horizontal: 12,
                                  ),
                                  decoration: BoxDecoration(
                                    color: isSelected
                                        ? const Color(0xFF667eea)
                                        : Colors.transparent,
                                    borderRadius: BorderRadius.circular(16),
                                  ),
                                  child: Column(
                                    children: [
                                      Icon(
                                        type == 'Patient'
                                            ? Icons.person_rounded
                                            : Icons.local_shipping_rounded,
                                        color: isSelected
                                            ? Colors.white
                                            : const Color(0xFF718096),
                                        size: 20,
                                      ),
                                      const SizedBox(height: 6),
                                      Text(
                                        type,
                                        style: GoogleFonts.poppins(
                                          fontSize: 13,
                                          fontWeight: FontWeight.w600,
                                          color: isSelected
                                              ? Colors.white
                                              : const Color(0xFF718096),
                                        ),
                                        textAlign: TextAlign.center,
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            );
                          }).toList(),
                        ),
                      ),

                      SizedBox(height: isSmallScreen ? 24 : 32),

                      // Enhanced Signup Form with professional glass effect
                      Container(
                        padding: EdgeInsets.all(isSmallScreen ? 20 : 24),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.85),
                          borderRadius: BorderRadius.circular(28),
                          border: Border.all(
                            color: Colors.white.withOpacity(0.6),
                            width: 1.5,
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.12),
                              blurRadius: 40,
                              offset: const Offset(0, 20),
                            ),
                          ],
                        ),
                        child: Form(
                          key: _formKey,
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              // Full Name
                              _buildInputField(
                                controller: _fullNameController,
                                label: 'Full Name',
                                keyboardType: TextInputType.name,
                                helperText: 'John Doe',
                                prefixIcon: Icons.person_rounded,
                                validator: (value) {
                                  if (value == null || value.trim().isEmpty) {
                                    return 'Please enter your full name';
                                  }
                                  if (value.trim().length < 2) {
                                    return 'Name must be at least 2 characters';
                                  }
                                  if (!RegExp(r'^[a-zA-Z\s]+')
                                      .hasMatch(value.trim())) {
                                    return 'Name can only contain letters and spaces';
                                  }
                                  return null;
                                },
                              ),

                              const SizedBox(height: 18),

                              // Email
                              _buildInputField(
                                controller: _emailController,
                                label: 'Email Address',
                                keyboardType: TextInputType.emailAddress,
                                helperText: 'your@email.com',
                                prefixIcon: Icons.email_rounded,
                                validator: (value) {
                                  if (value == null || value.trim().isEmpty) {
                                    return 'Please enter your email';
                                  }
                                  if (!RegExp(r'^[\w\.-]+@([\w-]+\.)+[\w-]{2,4}$').hasMatch(value.trim())) {
                                    return 'Please enter a valid email address';
                                  }
                                  return null;
                                },
                              ),

                              const SizedBox(height: 18),

                              // Phone Number
                              _buildInputField(
                                controller: _phoneController,
                                label: 'Phone Number (Optional)',
                                keyboardType: TextInputType.phone,
                                helperText: '+1234567890',
                                prefixIcon: Icons.phone_rounded,
                                validator: (value) {
                                  if (value != null && value.isNotEmpty) {
                                    if (value.length < 10) {
                                      return 'Please enter a valid phone number';
                                    }
                                    if (!RegExp(r'^[\d\+\-\(\)\s]+')
                                        .hasMatch(value)) {
                                      return 'Please enter a valid phone number';
                                    }
                                  }
                                  return null;
                                },
                              ),

                              const SizedBox(height: 18),

                              // Age and Gender Row - Fixed overflow
                              Row(
                                children: [
                                  Expanded(
                                    child: _buildInputField(
                                      controller: _ageController,
                                      label: 'Age',
                                      keyboardType: TextInputType.number,
                                      helperText: '25',
                                      prefixIcon: Icons.cake_rounded,
                                      validator: (value) {
                                        if (value == null || value.trim().isEmpty) {
                                          return 'Please enter your age';
                                        }
                                        final age = int.tryParse(value.trim());
                                        if (age == null || age < 1 || age > 120) {
                                          return 'Please enter a valid age (1-120)';
                                        }
                                        return null;
                                      },
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          'Gender',
                                          style: GoogleFonts.poppins(
                                            fontSize: 15,
                                            color: const Color(0xFF4A5568),
                                            fontWeight: FontWeight.w600,
                                          ),
                                        ),
                                        const SizedBox(height: 10),
                                        Container(
                                          decoration: BoxDecoration(
                                            color: Colors.white.withOpacity(0.9),
                                            borderRadius: BorderRadius.circular(16),
                                            border: Border.all(
                                              color: const Color(0xFFE2E8F0),
                                              width: 1.5,
                                            ),
                                          ),
                                          child: DropdownButtonFormField<String>(
                                            value: _selectedGender,
                                            isExpanded: true,
                                            decoration: InputDecoration(
                                              border: InputBorder.none,
                                              contentPadding: const EdgeInsets.symmetric(
                                                horizontal: 12,
                                                vertical: 16,
                                              ),
                                              prefixIcon: Icon(
                                                Icons.transgender_rounded,
                                                color: const Color(0xFF667eea),
                                                size: 22,
                                              ),
                                            ),
                                            items: _genderOptions.map((gender) {
                                              return DropdownMenuItem(
                                                value: gender,
                                                child: Text(
                                                  gender,
                                                  style: GoogleFonts.poppins(
                                                    fontSize: 16,
                                                    fontWeight: FontWeight.w500,
                                                  ),
                                                ),
                                              );
                                            }).toList(),
                                            onChanged: (value) {
                                              setState(() {
                                                _selectedGender = value!;
                                              });
                                            },
                                            style: GoogleFonts.poppins(
                                              fontSize: 16,
                                              color: const Color(0xFF2D3748),
                                              fontWeight: FontWeight.w500,
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),

                              // Conditional Fields based on User Type
                              if (_selectedUserType == 'Patient') ...[
                                const SizedBox(height: 18),

                                // Blood Type Dropdown
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      'Blood Type (Optional)',
                                      style: GoogleFonts.poppins(
                                        fontSize: 15,
                                        color: const Color(0xFF4A5568),
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                    const SizedBox(height: 10),
                                    Container(
                                      decoration: BoxDecoration(
                                        color: Colors.white.withOpacity(0.9),
                                        borderRadius: BorderRadius.circular(16),
                                        border: Border.all(
                                          color: const Color(0xFFE2E8F0),
                                          width: 1.5,
                                        ),
                                      ),
                                      child: DropdownButtonFormField<String>(
                                        value: _selectedBloodType,
                                        decoration: InputDecoration(
                                          hintText: 'Select Blood Type',
                                          hintStyle: GoogleFonts.poppins(
                                            color: const Color(0xFFA0AEC0),
                                            fontSize: 16,
                                          ),
                                          border: InputBorder.none,
                                          contentPadding: const EdgeInsets.symmetric(
                                            horizontal: 16,
                                            vertical: 16,
                                          ),
                                          prefixIcon: Icon(
                                            Icons.bloodtype_rounded,
                                            color: const Color(0xFF667eea),
                                            size: 22,
                                          ),
                                        ),
                                        items: [
                                          DropdownMenuItem<String>(
                                            value: null,
                                            child: Text(
                                              'Select Blood Type',
                                              style: GoogleFonts.poppins(
                                                color: const Color(0xFFA0AEC0),
                                              ),
                                            ),
                                          ),
                                          ..._bloodTypes.map((bloodType) {
                                            return DropdownMenuItem(
                                              value: bloodType,
                                              child: Text(
                                                bloodType,
                                                style: GoogleFonts.poppins(),
                                              ),
                                            );
                                          }).toList(),
                                        ],
                                        onChanged: (value) {
                                          setState(() {
                                            _selectedBloodType = value;
                                          });
                                        },
                                      ),
                                    ),
                                  ],
                                ),

                                const SizedBox(height: 18),

                                // Allergies Section
                                Text(
                                  'Allergies (Optional)',
                                  style: GoogleFonts.poppins(
                                    fontSize: 15,
                                    color: const Color(0xFF4A5568),
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                                const SizedBox(height: 10),

                                // Add Allergy Field
                                Row(
                                  children: [
                                    Expanded(
                                      child: TextFormField(
                                        controller: _allergyController,
                                        style: GoogleFonts.poppins(
                                          fontSize: 16,
                                          color: const Color(0xFF2D3748),
                                          fontWeight: FontWeight.w500,
                                        ),
                                        decoration: InputDecoration(
                                          hintText: 'Add an allergy',
                                          hintStyle: GoogleFonts.poppins(
                                            color: const Color(0xFFA0AEC0),
                                            fontSize: 14,
                                          ),
                                          filled: true,
                                          fillColor: Colors.white.withOpacity(0.9),
                                          border: OutlineInputBorder(
                                            borderRadius: BorderRadius.circular(16),
                                            borderSide: BorderSide.none,
                                          ),
                                          enabledBorder: OutlineInputBorder(
                                            borderRadius: BorderRadius.circular(16),
                                            borderSide: BorderSide(
                                              color: const Color(0xFFE2E8F0),
                                              width: 1.5,
                                            ),
                                          ),
                                          focusedBorder: OutlineInputBorder(
                                            borderRadius: BorderRadius.circular(16),
                                            borderSide: const BorderSide(
                                              color: Color(0xFF667eea),
                                              width: 2.5,
                                            ),
                                          ),
                                          contentPadding: const EdgeInsets.symmetric(
                                            horizontal: 20,
                                            vertical: 16,
                                          ),
                                          prefixIcon: Icon(
                                            Icons.health_and_safety_rounded,
                                            color: const Color(0xFF667eea),
                                            size: 22,
                                          ),
                                        ),
                                      ),
                                    ),
                                    const SizedBox(width: 12),
                                    Container(
                                      height: 56,
                                      width: 56,
                                      decoration: BoxDecoration(
                                        gradient: const LinearGradient(
                                          colors: [
                                            Color(0xFF667eea),
                                            Color(0xFF764ba2),
                                          ],
                                        ),
                                        borderRadius: BorderRadius.circular(16),
                                        boxShadow: [
                                          BoxShadow(
                                            color: const Color(0xFF667eea).withOpacity(0.3),
                                            blurRadius: 10,
                                            offset: const Offset(0, 5),
                                          ),
                                        ],
                                      ),
                                      child: IconButton(
                                        onPressed: _addAllergy,
                                        icon: const Icon(
                                          Icons.add_rounded,
                                          color: Colors.white,
                                          size: 24,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),

                                // Display Added Allergies
                                if (_allergies.isNotEmpty) ...[
                                  const SizedBox(height: 12),
                                  Wrap(
                                    spacing: 8,
                                    runSpacing: 8,
                                    children: _allergies.asMap().entries.map((entry) {
                                      return Container(
                                        decoration: BoxDecoration(
                                          color: const Color(0xFF667eea).withOpacity(0.1),
                                          borderRadius: BorderRadius.circular(12),
                                          border: Border.all(
                                            color: const Color(0xFF667eea).withOpacity(0.3),
                                          ),
                                        ),
                                        padding: const EdgeInsets.symmetric(
                                          horizontal: 12,
                                          vertical: 8,
                                        ),
                                        child: Row(
                                          mainAxisSize: MainAxisSize.min,
                                          children: [
                                            Text(
                                              entry.value,
                                              style: GoogleFonts.poppins(
                                                fontSize: 13,
                                                color: const Color(0xFF667eea),
                                                fontWeight: FontWeight.w500,
                                              ),
                                            ),
                                            const SizedBox(width: 6),
                                            GestureDetector(
                                              onTap: () => _removeAllergy(entry.key),
                                              child: Icon(
                                                Icons.close_rounded,
                                                color: const Color(0xFF667eea),
                                                size: 16,
                                              ),
                                            ),
                                          ],
                                        ),
                                      );
                                    }).toList(),
                                  ),
                                ],
                              ] else if (_selectedUserType == 'Ambulance Employer') ...[
                                const SizedBox(height: 18),

                                _buildInputField(
                                  controller: _companyNameController,
                                  label: 'Company Name (Optional)',
                                  helperText: 'ABC Ambulance Service',
                                  prefixIcon: Icons.business_rounded,
                                ),

                                const SizedBox(height: 18),

                                _buildInputField(
                                  controller: _licenseNumberController,
                                  label: 'License Number (Optional)',
                                  helperText: 'LIC-12345',
                                  prefixIcon: Icons.badge_rounded,
                                ),

                                const SizedBox(height: 18),

                                _buildInputField(
                                  controller: _serviceAreaController,
                                  label: 'Service Area (Optional)',
                                  helperText: 'New York, NY',
                                  prefixIcon: Icons.location_on_rounded,
                                ),

                                const SizedBox(height: 18),

                                Container(
                                  padding: const EdgeInsets.all(16),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFF667eea).withOpacity(0.1),
                                    borderRadius: BorderRadius.circular(16),
                                    border: Border.all(
                                      color: const Color(0xFF667eea).withOpacity(0.3),
                                    ),
                                  ),
                                  child: Row(
                                    children: [
                                      Icon(
                                        Icons.info_outline_rounded,
                                        color: const Color(0xFF667eea),
                                        size: 20,
                                      ),
                                      const SizedBox(width: 12),
                                      Expanded(
                                        child: Text(
                                          'Full ambulance service features are coming soon.',
                                          style: GoogleFonts.poppins(
                                            fontSize: 13,
                                            color: const Color(0xFF667eea),
                                            fontWeight: FontWeight.w500,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],

                              const SizedBox(height: 18),

                              // Emergency Contact
                              _buildInputField(
                                controller: _emergencyContactController,
                                label: 'Emergency Contact (Optional)',
                                keyboardType: TextInputType.phone,
                                helperText: '+1234567890',
                                prefixIcon: Icons.emergency_rounded,
                                validator: (value) {
                                  if (value != null && value.isNotEmpty) {
                                    if (value.length < 10) {
                                      return 'Please enter a valid phone number';
                                    }
                                    if (!RegExp(r'^[\d\+\-\(\)\s]+')
                                        .hasMatch(value)) {
                                      return 'Please enter a valid phone number';
                                    }
                                  }
                                  return null;
                                },
                              ),

                              const SizedBox(height: 18),

                              // Password
                              _buildInputField(
                                controller: _passwordController,
                                label: 'Password',
                                obscureText: !_isPasswordVisible,
                                isPassword: true,
                                helperText: '••••••••',
                                prefixIcon: Icons.lock_rounded,
                                toggleVisibility: () {
                                  setState(() {
                                    _isPasswordVisible = !_isPasswordVisible;
                                  });
                                },
                                validator: (value) {
                                  if (value == null || value.isEmpty) {
                                    return 'Please enter a password';
                                  }
                                  if (value.length < 8) {
                                    return 'Password must be at least 8 characters';
                                  }
                                  if (!RegExp(r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)')
                                      .hasMatch(value)) {
                                    return 'Password must contain uppercase, lowercase & number';
                                  }
                                  return null;
                                },
                              ),

                              const SizedBox(height: 18),

                              // Confirm Password
                              _buildInputField(
                                controller: _confirmPasswordController,
                                label: 'Confirm Password',
                                obscureText: !_isConfirmPasswordVisible,
                                isPassword: true,
                                helperText: '••••••••',
                                prefixIcon: Icons.lock_outline_rounded,
                                toggleVisibility: () {
                                  setState(() {
                                    _isConfirmPasswordVisible = !_isConfirmPasswordVisible;
                                  });
                                },
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

                              const SizedBox(height: 18),

                              // Terms and Conditions
                              Row(
                                children: [
                                  Checkbox(
                                    value: _agreeToTerms,
                                    onChanged: (value) {
                                      setState(() {
                                        _agreeToTerms = value!;
                                      });
                                    },
                                    activeColor: const Color(0xFF667eea),
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(6),
                                    ),
                                  ),
                                  Expanded(
                                    child: Text.rich(
                                      TextSpan(
                                        children: [
                                          TextSpan(
                                            text: 'I agree to the ',
                                            style: GoogleFonts.poppins(
                                              color: const Color(0xFF718096),
                                              fontSize: 14,
                                            ),
                                          ),
                                          TextSpan(
                                            text: 'Terms & Conditions',
                                            style: GoogleFonts.poppins(
                                              color: const Color(0xFF667eea),
                                              fontSize: 14,
                                              fontWeight: FontWeight.w600,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ),
                                ],
                              ),

                              const SizedBox(height: 24),

                              // Enhanced Sign Up Button
                              SizedBox(
                                width: double.infinity,
                                height: 58,
                                child: ElevatedButton(
                                  onPressed: authProvider.isLoading
                                      ? null
                                      : _handleSignup,
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: const Color(0xFF667eea),
                                    foregroundColor: Colors.white,
                                    elevation: 0,
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(16),
                                    ),
                                    disabledBackgroundColor:
                                        const Color(0xFF667eea).withOpacity(0.6),
                                  ),
                                  child: authProvider.isLoading
                                      ? const SizedBox(
                                          width: 24,
                                          height: 24,
                                          child: CircularProgressIndicator(
                                            color: Colors.white,
                                            strokeWidth: 3,
                                          ),
                                        )
                                      : Row(
                                          mainAxisAlignment: MainAxisAlignment.center,
                                          children: [
                                            Text(
                                              'Create Account',
                                              style: GoogleFonts.poppins(
                                                fontSize: 17,
                                                fontWeight: FontWeight.w600,
                                              ),
                                            ),
                                            const SizedBox(width: 8),
                                            const Icon(
                                              Icons.arrow_forward_rounded,
                                              size: 20,
                                            ),
                                          ],
                                        ),
                                ),
                              ),

                              const SizedBox(height: 24),

                              // Divider
                              Row(
                                children: [
                                  Expanded(
                                    child: Divider(
                                      color: const Color(0xFFE2E8F0),
                                      thickness: 1,
                                    ),
                                  ),
                                  Padding(
                                    padding: const EdgeInsets.symmetric(horizontal: 16),
                                    child: Text(
                                      'Or continue with',
                                      style: GoogleFonts.poppins(
                                        color: const Color(0xFF718096),
                                        fontSize: 14,
                                        fontWeight: FontWeight.w500,
                                      ),
                                    ),
                                  ),
                                  Expanded(
                                    child: Divider(
                                      color: const Color(0xFFE2E8F0),
                                      thickness: 1,
                                    ),
                                  ),
                                ],
                              ),

                              const SizedBox(height: 24),

                              // Enhanced Google Sign Up Button
                              SizedBox(
                                width: double.infinity,
                                height: 58,
                                child: OutlinedButton.icon(
                                  onPressed: () {
                                    _showSnackBar(
                                      'Google Sign Up coming soon!',
                                      const Color(0xFF667eea),
                                    );
                                  },
                                  style: OutlinedButton.styleFrom(
                                    side: const BorderSide(
                                      color: Color(0xFFE2E8F0),
                                      width: 1.5,
                                    ),
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(16),
                                    ),
                                    backgroundColor: Colors.white.withOpacity(0.9),
                                  ),
                                  icon: Container(
                                    width: 22,
                                    height: 22,
                                    decoration: const BoxDecoration(
                                      image: DecorationImage(
                                        image: NetworkImage(
                                          'https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg',
                                        ),
                                      ),
                                    ),
                                  ),
                                  label: Text(
                                    'Continue with Google',
                                    style: GoogleFonts.poppins(
                                      color: const Color(0xFF4A5568),
                                      fontSize: 16,
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),

                      const SizedBox(height: 24),

                      // Enhanced Sign In Link with glass effect
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.7),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(
                            color: Colors.white.withOpacity(0.4),
                          ),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              "Already have an account? ",
                              style: GoogleFonts.poppins(
                                color: const Color(0xFF718096),
                                fontSize: 15,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                            TextButton(
                              onPressed: () {
                                Navigator.pushReplacement(
                                  context,
                                  MaterialPageRoute(
                                    builder: (context) => const LoginScreen(),
                                  ),
                                );
                              },
                              child: Text(
                                'Sign In',
                                style: GoogleFonts.poppins(
                                  color: const Color(0xFF667eea),
                                  fontSize: 15,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ),
                          ],
                        ),
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