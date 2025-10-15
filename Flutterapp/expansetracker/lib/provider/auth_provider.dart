// lib/provider/auth_provider.dart - Complete Updated AuthProvider Compatible with ConfigService
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../services/config_service.dart';

class AuthProvider with ChangeNotifier {
  bool _isLoading = false;
  String? _errorMessage;
  Map<String, dynamic>? _currentUser;
  String? _userType; // 'patient' or 'ambulance_employer'
  String? _authToken;

  // Getters
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  Map<String, dynamic>? get currentUser => _currentUser;
  String? get userType => _userType;
  String? get authToken => _authToken;
  bool get isAuthenticated => _currentUser != null;

  // Get base URL from config service (synchronous for compatibility)
  String get baseUrl => ConfigService.instance.baseUrl;

  // Get authorization headers
  Map<String, String> get _authHeaders {
    final headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    
    if (_authToken != null && _authToken != 'patient_token' && _authToken != 'valid') {
      headers['Authorization'] = 'Bearer $_authToken';
    }
    
    return headers;
  }

  // Set loading state
  void _setLoading(bool loading) {
    _isLoading = loading;
    notifyListeners();
  }

  // Set error message
  void _setError(String? error) {
    _errorMessage = error;
    notifyListeners();
  }

  // Clear error
  void clearError() {
    _errorMessage = null;
    notifyListeners();
  }

  // Clear all authentication data
  void clearAuth() {
    _currentUser = null;
    _userType = null;
    _authToken = null;
    _errorMessage = null;
    notifyListeners();
  }

  // PATIENT SIGNUP - Using same API as web frontend
  Future<bool> signup({
    required String email,
    required String password,
    required String firstName,
    required String lastName,
    required String phoneNumber,
    required String gender,
    required DateTime dateOfBirth,
    String? street,
    String? city,
    String? state,
    String? zipCode,
    String? country,
    Map<String, dynamic>? allergies,
    Map<String, dynamic>? insurance,
    Map<String, dynamic>? emergencyContact,
    Map<String, dynamic>? socialHistory,
    Map<String, dynamic>? specialDirectives,
  }) async {
    try {
      _setLoading(true);
      _setError(null);

      final currentBaseUrl = baseUrl;
      print('Starting patient signup process...');
      print('Email: $email');
      print('Name: $firstName $lastName');
      print('Using API URL: $currentBaseUrl');

      // Build request data matching the unified auth controller structure
      final requestData = <String, dynamic>{
        'name': '${firstName.trim()} ${lastName.trim()}',
        'email': email.trim(),
        'password': password,
        'phoneNumber': phoneNumber.trim(),
        'gender': gender,
        'age': DateTime.now().year - dateOfBirth.year,
        'dateOfBirth': dateOfBirth.toIso8601String(),
      };

      // Add required fields for unified auth controller
      requestData['bloodType'] = 'Unknown'; // Default value
      requestData['allergies'] = allergies ?? [];
      requestData['emergencyContact'] = emergencyContact ?? {'phoneNumber': phoneNumber};
      requestData['medicalHistory'] = [];
      requestData['currentMedications'] = [];

      final uri = Uri.parse('$currentBaseUrl/auth/patient/signup');
      print('Request URL: $uri');

      final response = await http.post(
        uri,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: json.encode(requestData),
      ).timeout(const Duration(seconds: 30));

      print('Response status: ${response.statusCode}');
      print('Response body: ${response.body}');

      if (response.body.isEmpty) {
        print('Empty response body received');
        _setError('Server returned empty response');
        return false;
      }

      final responseData = json.decode(response.body);

      if (response.statusCode == 201 && responseData['success'] == true) {
        final userData = responseData['user'];
        
        if (userData == null) {
          print('No user data in successful response');
          _setError('Invalid response format from server');
          return false;
        }

        _currentUser = userData;
        _userType = 'patient';
        _authToken = responseData['token'] ?? 'patient_token'; // Use token from response if available
        
        print('Patient signup successful');
        
        notifyListeners();
        return true;
      } else {
        final errorMsg = responseData['error'] ?? responseData['message'] ?? 'Patient signup failed';
        print('Patient signup failed: $errorMsg');
        _setError(errorMsg);
        return false;
      }
    } catch (e) {
      print('Patient signup exception: $e');
      _setError(_getNetworkErrorMessage(e));
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // AMBULANCE EMPLOYER SIGNUP
  Future<bool> ambulanceEmployerSignup({
    required String email,
    required String password,
    required String name,
    String? phoneNumber,
    required String gender,
    int? age,
    DateTime? dateOfBirth,
    String? companyName,
    String? licenseNumber,
    String? serviceArea,
    String? emergencyContact,
  }) async {
    try {
      _setLoading(true);
      _setError(null);

      final currentBaseUrl = baseUrl;
      print('Starting ambulance employer signup for $email');
      print('Using API URL: $currentBaseUrl');

      // Validate required fields
      if (age == null || age <= 0) {
        _setError('Age is required and must be valid');
        return false;
      }

      if (dateOfBirth == null) {
        _setError('Date of birth is required');
        return false;
      }

      final requestData = {
        'email': email.trim(),
        'password': password,
        'name': name.trim(),
        'gender': gender,
        'age': age,
        'dateOfBirth': dateOfBirth.toIso8601String(),
      };

      // Add optional fields only if they have values
      if (phoneNumber != null && phoneNumber.trim().isNotEmpty) {
        requestData['phoneNumber'] = phoneNumber.trim();
      }
      
      if (companyName != null && companyName.trim().isNotEmpty) {
        requestData['companyName'] = companyName.trim();
      }
      
      if (licenseNumber != null && licenseNumber.trim().isNotEmpty) {
        requestData['licenseNumber'] = licenseNumber.trim();
      }
      
      if (serviceArea != null && serviceArea.trim().isNotEmpty) {
        requestData['serviceArea'] = serviceArea.trim();
      }
      
      if (emergencyContact != null && emergencyContact.trim().isNotEmpty) {
        requestData['emergencyContact'] = emergencyContact.trim();
      }

      final uri = Uri.parse('$currentBaseUrl/auth/ambulance-employer/signup');
      print('Request URL: $uri');

      final response = await http.post(
        uri,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: json.encode(requestData),
      ).timeout(const Duration(seconds: 30));

      print('Response status: ${response.statusCode}');
      print('Response body: ${response.body}');

      if (response.body.isEmpty) {
        print('Empty response body received');
        _setError('Server returned empty response');
        return false;
      }

      final responseData = json.decode(response.body);

      if (response.statusCode == 201 && responseData['success'] == true) {
        final userData = responseData['user'] ?? 
                        responseData['employer'] ?? 
                        responseData['ambulanceEmployer'];
        
        if (userData == null) {
          print('No user data in successful response');
          _setError('Invalid response format from server');
          return false;
        }

        _currentUser = userData;
        _userType = 'ambulance_employer';
        _authToken = responseData['token'];
        
        print('Ambulance employer signup successful');
        
        notifyListeners();
        return true;
      } else {
        final errorMsg = responseData['message'] ?? 'Ambulance employer signup failed';
        print('Ambulance employer signup failed: $errorMsg');
        _setError(errorMsg);
        return false;
      }
    } catch (e) {
      print('Ambulance employer signup exception: $e');
      _setError(_getNetworkErrorMessage(e));
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // PATIENT LOGIN - Using same API as web frontend
  Future<bool> patientLogin({
    required String email,
    required String password,
  }) async {
    try {
      _setLoading(true);
      _setError(null);

      final currentBaseUrl = baseUrl;
      print('Starting patient login process...');
      print('Using API URL: $currentBaseUrl');

      // Use the proper patient login endpoint
      final requestBody = {
        'email': email.trim(),
        'password': password,
      };
      
      print('🔐 Login request body: ${json.encode(requestBody)}');
      print('🔐 Login headers: $_authHeaders');
      
      final response = await http.post(
        Uri.parse('$currentBaseUrl/auth/patient/login'),
        headers: _authHeaders,
        body: json.encode(requestBody),
      ).timeout(const Duration(seconds: 30));

      print('Login response status: ${response.statusCode}');
      print('Login response body: ${response.body}');

      if (response.statusCode == 200) {
        final responseData = json.decode(response.body);
        if (responseData['success'] == true) {
          _currentUser = responseData['patient'];
          _userType = 'patient';
          _authToken = responseData['token'];
        
          print('Patient login successful');
          
          notifyListeners();
          return true;
        }
      }

      _setError('Patient not found or invalid credentials');
      return false;
    } catch (e) {
      print('Patient login exception: $e');
      _setError(_getNetworkErrorMessage(e));
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // AMBULANCE EMPLOYER LOGIN
  Future<bool> ambulanceEmployerLogin({
    required String email,
    required String password,
  }) async {
    try {
      _setLoading(true);
      _setError(null);

      final currentBaseUrl = baseUrl;
      print('Starting ambulance employer login process...');
      print('Using API URL: $currentBaseUrl');

      final response = await http.post(
        Uri.parse('$currentBaseUrl/auth/ambulance-employer/login'),
        headers: _authHeaders,
        body: json.encode({
          'email': email.trim(),
          'password': password,
        }),
      ).timeout(const Duration(seconds: 30));

      print('Response status: ${response.statusCode}');

      if (response.body.isEmpty) {
        _setError('Server returned empty response');
        return false;
      }

      final responseData = json.decode(response.body);

      if (response.statusCode == 200 && responseData['success'] == true) {
        _currentUser = responseData['employer'];
        _userType = 'ambulance_employer';
        _authToken = responseData['token'];
        
        print('Ambulance employer login successful');
        
        notifyListeners();
        return true;
      } else {
        final errorMsg = responseData['message'] ?? 'Login failed';
        print('Ambulance employer login failed: $errorMsg');
        _setError(errorMsg);
        return false;
      }
    } catch (e) {
      print('Ambulance employer login exception: $e');
      _setError(_getNetworkErrorMessage(e));
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // UNIVERSAL LOGIN (detects user type automatically)
  Future<bool> login({
    required String email,
    required String password,
  }) async {
    // Try patient login first
    bool patientLoginSuccess = await patientLogin(email: email, password: password);
    
    if (patientLoginSuccess) {
      return true;
    }

    // If patient login fails, try ambulance employer login
    clearError(); // Clear the patient login error
    bool employerLoginSuccess = await ambulanceEmployerLogin(email: email, password: password);
    
    return employerLoginSuccess;
  }

  // LOGOUT
  Future<bool> logout() async {
    try {
      _setLoading(true);
      _setError(null);

      final currentBaseUrl = baseUrl;
      final response = await http.post(
        Uri.parse('$currentBaseUrl/auth/logout'),
        headers: {
          'Content-Type': 'application/json',
        },
      ).timeout(const Duration(seconds: 15));

      print('Logout response status: ${response.statusCode}');

      // Clear local state regardless of response
      clearAuth();
      
      print('User logged out successfully');
      return true;
    } catch (e) {
      print('Logout exception: $e');
      _setError('Logout error: ${e.toString()}');
      
      // Still clear local state even if network request fails
      clearAuth();
      
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // CHECK AUTHENTICATION STATUS
  Future<bool> checkAuthStatus() async {
    try {
      _setLoading(true);
      _setError(null);

      final currentBaseUrl = baseUrl;

      // Try to check patient auth first
      try {
        final patientResponse = await http.get(
          Uri.parse('$currentBaseUrl/patients/check-auth'),
          headers: _authHeaders,
        ).timeout(const Duration(seconds: 15));

        if (patientResponse.statusCode == 200) {
          final responseData = json.decode(patientResponse.body);
          if (responseData['success'] == true) {
            _currentUser = responseData['patient'];
            _userType = 'patient';
            _authToken = 'valid';
            
            print('Patient auth check successful');
            notifyListeners();
            return true;
          }
        }
      } catch (e) {
        print('Patient auth check failed, trying ambulance employer...');
      }

      // Try to check ambulance employer auth
      try {
        final employerResponse = await http.get(
          Uri.parse('$currentBaseUrl/ambulance-employers/check-auth'),
          headers: _authHeaders,
        ).timeout(const Duration(seconds: 15));

        if (employerResponse.statusCode == 200) {
          final responseData = json.decode(employerResponse.body);
          if (responseData['success'] == true) {
            _currentUser = responseData['employer'];
            _userType = 'ambulance_employer';
            _authToken = 'valid';
            
            print('Ambulance employer auth check successful');
            notifyListeners();
            return true;
          }
        }
      } catch (e) {
        print('Ambulance employer auth check failed');
      }

      // If both fail, clear auth state
      clearAuth();
      
      print('No valid authentication found');
      return false;
      
    } catch (e) {
      print('Auth check exception: $e');
      _setError('Authentication check failed');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // UPDATE PATIENT PROFILE
  Future<bool> updatePatientProfile(Map<String, dynamic> profileData) async {
    try {
      _setLoading(true);
      _setError(null);

      final currentBaseUrl = baseUrl;
      final response = await http.put(
        Uri.parse('$currentBaseUrl/patients/update-profile'),
        headers: {
          'Content-Type': 'application/json',
        },
        body: json.encode(profileData),
      ).timeout(const Duration(seconds: 30));

      final responseData = json.decode(response.body);

      if (response.statusCode == 200 && responseData['success'] == true) {
        _currentUser = responseData['patient'];
        
        print('Patient profile updated successfully');
        notifyListeners();
        return true;
      } else {
        final errorMsg = responseData['message'] ?? 'Profile update failed';
        _setError(errorMsg);
        return false;
      }
    } catch (e) {
      print('Update patient profile exception: $e');
      _setError(_getNetworkErrorMessage(e));
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // UPDATE AMBULANCE EMPLOYER PROFILE
  Future<bool> updateAmbulanceEmployerProfile(Map<String, dynamic> profileData) async {
    try {
      _setLoading(true);
      _setError(null);

      final currentBaseUrl = baseUrl;
      final response = await http.put(
        Uri.parse('$currentBaseUrl/ambulance-employers/update-profile'),
        headers: {
          'Content-Type': 'application/json',
        },
        body: json.encode(profileData),
      ).timeout(const Duration(seconds: 30));

      final responseData = json.decode(response.body);

      if (response.statusCode == 200 && responseData['success'] == true) {
        _currentUser = responseData['employer'];
        
        print('Ambulance employer profile updated successfully');
        notifyListeners();
        return true;
      } else {
        final errorMsg = responseData['message'] ?? 'Profile update failed';
        _setError(errorMsg);
        return false;
      }
    } catch (e) {
      print('Update ambulance employer profile exception: $e');
      _setError(_getNetworkErrorMessage(e));
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // GENERIC SIGNUP METHOD
  Future<bool> signupByType({
    required String userType,
    required String email,
    required String password,
    required String name,
    String? phoneNumber,
    required String gender,
    int? age,
    DateTime? dateOfBirth,
    // Patient-specific fields
    String? bloodType,
    List<String>? allergies,
    List<Map<String, dynamic>>? medicalHistory,
    List<Map<String, dynamic>>? currentMedications,
    // Ambulance employer-specific fields
    String? companyName,
    String? licenseNumber,
    String? serviceArea,
    String? emergencyContact,
  }) async {
    print('Generic signup called for user type: $userType');
    
    if (userType.toLowerCase() == 'patient') {
      // Parse name into first and last name
      final nameParts = name.split(' ');
      final firstName = nameParts.isNotEmpty ? nameParts[0] : '';
      final lastName = nameParts.length > 1 ? nameParts.sublist(1).join(' ') : '';
      
      // Convert List<String> allergies to Map structure if needed
      Map<String, dynamic>? allergiesData;
      if (allergies != null && allergies.isNotEmpty) {
        allergiesData = {
          'medicinal': allergies.map((allergy) => {
            'name': allergy,
            'reaction': '',
            'criticality': 'Medium',
            'notes': ''
          }).toList(),
          'food': [],
          'environmental': []
        };
      }

      return await signup(
        email: email,
        password: password,
        firstName: firstName,
        lastName: lastName,
        phoneNumber: phoneNumber ?? '',
        gender: gender,
        dateOfBirth: dateOfBirth!,
        allergies: allergiesData,
        emergencyContact: emergencyContact != null ? {'phoneNumber': emergencyContact} : null,
      );
    } else if (userType.toLowerCase() == 'ambulance employer') {
      return await ambulanceEmployerSignup(
        email: email,
        password: password,
        name: name,
        phoneNumber: phoneNumber,
        gender: gender,
        age: age,
        dateOfBirth: dateOfBirth,
        companyName: companyName,
        licenseNumber: licenseNumber,
        serviceArea: serviceArea,
        emergencyContact: emergencyContact,
      );
    } else {
      _setError('Invalid user type: $userType');
      return false;
    }
  }

  // TEST CONNECTION
  Future<bool> testConnection() async {
    try {
      final serverUrl = ConfigService.instance.serverUrl;
      print('Testing connection to: $serverUrl/health');
      
      final response = await http.get(
        Uri.parse('$serverUrl/health'),
        headers: {
          'Content-Type': 'application/json',
        },
      ).timeout(const Duration(seconds: 10));

      print('Test response status: ${response.statusCode}');

      if (response.statusCode == 200) {
        final responseData = json.decode(response.body);
        print('Connection test successful: ${responseData['message']}');
        return true;
      } else {
        print('Connection test failed with status: ${response.statusCode}');
        return false;
      }
    } catch (e) {
      print('Connection test exception: $e');
      return false;
    }
  }

  // GET USER PROFILE
  Future<bool> getUserProfile() async {
    try {
      _setLoading(true);
      _setError(null);

      final currentBaseUrl = baseUrl;
      String endpoint = '';
      if (_userType == 'patient') {
        endpoint = '$currentBaseUrl/patients/check-auth';
      } else if (_userType == 'ambulance_employer') {
        endpoint = '$currentBaseUrl/ambulance-employers/check-auth';
      } else {
        _setError('Unknown user type');
        return false;
      }

      final response = await http.get(
        Uri.parse(endpoint),
        headers: _authHeaders,
      ).timeout(const Duration(seconds: 15));

      print('Profile response status: ${response.statusCode}');

      if (response.statusCode == 200) {
        final responseData = json.decode(response.body);
        if (responseData['success'] == true) {
          _currentUser = responseData['patient'] ?? responseData['employer'];
          
          print('Profile retrieved successfully');
          notifyListeners();
          return true;
        }
      }
      
      // If profile retrieval fails, clear auth
      clearAuth();
      return false;
      
    } catch (e) {
      print('Get profile exception: $e');
      clearAuth();
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // INITIALIZE AUTH
  Future<void> initializeAuth() async {
    try {
      print('Initializing authentication...');
      
      // Initialize ConfigService first
      await ConfigService.initialize();
      
      // Test the connection
      bool connectionOk = await testConnection();
      if (!connectionOk) {
        print('Cannot connect to server during initialization');
        return;
      }

      // Try to get current user profile
      bool authValid = await checkAuthStatus();
      if (authValid) {
        print('Authentication initialized successfully');
      } else {
        print('No valid authentication found during initialization');
      }
    } catch (e) {
      print('Auth initialization exception: $e');
    }
  }

  // Helper method to get user-friendly error messages
  String _getNetworkErrorMessage(dynamic error) {
    final errorStr = error.toString().toLowerCase();
    
    if (errorStr.contains('socketerror') || 
        errorStr.contains('connection refused') ||
        errorStr.contains('network is unreachable')) {
      return 'Cannot connect to server. Please check your network connection and server configuration.';
    } else if (errorStr.contains('timeoutexception') ||
               errorStr.contains('timeout')) {
      return 'Connection timed out. Please check your server address and try again.';
    } else if (errorStr.contains('formatexception') ||
               errorStr.contains('unexpected character')) {
      return 'Invalid server response. Please verify your server configuration.';
    } else if (errorStr.contains('handshakeexception')) {
      return 'SSL/TLS connection error. Please check your server configuration.';
    } else {
      return 'Network error occurred. Please check your connection and server settings.';
    }
  }

  // Helper methods
  bool get isPatient => _userType == 'patient';
  bool get isAmbulanceEmployer => _userType == 'ambulance_employer';

  String get userDisplayName {
    if (_currentUser == null) return 'Guest';
    return _currentUser!['name'] ?? 'Unknown User';
  }

  String get userEmail {
    if (_currentUser == null) return '';
    return _currentUser!['email'] ?? '';
  }

  String get userId {
    if (_currentUser == null) return '';
    return _currentUser!['id'] ?? '';
  }

  // Get current server configuration info (async version for UI)
  Future<Map<String, dynamic>> get serverConfig async {
    final config = await ConfigService.instance.getConfigInfo();
    return {
      'baseUrl': config['baseUrl'],
      'serverUrl': config['serverUrl'],
      'currentIP': config['currentIP'],
      'currentPort': config['currentPort'],
      'isUsingCustom': config['isUsingCustom'],
      'status': 'configured',
    };
  }

  // Update server configuration and notify listeners
  Future<bool> updateServerConfig({
    required String ip,
    required String port,
  }) async {
    try {
      print('Updating server configuration to: $ip:$port');
      
      await ConfigService.instance.updateIP(ip);
      await ConfigService.instance.updatePort(port);
      
      print('Server configuration updated successfully');
      notifyListeners(); // Notify UI to refresh
      return true;
    } catch (e) {
      print('Error updating server config: $e');
      _setError('Failed to update server configuration: $e');
      return false;
    }
  }

  // Reset server configuration and notify listeners
  Future<void> resetServerConfig() async {
    try {
      print('Resetting server configuration to defaults');
      await ConfigService.instance.resetToDefaults();
      print('Server configuration reset successfully');
      notifyListeners(); // Notify UI to refresh
    } catch (e) {
      print('Error resetting server config: $e');
      _setError('Failed to reset server configuration: $e');
    }
  }

  // DEBUG: Print current state
  Future<void> debugPrintState() async {
    print('AuthProvider Debug State:');
    print('   • Is Loading: $_isLoading');
    print('   • Is Authenticated: $isAuthenticated');
    print('   • User Type: $_userType');
    print('   • Has Token: ${_authToken != null}');
    print('   • Has User: ${_currentUser != null}');
    print('   • Error: $_errorMessage');
    print('   • Current Base URL: $baseUrl');
    
    if (_currentUser != null) {
      print('   • User ID: ${_currentUser!['id']}');
      print('   • User Name: ${_currentUser!['name']}');
      print('   • User Email: ${_currentUser!['email']}');
    }
    
    // Print config info
    await ConfigService.instance.printConfig();
  }
}