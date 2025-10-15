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
  // Basic Info Controllers
  final _firstNameController = TextEditingController();
  final _lastNameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  final _dateOfBirthController = TextEditingController();
  
  // Address Controllers
  final _streetController = TextEditingController();
  final _cityController = TextEditingController();
  final _stateController = TextEditingController();
  final _zipCodeController = TextEditingController();
  final _countryController = TextEditingController();
  
  // Emergency Contact Controllers
  final _emergencyNameController = TextEditingController();
  final _emergencyRelationshipController = TextEditingController();
  final _emergencyPhoneController = TextEditingController();
  
  // Insurance Controllers
  final _insuranceProviderController = TextEditingController();
  final _policyNumberController = TextEditingController();
  final _groupNumberController = TextEditingController();
  final _expiryDateController = TextEditingController();
  
  // Social History Controllers
  final _tobaccoTypeController = TextEditingController();
  final _tobaccoFrequencyController = TextEditingController();
  final _alcoholTypeController = TextEditingController();
  final _alcoholFrequencyController = TextEditingController();
  final _drugTypeController = TextEditingController();
  final _drugFrequencyController = TextEditingController();
  final _occupationController = TextEditingController();
  
  // Special Directives Controllers
  final _religiousInstructionsController = TextEditingController();
  
  // Allergy Controllers
  final _allergyNameController = TextEditingController();
  final _allergyReactionController = TextEditingController();
  final _allergyNotesController = TextEditingController();

  bool _isPasswordVisible = false;
  bool _isConfirmPasswordVisible = false;
  bool _agreeToTerms = false;
  String _selectedGender = 'Male';
  String _selectedUserType = 'Patient';
  
  // Social History Selections
  String _selectedTobaccoUse = 'Unknown';
  String _selectedAlcoholUse = 'Unknown';
  String _selectedDrugUse = 'Unknown';
  
  // Allergy Selections
  String _selectedAllergyType = 'medicinal';
  String _selectedAllergyCriticality = 'Medium';
  
  // Special Directives
  bool _dnr = false;
  bool _livingWill = false;
  bool _organDonor = false;
  
  // Allergy Lists
  List<Map<String, dynamic>> _medicinalAllergies = [];
  List<Map<String, dynamic>> _foodAllergies = [];
  List<Map<String, dynamic>> _environmentalAllergies = [];

  final List<String> _genderOptions = ['Male', 'Female', 'Other'];
  final List<String> _userTypeOptions = ['Patient', 'Ambulance Employer'];

  @override
  void dispose() {
    // Basic Info Controllers
    _firstNameController.dispose();
    _lastNameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    _dateOfBirthController.dispose();
    
    // Address Controllers
    _streetController.dispose();
    _cityController.dispose();
    _stateController.dispose();
    _zipCodeController.dispose();
    _countryController.dispose();
    
    // Emergency Contact Controllers
    _emergencyNameController.dispose();
    _emergencyRelationshipController.dispose();
    _emergencyPhoneController.dispose();
    
    // Insurance Controllers
    _insuranceProviderController.dispose();
    _policyNumberController.dispose();
    _groupNumberController.dispose();
    _expiryDateController.dispose();
    
    // Social History Controllers
    _tobaccoTypeController.dispose();
    _tobaccoFrequencyController.dispose();
    _alcoholTypeController.dispose();
    _alcoholFrequencyController.dispose();
    _drugTypeController.dispose();
    _drugFrequencyController.dispose();
    _occupationController.dispose();
    
    // Special Directives Controllers
    _religiousInstructionsController.dispose();
    
    // Allergy Controllers
    _allergyNameController.dispose();
    _allergyReactionController.dispose();
    _allergyNotesController.dispose();
    
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
      print('AuthProvider obtained: true');


      print('Calling signup method for $_selectedUserType...');
      
      bool success = false;
      
      if (_selectedUserType == 'Patient') {
        // Parse date of birth
        DateTime? dateOfBirth;
        if (_dateOfBirthController.text.isNotEmpty) {
          dateOfBirth = DateTime.tryParse(_dateOfBirthController.text);
          if (dateOfBirth == null) {
            _showSnackBar('Please enter a valid date of birth', Colors.red);
          return;
        }
        } else {
          _showSnackBar('Date of birth is required', Colors.red);
          return;
        }


        // Prepare optional data structures
        Map<String, dynamic>? addressData;
        if (_streetController.text.isNotEmpty || 
            _cityController.text.isNotEmpty || 
            _stateController.text.isNotEmpty || 
            _zipCodeController.text.isNotEmpty || 
            _countryController.text.isNotEmpty) {
          addressData = {
            'street': _streetController.text.trim(),
            'city': _cityController.text.trim(),
            'state': _stateController.text.trim(),
            'zipCode': _zipCodeController.text.trim(),
            'country': _countryController.text.trim(),
          };
        }

        Map<String, dynamic>? allergiesData;
        if (_medicinalAllergies.isNotEmpty || 
            _foodAllergies.isNotEmpty || 
            _environmentalAllergies.isNotEmpty) {
          allergiesData = {
            'medicinal': _medicinalAllergies,
            'food': _foodAllergies,
            'environmental': _environmentalAllergies,
          };
        }

        Map<String, dynamic>? insuranceData;
        if (_insuranceProviderController.text.isNotEmpty || 
            _policyNumberController.text.isNotEmpty || 
            _groupNumberController.text.isNotEmpty || 
            _expiryDateController.text.isNotEmpty) {
          insuranceData = {
            'provider': _insuranceProviderController.text.trim(),
            'policyNumber': _policyNumberController.text.trim(),
            'groupNumber': _groupNumberController.text.trim(),
            'expiryDate': _expiryDateController.text.trim().isNotEmpty 
                ? DateTime.tryParse(_expiryDateController.text)?.toIso8601String() 
                : null,
          };
        }

        Map<String, dynamic>? emergencyContactData;
        if (_emergencyNameController.text.isNotEmpty || 
            _emergencyRelationshipController.text.isNotEmpty || 
            _emergencyPhoneController.text.isNotEmpty) {
          emergencyContactData = {
            'name': _emergencyNameController.text.trim(),
            'relationship': _emergencyRelationshipController.text.trim(),
            'phoneNumber': _emergencyPhoneController.text.trim(),
          };
        }

        Map<String, dynamic> socialHistoryData = {
          'tobaccoUse': _selectedTobaccoUse,
          'tobaccoType': _tobaccoTypeController.text.trim(),
          'tobaccoFrequency': _tobaccoFrequencyController.text.trim(),
          'alcoholUse': _selectedAlcoholUse,
          'alcoholType': _alcoholTypeController.text.trim(),
          'alcoholFrequency': _alcoholFrequencyController.text.trim(),
          'illicitDrugUse': _selectedDrugUse,
          'drugType': _drugTypeController.text.trim(),
          'drugFrequency': _drugFrequencyController.text.trim(),
          'occupation': _occupationController.text.trim(),
        };

        Map<String, dynamic> specialDirectivesData = {
          'dnr': _dnr,
          'livingWill': _livingWill,
          'religiousInstructions': _religiousInstructionsController.text.trim(),
          'organDonor': _organDonor,
        };

        success = await authProvider.signup(
          email: _emailController.text.trim(),
          password: _passwordController.text,
          firstName: _firstNameController.text.trim(),
          lastName: _lastNameController.text.trim(),
          phoneNumber: _phoneController.text.trim(),
          gender: _selectedGender,
          dateOfBirth: dateOfBirth,
          street: addressData?['street'],
          city: addressData?['city'],
          state: addressData?['state'],
          zipCode: addressData?['zipCode'],
          country: addressData?['country'],
          allergies: allergiesData,
          insurance: insuranceData,
          emergencyContact: emergencyContactData,
          socialHistory: socialHistoryData,
          specialDirectives: specialDirectivesData,
        );
      } else if (_selectedUserType == 'Ambulance Employer') {
        // Parse date of birth for ambulance employer
        DateTime? dateOfBirth;
        if (_dateOfBirthController.text.isNotEmpty) {
          dateOfBirth = DateTime.tryParse(_dateOfBirthController.text);
          if (dateOfBirth == null) {
            _showSnackBar('Please enter a valid date of birth', Colors.red);
            return;
          }
        } else {
          _showSnackBar('Date of birth is required', Colors.red);
          return;
        }

        // Calculate age from date of birth
        final now = DateTime.now();
        int age = now.year - dateOfBirth.year;
        if (now.month < dateOfBirth.month || (now.month == dateOfBirth.month && now.day < dateOfBirth.day)) {
          age = age - 1;
        }

        success = await authProvider.ambulanceEmployerSignup(
          email: _emailController.text.trim(),
          password: _passwordController.text,
          name: '${_firstNameController.text.trim()} ${_lastNameController.text.trim()}',
          phoneNumber: _phoneController.text.trim().isNotEmpty ? _phoneController.text.trim() : null,
          gender: _selectedGender,
          age: age,
          dateOfBirth: dateOfBirth,
          companyName: null, // Simplified for now
          licenseNumber: null, // Simplified for now
          serviceArea: null, // Simplified for now
          emergencyContact: _emergencyPhoneController.text.trim().isNotEmpty
              ? _emergencyPhoneController.text.trim()
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
    final name = _allergyNameController.text.trim();
    if (name.isNotEmpty) {
      final allergy = {
        'name': name,
        'reaction': _allergyReactionController.text.trim(),
        'criticality': _selectedAllergyCriticality,
        'notes': _allergyNotesController.text.trim(),
      };

      setState(() {
        if (_selectedAllergyType == 'medicinal') {
          _medicinalAllergies.add(allergy);
        } else if (_selectedAllergyType == 'food') {
          _foodAllergies.add(allergy);
        } else if (_selectedAllergyType == 'environmental') {
          _environmentalAllergies.add(allergy);
        }
        
        _allergyNameController.clear();
        _allergyReactionController.clear();
        _allergyNotesController.clear();
      });
    }
  }

  void _removeAllergy(String type, int index) {
    setState(() {
      if (type == 'medicinal') {
        _medicinalAllergies.removeAt(index);
      } else if (type == 'food') {
        _foodAllergies.removeAt(index);
      } else if (type == 'environmental') {
        _environmentalAllergies.removeAt(index);
      }
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

  Widget _buildSocialHistoryDropdown(
    String label,
    String value,
    List<String> options,
    Function(String?) onChanged,
  ) {
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
      child: DropdownButtonFormField<String>(
        value: value,
        decoration: InputDecoration(
          labelText: label,
          labelStyle: GoogleFonts.inter(
            color: const Color(0xFF718096),
          ),
          prefixIcon: const Icon(
            Icons.health_and_safety_outlined,
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
        items: options.map((option) {
          return DropdownMenuItem(
            value: option,
            child: Text(
              option,
              style: GoogleFonts.inter(),
            ),
          );
        }).toList(),
        onChanged: onChanged,
      ),
    );
  }

  Widget _buildAllergySection(String title, List<Map<String, dynamic>> allergies, String type) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF6B8E3D).withOpacity(0.05),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: const Color(0xFF6B8E3D).withOpacity(0.2),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: GoogleFonts.inter(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: const Color(0xFF6B8E3D),
            ),
          ),
          const SizedBox(height: 8),
          ...allergies.asMap().entries.map((entry) {
            final index = entry.key;
            final allergy = entry.value;
            return Container(
              margin: const EdgeInsets.only(bottom: 8),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(
                  color: const Color(0xFF6B8E3D).withOpacity(0.3),
                ),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          allergy['name'] ?? '',
                          style: GoogleFonts.inter(
                            fontWeight: FontWeight.w600,
                            fontSize: 14,
                          ),
                        ),
                        if (allergy['reaction']?.isNotEmpty == true) ...[
                          const SizedBox(height: 4),
                          Text(
                            'Reaction: ${allergy['reaction']}',
                            style: GoogleFonts.inter(
                              fontSize: 12,
                              color: const Color(0xFF718096),
                            ),
                          ),
                        ],
                        if (allergy['notes']?.isNotEmpty == true) ...[
                          const SizedBox(height: 4),
                          Text(
                            'Notes: ${allergy['notes']}',
                            style: GoogleFonts.inter(
                              fontSize: 12,
                              color: const Color(0xFF718096),
                            ),
                          ),
                        ],
                        const SizedBox(height: 4),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(
                            color: allergy['criticality'] == 'High' 
                                ? Colors.red.withOpacity(0.1)
                                : allergy['criticality'] == 'Medium'
                                    ? Colors.orange.withOpacity(0.1)
                                    : Colors.green.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            allergy['criticality'] ?? 'Medium',
                            style: GoogleFonts.inter(
                              fontSize: 10,
                              fontWeight: FontWeight.w600,
                              color: allergy['criticality'] == 'High' 
                                  ? Colors.red
                                  : allergy['criticality'] == 'Medium'
                                      ? Colors.orange
                                      : Colors.green,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    onPressed: () => _removeAllergy(type, index),
                    icon: const Icon(
                      Icons.close,
                      color: Colors.red,
                      size: 20,
                    ),
                  ),
                ],
              ),
            );
          }).toList(),
        ],
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
                              _medicinalAllergies.clear();
                              _foodAllergies.clear();
                              _environmentalAllergies.clear();
                              _allergyNameController.clear();
                              _allergyReactionController.clear();
                              _allergyNotesController.clear();
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
                        // First Name
                        _buildInputField(
                          controller: _firstNameController,
                          label: 'First Name *',
                          icon: Icons.person_outline,
                          keyboardType: TextInputType.name,
                          validator: (value) {
                            if (value == null || value.trim().isEmpty) {
                              return 'Please enter your first name';
                            }
                            if (value.trim().length < 2) {
                              return 'First name must be at least 2 characters';
                            }
                            if (!RegExp(r'^[a-zA-Z\s]+$').hasMatch(value.trim())) {
                              return 'First name can only contain letters and spaces';
                            }
                            return null;
                          },
                        ),

                        const SizedBox(height: 16),

                        // Last Name
                        _buildInputField(
                          controller: _lastNameController,
                          label: 'Last Name *',
                          icon: Icons.person_outline,
                          keyboardType: TextInputType.name,
                          validator: (value) {
                            if (value == null || value.trim().isEmpty) {
                              return 'Please enter your last name';
                            }
                            if (value.trim().length < 2) {
                              return 'Last name must be at least 2 characters';
                            }
                            if (!RegExp(r'^[a-zA-Z\s]+$').hasMatch(value.trim())) {
                              return 'Last name can only contain letters and spaces';
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

                        // Date of Birth and Gender Row
                        Row(
                          children: [
                            // Date of Birth
                            Expanded(
                              child: _buildInputField(
                                controller: _dateOfBirthController,
                                label: 'Date of Birth *',
                                icon: Icons.cake_outlined,
                                keyboardType: TextInputType.datetime,
                                validator: (value) {
                                  if (value == null || value.trim().isEmpty) {
                                    return 'Please enter your date of birth';
                                  }
                                  final date = DateTime.tryParse(value.trim());
                                  if (date == null) {
                                    return 'Please enter a valid date';
                                  }
                                  if (date.isAfter(DateTime.now())) {
                                    return 'Date of birth cannot be in the future';
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

                          // Allergy Type Selection
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
                              value: _selectedAllergyType,
                              decoration: InputDecoration(
                                labelText: 'Allergy Type',
                                labelStyle: GoogleFonts.inter(
                                  color: const Color(0xFF718096),
                                ),
                                prefixIcon: const Icon(
                                  Icons.category_outlined,
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
                                DropdownMenuItem(value: 'medicinal', child: Text('Medicinal')),
                                DropdownMenuItem(value: 'food', child: Text('Food')),
                                DropdownMenuItem(value: 'environmental', child: Text('Environmental')),
                              ],
                              onChanged: (value) {
                                setState(() {
                                  _selectedAllergyType = value!;
                                });
                              },
                            ),
                          ),

                          const SizedBox(height: 16),

                          // Add Allergy Fields
                          Row(
                            children: [
                              Expanded(
                                child: _buildInputField(
                                  controller: _allergyNameController,
                                  label: 'Allergy Name',
                                  icon: Icons.warning_outlined,
                                ),
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: _buildInputField(
                                  controller: _allergyReactionController,
                                  label: 'Reaction',
                                  icon: Icons.medical_services_outlined,
                                ),
                              ),
                            ],
                          ),

                          const SizedBox(height: 16),

                          Row(
                            children: [
                              Expanded(
                                child: _buildInputField(
                                  controller: _allergyNotesController,
                                  label: 'Notes',
                                  icon: Icons.note_outlined,
                                ),
                              ),
                              const SizedBox(width: 8),
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
                                    value: _selectedAllergyCriticality,
                                    decoration: InputDecoration(
                                      labelText: 'Criticality',
                                      labelStyle: GoogleFonts.inter(
                                      color: const Color(0xFF718096),
                                    ),
                                      prefixIcon: const Icon(
                                        Icons.priority_high_outlined,
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
                                      DropdownMenuItem(value: 'Low', child: Text('Low')),
                                      DropdownMenuItem(value: 'Medium', child: Text('Medium')),
                                      DropdownMenuItem(value: 'High', child: Text('High')),
                              ],
                              onChanged: (value) {
                                setState(() {
                                        _selectedAllergyCriticality = value!;
                                });
                              },
                            ),
                                ),
                              ),
                            ],
                          ),

                          const SizedBox(height: 16),

                          // Add Allergy Button
                          SizedBox(
                            width: double.infinity,
                            child: ElevatedButton.icon(
                              onPressed: _addAllergy,
                              icon: const Icon(Icons.add, color: Colors.white),
                              label: Text(
                                'Add Allergy',
                                style: GoogleFonts.inter(
                                  color: Colors.white,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFF6B8E3D),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(16),
                                ),
                                padding: const EdgeInsets.symmetric(vertical: 16),
                              ),
                            ),
                          ),

                          // Display Added Allergies
                          if (_medicinalAllergies.isNotEmpty || 
                              _foodAllergies.isNotEmpty || 
                              _environmentalAllergies.isNotEmpty) ...[
                            const SizedBox(height: 16),
                            
                            // Medicinal Allergies
                            if (_medicinalAllergies.isNotEmpty) ...[
                              _buildAllergySection('Medicinal Allergies', _medicinalAllergies, 'medicinal'),
                              const SizedBox(height: 12),
                            ],
                            
                            // Food Allergies
                            if (_foodAllergies.isNotEmpty) ...[
                              _buildAllergySection('Food Allergies', _foodAllergies, 'food'),
                              const SizedBox(height: 12),
                            ],
                            
                            // Environmental Allergies
                            if (_environmentalAllergies.isNotEmpty) ...[
                              _buildAllergySection('Environmental Allergies', _environmentalAllergies, 'environmental'),
                            ],
                          ],
                          const SizedBox(height: 24),

                          // Address Section
                          Text(
                            'Address Information',
                            style: GoogleFonts.inter(
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                              color: const Color(0xFF2D3748),
                            ),
                          ),
                          const SizedBox(height: 8),

                          _buildInputField(
                            controller: _streetController,
                            label: 'Street Address',
                            icon: Icons.home_outlined,
                            helperText: 'Optional',
                          ),

                          const SizedBox(height: 16),

                          Row(
                            children: [
                              Expanded(
                                child: _buildInputField(
                                  controller: _cityController,
                                  label: 'City',
                                  icon: Icons.location_city_outlined,
                                ),
                              ),
                              const SizedBox(width: 16),
                              Expanded(
                                child: _buildInputField(
                                  controller: _stateController,
                                  label: 'State',
                                  icon: Icons.map_outlined,
                                ),
                              ),
                            ],
                          ),

                          const SizedBox(height: 16),

                          Row(
                            children: [
                              Expanded(
                                child: _buildInputField(
                                  controller: _zipCodeController,
                                  label: 'ZIP Code',
                                  icon: Icons.local_post_office_outlined,
                                  keyboardType: TextInputType.number,
                                ),
                              ),
                              const SizedBox(width: 16),
                              Expanded(
                                child: _buildInputField(
                                  controller: _countryController,
                                  label: 'Country',
                                  icon: Icons.public_outlined,
                                ),
                              ),
                            ],
                          ),

                          const SizedBox(height: 24),

                          // Emergency Contact Section
                          Text(
                            'Emergency Contact',
                            style: GoogleFonts.inter(
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                              color: const Color(0xFF2D3748),
                            ),
                          ),
                          const SizedBox(height: 8),

                          Row(
                            children: [
                              Expanded(
                                child: _buildInputField(
                                  controller: _emergencyNameController,
                                  label: 'Contact Name',
                                  icon: Icons.person_outline,
                                ),
                              ),
                              const SizedBox(width: 16),
                              Expanded(
                                child: _buildInputField(
                                  controller: _emergencyRelationshipController,
                                  label: 'Relationship',
                                  icon: Icons.family_restroom_outlined,
                                ),
                              ),
                            ],
                          ),

                          const SizedBox(height: 16),

                          _buildInputField(
                            controller: _emergencyPhoneController,
                            label: 'Phone Number',
                            icon: Icons.phone_outlined,
                            keyboardType: TextInputType.phone,
                          ),

                          const SizedBox(height: 24),

                          // Insurance Section
                          Text(
                            'Insurance Information',
                            style: GoogleFonts.inter(
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                              color: const Color(0xFF2D3748),
                            ),
                          ),
                          const SizedBox(height: 8),

                          _buildInputField(
                            controller: _insuranceProviderController,
                            label: 'Insurance Provider',
                            icon: Icons.local_hospital_outlined,
                          ),

                          const SizedBox(height: 16),

                          Row(
                            children: [
                              Expanded(
                                child: _buildInputField(
                                  controller: _policyNumberController,
                                  label: 'Policy Number',
                                  icon: Icons.badge_outlined,
                                ),
                              ),
                              const SizedBox(width: 16),
                              Expanded(
                                child: _buildInputField(
                                  controller: _groupNumberController,
                                  label: 'Group Number',
                                  icon: Icons.group_outlined,
                                ),
                              ),
                            ],
                          ),

                          const SizedBox(height: 16),

                          _buildInputField(
                            controller: _expiryDateController,
                            label: 'Expiry Date',
                            icon: Icons.calendar_today_outlined,
                            keyboardType: TextInputType.datetime,
                          ),

                          const SizedBox(height: 24),

                          // Social History Section
                          Text(
                            'Social History',
                                    style: GoogleFonts.inter(
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                              color: const Color(0xFF2D3748),
                            ),
                          ),
                          const SizedBox(height: 8),

                          // Tobacco Use
                          _buildSocialHistoryDropdown(
                            'Tobacco Use',
                            _selectedTobaccoUse,
                            ['Never', 'Former', 'Current', 'Unknown'],
                            (value) => setState(() => _selectedTobaccoUse = value!),
                          ),

                          if (_selectedTobaccoUse == 'Current' || _selectedTobaccoUse == 'Former') ...[
                            const SizedBox(height: 16),
                            Row(
                              children: [
                                Expanded(
                                  child: _buildInputField(
                                    controller: _tobaccoTypeController,
                                    label: 'Tobacco Type',
                                    icon: Icons.smoking_rooms_outlined,
                                  ),
                                ),
                                const SizedBox(width: 16),
                                Expanded(
                                  child: _buildInputField(
                                    controller: _tobaccoFrequencyController,
                                    label: 'Frequency',
                                    icon: Icons.schedule_outlined,
                                  ),
                                ),
                              ],
                            ),
                          ],

                          const SizedBox(height: 16),

                          // Alcohol Use
                          _buildSocialHistoryDropdown(
                            'Alcohol Use',
                            _selectedAlcoholUse,
                            ['Never', 'Former', 'Current', 'Unknown'],
                            (value) => setState(() => _selectedAlcoholUse = value!),
                          ),

                          if (_selectedAlcoholUse == 'Current' || _selectedAlcoholUse == 'Former') ...[
                          const SizedBox(height: 16),
                            Row(
                              children: [
                                Expanded(
                                  child: _buildInputField(
                                    controller: _alcoholTypeController,
                                    label: 'Alcohol Type',
                                    icon: Icons.local_bar_outlined,
                                  ),
                                ),
                                const SizedBox(width: 16),
                                Expanded(
                                  child: _buildInputField(
                                    controller: _alcoholFrequencyController,
                                    label: 'Frequency',
                                    icon: Icons.schedule_outlined,
                                  ),
                                ),
                              ],
                            ),
                          ],

                          const SizedBox(height: 16),

                          // Drug Use
                          _buildSocialHistoryDropdown(
                            'Illicit Drug Use',
                            _selectedDrugUse,
                            ['Never', 'Former', 'Current', 'Unknown'],
                            (value) => setState(() => _selectedDrugUse = value!),
                          ),

                          if (_selectedDrugUse == 'Current' || _selectedDrugUse == 'Former') ...[
                            const SizedBox(height: 16),
                            Row(
                              children: [
                                Expanded(
                                  child: _buildInputField(
                                    controller: _drugTypeController,
                                    label: 'Drug Type',
                                    icon: Icons.medical_services_outlined,
                                  ),
                                ),
                                const SizedBox(width: 16),
                                Expanded(
                                  child: _buildInputField(
                                    controller: _drugFrequencyController,
                                    label: 'Frequency',
                                    icon: Icons.schedule_outlined,
                                  ),
                                ),
                              ],
                            ),
                          ],

                          const SizedBox(height: 16),

                          _buildInputField(
                            controller: _occupationController,
                            label: 'Occupation',
                            icon: Icons.work_outline,
                          ),

                          const SizedBox(height: 24),

                          // Special Directives Section
                          Text(
                            'Special Directives',
                            style: GoogleFonts.inter(
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                              color: const Color(0xFF2D3748),
                            ),
                          ),
                          const SizedBox(height: 8),

                          // DNR Checkbox
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
                              children: [
                                Checkbox(
                                  value: _dnr,
                                  onChanged: (value) {
                                    setState(() {
                                      _dnr = value ?? false;
                                    });
                                  },
                                  activeColor: const Color(0xFF6B8E3D),
                                ),
                                Expanded(
                                  child: Text(
                                    'Do Not Resuscitate (DNR)',
                                    style: GoogleFonts.inter(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),

                          const SizedBox(height: 12),

                          // Living Will Checkbox
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
                              children: [
                                Checkbox(
                                  value: _livingWill,
                                  onChanged: (value) {
                                    setState(() {
                                      _livingWill = value ?? false;
                                    });
                                  },
                                  activeColor: const Color(0xFF6B8E3D),
                                ),
                                Expanded(
                                  child: Text(
                                    'Living Will',
                                    style: GoogleFonts.inter(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),

                          const SizedBox(height: 12),

                          // Organ Donor Checkbox
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
                              children: [
                                Checkbox(
                                  value: _organDonor,
                                  onChanged: (value) {
                                    setState(() {
                                      _organDonor = value ?? false;
                                    });
                                  },
                                  activeColor: const Color(0xFF6B8E3D),
                                ),
                                Expanded(
                                  child: Text(
                                    'Organ Donor',
                                    style: GoogleFonts.inter(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),

                          const SizedBox(height: 16),

                          _buildInputField(
                            controller: _religiousInstructionsController,
                            label: 'Religious Instructions',
                            icon: Icons.church_outlined,
                            maxLines: 3,
                            helperText: 'Any religious instructions or preferences',
                          ),

                        ] else if (_selectedUserType == 'Ambulance Employer') ...[
                          const SizedBox(height: 16),

                          // Coming Soon Notice for Ambulance Employers
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