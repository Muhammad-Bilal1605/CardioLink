//ambulance_screen.dart - Complete with Map Integration
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:location/location.dart' as loc;
import 'package:geocoding/geocoding.dart';
import 'dart:async';
import 'dart:math' as math;
import 'package:http/http.dart' as http;
import 'dart:convert';

// Import your services and models
import '../services/location_service.dart';
import '../backend/models/location_model.dart';
import '../services/config_service.dart';
import 'ambulance_map_screen.dart'; // Import the map screen

class AmbulanceScreen extends StatefulWidget {
  const AmbulanceScreen({Key? key}) : super(key: key);

  @override
  State<AmbulanceScreen> createState() => _AmbulanceScreenState();
}

class _AmbulanceScreenState extends State<AmbulanceScreen>
    with TickerProviderStateMixin {
  late AnimationController _pulseController;
  late AnimationController _emergencyController;
  late AnimationController _locationController;
  late AnimationController _rippleController;
  late Animation<double> _pulseAnimation;
  late Animation<double> _scaleAnimation;
  late Animation<double> _rotationAnimation;
  late Animation<double> _rippleAnimation;

  // Location data
  LocationDataModel _locationData = const LocationDataModel();
  Timer? _locationTimer;
  bool _emergencyActive = false;
  bool _sendingRequest = false; // For send info button loading state

  // Get base URL from config service
  String get baseUrl => ConfigService.instance.baseUrl;

  @override
  void initState() {
    super.initState();
    _initializeAnimations();
    _requestLocationOnStart();
  }

  void _initializeAnimations() {
    _pulseController = AnimationController(
      duration: const Duration(seconds: 2),
      vsync: this,
    )..repeat();

    _emergencyController = AnimationController(
      duration: const Duration(milliseconds: 800),
      vsync: this,
    );

    _locationController = AnimationController(
      duration: const Duration(milliseconds: 2000),
      vsync: this,
    );

    _rippleController = AnimationController(
      duration: const Duration(milliseconds: 1500),
      vsync: this,
    );

    _pulseAnimation = Tween<double>(
      begin: 1.0,
      end: 1.15,
    ).animate(CurvedAnimation(
      parent: _pulseController,
      curve: Curves.easeInOut,
    ));

    _scaleAnimation = Tween<double>(
      begin: 1.0,
      end: 0.85,
    ).animate(CurvedAnimation(
      parent: _emergencyController,
      curve: Curves.elasticOut,
    ));

    _rotationAnimation = Tween<double>(
      begin: 0.0,
      end: 2.0,
    ).animate(CurvedAnimation(
      parent: _locationController,
      curve: Curves.easeInOut,
    ));

    _rippleAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _rippleController,
      curve: Curves.easeOut,
    ));
  }

  void _requestLocationOnStart() {
    // Automatically request location when screen loads
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _detectCurrentLocation();
    });
  }

  Future<void> _detectCurrentLocation() async {
    setState(() {
      _locationData = _locationData.copyWith(
        isDetecting: true,
        error: null,
      );
    });

    _locationController.forward();

    try {
      // Get current position using LocationService
      loc.LocationData? locationData = await LocationService.instance.getCurrentPosition();
      
      if (locationData != null && locationData.latitude != null && locationData.longitude != null) {
        // Get address from coordinates
        String? address = await LocationService.instance
            .getAddressFromCoordinates(locationData.latitude!, locationData.longitude!);
        
        // Format coordinates
        String coordinates = LocationService.instance
            .getFormattedCoordinates(locationData.latitude!, locationData.longitude!);

        setState(() {
          _locationData = _locationData.copyWith(
            latitude: locationData.latitude,
            longitude: locationData.longitude,
            address: address ?? "Address not found",
            coordinates: coordinates,
            isDetecting: false,
            error: null,
            timestamp: DateTime.now(),
          );
        });
      } else {
        throw Exception('Unable to get location');
      }
    } catch (e) {
      String errorMessage;
      if (e.toString().contains('permission')) {
        errorMessage = "Location permission denied";
      } else if (e.toString().contains('disabled')) {
        errorMessage = "Location services disabled";
      } else {
        errorMessage = "Unable to detect location";
      }

      setState(() {
        _locationData = _locationData.copyWith(
          isDetecting: false,
          error: errorMessage,
        );
      });
    }

    _locationController.reverse();
  }

  void _onLocationTap() {
    if (_locationData.hasError) {
      _showLocationErrorDialog();
    } else if (!_locationData.hasLocation) {
      _detectCurrentLocation();
    } else {
      _showLocationDetails(context);
    }
  }

  void _showLocationErrorDialog() {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
          ),
          backgroundColor: const Color(0xFF24243e),
          title: const Row(
            children: [
              Icon(Icons.location_off, color: Colors.red),
              SizedBox(width: 10),
              Text(
                "Location Error",
                style: TextStyle(color: Colors.white),
              ),
            ],
          ),
          content: Text(
            _locationData.error ?? "Unknown location error",
            style: const TextStyle(color: Colors.white70),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text("Cancel"),
            ),
            TextButton(
              onPressed: () {
                Navigator.pop(context);
                _openLocationSettings();
              },
              child: const Text("Settings"),
            ),
            ElevatedButton(
              onPressed: () {
                Navigator.pop(context);
                _detectCurrentLocation();
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.blue,
              ),
              child: const Text("Try Again"),
            ),
          ],
        );
      },
    );
  }

  Future<void> _openLocationSettings() async {
    try {
      // For location package, we can't directly open location settings
      // But we can show a dialog to guide users
      showDialog(
        context: context,
        builder: (context) => AlertDialog(
          title: const Text('Enable Location'),
          content: const Text('Please enable location services in your device settings.'),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('OK'),
            ),
          ],
        ),
      );
    } catch (e) {
      print("Error opening location settings: $e");
    }
  }

  Future<void> _callEmergency() async {
    setState(() {
      _emergencyActive = true;
    });

    // Multiple haptic feedback for urgency
    HapticFeedback.heavyImpact();
    await Future.delayed(const Duration(milliseconds: 100));
    HapticFeedback.heavyImpact();

    // Start ripple animation
    _rippleController.forward().then((_) => _rippleController.reverse());

    // Button press animation
    await _emergencyController.forward();
    await _emergencyController.reverse();

    // Emergency call
    const String emergencyNumber = "tel:911"; // Change to local emergency number
    try {
      if (await canLaunchUrl(Uri.parse(emergencyNumber))) {
        await launchUrl(Uri.parse(emergencyNumber));
      }
    } catch (e) {
      print("Could not launch $emergencyNumber");
    }

    // Show confirmation dialog
    _showEmergencyDialog();

    setState(() {
      _emergencyActive = false;
    });
  }

  // Send patient info to ambulance employers using config service
  Future<void> _sendInfoToAmbulance() async {
    if (!_locationData.hasLocation) {
      _showErrorDialog('Location Required', 'Please enable location services to send your location to ambulance services.');
      return;
    }

    setState(() {
      _sendingRequest = true;
    });

    try {
      // Mock patient data - replace with actual auth provider data
      final requestData = {
        'patientId': 'patient_${DateTime.now().millisecondsSinceEpoch}',
        'patientName': 'Emergency Patient', // Replace with actual name
        'patientEmail': 'patient@example.com', // Replace with actual email
        'phoneNumber': '03425957918', // Replace with actual phone
        'gender': 'Unknown', // Replace with actual gender
        'age': 30, // Replace with actual age
        'bloodType': 'Unknown', // Replace with actual blood type
        'allergies': [], // Replace with actual allergies
        'emergencyContact': '03425957918', // Replace with actual emergency contact
        'medicalHistory': [], // Replace with actual medical history
        'currentMedications': [], // Replace with actual medications
        'location': {
          'latitude': _locationData.latitude,
          'longitude': _locationData.longitude,
          'address': _locationData.address,
          'coordinates': _locationData.coordinates,
        },
        'urgency': 'High',
        'condition': 'Emergency Request',
        'requestTime': DateTime.now().toIso8601String(),
        'status': 'Pending',
      };

      print('🚑 Sending ambulance request to: $baseUrl/ambulance-requests');
      print('🚑 Request data: ${json.encode(requestData)}');

      final response = await http.post(
        Uri.parse('$baseUrl/ambulance-requests'),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: json.encode(requestData),
      );

      print('📥 Response status: ${response.statusCode}');
      print('📥 Response body: ${response.body}');

      if (response.statusCode == 201) {
        final responseData = json.decode(response.body);
        if (responseData['success'] == true) {
          _showSuccessDialog();
        } else {
          _showErrorDialog('Request Failed', responseData['message'] ?? 'Failed to send ambulance request');
        }
      } else {
        final responseData = json.decode(response.body);
        _showErrorDialog('Request Failed', responseData['message'] ?? 'Failed to send ambulance request');
      }

    } catch (e) {
      print('❌ Send ambulance request exception: $e');
      _showErrorDialog('Network Error', 'Failed to send request. Please check your internet connection and try again.');
    } finally {
      setState(() {
        _sendingRequest = false;
      });
    }
  }

  // New method to open map screen
  void _openMapScreen() {
    if (!_locationData.hasLocation) {
      _showErrorDialog('Location Required', 'Please enable location services to view your location on the map.');
      return;
    }

    // Prepare map data
    final mapData = {
      'patientName': 'Emergency Patient', // Replace with actual name
      'latitude': _locationData.latitude,
      'longitude': _locationData.longitude,
      'address': _locationData.address,
      'emergencyType': 'Cardiac Emergency', // Replace with actual emergency type
      'timestamp': _formatTimestamp(_locationData.timestamp ?? DateTime.now()),
      'phoneNumber': '03425957918', // Replace with actual phone
      'coordinates': _locationData.coordinates,
    };

    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => AmbulanceMapScreen(requestData: mapData),
      ),
    );
  }

  void _showSuccessDialog() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (BuildContext context) {
        return Dialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(25),
          ),
          elevation: 0,
          backgroundColor: Colors.transparent,
          child: Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(25),
              gradient: const LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  Color(0xFF4ECDC4),
                  Color(0xFF44A08D),
                  Color(0xFF093637),
                ],
              ),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFF4ECDC4).withOpacity(0.3),
                  blurRadius: 20,
                  spreadRadius: 5,
                ),
              ],
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.2),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.check_circle,
                    color: Colors.white,
                    size: 50,
                  ),
                ),
                const SizedBox(height: 20),
                const Text(
                  "Request Sent Successfully",
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 22,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 12),
                const Text(
                  "Your information has been sent to nearby ambulance services.\nYour location has been shared\nPlease wait for confirmation from an ambulance provider.",
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    height: 1.5,
                  ),
                ),
                const SizedBox(height: 24),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () => Navigator.of(context).pop(),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.white,
                      foregroundColor: const Color(0xFF4ECDC4),
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(25),
                      ),
                      elevation: 0,
                    ),
                    child: const Text(
                      "OK",
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 18,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  void _showErrorDialog(String title, String message) {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
          ),
          backgroundColor: const Color(0xFF24243e),
          title: Row(
            children: [
              const Icon(Icons.error_outline, color: Colors.red),
              const SizedBox(width: 10),
              Text(
                title,
                style: const TextStyle(color: Colors.white),
              ),
            ],
          ),
          content: Text(
            message,
            style: const TextStyle(color: Colors.white70),
          ),
          actions: [
            ElevatedButton(
              onPressed: () => Navigator.pop(context),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.blue,
              ),
              child: const Text("OK"),
            ),
          ],
        );
      },
    );
  }

  void _showEmergencyDialog() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (BuildContext context) {
        return Dialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(25),
          ),
          elevation: 0,
          backgroundColor: Colors.transparent,
          child: Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(25),
              gradient: const LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  Color(0xFFFF4757),
                  Color(0xFFFF6B8A),
                  Color(0xFFFF8A94),
                ],
              ),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFFFF4757).withOpacity(0.3),
                  blurRadius: 20,
                  spreadRadius: 5,
                ),
              ],
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.2),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.local_hospital,
                    color: Colors.white,
                    size: 50,
                  ),
                ),
                const SizedBox(height: 20),
                const Text(
                  "Emergency Call Initiated",
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 22,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  "Ambulance has been contacted\n${_locationData.hasLocation ? 'Your location has been shared' : 'Location sharing unavailable'}\nStay calm and wait for assistance",
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    height: 1.5,
                  ),
                ),
                const SizedBox(height: 24),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () => Navigator.of(context).pop(),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.white,
                      foregroundColor: const Color(0xFFFF4757),
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(25),
                      ),
                      elevation: 0,
                    ),
                    child: const Text(
                      "OK",
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 18,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  @override
  void dispose() {
    _pulseController.dispose();
    _emergencyController.dispose();
    _locationController.dispose();
    _rippleController.dispose();
    _locationTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              Color(0xFF0F0C29),
              Color(0xFF24243e),
              Color(0xFF302B63),
              Color(0xFF0F0C29),
            ],
          ),
        ),
        child: SafeArea(
          child: Column(
            children: [
              // Header with glassmorphism effect
              Container(
                margin: const EdgeInsets.all(20),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: Colors.white.withOpacity(0.2),
                  ),
                ),
                child: Row(
                  children: [
                    Container(
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: IconButton(
                        onPressed: () => Navigator.pop(context),
                        icon: const Icon(
                          Icons.arrow_back_ios_new,
                          color: Colors.white,
                          size: 20,
                        ),
                      ),
                    ),
                    const Expanded(
                      child: Text(
                        "Emergency Ambulance",
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    Container(
                      decoration: BoxDecoration(
                        color: Colors.green.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      padding: const EdgeInsets.all(8),
                      child: const Icon(
                        Icons.verified_user,
                        color: Colors.green,
                        size: 20,
                      ),
                    ),
                  ],
                ),
              ),

              // Emergency Button Section
              Expanded(
                child: SingleChildScrollView(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const SizedBox(height: 20),

                      // Ripple Effect Background
                      AnimatedBuilder(
                        animation: _rippleAnimation,
                        builder: (context, child) {
                          return Stack(
                            alignment: Alignment.center,
                            children: [
                              // Outer ripple
                              if (_rippleAnimation.value > 0)
                                Container(
                                  width: 300 * _rippleAnimation.value,
                                  height: 300 * _rippleAnimation.value,
                                  decoration: BoxDecoration(
                                    shape: BoxShape.circle,
                                    border: Border.all(
                                      color: Colors.red.withOpacity(0.3 * (1 - _rippleAnimation.value)),
                                      width: 2,
                                    ),
                                  ),
                                ),
                              // Middle ripple
                              if (_rippleAnimation.value > 0)
                                Container(
                                  width: 250 * _rippleAnimation.value,
                                  height: 250 * _rippleAnimation.value,
                                  decoration: BoxDecoration(
                                    shape: BoxShape.circle,
                                    border: Border.all(
                                      color: Colors.red.withOpacity(0.5 * (1 - _rippleAnimation.value)),
                                      width: 3,
                                    ),
                                  ),
                                ),
                              // Emergency Button
                              AnimatedBuilder(
                                animation: _pulseAnimation,
                                builder: (context, child) {
                                  return Transform.scale(
                                    scale: _pulseAnimation.value,
                                    child: Container(
                                      width: 220,
                                      height: 220,
                                      decoration: BoxDecoration(
                                        shape: BoxShape.circle,
                                        gradient: const RadialGradient(
                                          colors: [
                                            Color(0xFFFF4757),
                                            Color(0xFFFF3742),
                                            Color(0xFFE63946),
                                          ],
                                        ),
                                        boxShadow: [
                                          BoxShadow(
                                            color: const Color(0xFFFF4757).withOpacity(0.6),
                                            blurRadius: 40,
                                            spreadRadius: 10,
                                          ),
                                          BoxShadow(
                                            color: const Color(0xFFFF4757).withOpacity(0.3),
                                            blurRadius: 80,
                                            spreadRadius: 20,
                                          ),
                                        ],
                                      ),
                                      child: AnimatedBuilder(
                                        animation: _scaleAnimation,
                                        builder: (context, child) {
                                          return Transform.scale(
                                            scale: _emergencyActive ? _scaleAnimation.value : 1.0,
                                            child: Material(
                                              color: Colors.transparent,
                                              child: InkWell(
                                                onTap: _callEmergency,
                                                borderRadius: BorderRadius.circular(110),
                                                child: Container(
                                                  width: double.infinity,
                                                  height: double.infinity,
                                                  decoration: const BoxDecoration(
                                                    shape: BoxShape.circle,
                                                  ),
                                                  child: Column(
                                                    mainAxisAlignment: MainAxisAlignment.center,
                                                    children: [
                                                      Container(
                                                        padding: const EdgeInsets.all(16),
                                                        decoration: BoxDecoration(
                                                          color: Colors.white.withOpacity(0.2),
                                                          shape: BoxShape.circle,
                                                        ),
                                                        child: const Icon(
                                                          Icons.local_hospital,
                                                          color: Colors.white,
                                                          size: 60,
                                                        ),
                                                      ),
                                                      const SizedBox(height: 12),
                                                      const Text(
                                                        "EMERGENCY",
                                                        style: TextStyle(
                                                          color: Colors.white,
                                                          fontSize: 18,
                                                          fontWeight: FontWeight.bold,
                                                          letterSpacing: 3,
                                                        ),
                                                      ),
                                                      const Text(
                                                        "TAP TO CALL",
                                                        style: TextStyle(
                                                          color: Colors.white,
                                                          fontSize: 12,
                                                          fontWeight: FontWeight.w500,
                                                          letterSpacing: 2,
                                                        ),
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
                                  );
                                },
                              ),
                            ],
                          );
                        },
                      ),

                      const SizedBox(height: 40),

                      // Status Text
                      Container(
                        margin: const EdgeInsets.symmetric(horizontal: 40),
                        padding: const EdgeInsets.symmetric(
                          horizontal: 28,
                          vertical: 16,
                        ),
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            colors: [
                              Colors.white.withOpacity(0.1),
                              Colors.white.withOpacity(0.05),
                            ],
                          ),
                          borderRadius: BorderRadius.circular(30),
                          border: Border.all(
                            color: Colors.white.withOpacity(0.3),
                          ),
                        ),
                        child: const Text(
                          "ONE TAP • INSTANT HELP",
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                            letterSpacing: 1.5,
                          ),
                        ),
                      ),

                      const SizedBox(height: 30),

                      // Send Info to Ambulance Button
                      Container(
                        margin: const EdgeInsets.symmetric(horizontal: 20),
                        child: SizedBox(
                          width: double.infinity,
                          height: 60,
                          child: ElevatedButton(
                            onPressed: _sendingRequest ? null : _sendInfoToAmbulance,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFF4ECDC4),
                              foregroundColor: Colors.white,
                              elevation: 8,
                              shadowColor: const Color(0xFF4ECDC4).withOpacity(0.5),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(30),
                              ),
                            ),
                            child: _sendingRequest
                                ? const Row(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      SizedBox(
                                        width: 20,
                                        height: 20,
                                        child: CircularProgressIndicator(
                                          color: Colors.white,
                                          strokeWidth: 2,
                                        ),
                                      ),
                                      SizedBox(width: 12),
                                      Text(
                                        "Sending Request...",
                                        style: TextStyle(
                                          fontSize: 16,
                                          fontWeight: FontWeight.w600,
                                        ),
                                      ),
                                    ],
                                  )
                                : const Row(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Icon(
                                        Icons.send,
                                        size: 24,
                                      ),
                                      SizedBox(width: 12),
                                      Text(
                                        "Send Info to Ambulance",
                                        style: TextStyle(
                                          fontSize: 16,
                                          fontWeight: FontWeight.w600,
                                        ),
                                      ),
                                    ],
                                  ),
                          ),
                        ),
                      ),

                      const SizedBox(height: 15),

                      // Check on Maps Button - NEW FEATURE
                      Container(
                        margin: const EdgeInsets.symmetric(horizontal: 20),
                        child: SizedBox(
                          width: double.infinity,
                          height: 60,
                          child: ElevatedButton(
                            onPressed: _locationData.hasLocation ? _openMapScreen : null,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFF3366FF),
                              foregroundColor: Colors.white,
                              elevation: 8,
                              shadowColor: const Color(0xFF3366FF).withOpacity(0.5),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(30),
                              ),
                              disabledBackgroundColor: Colors.grey.withOpacity(0.3),
                            ),
                            child: const Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(
                                  Icons.map,
                                  size: 24,
                                ),
                                SizedBox(width: 12),
                                Text(
                                  "Check on Maps",
                                  style: TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),

                      const SizedBox(height: 20),

                      // Location Information Section
                      Container(
                        margin: const EdgeInsets.symmetric(horizontal: 20),
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            colors: [
                              Colors.white.withOpacity(0.1),
                              Colors.white.withOpacity(0.05),
                            ],
                          ),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(
                            color: Colors.white.withOpacity(0.3),
                          ),
                        ),
                        child: InkWell(
                          onTap: _onLocationTap,
                          borderRadius: BorderRadius.circular(20),
                          child: Row(
                            children: [
                              AnimatedBuilder(
                                animation: _rotationAnimation,
                                builder: (context, child) {
                                  return Transform.rotate(
                                    angle: _locationData.isDetecting ? _rotationAnimation.value * math.pi : 0,
                                    child: Container(
                                      padding: const EdgeInsets.all(10),
                                      decoration: BoxDecoration(
                                        gradient: LinearGradient(
                                          colors: _locationData.hasError
                                              ? [Colors.red, Colors.redAccent]
                                              : _locationData.hasLocation
                                                  ? [const Color(0xFF4ECDC4), const Color(0xFF44A08D)]
                                                  : [Colors.orange, Colors.orangeAccent],
                                        ),
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                      child: Icon(
                                        _locationData.hasError
                                            ? Icons.location_off
                                            : _locationData.hasLocation
                                                ? Icons.my_location
                                                : Icons.location_searching,
                                        color: Colors.white,
                                        size: 20,
                                      ),
                                    ),
                                  );
                                },
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      _locationData.displayStatus,
                                      style: const TextStyle(
                                        color: Colors.white,
                                        fontSize: 16,
                                        fontWeight: FontWeight.w500,
                                      ),
                                    ),
                                    if (_locationData.hasAddress || _locationData.hasError)
                                      Padding(
                                        padding: const EdgeInsets.only(top: 4),
                                        child: Text(
                                          _locationData.displayAddress,
                                          style: TextStyle(
                                            color: _locationData.hasError ? Colors.red[300] : Colors.white70,
                                            fontSize: 12,
                                          ),
                                          maxLines: 2,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                      ),
                                  ],
                                ),
                              ),
                              Container(
                                decoration: BoxDecoration(
                                  color: Colors.white.withOpacity(0.1),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: IconButton(
                                  onPressed: _locationData.hasError
                                      ? () => _detectCurrentLocation()
                                      : () => _showLocationDetails(context),
                                  icon: Icon(
                                    _locationData.hasError ? Icons.refresh : Icons.info_outline,
                                    color: Colors.white,
                                    size: 20,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),

                      const SizedBox(height: 20),

                      // Bottom Warning
                      Container(
                        margin: const EdgeInsets.fromLTRB(20, 0, 20, 20),
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            colors: [
                              Colors.amber.withOpacity(0.2),
                              Colors.orange.withOpacity(0.1),
                            ],
                          ),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(
                            color: Colors.amber.withOpacity(0.4),
                          ),
                        ),
                        child: Column(
                          children: [
                            Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.all(6),
                                  decoration: BoxDecoration(
                                    color: Colors.amber.withOpacity(0.3),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Icon(
                                    Icons.warning_amber,
                                    color: Colors.amber[300],
                                    size: 20,
                                  ),
                                ),
                                const SizedBox(width: 12),
                                const Expanded(
                                  child: Text(
                                    "Emergency Use Only",
                                    style: TextStyle(
                                      color: Colors.white,
                                      fontSize: 14,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            const Text(
                              "For life-threatening situations • Stay calm • Provide clear information",
                              style: TextStyle(
                                color: Colors.white70,
                                fontSize: 12,
                                height: 1.3,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showLocationDetails(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (context) {
        return Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: const Color(0xFF24243e),
            borderRadius: const BorderRadius.vertical(top: Radius.circular(25)),
            border: Border.all(
              color: Colors.white.withOpacity(0.2),
            ),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 60,
                height: 6,
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.3),
                  borderRadius: BorderRadius.circular(3),
                ),
              ),
              const SizedBox(height: 20),
              const Text(
                "Your Location Details",
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 20),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(15),
                ),
                child: Column(
                  children: [
                    Row(
                      children: [
                        const Icon(
                          Icons.location_on,
                          color: Colors.white,
                          size: 24,
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            _locationData.displayAddress,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 16,
                            ),
                          ),
                        ),
                      ],
                    ),
                    if (_locationData.coordinates != null) ...[
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          const Icon(
                            Icons.map,
                            color: Colors.white,
                            size: 24,
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Text(
                              _locationData.coordinates!,
                              style: const TextStyle(
                                color: Colors.white70,
                                fontSize: 14,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                    if (_locationData.timestamp != null) ...[
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          const Icon(
                            Icons.access_time,
                            color: Colors.white,
                            size: 24,
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Text(
                              "Last updated: ${_formatTimestamp(_locationData.timestamp!)}",
                              style: const TextStyle(
                                color: Colors.white70,
                                fontSize: 14,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ],
                ),
              ),
              const SizedBox(height: 20),
              Row(
                children: [
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () {
                        Navigator.pop(context);
                        _detectCurrentLocation();
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.blue,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(15),
                        ),
                      ),
                      child: const Text(
                        "Refresh Location",
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () {
                        Navigator.pop(context);
                        if (_locationData.hasLocation) {
                          _openMapScreen();
                        }
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF4ECDC4),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(15),
                        ),
                      ),
                      child: const Text(
                        "View Map",
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
            ],
          ),
        );
      },
    );
  }

  String _formatTimestamp(DateTime timestamp) {
    final now = DateTime.now();
    final difference = now.difference(timestamp);

    if (difference.inMinutes < 1) {
      return "Just now";
    } else if (difference.inMinutes < 60) {
      return "${difference.inMinutes} min ago";
    } else if (difference.inHours < 24) {
      return "${difference.inHours} hour${difference.inHours > 1 ? 's' : ''} ago";
    } else {
      return "${timestamp.day}/${timestamp.month}/${timestamp.year} ${timestamp.hour}:${timestamp.minute.toString().padLeft(2, '0')}";
    }
  }
}