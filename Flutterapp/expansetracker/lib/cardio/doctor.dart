class Doctor {
  final String id;
  final String name;
  final String email;
  final String specialty;
  final String department;
  final int yearsOfExperience;
  final List<String> qualifications;
  final bool isVerified;
  final String imageUrl;
  final double rating;
  final int reviews;
  final int roomNumber;
  final bool isOnline;
  final double consultationFee;

  Doctor({
    required this.id,
    required this.name,
    required this.email,
    required this.specialty,
    required this.department,
    required this.yearsOfExperience,
    required this.qualifications,
    required this.isVerified,
    this.imageUrl = 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&h=150&fit=crop&crop=face',
    this.rating = 4.5,
    this.reviews = 0,
    this.roomNumber = 101,
    this.isOnline = false,
    this.consultationFee = 50.0,
  });

  // Factory constructor to create Doctor from API response
  factory Doctor.fromJson(Map<String, dynamic> json) {
    return Doctor(
      id: json['_id'] ?? json['id'] ?? '',
      name: json['name'] ?? 'Unknown Doctor',
      email: json['email'] ?? '',
      specialty: json['specialty'] ?? 'General',
      department: json['department'] ?? 'General',
      yearsOfExperience: json['yearsOfExperience'] ?? 0,
      qualifications: List<String>.from(json['qualifications'] ?? []),
      isVerified: json['isVerified'] ?? false,
      imageUrl: json['imageUrl'] ?? 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&h=150&fit=crop&crop=face',
      rating: (json['rating'] ?? 4.5).toDouble(),
      reviews: json['reviews'] ?? 0,
      roomNumber: json['roomNumber'] ?? 101,
      isOnline: json['isOnline'] ?? false,
      consultationFee: (json['consultationFee'] ?? 50.0).toDouble(),
    );
  }

  // Convert Doctor to JSON
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'email': email,
      'specialty': specialty,
      'department': department,
      'yearsOfExperience': yearsOfExperience,
      'qualifications': qualifications,
      'isVerified': isVerified,
      'imageUrl': imageUrl,
      'rating': rating,
      'reviews': reviews,
      'roomNumber': roomNumber,
      'isOnline': isOnline,
      'consultationFee': consultationFee,
    };
  }

  // Helper method to get display name with credentials
  String get displayName {
    return 'Dr. ${name}';
  }

  // Helper method to get experience text
  String get experienceText {
    if (yearsOfExperience == 0) return 'New Doctor';
    if (yearsOfExperience == 1) return '1 year experience';
    return '$yearsOfExperience years experience';
  }

  // Helper method to get qualifications as string
  String get qualificationsText {
    if (qualifications.isEmpty) return 'General Practice';
    return qualifications.join(', ');
  }
}