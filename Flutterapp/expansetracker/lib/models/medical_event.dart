class MedicalEvent {
  final String id;
  final DateTime date;
  final String type;
  final String typeLabel;
  final String color;
  final String icon;
  final String department;
  final String doctor;
  final String details;
  final Map<String, dynamic> fullData;

  MedicalEvent({
    required this.id,
    required this.date,
    required this.type,
    required this.typeLabel,
    required this.color,
    required this.icon,
    required this.department,
    required this.doctor,
    required this.details,
    required this.fullData,
  });

  factory MedicalEvent.fromJson(Map<String, dynamic> json) {
    return MedicalEvent(
      id: json['id'] ?? '',
      date: DateTime.parse(json['date']),
      type: json['type'] ?? '',
      typeLabel: json['typeLabel'] ?? '',
      color: json['color'] ?? '#6B8E3D',
      icon: json['icon'] ?? '📋',
      department: json['department'] ?? '',
      doctor: json['doctor'] ?? '',
      details: json['details'] ?? '',
      fullData: json['fullData'] ?? {},
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'date': date.toIso8601String(),
      'type': type,
      'typeLabel': typeLabel,
      'color': color,
      'icon': icon,
      'department': department,
      'doctor': doctor,
      'details': details,
      'fullData': fullData,
    };
  }
}

class EventType {
  final String key;
  final String label;
  final String color;
  final String icon;

  EventType({
    required this.key,
    required this.label,
    required this.color,
    required this.icon,
  });

  static List<EventType> get eventTypes => [
    EventType(key: 'visits', label: 'Visits', color: '#f56565', icon: '👨‍⚕️'),
    EventType(key: 'hospitalizations', label: 'Hospitalizations', color: '#4299e1', icon: '🏥'),
    EventType(key: 'procedures', label: 'Procedures', color: '#9f7aea', icon: '⚕️'),
    EventType(key: 'labs', label: 'Labs', color: '#38b2ac', icon: '🧪'),
    EventType(key: 'imaging', label: 'Imaging', color: '#ecc94b', icon: '🔬'),
  ];
}
