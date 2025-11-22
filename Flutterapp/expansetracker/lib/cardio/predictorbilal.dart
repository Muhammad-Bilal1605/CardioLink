import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:flutter_spinkit/flutter_spinkit.dart';

class FraminghamPredictorScreen extends StatefulWidget {
  @override
  _FraminghamPredictorScreenState createState() =>
      _FraminghamPredictorScreenState();
}

class _FraminghamPredictorScreenState extends State<FraminghamPredictorScreen> {
  final _formKey = GlobalKey<FormState>();
  bool _isLoading = false;
  Map<String, dynamic>? _result;

  // Form data
  int _gender = 1; // 1 = Male, 0 = Female
  double _age = 55;
  int _education = 2;
  int _currentSmoker = 0;
  double _cigsPerDay = 0;
  int _bpMeds = 0;
  int _prevalentStroke = 0;
  int _prevalentHyp = 0;
  int _diabetes = 0;
  double _totChol = 200;
  double _sysBP = 120;
  double _diaBP = 80;
  double _bmi = 25;
  double _heartRate = 72;
  double _glucose = 90;

  final TextEditingController _ageController = TextEditingController(text: '55');
  final TextEditingController _cigsPerDayController =
      TextEditingController(text: '0');
  final TextEditingController _totCholController =
      TextEditingController(text: '200');
  final TextEditingController _sysBPController =
      TextEditingController(text: '120');
  final TextEditingController _diaBPController = TextEditingController(text: '80');
  final TextEditingController _bmiController = TextEditingController(text: '25');
  final TextEditingController _heartRateController =
      TextEditingController(text: '72');
  final TextEditingController _glucoseController =
      TextEditingController(text: '90');

  @override
  void dispose() {
    _ageController.dispose();
    _cigsPerDayController.dispose();
    _totCholController.dispose();
    _sysBPController.dispose();
    _diaBPController.dispose();
    _bmiController.dispose();
    _heartRateController.dispose();
    _glucoseController.dispose();
    super.dispose();
  }

  Future<void> _submitPrediction() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    setState(() {
      _isLoading = true;
      _result = null;
    });

    try {
      final requestData = {
        'male': _gender,
        'age': _age,
        'education': _education.toDouble(),
        'currentSmoker': _currentSmoker,
        'cigsPerDay': _cigsPerDay,
        'BPMeds': _bpMeds.toDouble(),
        'prevalentStroke': _prevalentStroke,
        'prevalentHyp': _prevalentHyp,
        'diabetes': _diabetes,
        'totChol': _totChol,
        'sysBP': _sysBP,
        'diaBP': _diaBP,
        'BMI': _bmi,
        'heartRate': _heartRate,
        'glucose': _glucose,
      };

      final response = await http.post(
        Uri.parse('http://localhost:5000/predict'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode(requestData),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        setState(() {
          _result = data;
          _isLoading = false;
        });
      } else {
        throw Exception('Failed to get prediction');
      }
    } catch (e) {
      setState(() {
        _isLoading = false;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error: ${e.toString()}'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Color(0xFFF5F6FA),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back, color: Color(0xFF1E1E1E)),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          'Framingham Risk Predictor',
          style: GoogleFonts.inter(
            color: Color(0xFF1E1E1E),
            fontWeight: FontWeight.w600,
            fontSize: 18,
          ),
        ),
        centerTitle: true,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: EdgeInsets.all(20),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildHeaderCard(),
                SizedBox(height: 24),
                _buildSectionTitle('Personal Information'),
                SizedBox(height: 12),
                _buildGenderSelector(),
                SizedBox(height: 16),
                _buildNumberInput(
                  'Age',
                  'Enter age in years',
                  _ageController,
                  (value) => _age = double.parse(value),
                  min: 20,
                  max: 100,
                ),
                SizedBox(height: 16),
                _buildEducationSelector(),
                SizedBox(height: 24),
                _buildSectionTitle('Lifestyle Factors'),
                SizedBox(height: 12),
                _buildYesNoSelector(
                  'Current Smoker',
                  'Do you currently smoke?',
                  _currentSmoker,
                  (value) => setState(() => _currentSmoker = value),
                ),
                SizedBox(height: 16),
                _buildNumberInput(
                  'Cigarettes Per Day',
                  'Number of cigarettes',
                  _cigsPerDayController,
                  (value) => _cigsPerDay = double.parse(value),
                  min: 0,
                  max: 100,
                ),
                SizedBox(height: 24),
                _buildSectionTitle('Medical History'),
                SizedBox(height: 12),
                _buildYesNoSelector(
                  'Blood Pressure Medication',
                  'Taking BP medication?',
                  _bpMeds,
                  (value) => setState(() => _bpMeds = value),
                ),
                SizedBox(height: 16),
                _buildYesNoSelector(
                  'Prevalent Stroke',
                  'History of stroke?',
                  _prevalentStroke,
                  (value) => setState(() => _prevalentStroke = value),
                ),
                SizedBox(height: 16),
                _buildYesNoSelector(
                  'Prevalent Hypertension',
                  'History of hypertension?',
                  _prevalentHyp,
                  (value) => setState(() => _prevalentHyp = value),
                ),
                SizedBox(height: 16),
                _buildYesNoSelector(
                  'Diabetes',
                  'Diagnosed with diabetes?',
                  _diabetes,
                  (value) => setState(() => _diabetes = value),
                ),
                SizedBox(height: 24),
                _buildSectionTitle('Clinical Measurements'),
                SizedBox(height: 12),
                _buildNumberInput(
                  'Total Cholesterol',
                  'mg/dL',
                  _totCholController,
                  (value) => _totChol = double.parse(value),
                  min: 100,
                  max: 400,
                ),
                SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: _buildNumberInput(
                        'Systolic BP',
                        'mmHg',
                        _sysBPController,
                        (value) => _sysBP = double.parse(value),
                        min: 80,
                        max: 200,
                      ),
                    ),
                    SizedBox(width: 12),
                    Expanded(
                      child: _buildNumberInput(
                        'Diastolic BP',
                        'mmHg',
                        _diaBPController,
                        (value) => _diaBP = double.parse(value),
                        min: 50,
                        max: 130,
                      ),
                    ),
                  ],
                ),
                SizedBox(height: 16),
                _buildNumberInput(
                  'BMI',
                  'Body Mass Index',
                  _bmiController,
                  (value) => _bmi = double.parse(value),
                  min: 15,
                  max: 50,
                ),
                SizedBox(height: 16),
                _buildNumberInput(
                  'Heart Rate',
                  'beats/minute',
                  _heartRateController,
                  (value) => _heartRate = double.parse(value),
                  min: 40,
                  max: 150,
                ),
                SizedBox(height: 16),
                _buildNumberInput(
                  'Glucose',
                  'mg/dL',
                  _glucoseController,
                  (value) => _glucose = double.parse(value),
                  min: 50,
                  max: 300,
                ),
                SizedBox(height: 32),
                _buildPredictButton(),
                SizedBox(height: 24),
                if (_result != null) _buildResultCard(),
                SizedBox(height: 20),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildHeaderCard() {
    return Container(
      padding: EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [Color(0xFF8B5CF6), Color(0xFF6366F1)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Color(0xFF8B5CF6).withOpacity(0.3),
            blurRadius: 16,
            offset: Offset(0, 6),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            padding: EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.2),
              shape: BoxShape.circle,
              border: Border.all(
                color: Colors.white.withOpacity(0.3),
                width: 2,
              ),
            ),
            child: Icon(
              Icons.analytics_outlined,
              color: Colors.white,
              size: 28,
            ),
          ),
          SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Framingham Risk Score',
                  style: GoogleFonts.inter(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    color: Colors.white,
                    letterSpacing: -0.3,
                  ),
                ),
                SizedBox(height: 4),
                Text(
                  'Calculate your 10-year cardiovascular disease risk',
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                    color: Colors.white.withOpacity(0.95),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Text(
      title,
      style: GoogleFonts.inter(
        fontSize: 18,
        fontWeight: FontWeight.w700,
        color: Color(0xFF1E1E1E),
      ),
    );
  }

  Widget _buildGenderSelector() {
    return Container(
      padding: EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Color(0xFFE5E7EB)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Gender',
            style: GoogleFonts.inter(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: Color(0xFF1E1E1E),
            ),
          ),
          SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _buildGenderOption('Male', Icons.male, 1),
              ),
              SizedBox(width: 12),
              Expanded(
                child: _buildGenderOption('Female', Icons.female, 0),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildGenderOption(String label, IconData icon, int value) {
    bool isSelected = _gender == value;
    return InkWell(
      onTap: () => setState(() => _gender = value),
      borderRadius: BorderRadius.circular(10),
      child: Container(
        padding: EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: isSelected ? Color(0xFF8B5CF6).withOpacity(0.1) : Colors.transparent,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
            color: isSelected ? Color(0xFF8B5CF6) : Color(0xFFE5E7EB),
            width: 2,
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon,
              color: isSelected ? Color(0xFF8B5CF6) : Color(0xFF6B7280),
              size: 20,
            ),
            SizedBox(width: 8),
            Text(
              label,
              style: GoogleFonts.inter(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: isSelected ? Color(0xFF8B5CF6) : Color(0xFF6B7280),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEducationSelector() {
    return Container(
      padding: EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Color(0xFFE5E7EB)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Education Level',
            style: GoogleFonts.inter(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: Color(0xFF1E1E1E),
            ),
          ),
          SizedBox(height: 12),
          DropdownButtonFormField<int>(
            value: _education,
            decoration: InputDecoration(
              contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: BorderSide(color: Color(0xFFE5E7EB)),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: BorderSide(color: Color(0xFFE5E7EB)),
              ),
            ),
            items: [
              DropdownMenuItem(value: 1, child: Text('Some High School')),
              DropdownMenuItem(value: 2, child: Text('High School/GED')),
              DropdownMenuItem(value: 3, child: Text('Some College/Vocational')),
              DropdownMenuItem(value: 4, child: Text('College Degree')),
            ],
            onChanged: (value) => setState(() => _education = value!),
          ),
        ],
      ),
    );
  }

  Widget _buildYesNoSelector(String title, String subtitle, int value, Function(int) onChanged) {
    return Container(
      padding: EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Color(0xFFE5E7EB)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: GoogleFonts.inter(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: Color(0xFF1E1E1E),
            ),
          ),
          SizedBox(height: 4),
          Text(
            subtitle,
            style: GoogleFonts.inter(
              fontSize: 12,
              color: Color(0xFF6B7280),
            ),
          ),
          SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _buildYesNoOption('Yes', 1, value, onChanged),
              ),
              SizedBox(width: 12),
              Expanded(
                child: _buildYesNoOption('No', 0, value, onChanged),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildYesNoOption(String label, int optionValue, int currentValue, Function(int) onChanged) {
    bool isSelected = currentValue == optionValue;
    Color activeColor = optionValue == 1 ? Color(0xFFEF4444) : Color(0xFF16A34A);
    
    return InkWell(
      onTap: () => onChanged(optionValue),
      borderRadius: BorderRadius.circular(10),
      child: Container(
        padding: EdgeInsets.symmetric(vertical: 10),
        decoration: BoxDecoration(
          color: isSelected ? activeColor.withOpacity(0.1) : Colors.transparent,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
            color: isSelected ? activeColor : Color(0xFFE5E7EB),
            width: 2,
          ),
        ),
        child: Center(
          child: Text(
            label,
            style: GoogleFonts.inter(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: isSelected ? activeColor : Color(0xFF6B7280),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildNumberInput(
    String label,
    String hint,
    TextEditingController controller,
    Function(String) onChanged, {
    double min = 0,
    double max = 1000,
  }) {
    return Container(
      padding: EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Color(0xFFE5E7EB)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: GoogleFonts.inter(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: Color(0xFF1E1E1E),
            ),
          ),
          SizedBox(height: 8),
          TextFormField(
            controller: controller,
            keyboardType: TextInputType.numberWithOptions(decimal: true),
            decoration: InputDecoration(
              hintText: hint,
              hintStyle: GoogleFonts.inter(
                fontSize: 14,
                color: Color(0xFF9CA3AF),
              ),
              contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 12),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: BorderSide(color: Color(0xFFE5E7EB)),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: BorderSide(color: Color(0xFFE5E7EB)),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: BorderSide(color: Color(0xFF8B5CF6), width: 2),
              ),
            ),
            validator: (value) {
              if (value == null || value.isEmpty) {
                return 'Please enter a value';
              }
              final numValue = double.tryParse(value);
              if (numValue == null) {
                return 'Please enter a valid number';
              }
              if (numValue < min || numValue > max) {
                return 'Value must be between $min and $max';
              }
              return null;
            },
            onChanged: onChanged,
          ),
        ],
      ),
    );
  }

  Widget _buildPredictButton() {
    return Container(
      width: double.infinity,
      height: 56,
      child: ElevatedButton(
        onPressed: _isLoading ? null : _submitPrediction,
        style: ElevatedButton.styleFrom(
          backgroundColor: Color(0xFF8B5CF6),
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          elevation: 0,
        ),
        child: _isLoading
            ? SpinKitThreeBounce(
                color: Colors.white,
                size: 24.0,
              )
            : Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.psychology, size: 24),
                  SizedBox(width: 12),
                  Text(
                    'Calculate Risk',
                    style: GoogleFonts.inter(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
      ),
    );
  }

  Widget _buildResultCard() {
    final riskProb = (_result!['risk_probability'] * 100).toStringAsFixed(2);
    final riskLevel = _result!['risk_level'];
    
    Color riskColor;
    IconData riskIcon;
    
    if (riskLevel == 'Low') {
      riskColor = Color(0xFF16A34A);
      riskIcon = Icons.check_circle;
    } else if (riskLevel == 'Moderate') {
      riskColor = Color(0xFFF59E0B);
      riskIcon = Icons.warning;
    } else {
      riskColor = Color(0xFFDC2626);
      riskIcon = Icons.error;
    }

    return Container(
      padding: EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: riskColor.withOpacity(0.3), width: 2),
        boxShadow: [
          BoxShadow(
            color: riskColor.withOpacity(0.1),
            blurRadius: 16,
            offset: Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          Container(
            padding: EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: riskColor.withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(
              riskIcon,
              color: riskColor,
              size: 48,
            ),
          ),
          SizedBox(height: 20),
          Text(
            'Risk Assessment',
            style: GoogleFonts.inter(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: Color(0xFF6B7280),
            ),
          ),
          SizedBox(height: 8),
          Text(
            '$riskProb%',
            style: GoogleFonts.inter(
              fontSize: 48,
              fontWeight: FontWeight.w700,
              color: riskColor,
              height: 1.2,
            ),
          ),
          SizedBox(height: 4),
          Text(
            '10-Year CVD Risk Probability',
            style: GoogleFonts.inter(
              fontSize: 12,
              color: Color(0xFF6B7280),
            ),
          ),
          SizedBox(height: 20),
          Container(
            padding: EdgeInsets.symmetric(horizontal: 20, vertical: 10),
            decoration: BoxDecoration(
              color: riskColor.withOpacity(0.1),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Text(
              '$riskLevel Risk',
              style: GoogleFonts.inter(
                fontSize: 18,
                fontWeight: FontWeight.w700,
                color: riskColor,
              ),
            ),
          ),
          SizedBox(height: 24),
          Container(
            padding: EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Color(0xFFF8F9FA),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Color(0xFFE5E7EB)),
            ),
            child: Column(
              children: [
                Icon(Icons.info_outline, color: Color(0xFF6B7280), size: 20),
                SizedBox(height: 8),
                Text(
                  'This risk score estimates your 10-year probability of developing cardiovascular disease based on the Framingham Heart Study.',
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    color: Color(0xFF6B7280),
                    height: 1.5,
                  ),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

