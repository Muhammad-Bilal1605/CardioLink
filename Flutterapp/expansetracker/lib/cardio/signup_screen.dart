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

class _SignupScreenState extends State<SignupScreen> {
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
  String _selectedUserType = 'Patient'; // New field for user type
  String? _selectedBloodType;
  List<String> _allergies = [];
  final _allergyController = TextEditingController();

  final List<String> _bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  final List<String> _genderOptions = ['Male', 'Female', 'Other'];
  final List<String> _userTypeOptions = ['Patient', 'Ambulance Employer'];

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

      // Parse age from text field
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

      // Calculate date of birth from age
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
          name: _fullNameController.text.trim(),
          phoneNumber: _phoneController.text.trim().isNotEmpty ? _phoneController.text.trim() : null,
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
          phoneNumber: _phoneController.text.trim().isNotEmpty ? _phoneController.text.trim() : null,
          gender: _selectedGender,
          age: age,
          dateOfBirth: dateOfBirth,
          companyName: _companyNameController.text.trim().isNotEmpty ? _companyNameController.text.trim() : null,
          licenseNumber: _licenseNumberController.text.trim().isNotEmpty ? _licenseNumberController.text.trim() : null,
          serviceArea: _serviceAreaController.text.trim().isNotEmpty ? _serviceAreaController.text.trim() : null,
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
          style: GoogleFonts.inter(),
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
    required IconData icon,
    TextInputType? keyboardType,
    bool obscureText = false,
    bool isPassword = false,
    VoidCallback? toggleVisibility,
    String? Function(String?)? validator,
    int maxLines = 1,
    String? helperText,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: TextFormField(
        controller: controller,
        keyboardType: keyboardType,
        obscureText: obscureText,
        maxLines: maxLines,
        decoration: InputDecoration(
          labelText: label,
          labelStyle: GoogleFonts.inter(
            color: const Color(0xFF718096),
          ),
          helperText: helperText,
          helperStyle: GoogleFonts.inter(
            color: const Color(0xFF718096),
            fontSize: 12,
          ),
          prefixIcon: Icon(
            icon,
            color: const Color(0xFF6B8E3D),
          ),
          suffixIcon: isPassword
              ? IconButton(
            icon: Icon(
              obscureText ? Icons.visibility : Icons.visibility_off,
              color: const Color(0xFF718096),
            ),
            onPressed: toggleVisibility,
          )
              : null,
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(16),
            borderSide: BorderSide.none,
          ),
          filled: true,
          fillColor: Colors.white,
          contentPadding: const EdgeInsets.all(20),
          errorStyle: GoogleFonts.inter(
            color: Colors.red,
            fontSize: 12,
          ),
        ),
        validator: validator,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAF5),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(
            Icons.arrow_back_ios,
            color: Color(0xFF6B8E3D),
          ),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          'Create Account',
          style: GoogleFonts.inter(
            color: const Color(0xFF2D3748),
            fontWeight: FontWeight.w600,
          ),
        ),
        centerTitle: true,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
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
                  // Header
                  Column(
                    children: [
                      Container(
                        width: 80,
                        height: 80,
                        decoration: BoxDecoration(
                          color: const Color(0xFF6B8E3D),
                          borderRadius: BorderRadius.circular(20),
                          boxShadow: [
                            BoxShadow(
                              color: const Color(0xFF6B8E3D).withOpacity(0.3),
                              blurRadius: 15,
                              offset: const Offset(0, 8),
                            ),
                          ],
                        ),
                        child: const Icon(
                          Icons.person_add,
                          size: 40,
                          color: Colors.white,
                        ),
                      ),
                      const SizedBox(height: 20),
                      Text(
                        'Join CardioLink',
                        style: GoogleFonts.inter(
                          fontSize: 28,
                          fontWeight: FontWeight.bold,
                          color: const Color(0xFF2D3748),
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Create your account for better health monitoring',
                        style: GoogleFonts.inter(
                          fontSize: 16,
                          color: const Color(0xFF718096),
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ],
                  ),

                  const SizedBox(height: 32),

                  // User Type Selection
                  Text(
                    'Account Type',
                    style: GoogleFonts.inter(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: const Color(0xFF2D3748),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Container(
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.05),
                          blurRadius: 10,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Column(
                      children: _userTypeOptions.map((type) {
                        return RadioListTile<String>(
                          title: Text(
                            type,
                            style: GoogleFonts.inter(
                              fontSize: 16,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                          subtitle: Text(
                            type == 'Patient' 
                                ? 'For individuals seeking medical care'
                                : 'For ambulance service providers',
                            style: GoogleFonts.inter(
                              fontSize: 14,
                              color: const Color(0xFF718096),
                            ),
                          ),
                          value: type,
                          groupValue: _selectedUserType,
                          activeColor: const Color(0xFF6B8E3D),
                          onChanged: (value) {
                            setState(() {
                              _selectedUserType = value!;
                              // Clear type-specific fields when switching
                              _allergies.clear();
                              _selectedBloodType = null;
                              _companyNameController.clear();
                              _licenseNumberController.clear();
                              _serviceAreaController.clear();
                            });
                          },
                        );
                      }).toList(),
                    ),
                  ),

                  const SizedBox(height: 24),

                  // Signup Form
                  Form(
                    key: _formKey,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Full Name
                        _buildInputField(
                          controller: _fullNameController,
                          label: 'Full Name *',
                          icon: Icons.person_outline,
                          keyboardType: TextInputType.name,
                          validator: (value) {
                            if (value == null || value.trim().isEmpty) {
                              return 'Please enter your full name';
                            }
                            if (value.trim().length < 2) {
                              return 'Name must be at least 2 characters';
                            }
                            if (!RegExp(r'^[a-zA-Z\s]+$').hasMatch(value.trim())) {
                              return 'Name can only contain letters and spaces';
                            }
                            return null;
                          },
                        ),

                        const SizedBox(height: 16),

                        // Email
                        _buildInputField(
                          controller: _emailController,
                          label: 'Email Address *',
                          icon: Icons.email_outlined,
                          keyboardType: TextInputType.emailAddress,
                          validator: (value) {
                            if (value == null || value.trim().isEmpty) {
                              return 'Please enter your email';
                            }
                            if (!RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$').hasMatch(value.trim())) {
                              return 'Please enter a valid email address';
                            }
                            return null;
                          },
                        ),

                        const SizedBox(height: 16),

                        // Phone Number
                        _buildInputField(
                          controller: _phoneController,
                          label: 'Phone Number',
                          icon: Icons.phone_outlined,
                          keyboardType: TextInputType.phone,
                          helperText: 'Optional - for emergency contact',
                          validator: (value) {
                            if (value != null && value.isNotEmpty) {
                              if (value.length < 10) {
                                return 'Please enter a valid phone number';
                              }
                              if (!RegExp(r'^[\d\+\-\(\)\s]+$').hasMatch(value)) {
                                return 'Please enter a valid phone number';
                              }
                            }
                            return null;
                          },
                        ),

                        const SizedBox(height: 16),

                        // Age and Gender Row
                        Row(
                          children: [
                            // Age
                            Expanded(
                              child: _buildInputField(
                                controller: _ageController,
                                label: 'Age *',
                                icon: Icons.cake_outlined,
                                keyboardType: TextInputType.number,
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

                            const SizedBox(width: 16),

                            // Gender Dropdown
                            Expanded(
                              child: Container(
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(16),
                                  boxShadow: [
                                    BoxShadow(
                                      color: Colors.black.withOpacity(0.05),
                                      blurRadius: 10,
                                      offset: const Offset(0, 4),
                                    ),
                                  ],
                                ),
                                child: DropdownButtonFormField<String>(
                                  value: _selectedGender,
                                  decoration: InputDecoration(
                                    labelText: 'Gender *',
                                    labelStyle: GoogleFonts.inter(
                                      color: const Color(0xFF718096),
                                    ),
                                    prefixIcon: const Icon(
                                      Icons.wc_outlined,
                                      color: Color(0xFF6B8E3D),
                                    ),
                                    border: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(16),
                                      borderSide: BorderSide.none,
                                    ),
                                    filled: true,
                                    fillColor: Colors.white,
                                    contentPadding: const EdgeInsets.all(20),
                                  ),
                                  items: _genderOptions.map((gender) {
                                    return DropdownMenuItem(
                                      value: gender,
                                      child: Text(
                                        gender,
                                        style: GoogleFonts.inter(),
                                      ),
                                    );
                                  }).toList(),
                                  onChanged: (value) {
                                    setState(() {
                                      _selectedGender = value!;
                                    });
                                  },
                                ),
                              ),
                            ),
                          ],
                        ),

                        // Conditional Fields based on User Type
                        if (_selectedUserType == 'Patient') ...[
                          const SizedBox(height: 16),

                          // Blood Type Dropdown - Only for Patients
                          Container(
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(16),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withOpacity(0.05),
                                  blurRadius: 10,
                                  offset: const Offset(0, 4),
                                ),
                              ],
                            ),
                            child: DropdownButtonFormField<String>(
                              value: _selectedBloodType,
                              decoration: InputDecoration(
                                labelText: 'Blood Type',
                                labelStyle: GoogleFonts.inter(
                                  color: const Color(0xFF718096),
                                ),
                                helperText: 'Optional - helpful for medical records',
                                helperStyle: GoogleFonts.inter(
                                  color: const Color(0xFF718096),
                                  fontSize: 12,
                                ),
                                prefixIcon: const Icon(
                                  Icons.bloodtype_outlined,
                                  color: Color(0xFF6B8E3D),
                                ),
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(16),
                                  borderSide: BorderSide.none,
                                ),
                                filled: true,
                                fillColor: Colors.white,
                                contentPadding: const EdgeInsets.all(20),
                              ),
                              items: [
                                DropdownMenuItem<String>(
                                  value: null,
                                  child: Text(
                                    'Select Blood Type',
                                    style: GoogleFonts.inter(
                                      color: const Color(0xFF718096),
                                    ),
                                  ),
                                ),
                                ..._bloodTypes.map((bloodType) {
                                  return DropdownMenuItem(
                                    value: bloodType,
                                    child: Text(
                                      bloodType,
                                      style: GoogleFonts.inter(),
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

                          const SizedBox(height: 16),

                          // Allergies Section - Only for Patients
                          Text(
                            'Allergies',
                            style: GoogleFonts.inter(
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                              color: const Color(0xFF2D3748),
                            ),
                          ),
                          const SizedBox(height: 8),

                          Text(
                            'Add any allergies you have (optional but recommended)',
                            style: GoogleFonts.inter(
                              fontSize: 14,
                              color: const Color(0xFF718096),
                            ),
                          ),
                          const SizedBox(height: 8),

                          // Add Allergy Field
                          Row(
                            children: [
                              Expanded(
                                child: _buildInputField(
                                  controller: _allergyController,
                                  label: 'Add an allergy',
                                  icon: Icons.warning_outlined,
                                ),
                              ),
                              const SizedBox(width: 8),
                              Container(
                                height: 56,
                                decoration: BoxDecoration(
                                  color: const Color(0xFF6B8E3D),
                                  borderRadius: BorderRadius.circular(16),
                                ),
                                child: IconButton(
                                  onPressed: _addAllergy,
                                  icon: const Icon(
                                    Icons.add,
                                    color: Colors.white,
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
                                return Chip(
                                  label: Text(
                                    entry.value,
                                    style: GoogleFonts.inter(
                                      fontSize: 13,
                                    ),
                                  ),
                                  deleteIcon: const Icon(Icons.close, size: 18),
                                  onDeleted: () => _removeAllergy(entry.key),
                                  backgroundColor: const Color(0xFF6B8E3D).withOpacity(0.1),
                                  deleteIconColor: const Color(0xFF6B8E3D),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                );
                              }).toList(),
                            ),
                          ],
                        ] else if (_selectedUserType == 'Ambulance Employer') ...[
                          const SizedBox(height: 16),

                          // Company Name - Only for Ambulance Employers
                          _buildInputField(
                            controller: _companyNameController,
                            label: 'Company Name',
                            icon: Icons.business_outlined,
                            helperText: 'Optional - name of your ambulance service',
                            validator: (value) {
                              if (value != null && value.isNotEmpty && value.trim().length < 2) {
                                return 'Company name must be at least 2 characters';
                              }
                              return null;
                            },
                          ),

                          const SizedBox(height: 16),

                          // License Number - Only for Ambulance Employers
                          _buildInputField(
                            controller: _licenseNumberController,
                            label: 'License Number',
                            icon: Icons.badge_outlined,
                            helperText: 'Optional - ambulance service license number',
                          ),

                          const SizedBox(height: 16),

                          // Service Area - Only for Ambulance Employers
                          _buildInputField(
                            controller: _serviceAreaController,
                            label: 'Service Area',
                            icon: Icons.location_on_outlined,
                            helperText: 'Optional - areas where you provide service',
                          ),

                          const SizedBox(height: 16),

                          // Coming Soon Notice
                          Container(
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: const Color(0xFF6B8E3D).withOpacity(0.1),
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(
                                color: const Color(0xFF6B8E3D).withOpacity(0.3),
                              ),
                            ),
                            child: Row(
                              children: [
                                Icon(
                                  Icons.info_outline,
                                  color: const Color(0xFF6B8E3D),
                                  size: 24,
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        'Ambulance Employer Features',
                                        style: GoogleFonts.inter(
                                          fontWeight: FontWeight.w600,
                                          color: const Color(0xFF6B8E3D),
                                        ),
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        'Full ambulance service features are coming soon. You can create your account now to get early access.',
                                        style: GoogleFonts.inter(
                                          fontSize: 14,
                                          color: const Color(0xFF6B8E3D),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],

                        const SizedBox(height: 16),

                        // Emergency Contact
                        _buildInputField(
                          controller: _emergencyContactController,
                          label: 'Emergency Contact',
                          icon: Icons.contact_emergency_outlined,
                          keyboardType: TextInputType.phone,
                          helperText: 'Optional - phone number for emergencies',
                          validator: (value) {
                            if (value != null && value.isNotEmpty) {
                              if (value.length < 10) {
                                return 'Please enter a valid phone number';
                              }
                              if (!RegExp(r'^[\d\+\-\(\)\s]+$').hasMatch(value)) {
                                return 'Please enter a valid phone number';
                              }
                            }
                            return null;
                          },
                        ),

                        const SizedBox(height: 16),

                        // Password
                        _buildInputField(
                          controller: _passwordController,
                          label: 'Password *',
                          icon: Icons.lock_outline,
                          obscureText: !_isPasswordVisible,
                          isPassword: true,
                          helperText: 'Must be at least 8 characters with uppercase, lowercase & number',
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
                            if (!RegExp(r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)').hasMatch(value)) {
                              return 'Password must contain uppercase, lowercase & number';
                            }
                            return null;
                          },
                        ),

                        const SizedBox(height: 16),

                        // Confirm Password
                        _buildInputField(
                          controller: _confirmPasswordController,
                          label: 'Confirm Password *',
                          icon: Icons.lock_outline,
                          obscureText: !_isConfirmPasswordVisible,
                          isPassword: true,
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

                        const SizedBox(height: 24),

                        // Terms and Conditions
                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(16),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.05),
                                blurRadius: 10,
                                offset: const Offset(0, 4),
                              ),
                            ],
                          ),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Checkbox(
                                value: _agreeToTerms,
                                onChanged: (value) {
                                  setState(() {
                                    _agreeToTerms = value ?? false;
                                  });
                                },
                                activeColor: const Color(0xFF6B8E3D),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(4),
                                ),
                              ),
                              Expanded(
                                child: Padding(
                                  padding: const EdgeInsets.only(top: 12),
                                  child: RichText(
                                    text: TextSpan(
                                      style: GoogleFonts.inter(
                                        color: const Color(0xFF718096),
                                        fontSize: 14,
                                      ),
                                      children: [
                                        const TextSpan(text: 'I agree to the '),
                                        TextSpan(
                                          text: 'Terms of Service',
                                          style: GoogleFonts.inter(
                                            color: const Color(0xFF6B8E3D),
                                            fontWeight: FontWeight.w600,
                                            decoration: TextDecoration.underline,
                                          ),
                                        ),
                                        const TextSpan(text: ' and '),
                                        TextSpan(
                                          text: 'Privacy Policy',
                                          style: GoogleFonts.inter(
                                            color: const Color(0xFF6B8E3D),
                                            fontWeight: FontWeight.w600,
                                            decoration: TextDecoration.underline,
                                          ),
                                        ),
                                        const TextSpan(text: ' of CardioLink'),
                                      ],
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),

                        const SizedBox(height: 32),

                        // Sign Up Button
                        SizedBox(
                          width: double.infinity,
                          height: 56,
                          child: ElevatedButton(
                            onPressed: authProvider.isLoading ? null : _handleSignup,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFF6B8E3D),
                              foregroundColor: Colors.white,
                              elevation: 0,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(16),
                              ),
                              disabledBackgroundColor: const Color(0xFF6B8E3D).withOpacity(0.6),
                            ),
                            child: authProvider.isLoading
                                ? Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                const SizedBox(
                                  width: 20,
                                  height: 20,
                                  child: CircularProgressIndicator(
                                    color: Colors.white,
                                    strokeWidth: 2,
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Text(
                                  'Creating Account...',
                                  style: GoogleFonts.inter(
                                    fontSize: 16,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ],
                            )
                                : Text(
                              'Create ${_selectedUserType} Account',
                              style: GoogleFonts.inter(
                                fontSize: 18,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 32),

                  // Sign In Link
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        "Already have an account? ",
                        style: GoogleFonts.inter(
                          color: const Color(0xFF718096),
                          fontSize: 16,
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
                          style: GoogleFonts.inter(
                            color: const Color(0xFF6B8E3D),
                            fontSize: 16,
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
      ),
    );
  }
}