// lib/widgets/ip_config_dialog.dart
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/config_service.dart';

class IPConfigDialog extends StatefulWidget {
  final Function()? onConfigUpdated;
  
  const IPConfigDialog({
    Key? key,
    this.onConfigUpdated,
  }) : super(key: key);

  @override
  State<IPConfigDialog> createState() => _IPConfigDialogState();
}

class _IPConfigDialogState extends State<IPConfigDialog> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _ipController;
  late TextEditingController _portController;
  bool _isLoading = false;
  String? _errorMessage;
  bool _isTestingConnection = false;
  List<String> _availableServers = [];

  @override
  void initState() {
    super.initState();
    final config = ConfigService.instance;
    _ipController = TextEditingController(text: config.currentIP);
    _portController = TextEditingController(text: config.currentPort);
  }

  @override
  void dispose() {
    _ipController.dispose();
    _portController.dispose();
    super.dispose();
  }

  Future<void> _saveConfiguration() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    final success = await ConfigService.instance.updateConfig(
      ip: _ipController.text.trim(),
      port: _portController.text.trim(),
    );

    setState(() {
      _isLoading = false;
    });

    if (success) {
      if (widget.onConfigUpdated != null) {
        widget.onConfigUpdated!();
      }
      Navigator.of(context).pop(true);
      _showSnackBar('Server configuration updated successfully!', Colors.green);
    } else {
      setState(() {
        _errorMessage = 'Failed to update configuration. Please check your input.';
      });
    }
  }

  Future<void> _resetToEnvDefaults() async {
    await ConfigService.instance.resetToEnvDefaults();
    setState(() {
      _ipController.text = ConfigService.instance.currentIP;
      _portController.text = ConfigService.instance.currentPort;
      _errorMessage = null;
    });
    _showSnackBar('Configuration reset to .env defaults', Colors.blue);
  }

  Future<void> _testConnection() async {
    setState(() {
      _isTestingConnection = true;
      _errorMessage = null;
    });

    // First save the current config temporarily to test it
    final tempConfig = ConfigService.instance;
    await tempConfig.updateConfig(
      ip: _ipController.text.trim(),
      port: _portController.text.trim(),
    );

    final isConnected = await tempConfig.testConnection();

    setState(() {
      _isTestingConnection = false;
    });

    if (isConnected) {
      _showSnackBar('Connection successful!', Colors.green);
    } else {
      _showSnackBar('Connection failed. Please check your settings.', Colors.red);
    }
  }

  Future<void> _scanForServers() async {
    setState(() {
      _isLoading = true;
      _availableServers.clear();
    });

    final servers = await ConfigService.instance.scanForServers();
    
    setState(() {
      _availableServers = servers;
      _isLoading = false;
    });

    if (servers.isNotEmpty) {
      _showServerSelectionDialog(servers);
    } else {
      _showSnackBar('No servers found in the current network range', Colors.orange);
    }
  }

  void _showServerSelectionDialog(List<String> servers) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(
          'Available Servers',
          style: GoogleFonts.inter(fontWeight: FontWeight.w600),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: servers.map((server) => ListTile(
            leading: Icon(Icons.dns, color: const Color(0xFF6B8E3D)),
            title: Text(server),
            onTap: () {
              _ipController.text = server;
              Navigator.of(context).pop();
            },
          )).toList(),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: Text('Cancel'),
          ),
        ],
      ),
    );
  }

  void _showSnackBar(String message, Color color) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: color,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(10),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final config = ConfigService.instance;
    
    return AlertDialog(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
      ),
      title: Row(
        children: [
          Icon(
            Icons.settings_ethernet,
            color: const Color(0xFF6B8E3D),
          ),
          const SizedBox(width: 8),
          Text(
            'Server Configuration',
            style: GoogleFonts.inter(
              fontWeight: FontWeight.w600,
              color: const Color(0xFF2D3748),
              fontSize: 18,
            ),
          ),
        ],
      ),
      content: SingleChildScrollView(
        child: Form(
          key: _formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Configure your API server connection details:',
                style: GoogleFonts.inter(
                  color: const Color(0xFF718096),
                  fontSize: 14,
                ),
              ),
              const SizedBox(height: 20),
              
              // Current Configuration Info
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFFF7FAFC),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(
                    color: const Color(0xFF6B8E3D).withOpacity(0.2),
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(
                          'Current Server:',
                          style: GoogleFonts.inter(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: const Color(0xFF6B8E3D),
                          ),
                        ),
                        const Spacer(),
                        if (config.isUsingCustomConfig)
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: Colors.orange.withOpacity(0.2),
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Text(
                              'Custom',
                              style: GoogleFonts.inter(
                                fontSize: 10,
                                fontWeight: FontWeight.w600,
                                color: Colors.orange[800],
                              ),
                            ),
                          )
                        else
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: Colors.green.withOpacity(0.2),
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Text(
                              'Default',
                              style: GoogleFonts.inter(
                                fontSize: 10,
                                fontWeight: FontWeight.w600,
                                color: Colors.green[800],
                              ),
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      config.baseUrl,
                      style: GoogleFonts.inter(
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                        color: const Color(0xFF2D3748),
                      ),
                    ),
                    if (config.envIP != null) ...[
                      const SizedBox(height: 8),
                      Text(
                        '.env Default: ${config.envBaseUrl}',
                        style: GoogleFonts.inter(
                          fontSize: 11,
                          color: const Color(0xFF718096),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              
              const SizedBox(height: 20),

              // IP Address Field
              TextFormField(
                controller: _ipController,
                keyboardType: TextInputType.numberWithOptions(decimal: true),
                decoration: InputDecoration(
                  labelText: 'IP Address',
                  labelStyle: GoogleFonts.inter(
                    color: const Color(0xFF718096),
                  ),
                  prefixIcon: const Icon(
                    Icons.router,
                    color: Color(0xFF6B8E3D),
                  ),
                  suffixIcon: IconButton(
                    icon: Icon(Icons.search, color: const Color(0xFF6B8E3D)),
                    onPressed: _isLoading ? null : _scanForServers,
                    tooltip: 'Scan for servers',
                  ),
                  hintText: '192.168.1.9',
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(color: Color(0xFF718096)),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(color: Color(0xFF6B8E3D)),
                  ),
                ),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Please enter IP address';
                  }
                  
                  final ipRegex = RegExp(r'^(\d{1,3}\.){3}\d{1,3}$');
                  if (!ipRegex.hasMatch(value)) {
                    return 'Invalid IP format (e.g., 192.168.1.9)';
                  }
                  
                  final parts = value.split('.');
                  for (String part in parts) {
                    final num = int.tryParse(part);
                    if (num == null || num < 0 || num > 255) {
                      return 'IP parts must be 0-255';
                    }
                  }
                  return null;
                },
              ),

              const SizedBox(height: 16),

              // Port Field
              TextFormField(
                controller: _portController,
                keyboardType: TextInputType.number,
                decoration: InputDecoration(
                  labelText: 'Port',
                  labelStyle: GoogleFonts.inter(
                    color: const Color(0xFF718096),
                  ),
                  prefixIcon: const Icon(
                    Icons.electrical_services,
                    color: Color(0xFF6B8E3D),
                  ),
                  hintText: '5001',
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(color: Color(0xFF718096)),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(color: Color(0xFF6B8E3D)),
                  ),
                ),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Please enter port number';
                  }
                  
                  final port = int.tryParse(value);
                  if (port == null || port < 1 || port > 65535) {
                    return 'Port must be between 1-65535';
                  }
                  return null;
                },
              ),

              const SizedBox(height: 16),

              // Test Connection Button
              SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  onPressed: (_isLoading || _isTestingConnection) ? null : _testConnection,
                  icon: _isTestingConnection 
                      ? SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: const Color(0xFF6B8E3D),
                          ),
                        )
                      : Icon(Icons.wifi_tethering, color: const Color(0xFF6B8E3D)),
                  label: Text(
                    _isTestingConnection ? 'Testing...' : 'Test Connection',
                    style: GoogleFonts.inter(
                      color: const Color(0xFF6B8E3D),
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  style: OutlinedButton.styleFrom(
                    side: BorderSide(color: const Color(0xFF6B8E3D)),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ),
              ),

              if (_errorMessage != null) ...[
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.red.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.red.withOpacity(0.3)),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.error_outline, color: Colors.red, size: 16),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          _errorMessage!,
                          style: GoogleFonts.inter(
                            color: Colors.red,
                            fontSize: 12,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
      actions: [
        TextButton(
          onPressed: _isLoading ? null : () => Navigator.of(context).pop(),
          child: Text(
            'Cancel',
            style: GoogleFonts.inter(
              color: const Color(0xFF718096),
            ),
          ),
        ),
        TextButton(
          onPressed: _isLoading ? null : _resetToEnvDefaults,
          child: Text(
            'Reset to .env',
            style: GoogleFonts.inter(
              color: Colors.orange,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
        ElevatedButton(
          onPressed: _isLoading ? null : _saveConfiguration,
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFF6B8E3D),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
          ),
          child: _isLoading
              ? const SizedBox(
                  width: 16,
                  height: 16,
                  child: CircularProgressIndicator(
                    color: Colors.white,
                    strokeWidth: 2,
                  ),
                )
              : Text(
                  'Save',
                  style: GoogleFonts.inter(
                    color: Colors.white,
                    fontWeight: FontWeight.w600,
                  ),
                ),
        ),
      ],
    );
  }
}