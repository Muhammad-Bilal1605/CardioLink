// lib/config/api_config.dart
import 'package:flutter_dotenv/flutter_dotenv.dart';

class ApiConfig {
  // Get IP and PORT from .env file
  static String get ip => dotenv.env['IP'] ?? '192.168.1.4';
  static String get port => dotenv.env['PORT'] ?? '5001';
  
  // Construct the base URL dynamically
  static String get baseUrl => 'http://$ip:$port/api';
  
  // Timeout configurations
  static const Duration connectTimeout = Duration(seconds: 30);
  static const Duration receiveTimeout = Duration(seconds: 30);
  static const Duration sendTimeout = Duration(seconds: 30);
  
  // Optional: Add a method to log the current configuration
  static void printConfig() {
    print('========== API Configuration ==========');
    print('IP: $ip');
    print('PORT: $port');
    print('Base URL: $baseUrl');
    print('======================================');
  }
}