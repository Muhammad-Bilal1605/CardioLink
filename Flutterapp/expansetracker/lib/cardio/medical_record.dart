class MedicalRecord {
  final String id;
  final String title;
  final String date;
  final String description;
  final String type;
  final String fileUrl;

  MedicalRecord({
    required this.id,
    required this.title,
    required this.date,
    required this.description,
    required this.type,
    required this.fileUrl,
  });
}