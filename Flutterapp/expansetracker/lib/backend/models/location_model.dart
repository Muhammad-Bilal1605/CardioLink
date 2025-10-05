// Place this file in: lib/backend/models/location_model.dart

class LocationDataModel {
  final double? latitude;
  final double? longitude;
  final String? address;
  final String? coordinates;
  final bool isDetecting;
  final String? error;
  final DateTime? timestamp;

  const LocationDataModel({
    this.latitude,
    this.longitude,
    this.address,
    this.coordinates,
    this.isDetecting = false,
    this.error,
    this.timestamp,
  });

  LocationDataModel copyWith({
    double? latitude,
    double? longitude,
    String? address,
    String? coordinates,
    bool? isDetecting,
    String? error,
    DateTime? timestamp,
  }) {
    return LocationDataModel(
      latitude: latitude ?? this.latitude,
      longitude: longitude ?? this.longitude,
      address: address ?? this.address,
      coordinates: coordinates ?? this.coordinates,
      isDetecting: isDetecting ?? this.isDetecting,
      error: error ?? this.error,
      timestamp: timestamp ?? this.timestamp,
    );
  }

  bool get hasLocation => latitude != null && longitude != null;
  bool get hasAddress => address != null && address!.isNotEmpty;
  bool get hasError => error != null && error!.isNotEmpty;

  String get displayAddress {
    if (hasError) return error!;
    if (isDetecting) return "📍 Detecting your location...";
    if (hasAddress) return address!;
    return "Location not available";
  }

  String get displayStatus {
    if (hasError) return "Location detection failed";
    if (isDetecting) return "📍 Detecting location...";
    if (hasLocation) return "📍 Location detected";
    return "📍 Location not detected";
  }

  @override
  String toString() {
    return 'LocationDataModel(lat: $latitude, lng: $longitude, address: $address, isDetecting: $isDetecting, error: $error)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is LocationDataModel &&
        other.latitude == latitude &&
        other.longitude == longitude &&
        other.address == address &&
        other.coordinates == coordinates &&
        other.isDetecting == isDetecting &&
        other.error == error;
  }

  @override
  int get hashCode {
    return latitude.hashCode ^
        longitude.hashCode ^
        address.hashCode ^
        coordinates.hashCode ^
        isDetecting.hashCode ^
        error.hashCode;
  }
}