// lib/services/ip_config_service.dart
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:shared_preferences/shared_preferences.dart';

class IPConfigService {
  static final IPConfigService _instance = IPConfigService._internal();
  factory IPConfigService() => _instance;
  IPConfigService._internal();

  // Static instance getter for cleaner access
  static IPConfigService get instance => _instance;

  static const String _ipKey = 'custom_ip';
  static const String _portKey = 'custom_port';
  static const String _isInitializedKey = 'ip_service_initialized';

  String? _envIP;
  String? _envPort;
  bool _isInitialized = false;

  // Initialize the service and load .env file
  Future<void> init() async {
    if (_isInitialized) return;
    
    try {
      // Load the .env file
      await dotenv.load(fileName: '.env');
      
      // Get IP and PORT from .env file with fallback defaults
      _envIP = dotenv.env['IP'] ?? '192.168.1.9';
      _envPort = dotenv.env['PORT'] ?? '5001';
      
      _isInitialized = true;
      
      // Mark as initialized in SharedPreferences
      final prefs = await SharedPreferences.getInstance();
      await prefs.setBool(_isInitializedKey, true);
      
      print('IPConfigService initialized successfully');
      print('Environment IP: $_envIP');
      print('Environment PORT: $_envPort');
      
    } catch (e) {
      print('Error initializing IPConfigService: $e');
      
      // Use fallback defaults if .env loading fails
      _envIP = '192.168.1.9';
      _envPort = '5001';
      _isInitialized = true;
      
      print('Using fallback defaults - IP: $_envIP, PORT: $_envPort');
    }
  }

  // Get current IP address (custom or from .env)
  Future<String> getCurrentIP() async {
    if (!_isInitialized) {
      await init();
    }
    
    try {
      final prefs = await SharedPreferences.getInstance();
      final customIP = prefs.getString(_ipKey);
      
      if (customIP != null && customIP.isNotEmpty) {
        print('Using custom IP: $customIP');
        return customIP;
      }
      
      print('Using environment IP: $_envIP');
      return _envIP ?? '192.168.1.9';
    } catch (e) {
      print('Error getting current IP: $e');
      return _envIP ?? '192.168.1.9';
    }
  }

  // Get current port (custom or from .env)
  Future<String> getCurrentPort() async {
    if (!_isInitialized) {
      await init();
    }
    
    try {
      final prefs = await SharedPreferences.getInstance();
      final customPort = prefs.getString(_portKey);
      
      if (customPort != null && customPort.isNotEmpty) {
        print('Using custom PORT: $customPort');
        return customPort;
      }
      
      print('Using environment PORT: $_envPort');
      return _envPort ?? '5001';
    } catch (e) {
      print('Error getting current PORT: $e');
      return _envPort ?? '5001';
    }
  }

  // Update custom IP address
  Future<void> updateIP(String newIP) async {
    if (newIP.trim().isEmpty) {
      throw ArgumentError('IP address cannot be empty');
    }
    
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_ipKey, newIP.trim());
      print('Updated custom IP to: ${newIP.trim()}');
    } catch (e) {
      print('Error updating IP: $e');
      throw Exception('Failed to update IP address: $e');
    }
  }

  // Update custom port
  Future<void> updatePort(String newPort) async {
    if (newPort.trim().isEmpty) {
      throw ArgumentError('Port cannot be empty');
    }
    
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_portKey, newPort.trim());
      print('Updated custom PORT to: ${newPort.trim()}');
    } catch (e) {
      print('Error updating PORT: $e');
      throw Exception('Failed to update port: $e');
    }
  }

  // Reset to default (.env) values
  Future<void> resetToDefaults() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(_ipKey);
      await prefs.remove(_portKey);
      print('Reset to default configuration');
      print('Default IP: $_envIP');
      print('Default PORT: $_envPort');
    } catch (e) {
      print('Error resetting to defaults: $e');
      throw Exception('Failed to reset configuration: $e');
    }
  }

  // Get complete base URL
  Future<String> getBaseUrl() async {
    final ip = await getCurrentIP();
    final port = await getCurrentPort();
    final baseUrl = 'http://$ip:$port';
    print('Generated base URL: $baseUrl');
    return baseUrl;
  }

  // Check if using custom configuration
  Future<bool> isUsingCustomConfig() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final hasCustomIP = prefs.containsKey(_ipKey);
      final hasCustomPort = prefs.containsKey(_portKey);
      return hasCustomIP || hasCustomPort;
    } catch (e) {
      print('Error checking custom config status: $e');
      return false;
    }
  }

  // Get environment values directly (for debugging)
  String? get envIP => _envIP;
  String? get envPort => _envPort;
  bool get isInitialized => _isInitialized;

  // Get all configuration info for debugging
  Future<Map<String, dynamic>> getConfigInfo() async {
    if (!_isInitialized) {
      await init();
    }
    
    final currentIP = await getCurrentIP();
    final currentPort = await getCurrentPort();
    final isCustom = await isUsingCustomConfig();
    
    return {
      'initialized': _isInitialized,
      'envIP': _envIP,
      'envPort': _envPort,
      'currentIP': currentIP,
      'currentPort': currentPort,
      'isUsingCustom': isCustom,
      'baseUrl': await getBaseUrl(),
    };
  }

  // Validate IP address format (basic validation)
  bool isValidIP(String ip) {
    if (ip.trim().isEmpty) return false;
    
    // Check for localhost
    if (ip.toLowerCase() == 'localhost') return true;
    
    // Basic IPv4 validation
    final parts = ip.split('.');
    if (parts.length != 4) return false;
    
    for (final part in parts) {
      try {
        final num = int.parse(part);
        if (num < 0 || num > 255) return false;
      } catch (e) {
        return false;
      }
    }
    
    return true;
  }

  // Validate port number
  bool isValidPort(String port) {
    if (port.trim().isEmpty) return false;
    
    try {
      final num = int.parse(port);
      return num > 0 && num <= 65535;
    } catch (e) {
      return false;
    }
  }

  // Force refresh from .env file
  Future<void> refreshFromEnv() async {
    try {
      _isInitialized = false;
      await init();
      print('Refreshed configuration from .env file');
    } catch (e) {
      print('Error refreshing from .env: $e');
      throw Exception('Failed to refresh from .env file: $e');
    }
  }

  // Debug method to print all current settings
  Future<void> debugPrintConfig() async {
    final config = await getConfigInfo();
    print('=== IPConfigService Debug Info ===');
    config.forEach((key, value) {
      print('$key: $value');
    });
    print('================================');
  }
}