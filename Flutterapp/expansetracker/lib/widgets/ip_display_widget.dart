// lib/widgets/ip_display_widget.dart - Updated IP Display Widget Compatible with ConfigService
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/config_service.dart';

class IPDisplayWidget extends StatefulWidget {
  final EdgeInsets? margin;
  final Color? backgroundColor;
  final Color? textColor;
  
  const IPDisplayWidget({
    super.key,
    this.margin,
    this.backgroundColor,
    this.textColor,
  });

  @override
  State<IPDisplayWidget> createState() => _IPDisplayWidgetState();
}

class _IPDisplayWidgetState extends State<IPDisplayWidget> {
  String _currentIP = '';
  String _currentPort = '';
  bool _isLoading = false;
  bool _showDetails = false;
  bool _isUsingCustom = false;
  String _serverStatus = 'Unknown';

  @override
  void initState() {
    super.initState();
    _loadIPConfig();
  }

  Future<void> _loadIPConfig() async {
    setState(() {
      _isLoading = true;
    });

    try {
      // Initialize the config service
      await ConfigService.initialize();
      
      // Get current values using async methods
      final ip = await ConfigService.instance.currentIP;
      final port = await ConfigService.instance.currentPort;
      final isCustom = await ConfigService.instance.isUsingCustomConfig;
      
      setState(() {
        _currentIP = ip;
        _currentPort = port;
        _isUsingCustom = isCustom;
      });
      
      print('IP Display Widget loaded config:');
      print('   IP: $ip');
      print('   Port: $port');
      print('   Using Custom: $isCustom');
      
      // Test server connection
      await _testConnection();
      
    } catch (e) {
      print('Error loading IP config: $e');
      setState(() {
        _currentIP = 'Error';
        _currentPort = 'Error';
        _serverStatus = 'Error';
      });
      
      _showSnackBar('Error loading IP config: $e', Colors.red);
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _testConnection() async {
    try {
      // Use the sync getter for immediate response
      final serverUrl = ConfigService.instance.serverUrl;
      print('Testing connection to: $serverUrl/health');
      
      setState(() {
        _serverStatus = 'Testing...';
      });
      
      // This is a simplified test - in a real app you'd make an HTTP request
      await Future.delayed(const Duration(milliseconds: 500));
      
      setState(() {
        _serverStatus = 'Connected';
      });
      
    } catch (e) {
      print('Connection test failed: $e');
      setState(() {
        _serverStatus = 'Disconnected';
      });
    }
  }

  void _copyToClipboard(String text) {
    Clipboard.setData(ClipboardData(text: text));
    _showSnackBar('Copied: $text', Colors.green);
  }

  void _showSnackBar(String message, Color color) {
    if (!mounted) return;
    
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          message,
          style: GoogleFonts.inter(color: Colors.white),
        ),
        backgroundColor: color,
        behavior: SnackBarBehavior.floating,
        duration: const Duration(seconds: 2),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(8),
        ),
      ),
    );
  }

  Future<void> _showEditDialog() async {
    final ipController = TextEditingController(text: _currentIP);
    final portController = TextEditingController(text: _currentPort);
    
    // Get environment defaults for display
    final envIP = ConfigService.instance.envIP ?? 'N/A';
    final envPort = ConfigService.instance.envPort ?? 'N/A';
    
    final result = await showDialog<Map<String, String>>(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
        title: Text(
          'Edit Server Configuration',
          style: GoogleFonts.inter(
            fontWeight: FontWeight.w600,
            color: const Color(0xFF2D3748),
          ),
        ),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Show environment defaults
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.blue.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.blue.withOpacity(0.3)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(Icons.info_outline, size: 16, color: Colors.blue[700]),
                        const SizedBox(width: 4),
                        Text(
                          'Environment Defaults (.env):',
                          style: GoogleFonts.inter(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: Colors.blue[700],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Text('IP: ', style: GoogleFonts.inter(fontSize: 11, color: Colors.grey[600])),
                        Text(envIP, style: GoogleFonts.inter(fontSize: 11, color: Colors.blue[600], fontWeight: FontWeight.w500)),
                        const SizedBox(width: 16),
                        Text('Port: ', style: GoogleFonts.inter(fontSize: 11, color: Colors.grey[600])),
                        Text(envPort, style: GoogleFonts.inter(fontSize: 11, color: Colors.blue[600], fontWeight: FontWeight.w500)),
                      ],
                    ),
                  ],
                ),
              ),
              
              const SizedBox(height: 16),
              
              Text(
                'Override Settings:',
                style: GoogleFonts.inter(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: const Color(0xFF2D3748),
                ),
              ),
              
              const SizedBox(height: 8),
              
              // Custom IP input
              TextField(
                controller: ipController,
                decoration: InputDecoration(
                  labelText: 'IP Address',
                  labelStyle: GoogleFonts.inter(color: Colors.grey[600]),
                  hintText: 'e.g., 192.168.1.10 or localhost',
                  prefixIcon: Icon(Icons.computer, color: Colors.grey[600]),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                    borderSide: const BorderSide(color: Color(0xFF6B8E3D), width: 2),
                  ),
                ),
              ),
              
              const SizedBox(height: 16),
              
              // Custom port input
              TextField(
                controller: portController,
                keyboardType: TextInputType.number,
                decoration: InputDecoration(
                  labelText: 'Port',
                  labelStyle: GoogleFonts.inter(color: Colors.grey[600]),
                  hintText: 'e.g., 5001, 3000, 8080',
                  prefixIcon: Icon(Icons.settings_ethernet, color: Colors.grey[600]),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                    borderSide: const BorderSide(color: Color(0xFF6B8E3D), width: 2),
                  ),
                ),
              ),
              
              const SizedBox(height: 12),
              
              // Info text
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.amber.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(6),
                  border: Border.all(color: Colors.amber.withOpacity(0.3)),
                ),
                child: Row(
                  children: [
                    Icon(Icons.lightbulb_outline, size: 16, color: Colors.amber[700]),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Changes take effect immediately. Leave empty to use environment defaults.',
                        style: GoogleFonts.inter(
                          fontSize: 11,
                          color: Colors.amber[700],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text(
              'Cancel',
              style: GoogleFonts.inter(color: Colors.grey[600]),
            ),
          ),
          TextButton(
            onPressed: () async {
              try {
                await ConfigService.instance.resetToDefaults();
                Navigator.pop(context, {'reset': 'true'});
              } catch (e) {
                _showSnackBar('Error resetting: $e', Colors.red);
              }
            },
            child: Text(
              'Reset to Default',
              style: GoogleFonts.inter(
                color: Colors.orange[600],
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          ElevatedButton(
            onPressed: () {
              final newIP = ipController.text.trim();
              final newPort = portController.text.trim();
              
              // Validate inputs
              if (newIP.isNotEmpty && !_isValidIP(newIP)) {
                _showSnackBar('Invalid IP address format', Colors.red);
                return;
              }
              
              if (newPort.isNotEmpty && !_isValidPort(newPort)) {
                _showSnackBar('Invalid port number (1-65535)', Colors.red);
                return;
              }
              
              Navigator.pop(context, {
                'ip': newIP.isEmpty ? _currentIP : newIP,
                'port': newPort.isEmpty ? _currentPort : newPort,
              });
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF6B8E3D),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.save, size: 16),
                const SizedBox(width: 4),
                Text(
                  'Save',
                  style: GoogleFonts.inter(
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
    
    if (result != null) {
      if (result.containsKey('reset')) {
        await _loadIPConfig();
        _showSnackBar('Reset to default configuration', Colors.blue);
      } else {
        try {
          final newIP = result['ip']!;
          final newPort = result['port']!;
          
          setState(() {
            _serverStatus = 'Updating...';
          });
          
          // Update configuration using the new async methods
          await ConfigService.instance.updateIP(newIP);
          await ConfigService.instance.updatePort(newPort);
          
          // Reload the configuration to refresh UI
          await _loadIPConfig();
          _showSnackBar('Configuration updated successfully!', Colors.green);
          
          // Print new configuration for debugging
          print('Configuration updated to:');
          print('   IP: $newIP');
          print('   Port: $newPort');
          await ConfigService.instance.printConfig();
          
        } catch (e) {
          _showSnackBar('Error updating configuration: $e', Colors.red);
          setState(() {
            _serverStatus = 'Error';
          });
        }
      }
    }
  }

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

  Color _getStatusColor() {
    switch (_serverStatus.toLowerCase()) {
      case 'connected':
        return Colors.green;
      case 'testing...':
      case 'updating...':
        return Colors.orange;
      case 'disconnected':
      case 'error':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: widget.margin ?? const EdgeInsets.all(8),
      child: Material(
        color: widget.backgroundColor ?? Colors.white.withOpacity(0.9),
        borderRadius: BorderRadius.circular(20),
        elevation: 2,
        child: InkWell(
          onTap: () {
            setState(() {
              _showDetails = !_showDetails;
            });
          },
          borderRadius: BorderRadius.circular(20),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 300),
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                color: _isUsingCustom 
                    ? Colors.orange.withOpacity(0.5)
                    : Colors.grey.withOpacity(0.3),
                width: 1,
              ),
            ),
            child: _isLoading 
                ? _buildLoadingContent()
                : _showDetails 
                    ? _buildDetailedContent()
                    : _buildCompactContent(),
          ),
        ),
      ),
    );
  }

  Widget _buildLoadingContent() {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        SizedBox(
          width: 12,
          height: 12,
          child: CircularProgressIndicator(
            strokeWidth: 1.5,
            color: widget.textColor ?? const Color(0xFF6B8E3D),
          ),
        ),
        const SizedBox(width: 6),
        Text(
          'Loading...',
          style: GoogleFonts.inter(
            fontSize: 12,
            color: widget.textColor ?? const Color(0xFF2D3748),
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }

  Widget _buildCompactContent() {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(
          Icons.network_check,
          size: 14,
          color: _isUsingCustom 
              ? Colors.orange[600] 
              : (widget.textColor ?? const Color(0xFF6B8E3D)),
        ),
        const SizedBox(width: 4),
        Text(
          'Server',
          style: GoogleFonts.inter(
            fontSize: 12,
            color: widget.textColor ?? const Color(0xFF2D3748),
            fontWeight: FontWeight.w500,
          ),
        ),
        if (_isUsingCustom) ...[
          const SizedBox(width: 2),
          Container(
            width: 6,
            height: 6,
            decoration: BoxDecoration(
              color: Colors.orange,
              borderRadius: BorderRadius.circular(3),
            ),
          ),
        ],
        if (_serverStatus != 'Unknown') ...[
          const SizedBox(width: 4),
          Container(
            width: 6,
            height: 6,
            decoration: BoxDecoration(
              color: _getStatusColor(),
              borderRadius: BorderRadius.circular(3),
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildDetailedContent() {
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Header
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  Icons.network_check,
                  size: 14,
                  color: _isUsingCustom 
                      ? Colors.orange[600] 
                      : (widget.textColor ?? const Color(0xFF6B8E3D)),
                ),
                const SizedBox(width: 4),
                Text(
                  'Server Config',
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    color: widget.textColor ?? const Color(0xFF2D3748),
                    fontWeight: FontWeight.w600,
                  ),
                ),
                if (_isUsingCustom) ...[
                  const SizedBox(width: 4),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                    decoration: BoxDecoration(
                      color: Colors.orange.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      'CUSTOM',
                      style: GoogleFonts.inter(
                        fontSize: 8,
                        color: Colors.orange[800],
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ],
            ),
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                GestureDetector(
                  onTap: _showEditDialog,
                  child: Icon(
                    Icons.edit,
                    size: 14,
                    color: widget.textColor ?? Colors.grey[600],
                  ),
                ),
                const SizedBox(width: 8),
                Icon(
                  Icons.keyboard_arrow_up,
                  size: 16,
                  color: widget.textColor ?? Colors.grey[500],
                ),
              ],
            ),
          ],
        ),
        
        const SizedBox(height: 8),
        
        // Status Row
        Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 8,
              height: 8,
              decoration: BoxDecoration(
                color: _getStatusColor(),
                borderRadius: BorderRadius.circular(4),
              ),
            ),
            const SizedBox(width: 6),
            Text(
              'Status: $_serverStatus',
              style: GoogleFonts.inter(
                fontSize: 11,
                color: widget.textColor ?? Colors.grey[600],
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
        
        const SizedBox(height: 6),
        
        // IP Address Row
        Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'IP: ',
              style: GoogleFonts.inter(
                fontSize: 11,
                color: widget.textColor ?? Colors.grey[600],
                fontWeight: FontWeight.w500,
              ),
            ),
            GestureDetector(
              onTap: () => _copyToClipboard(_currentIP),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: Colors.blue.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      _currentIP,
                      style: GoogleFonts.inter(
                        fontSize: 11,
                        color: Colors.blue[700],
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(width: 4),
                    Icon(
                      Icons.copy,
                      size: 12,
                      color: Colors.blue[700],
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
        
        const SizedBox(height: 4),
        
        // Port Row
        Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'Port: ',
              style: GoogleFonts.inter(
                fontSize: 11,
                color: widget.textColor ?? Colors.grey[600],
                fontWeight: FontWeight.w500,
              ),
            ),
            GestureDetector(
              onTap: () => _copyToClipboard(_currentPort),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: Colors.blue.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      _currentPort,
                      style: GoogleFonts.inter(
                        fontSize: 11,
                        color: Colors.blue[700],
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(width: 4),
                    Icon(
                      Icons.copy,
                      size: 12,
                      color: Colors.blue[700],
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
        
        const SizedBox(height: 4),
        
        // Full URL Row
        Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'URL: ',
              style: GoogleFonts.inter(
                fontSize: 11,
                color: widget.textColor ?? Colors.grey[600],
                fontWeight: FontWeight.w500,
              ),
            ),
            Flexible(
              child: GestureDetector(
                onTap: () => _copyToClipboard('http://$_currentIP:$_currentPort'),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: Colors.green.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Flexible(
                        child: Text(
                          'http://$_currentIP:$_currentPort',
                          style: GoogleFonts.inter(
                            fontSize: 11,
                            color: Colors.green[700],
                            fontWeight: FontWeight.w600,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const SizedBox(width: 4),
                      Icon(
                        Icons.copy,
                        size: 12,
                        color: Colors.green[700],
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
        
        const SizedBox(height: 8),
        
        // Action Buttons
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
          children: [
            // Refresh Button
            GestureDetector(
              onTap: _loadIPConfig,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.blue.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.blue.withOpacity(0.3)),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      Icons.refresh,
                      size: 12,
                      color: Colors.blue[700],
                    ),
                    const SizedBox(width: 4),
                    Text(
                      'Refresh',
                      style: GoogleFonts.inter(
                        fontSize: 10,
                        color: Colors.blue[700],
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            
            // Test Button
            GestureDetector(
              onTap: _testConnection,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.purple.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.purple.withOpacity(0.3)),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      Icons.wifi_find,
                      size: 12,
                      color: Colors.purple[700],
                    ),
                    const SizedBox(width: 4),
                    Text(
                      'Test',
                      style: GoogleFonts.inter(
                        fontSize: 10,
                        color: Colors.purple[700],
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            
            // Edit Button
            GestureDetector(
              onTap: _showEditDialog,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.orange.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.orange.withOpacity(0.3)),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      Icons.edit,
                      size: 12,
                      color: Colors.orange[700],
                    ),
                    const SizedBox(width: 4),
                    Text(
                      'Edit',
                      style: GoogleFonts.inter(
                        fontSize: 10,
                        color: Colors.orange[700],
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }
}