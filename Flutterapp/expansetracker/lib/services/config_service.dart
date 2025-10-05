// lib/services/config_service.dart - Backward Compatible Configuration Service flutter 
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ConfigService {
  static ConfigService? _instance;
  static ConfigService get instance {
    _instance ??= ConfigService._();
    return _instance!;
  }
  
  ConfigService._();
  
  // SharedPreferences keys
  static const String _customIpKey = 'custom_ip_override';
  static const String _customPortKey = 'custom_port_override';
  static const String _useCustomConfigKey = 'use_custom_config';
  
  bool _isInitialized = false;
  String? _envIP;
  String? _envPort;
  String? _currentCachedIP;
  String? _currentCachedPort;
  
  // Initialize the config service
  static Future<void> initialize() async {
    await instance._init();
  }
  
  Future<void> _init() async {
    if (_isInitialized) return;
    
    try {
      await dotenv.load(fileName: ".env");
      _envIP = dotenv.env['IP'] ?? '192.168.1.9';
      _envPort = dotenv.env['PORT'] ?? '5001';
      _isInitialized = true;
      
      // Load current values immediately
      await _loadCurrentValues();
      
      print('✅ Config service initialized successfully');
      print('📍 Environment IP: $_envIP, PORT: $_envPort');
      print('📍 Current IP: $_currentCachedIP, PORT: $_currentCachedPort');
    } catch (e) {
      print('⚠️ Warning: Could not load .env file, using defaults: $e');
      _envIP = '192.168.1.9';
      _envPort = '5001';
      _currentCachedIP = _envIP;
      _currentCachedPort = _envPort;
      _isInitialized = true;
    }
  }
  
  Future<void> _loadCurrentValues() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final useCustom = prefs.getBool(_useCustomConfigKey) ?? false;
      
      if (useCustom) {
        final customIP = prefs.getString(_customIpKey);
        final customPort = prefs.getString(_customPortKey);
        
        _currentCachedIP = (customIP != null && customIP.isNotEmpty) ? customIP : _envIP;
        _currentCachedPort = (customPort != null && customPort.isNotEmpty) ? customPort : _envPort;
      } else {
        _currentCachedIP = _envIP;
        _currentCachedPort = _envPort;
      }
    } catch (e) {
      print('❌ Error loading current values: $e');
      _currentCachedIP = _envIP ?? '192.168.1.9';
      _currentCachedPort = _envPort ?? '5001';
    }
  }
  
  // SYNCHRONOUS GETTERS (for backward compatibility)
  String get baseUrl {
    if (!_isInitialized || _currentCachedIP == null || _currentCachedPort == null) {
      // Return default if not initialized
      final defaultIP = _envIP ?? '192.168.1.9';
      final defaultPort = _envPort ?? '5001';
      final cleanIp = defaultIP.replaceAll('http://', '').replaceAll('https://', '');
      return 'http://$cleanIp:$defaultPort/api';
    }
    
    final cleanIp = _currentCachedIP!.replaceAll('http://', '').replaceAll('https://', '');
    return 'http://$cleanIp:$_currentCachedPort/api';
  }
  
  String get ipAddress {
    if (!_isInitialized || _currentCachedIP == null) {
      return (_envIP ?? '192.168.1.9').replaceAll('http://', '').replaceAll('https://', '');
    }
    return _currentCachedIP!.replaceAll('http://', '').replaceAll('https://', '');
  }
  
  String get serverUrl {
    if (!_isInitialized || _currentCachedIP == null || _currentCachedPort == null) {
      final defaultIP = _envIP ?? '192.168.1.9';
      final defaultPort = _envPort ?? '5001';
      final cleanIp = defaultIP.replaceAll('http://', '').replaceAll('https://', '');
      return 'http://$cleanIp:$defaultPort';
    }
    
    final cleanIp = _currentCachedIP!.replaceAll('http://', '').replaceAll('https://', '');
    return 'http://$cleanIp:$_currentCachedPort';
  }
  
  int get port {
    if (!_isInitialized || _currentCachedPort == null) {
      return int.tryParse(_envPort ?? '5001') ?? 5001;
    }
    return int.tryParse(_currentCachedPort!) ?? 5001;
  }
  
  // ASYNC GETTERS (for new functionality)
  Future<String> get currentIP async {
    if (!_isInitialized) await _init();
    
    try {
      final prefs = await SharedPreferences.getInstance();
      final useCustom = prefs.getBool(_useCustomConfigKey) ?? false;
      
      if (useCustom) {
        final customIP = prefs.getString(_customIpKey);
        if (customIP != null && customIP.isNotEmpty) {
          _currentCachedIP = customIP;
          print('🔄 Using custom IP: $customIP');
          return customIP;
        }
      }
      
      _currentCachedIP = _envIP ?? '192.168.1.9';
      print('🏠 Using environment IP: $_currentCachedIP');
      return _currentCachedIP!;
    } catch (e) {
      print('❌ Error getting current IP: $e');
      _currentCachedIP = _envIP ?? '192.168.1.9';
      return _currentCachedIP!;
    }
  }
  
  Future<String> get currentPort async {
    if (!_isInitialized) await _init();
    
    try {
      final prefs = await SharedPreferences.getInstance();
      final useCustom = prefs.getBool(_useCustomConfigKey) ?? false;
      
      if (useCustom) {
        final customPort = prefs.getString(_customPortKey);
        if (customPort != null && customPort.isNotEmpty) {
          _currentCachedPort = customPort;
          print('🔄 Using custom PORT: $customPort');
          return customPort;
        }
      }
      
      _currentCachedPort = _envPort ?? '5001';
      print('🏠 Using environment PORT: $_currentCachedPort');
      return _currentCachedPort!;
    } catch (e) {
      print('❌ Error getting current PORT: $e');
      _currentCachedPort = _envPort ?? '5001';
      return _currentCachedPort!;
    }
  }
  
  // Update IP override and refresh cache
  Future<void> updateIP(String newIP) async {
    if (newIP.trim().isEmpty) {
      throw ArgumentError('IP address cannot be empty');
    }
    
    if (!_isValidIP(newIP.trim())) {
      throw ArgumentError('Invalid IP address format');
    }
    
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_customIpKey, newIP.trim());
      await prefs.setBool(_useCustomConfigKey, true);
      
      // Update cache immediately
      _currentCachedIP = newIP.trim();
      
      print('🔄 IP override set to: ${newIP.trim()}');
      await printConfig();
    } catch (e) {
      print('❌ Error updating IP: $e');
      throw Exception('Failed to update IP address: $e');
    }
  }
  
  // Update PORT override and refresh cache
  Future<void> updatePort(String newPort) async {
    if (newPort.trim().isEmpty) {
      throw ArgumentError('Port cannot be empty');
    }
    
    if (!_isValidPort(newPort.trim())) {
      throw ArgumentError('Invalid port number');
    }
    
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_customPortKey, newPort.trim());
      await prefs.setBool(_useCustomConfigKey, true);
      
      // Update cache immediately
      _currentCachedPort = newPort.trim();
      
      print('🔄 PORT override set to: ${newPort.trim()}');
      await printConfig();
    } catch (e) {
      print('❌ Error updating PORT: $e');
      throw Exception('Failed to update port: $e');
    }
  }
  
  // Reset to .env defaults
  Future<void> resetToDefaults() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(_customIpKey);
      await prefs.remove(_customPortKey);
      await prefs.setBool(_useCustomConfigKey, false);
      
      // Update cache immediately
      _currentCachedIP = _envIP;
      _currentCachedPort = _envPort;
      
      print('🏠 Reset to environment defaults');
      await printConfig();
    } catch (e) {
      print('❌ Error resetting to defaults: $e');
      throw Exception('Failed to reset configuration: $e');
    }
  }
  
  // Check if using custom configuration
  Future<bool> get isUsingCustomConfig async {
    try {
      final prefs = await SharedPreferences.getInstance();
      return prefs.getBool(_useCustomConfigKey) ?? false;
    } catch (e) {
      print('❌ Error checking custom config status: $e');
      return false;
    }
  }
  
  // Get all configuration info for debugging
  Future<Map<String, dynamic>> getConfigInfo() async {
    final currentIpValue = await currentIP;
    final currentPortValue = await currentPort;
    final isCustom = await isUsingCustomConfig;
    
    return {
      'initialized': _isInitialized,
      'envIP': _envIP,
      'envPort': _envPort,
      'currentIP': currentIpValue,
      'currentPort': currentPortValue,
      'isUsingCustom': isCustom,
      'baseUrl': baseUrl,  // Use sync getter
      'serverUrl': serverUrl,  // Use sync getter
    };
  }
  
  // Debug method to print current config
  Future<void> printConfig() async {
    final config = await getConfigInfo();
    print('🔧 Current Configuration:');
    print('   • Environment IP: ${config['envIP']}');
    print('   • Environment PORT: ${config['envPort']}');
    print('   • Current IP: ${config['currentIP']}');
    print('   • Current PORT: ${config['currentPort']}');
    print('   • Using Custom: ${config['isUsingCustom']}');
    print('   • Server URL: ${config['serverUrl']}');
    print('   • API Base URL: ${config['baseUrl']}');
  }
  
  // Legacy method for backward compatibility
  void updateIp(String newIp) {
    // For backward compatibility, update the dotenv variable
    dotenv.env['IP'] = newIp;
    _envIP = newIp;
    _currentCachedIP = newIp;
    print('🔄 IP updated to: $newIp (legacy method)');
  }
  
  // Test connection to current configuration
  Future<bool> testConnection() async {
    try {
      final url = serverUrl;  // Use sync getter
      print('🔍 Testing connection to: $url/health');
      return true;
    } catch (e) {
      print('❌ Connection test failed: $e');
      return false;
    }
  }
  
  // Get custom values for UI display
  Future<String?> getCustomIP() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      return prefs.getString(_customIpKey);
    } catch (e) {
      return null;
    }
  }
  
  Future<String?> getCustomPort() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      return prefs.getString(_customPortKey);
    } catch (e) {
      return null;
    }
  }
  
  // Environment values getters
  String? get envIP => _envIP;
  String? get envPort => _envPort;
  bool get isInitialized => _isInitialized;
  
  // Validation methods
  bool _isValidIP(String ip) {
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
  
  bool _isValidPort(String port) {
    if (port.trim().isEmpty) return false;
    
    try {
      final num = int.parse(port);
      return num > 0 && num <= 65535;
    } catch (e) {
      return false;
    }
  }
  
  // Force refresh configuration and cache
  Future<void> refresh() async {
    _isInitialized = false;
    await _init();
    print('🔄 Configuration refreshed');
  }
}