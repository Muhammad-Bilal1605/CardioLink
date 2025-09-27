// Place this file in: lib/services/location_service.dart

import 'package:location/location.dart' as loc;
import 'package:geocoding/geocoding.dart';
import 'dart:math' as math;

class LocationService {
  static LocationService? _instance;
  static LocationService get instance => _instance ??= LocationService._();
  LocationService._();

  final loc.Location _location = loc.Location();

  /// Check if location services are enabled
  Future<bool> isLocationServiceEnabled() async {
    return await _location.serviceEnabled();
  }

  /// Enable location services
  Future<bool> enableLocationService() async {
    return await _location.requestService();
  }

  /// Check location permission status
  Future<loc.PermissionStatus> checkLocationPermission() async {
    return await _location.hasPermission();
  }

  /// Request location permission
  Future<loc.PermissionStatus> requestLocationPermission() async {
    loc.PermissionStatus permission = await _location.hasPermission();
    
    if (permission == loc.PermissionStatus.denied) {
      permission = await _location.requestPermission();
    }
    
    return permission;
  }

  /// Get current position with high accuracy
  Future<loc.LocationData?> getCurrentPosition() async {
    try {
      // Check if location services are enabled
      bool serviceEnabled = await isLocationServiceEnabled();
      if (!serviceEnabled) {
        // Try to enable location services
        bool enabled = await enableLocationService();
        if (!enabled) {
          throw Exception('Location services are disabled');
        }
      }

      // Check and request permission
      loc.PermissionStatus permission = await requestLocationPermission();
      
      if (permission == loc.PermissionStatus.denied || 
          permission == loc.PermissionStatus.deniedForever) {
        throw Exception('Location permission denied');
      }

      // Configure location settings for high accuracy
      await _location.changeSettings(
        accuracy: loc.LocationAccuracy.high,
        interval: 1000,
        distanceFilter: 0,
      );

      // Get current position
      loc.LocationData locationData = await _location.getLocation();

      return locationData;
    } catch (e) {
      print('Error getting location: $e');
      return null;
    }
  }

  /// Convert coordinates to address
  Future<String?> getAddressFromCoordinates(double latitude, double longitude) async {
    try {
      List<Placemark> placemarks = await placemarkFromCoordinates(latitude, longitude);
      
      if (placemarks.isNotEmpty) {
        Placemark place = placemarks[0];
        
        // Format address
        String address = '';
        
        if (place.street != null && place.street!.isNotEmpty) {
          address += place.street!;
        }
        
        if (place.subLocality != null && place.subLocality!.isNotEmpty) {
          address += address.isNotEmpty ? ', ${place.subLocality}' : place.subLocality!;
        }
        
        if (place.locality != null && place.locality!.isNotEmpty) {
          address += address.isNotEmpty ? ', ${place.locality}' : place.locality!;
        }
        
        if (place.administrativeArea != null && place.administrativeArea!.isNotEmpty) {
          address += address.isNotEmpty ? ', ${place.administrativeArea}' : place.administrativeArea!;
        }
        
        if (place.country != null && place.country!.isNotEmpty) {
          address += address.isNotEmpty ? ', ${place.country}' : place.country!;
        }
        
        return address.isNotEmpty ? address : 'Address not found';
      }
      
      return null;
    } catch (e) {
      print('Error getting address: $e');
      return null;
    }
  }

  /// Get formatted coordinates string
  String getFormattedCoordinates(double latitude, double longitude) {
    return "${latitude.toStringAsFixed(6)}, ${longitude.toStringAsFixed(6)}";
  }

  /// Check if location permission is granted
  Future<bool> isLocationPermissionGranted() async {
    loc.PermissionStatus permission = await checkLocationPermission();
    return permission == loc.PermissionStatus.granted;
  }

  /// Get distance between two points (in meters)
  double getDistanceBetween(
    double startLatitude, 
    double startLongitude, 
    double endLatitude, 
    double endLongitude
  ) {
    // Using Haversine formula to calculate distance
    const double earthRadius = 6371000; // Earth's radius in meters
    
    double lat1Rad = startLatitude * (math.pi / 180);
    double lat2Rad = endLatitude * (math.pi / 180);
    double deltaLatRad = (endLatitude - startLatitude) * (math.pi / 180);
    double deltaLngRad = (endLongitude - startLongitude) * (math.pi / 180);

    double a = math.pow(math.sin(deltaLatRad / 2), 2) +
        math.cos(lat1Rad) * math.cos(lat2Rad) *
        math.pow(math.sin(deltaLngRad / 2), 2);
    double c = 2 * math.asin(math.sqrt(a));

    return earthRadius * c;
  }

  /// Start listening to location changes
  Stream<loc.LocationData> getLocationStream() {
    return _location.onLocationChanged;
  }

  /// Stop listening to location changes
  void stopLocationStream() {
    // Location stream stops automatically when not being listened to
  }
}