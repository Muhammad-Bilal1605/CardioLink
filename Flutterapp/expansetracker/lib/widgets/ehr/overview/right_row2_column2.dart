import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../../provider/auth_provider.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;

class RightRow2Column2 extends StatefulWidget {
  final String? patientId;

  const RightRow2Column2({
    Key? key,
    this.patientId,
  }) : super(key: key);

  @override
  _RightRow2Column2State createState() => _RightRow2Column2State();
}

class _RightRow2Column2State extends State<RightRow2Column2> {
  Map<String, dynamic> _vitalData = {
    'heartRate': [],
    'bloodPressure': [],
    'oxygen': [],
    'temperature': [],
    'dates': []
  };
  bool _loading = false;
  String? _error;
  String _selectedVital = 'heartRate';
  Map<String, dynamic> _recentValues = {
    'heartRate': 'N/A',
    'bloodPressure': 'N/A',
    'oxygen': 'N/A',
    'temperature': 'N/A'
  };

  @override
  void initState() {
    super.initState();
    _loadVitalSigns();
  }

  Future<void> _loadVitalSigns() async {
    if (widget.patientId == null) return;
    
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      print('RightRow2Column2 - Loading vital signs for patient: ${widget.patientId}');
      
      // Get auth token from context
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final authToken = authProvider.authToken;
      
      final headers = <String, String>{
        'Content-Type': 'application/json',
      };
      
      if (authToken != null) {
        headers['Authorization'] = 'Bearer $authToken';
      }
      
      final response = await http.get(
        Uri.parse('http://192.168.100.8:5001/api/vital-signs/patient/${widget.patientId}?limit=50'),
        headers: headers,
      );

      print('RightRow2Column2 - Vital signs API response: ${response.statusCode}');
      print('RightRow2Column2 - Vital signs response body: ${response.body}');
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        print('RightRow2Column2 - Vital signs data: $data');
        
        if (data['success'] == true && data['data'] != null && (data['data'] as List).isNotEmpty) {
          final vitals = data['data'] as List;
          final processedData = _processVitalSigns(vitals);
          
          setState(() {
            _vitalData = processedData;
            _recentValues = _getRecentValues(processedData);
            _loading = false;
          });
        } else {
          setState(() {
            _error = 'No vital signs data available';
            _loading = false;
          });
        }
      } else {
        setState(() {
          _error = 'Failed to load vital signs data';
          _loading = false;
        });
      }
    } catch (e) {
      setState(() {
        _error = 'Error loading vital signs: $e';
        _loading = false;
      });
      print('RightRow2Column2 - Error loading vital signs: $e');
    }
  }

  Map<String, dynamic> _processVitalSigns(List vitals) {
    // Group vitals by date and calculate averages
    Map<String, dynamic> groups = {};
    
    for (var vital in vitals) {
      final date = DateTime.parse(vital['date']);
      final dateKey = date.toIso8601String().split('T')[0];
      
      if (!groups.containsKey(dateKey)) {
        groups[dateKey] = {
          'date': dateKey,
          'heartRateValues': [],
          'bloodPressureValues': [],
          'oxygenValues': [],
          'temperatureValues': []
        };
      }
      
      // Add values to their respective arrays
      if (vital['heartRate'] != null && vital['heartRate']['value'] != null) {
        groups[dateKey]['heartRateValues'].add(vital['heartRate']['value']);
      }
      
      if (vital['bloodPressure'] != null && 
          vital['bloodPressure']['systolic'] != null && 
          vital['bloodPressure']['diastolic'] != null) {
        groups[dateKey]['bloodPressureValues'].add({
          'systolic': vital['bloodPressure']['systolic'],
          'diastolic': vital['bloodPressure']['diastolic']
        });
      }
      
      if (vital['oxygenSaturation'] != null && vital['oxygenSaturation']['value'] != null) {
        groups[dateKey]['oxygenValues'].add(vital['oxygenSaturation']['value']);
      }
      
      if (vital['temperature'] != null && vital['temperature']['value'] != null) {
        groups[dateKey]['temperatureValues'].add(vital['temperature']['value']);
      }
    }
    
    // Calculate averages for each date
    List<Map<String, dynamic>> result = [];
    groups.values.forEach((group) {
      // Calculate heart rate average
      int? heartRateAvg;
      if (group['heartRateValues'].isNotEmpty) {
        heartRateAvg = (group['heartRateValues'].reduce((a, b) => a + b) / group['heartRateValues'].length).round();
      }
      
      // Calculate blood pressure average
      String? bloodPressureAvg;
      if (group['bloodPressureValues'].isNotEmpty) {
        final systolicSum = group['bloodPressureValues'].map((v) => v['systolic']).reduce((a, b) => a + b);
        final diastolicSum = group['bloodPressureValues'].map((v) => v['diastolic']).reduce((a, b) => a + b);
        final systolicAvg = (systolicSum / group['bloodPressureValues'].length).round();
        final diastolicAvg = (diastolicSum / group['bloodPressureValues'].length).round();
        bloodPressureAvg = '$systolicAvg/$diastolicAvg';
      }
      
      // Calculate oxygen average
      int? oxygenAvg;
      if (group['oxygenValues'].isNotEmpty) {
        oxygenAvg = (group['oxygenValues'].reduce((a, b) => a + b) / group['oxygenValues'].length).round();
      }
      
      // Calculate temperature average
      double? temperatureAvg;
      if (group['temperatureValues'].isNotEmpty) {
        temperatureAvg = (group['temperatureValues'].reduce((a, b) => a + b) / group['temperatureValues'].length);
      }
      
      result.add({
        'date': group['date'],
        'heartRate': heartRateAvg,
        'bloodPressure': bloodPressureAvg,
        'oxygen': oxygenAvg,
        'temperature': temperatureAvg
      });
    });
    
    // Sort by date and take last 7 days
    result.sort((a, b) => DateTime.parse(a['date']).compareTo(DateTime.parse(b['date'])));
    final recentVitals = result.length > 7 ? result.sublist(result.length - 7) : result;
    
    return {
      'heartRate': recentVitals.map((v) => v['heartRate']).where((v) => v != null).toList(),
      'bloodPressure': recentVitals.map((v) => v['bloodPressure']).where((v) => v != null).toList(),
      'oxygen': recentVitals.map((v) => v['oxygen']).where((v) => v != null).toList(),
      'temperature': recentVitals.map((v) => v['temperature']).where((v) => v != null).toList(),
      'dates': recentVitals.map((v) => v['date']).toList()
    };
  }

  Map<String, dynamic> _getRecentValues(Map<String, dynamic> data) {
    return {
      'heartRate': data['heartRate'].isNotEmpty ? '${data['heartRate'].last} bpm' : 'N/A',
      'bloodPressure': data['bloodPressure'].isNotEmpty ? '${data['bloodPressure'].last} mmHg' : 'N/A',
      'oxygen': data['oxygen'].isNotEmpty ? '${data['oxygen'].last} %' : 'N/A',
      'temperature': data['temperature'].isNotEmpty ? '${data['temperature'].last} °C' : 'N/A'
    };
  }

  bool _hasAnyData() {
    return _vitalData.values.any((list) => list is List && list.isNotEmpty);
  }

  String _getChartTitle(String vitalType) {
    switch (vitalType) {
      case 'heartRate':
        return 'Heart Rate Trend';
      case 'bloodPressure':
        return 'Blood Pressure Trend';
      case 'oxygen':
        return 'Oxygen Saturation Trend';
      case 'temperature':
        return 'Temperature Trend';
      default:
        return 'Vital Signs Trend';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity, // Take full width for mobile
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Container(
            padding: const EdgeInsets.all(16),
            decoration: const BoxDecoration(
              border: Border(bottom: BorderSide(color: Color(0xFFE2E8F0))),
            ),
            child: Row(
              children: [
                const Icon(Icons.favorite, color: Colors.red, size: 20),
                const SizedBox(width: 8),
                Text(
                  'Vital Signs',
                  style: GoogleFonts.inter(
                    fontSize: 18,
                    fontWeight: FontWeight.w600,
                    color: const Color(0xFF2D3748),
                  ),
                ),
                const Spacer(),
                Text(
                  'Daily Averages',
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    color: const Color(0xFF718096),
                  ),
                ),
              ],
            ),
          ),
          
          // Content
          Expanded(
            child: _buildContent(),
          ),
        ],
      ),
    );
  }

  Widget _buildContent() {
    if (_loading) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircularProgressIndicator(),
            SizedBox(height: 16),
            Text('Loading vital signs data...'),
          ],
        ),
      );
    }

    if (_error != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 48, color: Colors.red),
            const SizedBox(height: 16),
            Text(
              _error!,
              style: GoogleFonts.inter(color: Colors.red),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _loadVitalSigns,
              child: const Text('Retry'),
            ),
          ],
        ),
      );
    }

    if (!_hasAnyData()) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.info_outline, size: 48, color: Colors.grey),
            const SizedBox(height: 16),
            Text(
              'No vital signs data available',
              style: GoogleFonts.inter(color: Colors.grey[600]),
            ),
          ],
        ),
      );
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          // Vital signs cards
          _buildVitalCards(),
          const SizedBox(height: 16),
          // Chart placeholder
          _buildChartPlaceholder(),
          const SizedBox(height: 16),
          // Additional metrics
          _buildMetrics(),
        ],
      ),
    );
  }

  Widget _buildVitalCards() {
    final vitalTypes = [
      {'key': 'heartRate', 'label': 'Heart Rate', 'icon': Icons.favorite, 'color': Colors.red},
      {'key': 'bloodPressure', 'label': 'BP', 'icon': Icons.monitor_heart, 'color': Colors.blue},
      {'key': 'oxygen', 'label': 'SpO₂', 'icon': Icons.water_drop, 'color': Colors.purple},
      {'key': 'temperature', 'label': 'Temp', 'icon': Icons.thermostat, 'color': Colors.orange},
    ];

    return Row(
      children: vitalTypes.map((vital) {
        final isSelected = _selectedVital == vital['key'];
        
        return Expanded(
          child: GestureDetector(
            onTap: () => setState(() => _selectedVital = vital['key'] as String),
            child: Container(
              margin: const EdgeInsets.only(right: 6),
              padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 4),
              decoration: BoxDecoration(
                color: isSelected ? (vital['color'] as Color).withOpacity(0.1) : const Color(0xFFF7FAFC),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(
                  color: isSelected ? vital['color'] as Color : const Color(0xFFE2E8F0),
                  width: isSelected ? 2 : 1,
                ),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    vital['icon'] as IconData,
                    color: vital['color'] as Color,
                    size: 16,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    vital['label'] as String,
                    style: GoogleFonts.inter(
                      fontSize: 9,
                      color: const Color(0xFF718096),
                      fontWeight: FontWeight.w500,
                    ),
                    textAlign: TextAlign.center,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 2),
                  FittedBox(
                    fit: BoxFit.scaleDown,
                    child: Text(
                      _recentValues[vital['key']] ?? 'N/A',
                      style: GoogleFonts.inter(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        color: const Color(0xFF2D3748),
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      }).toList(),
    );
  }

  Widget _buildChartPlaceholder() {
    final selectedData = _vitalData[_selectedVital] as List;
    
    if (selectedData.isEmpty) {
      return Container(
        height: 200,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: const Color(0xFFF7FAFC),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: const Color(0xFFE2E8F0)),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.show_chart,
              size: 48,
              color: Colors.grey[400],
            ),
            const SizedBox(height: 12),
            Text(
              'No data available for ${_selectedVital.replaceAll(RegExp(r'([A-Z])'), ' \$1').toLowerCase()}',
              style: GoogleFonts.inter(
                fontSize: 16,
                fontWeight: FontWeight.w500,
                color: Colors.grey[600],
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      );
    }

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Chart title
          Text(
            _getChartTitle(_selectedVital),
            style: GoogleFonts.inter(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: const Color(0xFF2D3748),
            ),
          ),
          const SizedBox(height: 8),
          // Chart with proper height
          SizedBox(
            width: double.infinity,
            height: 180,
            child: _buildSimpleChart(selectedData),
          ),
        ],
      ),
    );
  }

  Widget _buildSimpleChart(List data) {
    if (data.isEmpty) {
      // Generate sample data for demonstration
      List sampleData = [];
      switch (_selectedVital) {
        case 'heartRate':
          sampleData = [72, 75, 78, 76, 74, 77, 80];
          break;
        case 'bloodPressure':
          sampleData = ['120/80', '125/82', '118/78', '122/79', '124/81', '119/77', '121/80'];
          break;
        case 'oxygen':
          sampleData = [98, 97, 99, 98, 97, 98, 99];
          break;
        case 'temperature':
          sampleData = [36.5, 36.7, 36.4, 36.6, 36.8, 36.5, 36.9];
          break;
        default:
          sampleData = [50, 55, 52, 58, 54, 57, 60];
      }
      
      return CustomPaint(
        painter: SimpleLineChartPainter(
          data: sampleData,
          color: _getVitalColor(_selectedVital),
          vitalType: _selectedVital,
        ),
      );
    }
    
    return CustomPaint(
      painter: SimpleLineChartPainter(
        data: data,
        color: _getVitalColor(_selectedVital),
        vitalType: _selectedVital,
      ),
    );
  }

  Color _getVitalColor(String vitalType) {
    switch (vitalType) {
      case 'heartRate':
        return Colors.red;
      case 'bloodPressure':
        return Colors.blue;
      case 'oxygen':
        return Colors.purple;
      case 'temperature':
        return Colors.orange;
      default:
        return Colors.grey;
    }
  }

  Widget _buildMetrics() {
    final selectedData = _vitalData[_selectedVital] as List;
    
    if (selectedData.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: const Color(0xFFF7FAFC),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Text(
          'No data available for ${_selectedVital.replaceAll(RegExp(r'([A-Z])'), ' \$1').toLowerCase()}',
          style: GoogleFonts.inter(
            fontSize: 14,
            color: Colors.grey[600],
          ),
          textAlign: TextAlign.center,
        ),
      );
    }

    return Row(
      children: [
        Expanded(
          child: _buildMetricCard(
            'Weekly Average',
            _getWeeklyAverage(selectedData),
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: _buildMetricCard(
            'Range',
            _getRange(selectedData),
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: _buildMetricCard(
            'Status',
            _getStatus(selectedData),
          ),
        ),
      ],
    );
  }

  Widget _buildMetricCard(String title, String value) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFFF7FAFC),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: GoogleFonts.inter(
              fontSize: 12,
              color: const Color(0xFF718096),
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: GoogleFonts.inter(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: const Color(0xFF2D3748),
            ),
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }

  String _getWeeklyAverage(List data) {
    if (data.isEmpty) return 'N/A';
    if (_selectedVital == 'bloodPressure') {
      final sys = data.map((v) => int.parse(v.split('/')[0])).toList();
      final dia = data.map((v) => int.parse(v.split('/')[1])).toList();
      final avgSys = (sys.reduce((a, b) => a + b) / sys.length).round();
      final avgDia = (dia.reduce((a, b) => a + b) / dia.length).round();
      return '$avgSys/$avgDia mmHg';
    } else if (_selectedVital == 'temperature') {
      final avg = (data.reduce((a, b) => a + b) / data.length).toStringAsFixed(1);
      return '$avg °C';
    } else {
      final avg = (data.reduce((a, b) => a + b) / data.length).round();
      return _selectedVital == 'heartRate' ? '$avg bpm' : '$avg %';
    }
  }

  String _getRange(List data) {
    if (data.isEmpty) return 'N/A';
    if (_selectedVital == 'bloodPressure') {
      final sys = data.map((v) => int.parse(v.split('/')[0])).toList();
      final dia = data.map((v) => int.parse(v.split('/')[1])).toList();
      return '${sys.reduce((a, b) => a < b ? a : b)}-${sys.reduce((a, b) => a > b ? a : b)}/${dia.reduce((a, b) => a < b ? a : b)}-${dia.reduce((a, b) => a > b ? a : b)}';
    } else {
      final min = data.reduce((a, b) => a < b ? a : b);
      final max = data.reduce((a, b) => a > b ? a : b);
      return '$min-$max';
    }
  }

  String _getStatus(List data) {
    if (data.isEmpty) return 'N/A';
    final lastValue = data.last;
    
    switch (_selectedVital) {
      case 'heartRate':
        final rate = lastValue as int;
        if (rate < 60) return 'Low';
        if (rate > 100) return 'High';
        return 'Normal';
      case 'bloodPressure':
        final bp = lastValue as String;
        final parts = bp.split('/');
        final systolic = int.parse(parts[0]);
        final diastolic = int.parse(parts[1]);
        if (systolic < 90 || diastolic < 60) return 'Low';
        if (systolic >= 140 || diastolic >= 90) return 'High';
        return 'Normal';
      case 'oxygen':
        final oxygen = lastValue as int;
        if (oxygen < 95) return 'Low';
        return 'Normal';
      case 'temperature':
        final temp = lastValue as double;
        if (temp < 36) return 'Low';
        if (temp > 37.5) return 'High';
        return 'Normal';
      default:
        return 'N/A';
    }
  }

}

// Custom painter for professional horizontal line chart
class SimpleLineChartPainter extends CustomPainter {
  final List data;
  final Color color;
  final String vitalType;

  SimpleLineChartPainter({
    required this.data,
    required this.color,
    required this.vitalType,
  });

  @override
  void paint(Canvas canvas, Size size) {
    if (data.isEmpty) return;

    // Add padding for better layout - reduced to give more chart space
    const padding = 10.0;
    const topPadding = 25.0; // Extra padding on top for value labels
    final chartWidth = size.width - padding * 2;
    final chartHeight = size.height - topPadding - padding;

    // Line paint
    final linePaint = Paint()
      ..color = color
      ..strokeWidth = 3.0
      ..strokeCap = StrokeCap.round
      ..style = PaintingStyle.stroke;

    // Fill paint for area under curve
    final fillPaint = Paint()
      ..color = color.withOpacity(0.15)
      ..style = PaintingStyle.fill;

    // Grid line paint
    final gridPaint = Paint()
      ..color = const Color(0xFFE2E8F0)
      ..strokeWidth = 1.0
      ..style = PaintingStyle.stroke;

    // Calculate points
    final points = <Offset>[];
    final double stepX = data.length > 1 ? chartWidth / (data.length - 1) : chartWidth / 2;
    
    // Get min and max values for scaling
    double minValue, maxValue;
    if (vitalType == 'bloodPressure') {
      final sysValues = data.map((v) => double.parse(v.split('/')[0])).toList();
      minValue = sysValues.reduce((a, b) => a < b ? a : b);
      maxValue = sysValues.reduce((a, b) => a > b ? a : b);
    } else {
      minValue = data.map((v) => v is int ? v.toDouble() : v as double).reduce((a, b) => a < b ? a : b);
      maxValue = data.map((v) => v is int ? v.toDouble() : v as double).reduce((a, b) => a > b ? a : b);
    }

    // Add padding to the range
    final range = maxValue - minValue;
    if (range > 0) {
      minValue -= range * 0.15;
      maxValue += range * 0.15;
    } else {
      minValue -= 5;
      maxValue += 5;
    }

    // Draw horizontal grid lines
    for (int i = 0; i <= 4; i++) {
      final y = topPadding + (chartHeight / 4) * i;
      canvas.drawLine(
        Offset(padding, y),
        Offset(size.width - padding, y),
        gridPaint,
      );
    }

    // Calculate data points
    for (int i = 0; i < data.length; i++) {
      double value;
      if (vitalType == 'bloodPressure') {
        value = double.parse(data[i].split('/')[0]);
      } else {
        value = data[i] is int ? data[i].toDouble() : data[i] as double;
      }
      
      final x = padding + (i * stepX);
      final normalizedValue = (value - minValue) / (maxValue - minValue);
      final y = topPadding + chartHeight - (normalizedValue * chartHeight);
      points.add(Offset(x, y));
    }

    // Draw filled area under the curve
    if (points.length > 1) {
      final path = Path();
      path.moveTo(points.first.dx, size.height - padding);
      path.lineTo(points.first.dx, points.first.dy);
      
      for (int i = 1; i < points.length; i++) {
        path.lineTo(points[i].dx, points[i].dy);
      }
      
      path.lineTo(points.last.dx, size.height - padding);
      path.close();
      canvas.drawPath(path, fillPaint);
    }

    // Draw the line
    if (points.length > 1) {
      final linePath = Path();
      linePath.moveTo(points.first.dx, points.first.dy);
      
      for (int i = 1; i < points.length; i++) {
        linePath.lineTo(points[i].dx, points[i].dy);
      }
      
      canvas.drawPath(linePath, linePaint);
    }

    // Draw data points with values
    final pointPaint = Paint()
      ..color = Colors.white
      ..style = PaintingStyle.fill;

    final pointBorderPaint = Paint()
      ..color = color
      ..strokeWidth = 2.0
      ..style = PaintingStyle.stroke;

    // Text painter for values
    final textStyle = TextStyle(
      color: const Color(0xFF2D3748),
      fontSize: 11,
      fontWeight: FontWeight.w600,
    );

    for (int i = 0; i < points.length; i++) {
      final point = points[i];
      
      // Draw point
      canvas.drawCircle(point, 5, pointPaint);
      canvas.drawCircle(point, 5, pointBorderPaint);
      
      // Draw value above point
      String valueText;
      if (vitalType == 'bloodPressure') {
        valueText = data[i];
      } else if (data[i] is double) {
        valueText = data[i].toStringAsFixed(1);
      } else {
        valueText = data[i].toString();
      }
      
      final textSpan = TextSpan(text: valueText, style: textStyle);
      final textPainter = TextPainter(
        text: textSpan,
        textDirection: TextDirection.ltr,
      );
      textPainter.layout();
      
      // Position text above the point
      final textOffset = Offset(
        point.dx - textPainter.width / 2,
        point.dy - 20,
      );
      textPainter.paint(canvas, textOffset);
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => true;
}
