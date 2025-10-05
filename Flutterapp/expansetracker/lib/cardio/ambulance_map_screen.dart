//this is ambulance_map_screen.dart
//
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'dart:async';
import 'package:url_launcher/url_launcher.dart';

class AmbulanceMapScreen extends StatefulWidget {
  final Map<String, dynamic> requestData;

  const AmbulanceMapScreen({
    Key? key,
    required this.requestData,
  }) : super(key: key);

  @override
  _AmbulanceMapScreenState createState() => _AmbulanceMapScreenState();
}

class _AmbulanceMapScreenState extends State<AmbulanceMapScreen>
    with TickerProviderStateMixin {
  GoogleMapController? _mapController;
  late LatLng _patientLocation;
  Map<MarkerId, Marker> _markers = {};
  Set<Circle> _circles = {};
  late AnimationController _pulseController;
  late AnimationController _slideController;
  bool _isLoading = true;
  bool _hasValidLocation = false;
  bool _mapCreated = false;
  
  // Draggable sheet controller
  late DraggableScrollableController _sheetController;
  double _currentSheetSize = 0.45; // Initial size (45% of screen)

  @override
  void initState() {
    super.initState();
    _sheetController = DraggableScrollableController();
    _setupAnimations();
    _initializeLocation();
  }

  void _setupAnimations() {
    _pulseController = AnimationController(
      vsync: this,
      duration: Duration(milliseconds: 2000),
    )..repeat();

    _slideController = AnimationController(
      vsync: this,
      duration: Duration(milliseconds: 600),
    );
    _slideController.forward();
  }

  void _initializeLocation() {
    double latitude = 0.0;
    double longitude = 0.0;

    try {
      print('📍 Request Data: ${widget.requestData}');
      
      // Check if latitude and longitude are directly available
      if (widget.requestData['latitude'] != null &&
          widget.requestData['longitude'] != null) {
        latitude = double.parse(widget.requestData['latitude'].toString());
        longitude = double.parse(widget.requestData['longitude'].toString());
        _hasValidLocation = true;
      } 
      // Check if location is in a nested object
      else if (widget.requestData['location'] != null) {
        var location = widget.requestData['location'];
        if (location is Map) {
          latitude = double.parse(location['latitude'].toString());
          longitude = double.parse(location['longitude'].toString());
          _hasValidLocation = true;
        }
      }
      
      // If no valid location, use default (Islamabad, Pakistan)
      if (!_hasValidLocation) {
        print('⚠️ No valid location, using default coordinates');
        latitude = 33.6844;
        longitude = 73.0479;
      }
      
      print('📍 Using coordinates: Lat: $latitude, Lng: $longitude');
    } catch (e) {
      print('❌ Error parsing location: $e');
      // Default location (Islamabad)
      latitude = 33.6844;
      longitude = 73.0479;
      _hasValidLocation = false;
    }

    _patientLocation = LatLng(latitude, longitude);
    
    // Wait a bit before showing the map
    Future.delayed(Duration(milliseconds: 500), () {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
        // Create markers after map is shown
        Future.delayed(Duration(milliseconds: 300), () {
          if (mounted) {
            _createMarkers();
          }
        });
      }
    });
  }

  void _createMarkers() {
    final markerId = MarkerId('patient_location');
    final marker = Marker(
      markerId: markerId,
      position: _patientLocation,
      icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueRed),
      infoWindow: InfoWindow(
        title: 'Patient Location',
        snippet: widget.requestData['patientName'] ?? 'Emergency Location',
      ),
    );

    if (mounted) {
      setState(() {
        _markers[markerId] = marker;
        
        // Add pulsing circle around patient location
        _circles.add(
          Circle(
            circleId: CircleId('patient_area'),
            center: _patientLocation,
            radius: 200,
            fillColor: Colors.red.withOpacity(0.2),
            strokeColor: Colors.red,
            strokeWidth: 2,
          ),
        );
      });
    }
  }

  void _onMapCreated(GoogleMapController controller) {
    if (!_mapCreated) {
      _mapController = controller;
      _mapCreated = true;
      print('✅ Map created successfully');
      
      // Set map style after a short delay
      Future.delayed(Duration(milliseconds: 500), () {
        _setMapStyle();
        // Animate to patient location
        _animateToPatientLocation();
      });
    }
  }

  void _setMapStyle() async {
    if (_mapController == null) return;
    
    try {
      String style = '''
      [
        {
          "featureType": "poi.business",
          "elementType": "labels",
          "stylers": [{"visibility": "off"}]
        },
        {
          "featureType": "transit.station",
          "elementType": "labels",
          "stylers": [{"visibility": "off"}]
        }
      ]
      ''';
      await _mapController?.setMapStyle(style);
      print('✅ Map style applied');
    } catch (e) {
      print('⚠️ Could not set map style: $e');
    }
  }

  @override
  void dispose() {
    _mapController?.dispose();
    _pulseController.dispose();
    _slideController.dispose();
    _sheetController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[200],
      body: _isLoading
          ? _buildLoadingScreen()
          : Stack(
              children: [
                _buildMap(),
                _buildGradientOverlay(),
                _buildTopBar(),
                _buildBottomInfoCard(),
                _buildFloatingActionButtons(),
              ],
            ),
    );
  }

  Widget _buildLoadingScreen() {
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Color(0xFFFF4757),
            Color(0xFFFF6B6B),
          ],
        ),
      ),
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.2),
                    blurRadius: 20,
                    spreadRadius: 5,
                  ),
                ],
              ),
              child: CircularProgressIndicator(
                color: Color(0xFFFF4757),
                strokeWidth: 3,
              ),
            ),
            SizedBox(height: 30),
            Text(
              'Loading Map...',
              style: GoogleFonts.poppins(
                fontSize: 20,
                fontWeight: FontWeight.w600,
                color: Colors.white,
              ),
            ),
            SizedBox(height: 10),
            Text(
              'Preparing patient location',
              style: GoogleFonts.poppins(
                fontSize: 14,
                color: Colors.white.withOpacity(0.9),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMap() {
    return Container(
      color: Colors.grey[200],
      child: GoogleMap(
        onMapCreated: _onMapCreated,
        initialCameraPosition: CameraPosition(
          target: _patientLocation,
          zoom: 15,
        ),
        markers: _markers.values.toSet(),
        circles: _circles,
        myLocationEnabled: false,
        myLocationButtonEnabled: false,
        zoomControlsEnabled: false,
        compassEnabled: true,
        mapToolbarEnabled: false,
        buildingsEnabled: true,
        trafficEnabled: false,
        rotateGesturesEnabled: true,
        scrollGesturesEnabled: true,
        tiltGesturesEnabled: true,
        zoomGesturesEnabled: true,
        liteModeEnabled: false,
        mapType: MapType.normal,
        minMaxZoomPreference: MinMaxZoomPreference(10, 20),
      ),
    );
  }

  Widget _buildGradientOverlay() {
    return Positioned(
      top: 0,
      left: 0,
      right: 0,
      child: IgnorePointer(
        child: Container(
          height: 200,
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [
                Colors.black.withOpacity(0.6),
                Colors.transparent,
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildTopBar() {
    return SafeArea(
      child: SlideTransition(
        position: Tween<Offset>(
          begin: Offset(0, -1),
          end: Offset.zero,
        ).animate(CurvedAnimation(
          parent: _slideController,
          curve: Curves.easeOut,
        )),
        child: Padding(
          padding: EdgeInsets.all(20),
          child: Row(
            children: [
              _buildBackButton(),
              SizedBox(width: 15),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      'Emergency Location',
                      style: GoogleFonts.poppins(
                        fontSize: 20,
                        fontWeight: FontWeight.w700,
                        color: Colors.white,
                        shadows: [
                          Shadow(
                            color: Colors.black.withOpacity(0.5),
                            blurRadius: 10,
                          ),
                        ],
                      ),
                    ),
                    Row(
                      children: [
                        AnimatedBuilder(
                          animation: _pulseController,
                          builder: (context, child) {
                            return Container(
                              width: 8,
                              height: 8,
                              decoration: BoxDecoration(
                                color: Colors.red,
                                shape: BoxShape.circle,
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.red.withOpacity(
                                        0.5 + (_pulseController.value * 0.5)),
                                    blurRadius: 10 + (_pulseController.value * 10),
                                    spreadRadius: 2 + (_pulseController.value * 2),
                                  ),
                                ],
                              ),
                            );
                          },
                        ),
                        SizedBox(width: 8),
                        Text(
                          'Live Tracking',
                          style: GoogleFonts.poppins(
                            fontSize: 14,
                            fontWeight: FontWeight.w500,
                            color: Colors.white,
                            shadows: [
                              Shadow(
                                color: Colors.black.withOpacity(0.5),
                                blurRadius: 10,
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              _buildShareButton(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildBackButton() {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () => Navigator.pop(context),
        borderRadius: BorderRadius.circular(15),
        child: Container(
          padding: EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(15),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.2),
                blurRadius: 10,
                offset: Offset(0, 4),
              ),
            ],
          ),
          child: Icon(
            Icons.arrow_back_ios_new,
            color: Color(0xFFFF4757),
            size: 20,
          ),
        ),
      ),
    );
  }

  Widget _buildShareButton() {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: _shareLocation,
        borderRadius: BorderRadius.circular(15),
        child: Container(
          padding: EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(15),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.2),
                blurRadius: 10,
                offset: Offset(0, 4),
              ),
            ],
          ),
          child: Icon(
            Icons.share_outlined,
            color: Color(0xFFFF4757),
            size: 20,
          ),
        ),
      ),
    );
  }

  Widget _buildBottomInfoCard() {
    return DraggableScrollableSheet(
      controller: _sheetController,
      initialChildSize: 0.45, // 45% of screen height
      minChildSize: 0.15, // Minimum 15% (just show a peek)
      maxChildSize: 0.85, // Maximum 85% (almost full screen)
      snap: true,
      snapSizes: [0.15, 0.45, 0.85], // Snap points
      builder: (BuildContext context, ScrollController scrollController) {
        return Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.only(
              topLeft: Radius.circular(25),
              topRight: Radius.circular(25),
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.15),
                blurRadius: 30,
                offset: Offset(0, -10),
              ),
            ],
          ),
          child: ListView(
            controller: scrollController,
            padding: EdgeInsets.zero,
            children: [
              // Drag Handle
              Center(
                child: Container(
                  margin: EdgeInsets.only(top: 12, bottom: 8),
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.grey[300],
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              
              Padding(
                padding: EdgeInsets.fromLTRB(25, 8, 25, 25),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    _buildPatientInfo(),
                    SizedBox(height: 20),
                    _buildLocationDetails(),
                    SizedBox(height: 20),
                    _buildActionButtons(),
                    SizedBox(height: 10),
                    
                    // Help text
                    Text(
                      '↕ Swipe to expand or minimize',
                      style: GoogleFonts.poppins(
                        fontSize: 12,
                        color: Colors.grey[400],
                        fontWeight: FontWeight.w500,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildPatientInfo() {
    return Row(
      children: [
        Container(
          width: 60,
          height: 60,
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [Color(0xFFFF4757), Color(0xFFFF6B6B)],
            ),
            borderRadius: BorderRadius.circular(15),
            boxShadow: [
              BoxShadow(
                color: Color(0xFFFF4757).withOpacity(0.3),
                blurRadius: 10,
                offset: Offset(0, 5),
              ),
            ],
          ),
          child: Icon(
            Icons.person,
            color: Colors.white,
            size: 32,
          ),
        ),
        SizedBox(width: 15),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                widget.requestData['patientName'] ?? 'Emergency Patient',
                style: GoogleFonts.poppins(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  color: Color(0xFF2E3A59),
                ),
              ),
              SizedBox(height: 4),
              Row(
                children: [
                  Icon(
                    Icons.medical_services,
                    size: 16,
                    color: Color(0xFFFF4757),
                  ),
                  SizedBox(width: 5),
                  Expanded(
                    child: Text(
                      widget.requestData['emergencyType'] ?? 'Emergency Request',
                      style: GoogleFonts.poppins(
                        fontSize: 14,
                        color: Colors.grey[600],
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
        Container(
          padding: EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(
            color: Color(0xFFFF4757).withOpacity(0.1),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: Color(0xFFFF4757).withOpacity(0.3),
            ),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                Icons.emergency,
                size: 14,
                color: Color(0xFFFF4757),
              ),
              SizedBox(width: 5),
              Text(
                'URGENT',
                style: GoogleFonts.poppins(
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                  color: Color(0xFFFF4757),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildLocationDetails() {
    return Container(
      padding: EdgeInsets.all(15),
      decoration: BoxDecoration(
        color: Color(0xFFF5F9FF),
        borderRadius: BorderRadius.circular(15),
        border: Border.all(
          color: Colors.blue.withOpacity(0.1),
        ),
      ),
      child: Column(
        children: [
          _buildInfoRow(
            Icons.location_on,
            'Location',
            widget.requestData['address'] ?? 'Getting address...',
            Color(0xFFFF4757),
          ),
          Divider(height: 20),
          _buildInfoRow(
            Icons.access_time,
            'Request Time',
            widget.requestData['timestamp'] ?? 'Just now',
            Color(0xFF3366FF),
          ),
          Divider(height: 20),
          _buildInfoRow(
            Icons.phone,
            'Contact',
            widget.requestData['phoneNumber'] ?? 'Not provided',
            Color(0xFF66BB6A),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String label, String value, Color color) {
    return Row(
      children: [
        Container(
          padding: EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: color.withOpacity(0.1),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(icon, color: color, size: 20),
        ),
        SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: GoogleFonts.poppins(
                  fontSize: 12,
                  color: Colors.grey[600],
                  fontWeight: FontWeight.w500,
                ),
              ),
              Text(
                value,
                style: GoogleFonts.poppins(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF2E3A59),
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildActionButtons() {
    return Row(
      children: [
        Expanded(
          child: ElevatedButton.icon(
            onPressed: _callPatient,
            icon: Icon(Icons.phone, size: 20),
            label: Text(
              'Call Patient',
              style: GoogleFonts.poppins(
                fontSize: 15,
                fontWeight: FontWeight.w600,
              ),
            ),
            style: ElevatedButton.styleFrom(
              backgroundColor: Color(0xFF66BB6A),
              foregroundColor: Colors.white,
              padding: EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(15),
              ),
              elevation: 3,
            ),
          ),
        ),
        SizedBox(width: 12),
        Expanded(
          child: ElevatedButton.icon(
            onPressed: _getDirections,
            icon: Icon(Icons.directions, size: 20),
            label: Text(
              'Directions',
              style: GoogleFonts.poppins(
                fontSize: 15,
                fontWeight: FontWeight.w600,
              ),
            ),
            style: ElevatedButton.styleFrom(
              backgroundColor: Color(0xFF3366FF),
              foregroundColor: Colors.white,
              padding: EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(15),
              ),
              elevation: 3,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildFloatingActionButtons() {
    return Positioned(
      right: 20,
      top: MediaQuery.of(context).size.height * 0.4,
      child: Column(
        children: [
          _buildFloatingButton(
            Icons.my_location,
            () => _animateToPatientLocation(),
            Color(0xFFFF4757),
          ),
          SizedBox(height: 12),
          _buildFloatingButton(
            Icons.zoom_in,
            () => _mapController?.animateCamera(CameraUpdate.zoomIn()),
            Color(0xFF3366FF),
          ),
          SizedBox(height: 12),
          _buildFloatingButton(
            Icons.zoom_out,
            () => _mapController?.animateCamera(CameraUpdate.zoomOut()),
            Color(0xFF3366FF),
          ),
        ],
      ),
    );
  }

  Widget _buildFloatingButton(IconData icon, VoidCallback onPressed, Color color) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onPressed,
        borderRadius: BorderRadius.circular(15),
        child: Container(
          padding: EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(15),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.15),
                blurRadius: 10,
                offset: Offset(0, 4),
              ),
            ],
          ),
          child: Icon(icon, color: color, size: 24),
        ),
      ),
    );
  }

  void _animateToPatientLocation() {
    if (_mapController != null) {
      _mapController!.animateCamera(
        CameraUpdate.newCameraPosition(
          CameraPosition(
            target: _patientLocation,
            zoom: 16,
            tilt: 0,
          ),
        ),
      );
    }
  }

  void _shareLocation() {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          'Location shared successfully',
          style: GoogleFonts.poppins(color: Colors.white),
        ),
        backgroundColor: Color(0xFF66BB6A),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      ),
    );
  }

  void _callPatient() async {
    final phoneNumber = widget.requestData['phoneNumber'];
    if (phoneNumber != null && phoneNumber.toString().isNotEmpty) {
      final uri = Uri.parse('tel:$phoneNumber');
      try {
        if (await canLaunchUrl(uri)) {
          await launchUrl(uri);
        } else {
          _showErrorSnackBar('Cannot make phone calls on this device');
        }
      } catch (e) {
        print('Error launching phone: $e');
        _showErrorSnackBar('Could not initiate call');
      }
    } else {
      _showErrorSnackBar('Phone number not available');
    }
  }

  void _getDirections() async {
    final lat = _patientLocation.latitude;
    final lng = _patientLocation.longitude;
    final uri = Uri.parse('https://www.google.com/maps/dir/?api=1&destination=$lat,$lng');
    
    try {
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
      } else {
        _showErrorSnackBar('Could not open maps');
      }
    } catch (e) {
      print('Error launching maps: $e');
      _showErrorSnackBar('Could not open maps');
    }
  }

  void _showErrorSnackBar(String message) {
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            message,
            style: GoogleFonts.poppins(color: Colors.white),
          ),
          backgroundColor: Colors.orange,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        ),
      );
    }
  }
}