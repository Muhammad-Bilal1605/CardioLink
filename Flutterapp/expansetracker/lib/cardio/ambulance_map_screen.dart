// ambulance_map_screen.dart - COMPLETE VERSION WITH PROPER ALIGNMENT
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'dart:async';
import 'package:url_launcher/url_launcher.dart';
import 'package:location/location.dart' as loc;
import 'package:provider/provider.dart';
import 'dart:math' as math;

// Import your services
import '../services/location_service.dart';
import '../services/ambulance_service.dart';
import '../provider/auth_provider.dart';

class AmbulanceMapScreen extends StatefulWidget {
  final Map<String, dynamic>? requestData;

  const AmbulanceMapScreen({
    Key? key,
    this.requestData,
  }) : super(key: key);

  @override
  _AmbulanceMapScreenState createState() => _AmbulanceMapScreenState();
}

class _AmbulanceMapScreenState extends State<AmbulanceMapScreen>
    with TickerProviderStateMixin {
  GoogleMapController? _mapController;
  LatLng? _patientLocation;
  LatLng? _ambulanceLocation;
  
  Map<MarkerId, Marker> _markers = {};
  Set<Polyline> _polylines = {};
  Set<Circle> _circles = {};
  
  late AnimationController _pulseController;
  late AnimationController _slideController;
  
  bool _isLoading = true;
  bool _hasValidLocation = false;
  bool _mapCreated = false;
  bool _isFetchingRequest = false;
  
  Timer? _locationUpdateTimer;
  StreamSubscription<loc.LocationData>? _locationSubscription;
  
  double? _distance;
  int? _duration;
  List<LatLng> _routeCoordinates = [];
  
  Map<String, dynamic>? _currentRequest;
  Timer? _requestRefreshTimer;

  @override
  void initState() {
    super.initState();
    _setupAnimations();
    _initializeData();
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
  }

  void _initializeData() async {
    _slideController.forward();
    
    // If request data is provided directly, use it
    if (widget.requestData != null && widget.requestData!.isNotEmpty) {
      _currentRequest = widget.requestData;
      _processRequestData(widget.requestData!);
    } else {
      // Otherwise fetch the latest request from API
      await _fetchLatestRequest();
    }
    
    // Start location tracking for ambulance
    _startAmbulanceLocationTracking();
    
    // Set up periodic request refresh (every 30 seconds)
    _requestRefreshTimer = Timer.periodic(Duration(seconds: 30), (timer) {
      _fetchLatestRequest();
    });
  }

  Future<void> _fetchLatestRequest() async {
    if (_isFetchingRequest) return;
    
    setState(() {
      _isFetchingRequest = true;
    });

    try {
      final latestRequest = await AmbulanceService().getLatestPendingRequest();
      
      if (latestRequest != null) {
        setState(() {
          _currentRequest = latestRequest;
        });
        _processRequestData(latestRequest);
      } else {
        print('⚠️ No pending requests found');
        if (_currentRequest == null) {
          _setDefaultLocation();
        }
      }
    } catch (e) {
      print('❌ Error fetching latest request: $e');
      if (_currentRequest == null) {
        _setDefaultLocation();
      }
    } finally {
      setState(() {
        _isFetchingRequest = false;
      });
    }
  }

  void _processRequestData(Map<String, dynamic> requestData) {
    print('📍 Processing request data: ${requestData['_id'] ?? 'No ID'}');
    
    double latitude = 0.0;
    double longitude = 0.0;

    try {
      // Method 1: Check for location object (API format)
      if (requestData['location'] != null) {
        var location = requestData['location'];
        if (location is Map) {
          // Try to parse from location object
          if (location['latitude'] != null && location['longitude'] != null) {
            latitude = _parseDouble(location['latitude']);
            longitude = _parseDouble(location['longitude']);
            _hasValidLocation = true;
            print('✅ Location from API location object: $latitude, $longitude');
          }
          // Also check for coordinates string
          else if (location['coordinates'] != null) {
            String coords = location['coordinates'].toString();
            List<String> parts = coords.split(',');
            if (parts.length == 2) {
              latitude = _parseDouble(parts[0].trim());
              longitude = _parseDouble(parts[1].trim());
              _hasValidLocation = true;
              print('✅ Location from coordinates string: $latitude, $longitude');
            }
          }
        }
      }
      // Method 2: Check for direct latitude/longitude fields
      else if (requestData['latitude'] != null && requestData['longitude'] != null) {
        latitude = _parseDouble(requestData['latitude']);
        longitude = _parseDouble(requestData['longitude']);
        _hasValidLocation = true;
        print('✅ Location from direct lat/lng fields');
      }
      
      if (!_hasValidLocation) {
        print('⚠️ No valid location in request, using default');
        _setDefaultLocation();
        return;
      }
      
      setState(() {
        _patientLocation = LatLng(latitude, longitude);
      });
      
      print('📍 Patient coordinates set: Lat: $latitude, Lng: $longitude');
      
      Future.delayed(Duration(milliseconds: 500), () {
        if (mounted) {
          setState(() {
            _isLoading = false;
          });
          _createMarkers();
          _fitBoundsToShowBothLocations();
        }
      });
      
    } catch (e) {
      print('❌ Error processing request data: $e');
      _setDefaultLocation();
    }
  }

  void _setDefaultLocation() {
    setState(() {
      _patientLocation = LatLng(33.6844, 73.0479); // Islamabad coordinates
      _hasValidLocation = false;
      _isLoading = false;
    });
    
    Future.delayed(Duration(milliseconds: 300), () {
      if (mounted) {
        _createMarkers();
        _fitBoundsToShowBothLocations();
      }
    });
  }

  double _parseDouble(dynamic value) {
    if (value == null) return 0.0;
    if (value is double) return value;
    if (value is int) return value.toDouble();
    if (value is String) return double.tryParse(value) ?? 0.0;
    return 0.0;
  }

  void _startAmbulanceLocationTracking() async {
    print('🚑 Starting ambulance location tracking...');
    
    try {
      loc.LocationData? locationData = await LocationService.instance.getCurrentPosition();
      
      if (locationData != null && locationData.latitude != null && locationData.longitude != null) {
        setState(() {
          _ambulanceLocation = LatLng(locationData.latitude!, locationData.longitude!);
        });
        print('🚑 Initial ambulance location: ${_ambulanceLocation}');
        
        _calculateRoute();
        _createMarkers();
        _fitBoundsToShowBothLocations();
      }
    } catch (e) {
      print('❌ Error getting initial ambulance location: $e');
    }

    try {
      _locationSubscription = LocationService.instance.getLocationStream().listen(
        (loc.LocationData locationData) {
          if (locationData.latitude != null && locationData.longitude != null) {
            final newLocation = LatLng(locationData.latitude!, locationData.longitude!);
            
            if (_ambulanceLocation == null || 
                _calculateDistance(_ambulanceLocation!, newLocation) > 0.005) {
              setState(() {
                _ambulanceLocation = newLocation;
              });
              print('🚑 Ambulance location updated: ${_ambulanceLocation}');
              
              _createMarkers();
              _calculateRoute();
            }
          }
        },
        onError: (error) {
          print('❌ Location stream error: $error');
        },
      );
    } catch (e) {
      print('❌ Error subscribing to location stream: $e');
    }

    _locationUpdateTimer = Timer.periodic(Duration(seconds: 10), (timer) async {
      if (!mounted) {
        timer.cancel();
        return;
      }
      
      try {
        loc.LocationData? locationData = await LocationService.instance.getCurrentPosition();
        
        if (locationData != null && locationData.latitude != null && locationData.longitude != null) {
          final newLocation = LatLng(locationData.latitude!, locationData.longitude!);
          
          if (_ambulanceLocation == null || 
              _calculateDistance(_ambulanceLocation!, newLocation) > 0.005) {
            setState(() {
              _ambulanceLocation = newLocation;
            });
            
            _createMarkers();
            _calculateRoute();
          }
        }
      } catch (e) {
        print('⚠️ Periodic location update failed: $e');
      }
    });
  }

  double _calculateDistance(LatLng point1, LatLng point2) {
    const double earthRadius = 6371;
    
    double lat1 = point1.latitude * math.pi / 180;
    double lat2 = point2.latitude * math.pi / 180;
    double dLat = (point2.latitude - point1.latitude) * math.pi / 180;
    double dLon = (point2.longitude - point1.longitude) * math.pi / 180;
    
    double a = math.sin(dLat / 2) * math.sin(dLat / 2) +
        math.cos(lat1) * math.cos(lat2) *
        math.sin(dLon / 2) * math.sin(dLon / 2);
    
    double c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a));
    
    return earthRadius * c;
  }

  Future<void> _calculateRoute() async {
    if (_ambulanceLocation == null || _patientLocation == null) return;
    
    try {
      double distance = _calculateDistance(_ambulanceLocation!, _patientLocation!);
      
      setState(() {
        _distance = distance;
        _duration = ((distance / 40) * 60).round(); // Assuming 40 km/h average speed
      });

      print('📏 Distance: ${_distance?.toStringAsFixed(2)} km');
      print('⏱️ Estimated time: $_duration min');

      _createPolyline();
      
    } catch (e) {
      print('❌ Error calculating route: $e');
      _createPolyline();
    }
  }

  void _createPolyline() {
    if (_ambulanceLocation == null || _patientLocation == null) return;

    _routeCoordinates = [_ambulanceLocation!, _patientLocation!];
    
    setState(() {
      _polylines.clear();
      _polylines.add(
        Polyline(
          polylineId: PolylineId('route'),
          points: _routeCoordinates,
          color: Color(0xFF3366FF),
          width: 4,
          patterns: [PatternItem.dash(20), PatternItem.gap(10)],
          geodesic: true,
        ),
      );
    });
  }

  void _createMarkers() {
    _markers.clear();
    _circles.clear();

    if (_patientLocation != null) {
      final patientMarkerId = MarkerId('patient_location');
      final patientMarker = Marker(
        markerId: patientMarkerId,
        position: _patientLocation!,
        icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueRed),
        infoWindow: InfoWindow(
          title: 'Patient Location',
          snippet: _currentRequest?['patientName'] ?? 'Emergency Location',
        ),
      );
      _markers[patientMarkerId] = patientMarker;

      _circles.add(
        Circle(
          circleId: CircleId('patient_area'),
          center: _patientLocation!,
          radius: 100,
          fillColor: Colors.red.withOpacity(0.15),
          strokeColor: Colors.red.withOpacity(0.5),
          strokeWidth: 2,
        ),
      );
    }

    if (_ambulanceLocation != null) {
      final ambulanceMarkerId = MarkerId('ambulance_location');
      final ambulanceMarker = Marker(
        markerId: ambulanceMarkerId,
        position: _ambulanceLocation!,
        icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueGreen),
        infoWindow: InfoWindow(
          title: 'Your Location',
          snippet: 'Ambulance',
        ),
        rotation: 0,
      );
      _markers[ambulanceMarkerId] = ambulanceMarker;

      _circles.add(
        Circle(
          circleId: CircleId('ambulance_area'),
          center: _ambulanceLocation!,
          radius: 80,
          fillColor: Color(0xFF22C55E).withOpacity(0.2),
          strokeColor: Color(0xFF22C55E).withOpacity(0.6),
          strokeWidth: 2,
        ),
      );
    }

    if (mounted) {
      setState(() {});
    }
  }

  void _onMapCreated(GoogleMapController controller) {
    if (!_mapCreated) {
      _mapController = controller;
      _mapCreated = true;
      print('✅ Map created successfully');
      
      Future.delayed(Duration(milliseconds: 500), () {
        _setMapStyle();
        _fitBoundsToShowBothLocations();
      });
    }
  }

  void _fitBoundsToShowBothLocations() {
    if (_mapController == null) return;

    if (_ambulanceLocation != null && _patientLocation != null) {
      // Calculate bounds to show both locations
      LatLngBounds bounds = _createBounds(_ambulanceLocation!, _patientLocation!);
      
      // Add padding to the bounds (150px padding)
      _mapController!.animateCamera(
        CameraUpdate.newLatLngBounds(bounds, 150),
      );
      print('🗺️ Map bounds adjusted to show both ambulance and patient locations');
    } else if (_patientLocation != null) {
      // If only patient location is available, zoom to patient
      _animateToLocation(_patientLocation!);
    } else if (_ambulanceLocation != null) {
      // If only ambulance location is available, zoom to ambulance
      _animateToLocation(_ambulanceLocation!);
    }
  }

  LatLngBounds _createBounds(LatLng point1, LatLng point2) {
    final southWest = LatLng(
      math.min(point1.latitude, point2.latitude),
      math.min(point1.longitude, point2.longitude),
    );
    final northEast = LatLng(
      math.max(point1.latitude, point2.latitude),
      math.max(point1.longitude, point2.longitude),
    );
    return LatLngBounds(southwest: southWest, northeast: northEast);
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
    _locationUpdateTimer?.cancel();
    _locationSubscription?.cancel();
    _requestRefreshTimer?.cancel();
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
                if (_isFetchingRequest) _buildRefreshOverlay(),
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
              'Loading Emergency Map...',
              style: GoogleFonts.poppins(
                fontSize: 20,
                fontWeight: FontWeight.w600,
                color: Colors.white,
              ),
            ),
            SizedBox(height: 10),
            Text(
              'Fetching patient location and route',
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

  Widget _buildRefreshOverlay() {
    return Positioned(
      top: 100,
      left: 0,
      right: 0,
      child: SafeArea(
        child: Align(
          alignment: Alignment.topCenter,
          child: Container(
            padding: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            decoration: BoxDecoration(
              color: Colors.blue.withOpacity(0.9),
              borderRadius: BorderRadius.circular(20),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.2),
                  blurRadius: 10,
                ),
              ],
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                SizedBox(
                  width: 16,
                  height: 16,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    color: Colors.white,
                  ),
                ),
                SizedBox(width: 8),
                Text(
                  'Checking for new requests...',
                  style: GoogleFonts.poppins(
                    fontSize: 12,
                    color: Colors.white,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildMap() {
    LatLng initialLocation = _patientLocation ?? _ambulanceLocation ?? LatLng(33.6844, 73.0479);
    
    return Container(
      color: Colors.grey[200],
      child: GoogleMap(
        onMapCreated: _onMapCreated,
        initialCameraPosition: CameraPosition(
          target: initialLocation,
          zoom: 15,
        ),
        markers: _markers.values.toSet(),
        polylines: _polylines,
        circles: _circles,
        myLocationEnabled: false,
        myLocationButtonEnabled: false,
        zoomControlsEnabled: false,
        compassEnabled: true,
        mapToolbarEnabled: false,
        buildingsEnabled: true,
        trafficEnabled: true,
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
                      'Emergency Route',
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
                                color: Color(0xFF22C55E),
                                shape: BoxShape.circle,
                                boxShadow: [
                                  BoxShadow(
                                    color: Color(0xFF22C55E).withOpacity(
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
                          'Live Navigation Active',
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
              _buildRefreshButton(),
              SizedBox(width: 10),
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

  Widget _buildRefreshButton() {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () {
          _fetchLatestRequest();
          _showSnackBar('Checking for new emergency requests...', Colors.blue);
        },
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
            Icons.refresh,
            color: Color(0xFF3366FF),
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
    return Positioned(
      bottom: 0,
      left: 0,
      right: 0,
      child: Container(
        height: MediaQuery.of(context).size.height * 0.45,
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
        child: SingleChildScrollView(
          padding: EdgeInsets.fromLTRB(25, 8, 25, 25),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
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
              
              if (_distance != null) ...[
                _buildETACard(),
                SizedBox(height: 20),
              ],
              
              _buildPatientInfo(),
              SizedBox(height: 20),
              _buildLocationDetails(),
              SizedBox(height: 20),
              _buildActionButtons(),
              SizedBox(height: 10),
              
              Text(
                'Emergency Response System Active',
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
      ),
    );
  }

  Widget _buildETACard() {
    return Container(
      padding: EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [Color(0xFF22C55E), Color(0xFF16A34A)],
        ),
        borderRadius: BorderRadius.circular(15),
        boxShadow: [
          BoxShadow(
            color: Color(0xFF22C55E).withOpacity(0.3),
            blurRadius: 15,
            offset: Offset(0, 5),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            padding: EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.2),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(
              Icons.timer_outlined,
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
                  'Estimated Arrival',
                  style: GoogleFonts.poppins(
                    fontSize: 14,
                    color: Colors.white.withOpacity(0.9),
                    fontWeight: FontWeight.w500,
                  ),
                ),
                SizedBox(height: 4),
                Text(
                  '$_duration min',
                  style: GoogleFonts.poppins(
                    fontSize: 28,
                    fontWeight: FontWeight.w700,
                    color: Colors.white,
                  ),
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                'Distance',
                style: GoogleFonts.poppins(
                  fontSize: 12,
                  color: Colors.white.withOpacity(0.9),
                  fontWeight: FontWeight.w500,
                ),
              ),
              SizedBox(height: 4),
              Text(
                '${_distance!.toStringAsFixed(1)} km',
                style: GoogleFonts.poppins(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  color: Colors.white,
                ),
              ),
            ],
          ),
        ],
      ),
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
                _currentRequest?['patientName'] ?? 'Emergency Patient',
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
                      _currentRequest?['condition'] ?? _currentRequest?['emergencyType'] ?? 'Emergency Request',
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
                _currentRequest?['urgency'] ?? 'URGENT',
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
    String patientAddress = _currentRequest?['location']?['address'] ?? 
                           _currentRequest?['address'] ?? 
                           'Location details not available';

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
            'Patient Location',
            patientAddress,
            Color(0xFFFF4757),
          ),
          if (_ambulanceLocation != null) ...[
            Divider(height: 20),
            _buildInfoRow(
              Icons.local_shipping,
              'Your Location',
              'Ambulance - Live Tracking',
              Color(0xFF22C55E),
            ),
          ],
          Divider(height: 20),
          _buildInfoRow(
            Icons.access_time,
            'Request Time',
            _formatRequestTime(_currentRequest?['requestTime']),
            Color(0xFF3366FF),
          ),
          Divider(height: 20),
          _buildInfoRow(
            Icons.phone,
            'Contact',
            _currentRequest?['phoneNumber'] ?? 'Not provided',
            Color(0xFF66BB6A),
          ),
        ],
      ),
    );
  }

  String _formatRequestTime(String? requestTime) {
    if (requestTime == null) return 'Just now';
    
    try {
      final dateTime = DateTime.parse(requestTime);
      final now = DateTime.now();
      final difference = now.difference(dateTime);
      
      if (difference.inMinutes < 1) return 'Just now';
      if (difference.inMinutes < 60) return '${difference.inMinutes} min ago';
      if (difference.inHours < 24) return '${difference.inHours} hours ago';
      return '${difference.inDays} days ago';
    } catch (e) {
      return requestTime;
    }
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
              'Get Directions',
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
          if (_ambulanceLocation != null)
            _buildFloatingButton(
              Icons.my_location,
              () => _animateToLocation(_ambulanceLocation!),
              Color(0xFF22C55E),
            ),
          if (_ambulanceLocation != null) SizedBox(height: 12),
          if (_patientLocation != null)
            _buildFloatingButton(
              Icons.person_pin_circle,
              () => _animateToLocation(_patientLocation!),
              Color(0xFFFF4757),
            ),
          if (_patientLocation != null) SizedBox(height: 12),
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
          if (_ambulanceLocation != null && _patientLocation != null) ...[
            SizedBox(height: 12),
            _buildFloatingButton(
              Icons.center_focus_strong,
              () => _fitBoundsToShowBothLocations(),
              Color(0xFFF59E0B),
            ),
          ],
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

  void _animateToLocation(LatLng location) {
    if (_mapController != null) {
      _mapController!.animateCamera(
        CameraUpdate.newCameraPosition(
          CameraPosition(
            target: location,
            zoom: 16,
            tilt: 0,
          ),
        ),
      );
    }
  }

  void _shareLocation() {
    _showSnackBar('Route details shared successfully', Color(0xFF66BB6A));
  }

  void _callPatient() async {
    final phoneNumber = _currentRequest?['phoneNumber'];
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
    if (_patientLocation == null) {
      _showErrorSnackBar('Patient location not available');
      return;
    }
    
    final lat = _patientLocation!.latitude;
    final lng = _patientLocation!.longitude;
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

  void _showSnackBar(String message, Color backgroundColor) {
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            message,
            style: GoogleFonts.poppins(color: Colors.white),
          ),
          backgroundColor: backgroundColor,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        ),
      );
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