// ai_heart_disease_prediction_screen.dart
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:awesome_snackbar_content/awesome_snackbar_content.dart';
import 'package:flutter_spinkit/flutter_spinkit.dart';

import '../provider/auth_provider.dart';
import '../services/ai_prediction_service.dart';
import 'health_tracker_screen.dart';
import 'ehr_screen.dart';

class AIHeartDiseasePredictionScreen extends StatefulWidget {
  @override
  _AIHeartDiseasePredictionScreenState createState() =>
      _AIHeartDiseasePredictionScreenState();
}

class _AIHeartDiseasePredictionScreenState
    extends State<AIHeartDiseasePredictionScreen> {
  final AIPredictionService _predictionService = AIPredictionService();
  bool _isLoading = true;
  bool _isPredicting = false;
  bool _hasData = false;
  Map<String, dynamic>? _predictionResult;

  @override
  void initState() {
    super.initState();
    _checkUserData();
  }

  Future<void> _checkUserData() async {
    final auth = await _ensureAuthenticated();
    if (auth == null) return;

    setState(() {
      _isLoading = true;
    });

    try {
      final hasData = await _predictionService.checkUserHealthData(
        authToken: auth.authToken,
      );

      setState(() {
        _hasData = hasData;
        _isLoading = false;
      });
    } catch (error) {
      setState(() {
        _isLoading = false;
      });
      _showSnackBar(
          'Failed to check data: ${error.toString()}', ContentType.failure);
    }
  }

  Future<void> _generatePrediction() async {
    final auth = await _ensureAuthenticated();
    if (auth == null) return;

    setState(() {
      _isPredicting = true;
      _predictionResult = null;
    });

    try {
      final result = await _predictionService.predictHeartDisease(
        authToken: auth.authToken,
      );

      setState(() {
        _predictionResult = result;
        _isPredicting = false;
      });
    } catch (error) {
      setState(() {
        _isPredicting = false;
      });
      _showSnackBar('Failed to generate prediction: ${error.toString()}',
          ContentType.failure);
    }
  }

  Future<AuthProvider?> _ensureAuthenticated() async {
    final auth = Provider.of<AuthProvider>(context, listen: false);
    final token = auth.authToken;
    if (token == null || token.isEmpty) {
      _showSnackBar(
        'Please log in to continue',
        ContentType.failure,
      );
      return null;
    }
    return auth;
  }

  void _showSnackBar(String message, ContentType contentType) {
    final snackBar = SnackBar(
      content: AwesomeSnackbarContent(
        title: contentType == ContentType.success ? 'Success' : 'Error',
        message: message,
        contentType: contentType,
      ),
      behavior: SnackBarBehavior.floating,
      backgroundColor: Colors.transparent,
      elevation: 0,
    );
    ScaffoldMessenger.of(context).showSnackBar(snackBar);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Color(0xFFF5F6FA),
      appBar: _buildAppBar(),
      body: _isLoading
          ? Center(
              child: SpinKitFadingCircle(
                color: Color(0xFFDC2626),
                size: 50,
              ),
            )
          : !_hasData
              ? _buildNoDataView()
              : _buildPredictionView(),
    );
  }

  PreferredSizeWidget _buildAppBar() {
    return AppBar(
      backgroundColor: Colors.white,
      elevation: 0,
      leading: IconButton(
        icon: Icon(Icons.arrow_back, color: Color(0xFF1E1E1E)),
        onPressed: () => Navigator.pop(context),
      ),
      title: Text(
        'AI Heart Disease Prediction',
        style: GoogleFonts.inter(
          fontSize: 20,
          fontWeight: FontWeight.w700,
          color: Color(0xFF1E1E1E),
        ),
      ),
    );
  }

  Widget _buildNoDataView() {
    return SingleChildScrollView(
      padding: EdgeInsets.all(20),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          SizedBox(height: 40),
          Container(
            padding: EdgeInsets.all(30),
            decoration: BoxDecoration(
              color: Colors.white,
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: Color(0xFFDC2626).withOpacity(0.1),
                  blurRadius: 20,
                  offset: Offset(0, 10),
                ),
              ],
            ),
            child: Icon(
              Icons.health_and_safety_outlined,
              size: 80,
              color: Color(0xFFDC2626),
            ),
          ),
          SizedBox(height: 30),
          Text(
            'Track Your Health First',
            style: GoogleFonts.inter(
              fontSize: 24,
              fontWeight: FontWeight.w700,
              color: Color(0xFF1E1E1E),
            ),
            textAlign: TextAlign.center,
          ),
          SizedBox(height: 16),
          Text(
            'To get an accurate AI-powered heart disease prediction, we need your health data from EHR and Health Tracker.',
            style: GoogleFonts.inter(
              fontSize: 16,
              fontWeight: FontWeight.w400,
              color: Color(0xFF6B7280),
            ),
            textAlign: TextAlign.center,
          ),
          SizedBox(height: 40),
          _buildActionButton(
            'Go to Health Tracker',
            Icons.monitor_heart_rounded,
            Color(0xFF06B6D4),
            () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => HealthTrackerScreen()),
              );
            },
          ),
          SizedBox(height: 16),
          _buildActionButton(
            'Go to EHR',
            Icons.medical_services,
            Color(0xFF16A34A),
            () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => EHRScreen()),
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildActionButton(
      String text, IconData icon, Color color, VoidCallback onTap) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: onTap,
        child: Container(
          padding: EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: color,
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(
                color: color.withOpacity(0.3),
                blurRadius: 16,
                offset: Offset(0, 6),
              ),
            ],
          ),
          child: Row(
            children: [
              Icon(icon, color: Colors.white, size: 28),
              SizedBox(width: 16),
              Expanded(
                child: Text(
                  text,
                  style: GoogleFonts.inter(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: Colors.white,
                  ),
                ),
              ),
              Icon(Icons.arrow_forward_ios, color: Colors.white, size: 20),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPredictionView() {
    return SingleChildScrollView(
      padding: EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildInfoCard(),
          SizedBox(height: 24),
          if (_predictionResult == null)
            _buildGenerateButton()
          else
            _buildPredictionResults(),
          SizedBox(height: 24),
          _buildResourcesSection(),
        ],
      ),
    );
  }

  Widget _buildInfoCard() {
    return Container(
      padding: EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [Color(0xFFDC2626), Color(0xFFEF4444)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Color(0xFFDC2626).withOpacity(0.3),
            blurRadius: 16,
            offset: Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.info_outline, color: Colors.white, size: 24),
              SizedBox(width: 12),
              Text(
                'About AI Prediction',
                style: GoogleFonts.inter(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  color: Colors.white,
                ),
              ),
            ],
          ),
          SizedBox(height: 16),
          Text(
            'Our AI analyzes your health data including age, gender, cholesterol, blood pressure, heart rate, BMI, smoking status, and exercise habits to predict heart disease risk.',
            style: GoogleFonts.inter(
              fontSize: 14,
              fontWeight: FontWeight.w400,
              color: Colors.white.withOpacity(0.95),
            ),
          ),
          SizedBox(height: 12),
          Container(
            padding: EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.2),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              children: [
                Icon(Icons.warning_amber_rounded,
                    color: Colors.white, size: 20),
                SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'This is for informational purposes only. Always consult healthcare professionals.',
                    style: GoogleFonts.inter(
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                      color: Colors.white,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildGenerateButton() {
    return Container(
      width: double.infinity,
      child: ElevatedButton(
        onPressed: _isPredicting ? null : _generatePrediction,
        style: ElevatedButton.styleFrom(
          backgroundColor: Color(0xFFDC2626),
          padding: EdgeInsets.symmetric(vertical: 18),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          elevation: 4,
        ),
        child: _isPredicting
            ? SpinKitFadingCircle(
                color: Colors.white,
                size: 24,
              )
            : Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.psychology, color: Colors.white, size: 24),
                  SizedBox(width: 12),
                  Text(
                    'Generate Prediction',
                    style: GoogleFonts.inter(
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                      color: Colors.white,
                    ),
                  ),
                ],
              ),
      ),
    );
  }

  Widget _buildPredictionResults() {
    if (_predictionResult == null) return SizedBox.shrink();

    final probability = _predictionResult!['probability'] ?? 0.0;
    final riskLevel = _predictionResult!['riskLevel'] ?? 'Unknown';
    final insights = _predictionResult!['insights'] ?? [];
    final recommendations = _predictionResult!['recommendations'] ?? [];
    final contributingFactors = _predictionResult!['contributingFactors'] ?? {};

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildRiskCard(probability, riskLevel),
        SizedBox(height: 24),
        if (contributingFactors.isNotEmpty)
          _buildRiskNarrative(probability, contributingFactors),
        if (contributingFactors.isNotEmpty) ...[
          SizedBox(height: 20),
          _buildRiskDriversSection(contributingFactors),
        ],
        SizedBox(height: 24),
        if (insights.isNotEmpty) _buildInsightsSection(insights),
        SizedBox(height: 24),
        if (recommendations.isNotEmpty)
          _buildRecommendationsSection(recommendations),
        if (recommendations.isNotEmpty || contributingFactors.isNotEmpty) ...[
          SizedBox(height: 24),
          _buildPrecautionPlan(
            recommendations,
            contributingFactors,
          ),
        ],
        SizedBox(height: 24),
        if (contributingFactors.isNotEmpty)
          _buildContributingFactorsSection(contributingFactors),
        SizedBox(height: 24),
        _buildGenerateButton(),
      ],
    );
  }

  Widget _buildRiskCard(double probability, String riskLevel) {
    Color riskColor;
    String riskText;

    if (probability < 0.3) {
      riskColor = Color(0xFF16A34A);
      riskText = 'Low Risk';
    } else if (probability < 0.6) {
      riskColor = Color(0xFFF59E0B);
      riskText = 'Moderate Risk';
    } else {
      riskColor = Color(0xFFDC2626);
      riskText = 'High Risk';
    }

    final percentText = '${(probability * 100).toStringAsFixed(1)}%';

    return Container(
      padding: EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [riskColor.withOpacity(0.12), riskColor.withOpacity(0.05)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: riskColor.withOpacity(0.3), width: 1.5),
        boxShadow: [
          BoxShadow(
            color: riskColor.withOpacity(0.15),
            blurRadius: 25,
            offset: Offset(0, 16),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.favorite, color: riskColor, size: 26),
              SizedBox(width: 8),
              Text(
                'AI Risk Score',
                style: GoogleFonts.inter(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  color: Color(0xFF111827),
                ),
              ),
            ],
          ),
          SizedBox(height: 18),
          Stack(
            alignment: Alignment.center,
            children: [
              SizedBox(
                width: 150,
                height: 150,
                child: CircularProgressIndicator(
                  value: probability.clamp(0.0, 1.0),
                  strokeWidth: 10,
                  backgroundColor: Colors.white,
                  valueColor: AlwaysStoppedAnimation<Color>(riskColor),
                ),
              ),
              Column(
                children: [
                  Text(
                    percentText,
                    style: GoogleFonts.inter(
                      fontSize: 34,
                      fontWeight: FontWeight.w800,
                      color: riskColor,
                    ),
                  ),
                  SizedBox(height: 4),
                  Text(
                    riskText,
                    style: GoogleFonts.inter(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF111827),
                    ),
                  ),
                ],
              ),
            ],
          ),
          SizedBox(height: 16),
          Text(
            _riskScoreExplanation(probability),
            textAlign: TextAlign.center,
            style: GoogleFonts.inter(
              fontSize: 13,
              fontWeight: FontWeight.w500,
              color: Color(0xFF4B5563),
              height: 1.4,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRiskNarrative(
      double probability, Map<String, dynamic> contributingFactors) {
    final topFactors = contributingFactors.entries.toList()
      ..sort((a, b) => _factorScore(b.value).compareTo(_factorScore(a.value)));
    final highlightedFactors =
        topFactors.take(2).map((entry) => entry.key).toList();

    final narrative = highlightedFactors.isEmpty
        ? 'Your score is calculated by analyzing your cardiovascular profile.'
        : 'Score drivers: ${highlightedFactors.join(' & ')} play the biggest role in this assessment.';

    return Container(
      padding: EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Color(0xFFF3F4F6),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: Color(0xFF3B82F6).withOpacity(0.15),
              shape: BoxShape.circle,
            ),
            child: Icon(Icons.insights, color: Color(0xFF1D4ED8)),
          ),
          SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'How this score is calculated',
                  style: GoogleFonts.inter(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF111827),
                  ),
                ),
                SizedBox(height: 8),
                Text(
                  narrative,
                  style: GoogleFonts.inter(
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                    color: Color(0xFF4B5563),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRiskDriversSection(Map<String, dynamic> factors) {
    final entries = factors.entries.toList()
      ..sort((a, b) => _factorScore(b.value).compareTo(_factorScore(a.value)));

    return Container(
      padding: EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 18,
            offset: Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.speed, color: Color(0xFFEF4444)),
              SizedBox(width: 8),
              Text(
                'Risk Drivers',
                style: GoogleFonts.inter(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
          ),
          SizedBox(height: 16),
          ...entries.take(5).map((entry) {
            final value = _factorScore(entry.value);
            final normalized = (value / 100).clamp(0.0, 1.0);
            return Padding(
              padding: EdgeInsets.only(bottom: 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        entry.key,
                        style: GoogleFonts.inter(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: Color(0xFF111827),
                        ),
                      ),
                      Text(
                        '${value.toStringAsFixed(0)}',
                        style: GoogleFonts.inter(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: Color(0xFFEF4444),
                        ),
                      ),
                    ],
                  ),
                  SizedBox(height: 6),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: LinearProgressIndicator(
                      value: normalized,
                      minHeight: 8,
                      backgroundColor: Color(0xFFF3F4F6),
                      valueColor:
                          AlwaysStoppedAnimation<Color>(Color(0xFFEF4444)),
                    ),
                  ),
                ],
              ),
            );
          }).toList(),
        ],
      ),
    );
  }

  Widget _buildPrecautionPlan(
    List<dynamic> recommendations,
    Map<String, dynamic> factors,
  ) {
    final sortedKeys = factors.entries.toList()
      ..sort((a, b) => _factorScore(b.value).compareTo(_factorScore(a.value)));
    final focusAreas = sortedKeys.map((e) => e.key).toList();
    final items =
        focusAreas.isEmpty ? ['Lifestyle'] : focusAreas.take(3).toList();

    return Container(
      padding: EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [Color(0xFF0EA5E9), Color(0xFF2563EB)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(18),
        boxShadow: [
          BoxShadow(
            color: Color(0xFF2563EB).withOpacity(0.25),
            blurRadius: 18,
            offset: Offset(0, 12),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.health_and_safety, color: Colors.white),
              SizedBox(width: 8),
              Text(
                'Precaution Plan',
                style: GoogleFonts.inter(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  color: Colors.white,
                ),
              ),
            ],
          ),
          SizedBox(height: 16),
          ...items.map((item) => _buildPrecautionItem(item)),
          if (recommendations.isNotEmpty) ...[
            SizedBox(height: 16),
            Text(
              'AI Suggestions',
              style: GoogleFonts.inter(
                fontSize: 14,
                fontWeight: FontWeight.w700,
                color: Colors.white.withOpacity(0.9),
              ),
            ),
            SizedBox(height: 8),
            ...recommendations.take(3).map(
                  (rec) => Padding(
                    padding: EdgeInsets.only(bottom: 8),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Icon(Icons.arrow_right, color: Colors.white70),
                        SizedBox(width: 6),
                        Expanded(
                          child: Text(
                            rec.toString(),
                            style: GoogleFonts.inter(
                              fontSize: 13,
                              fontWeight: FontWeight.w500,
                              color: Colors.white.withOpacity(0.95),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
          ],
        ],
      ),
    );
  }

  Widget _buildPrecautionItem(String focus) {
    final title = focus;
    final description = _precautionDetail(focus);
    final iconData = _precautionIcon(focus);

    return Container(
      margin: EdgeInsets.only(bottom: 12),
      padding: EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Icon(iconData, color: Colors.white, size: 24),
          SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: GoogleFonts.inter(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: Colors.white,
                  ),
                ),
                SizedBox(height: 4),
                Text(
                  description,
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                    color: Colors.white.withOpacity(0.9),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  String _riskScoreExplanation(double probability) {
    if (probability < 0.3) {
      return 'AI detects strong protective habits such as balanced cholesterol and stable blood pressure.';
    } else if (probability < 0.6) {
      return 'Some readings show opportunity for improvement. Focus on consistency to keep risk from rising.';
    }
    return 'Key vitals are trending high. Immediate lifestyle adjustments and clinical review are recommended.';
  }

  String _precautionDetail(String focus) {
    switch (focus.toLowerCase()) {
      case 'blood pressure':
        return 'Limit sodium <1500mg/day, monitor home readings twice daily, and stay hydrated.';
      case 'cholesterol':
        return 'Adopt a Mediterranean-style plate, reduce trans fats, and schedule lipid panels every 6 months.';
      case 'bmi':
      case 'weight':
        return 'Target a 5-7% weight reduction with portion control and 150 minutes of cardio weekly.';
      case 'smoking':
        return 'Set a quit date, use nicotine replacement if needed, and avoid secondhand smoke.';
      case 'exercise':
        return 'Blend moderate cardio with two days of strength training to boost cardiovascular reserve.';
      case 'heart rate':
        return 'Track resting heart rate trends and incorporate stress-relief breathing exercises.';
      case 'age':
        return 'Schedule annual cardiology reviews and keep vaccinations up to date.';
      default:
        return 'Maintain regular check-ups, balanced meals, restorative sleep, and stress management.';
    }
  }

  IconData _precautionIcon(String focus) {
    switch (focus.toLowerCase()) {
      case 'blood pressure':
        return Icons.bloodtype_outlined;
      case 'cholesterol':
        return Icons.opacity;
      case 'bmi':
      case 'weight':
        return Icons.monitor_weight;
      case 'smoking':
        return Icons.smoke_free;
      case 'exercise':
        return Icons.fitness_center;
      case 'heart rate':
        return Icons.monitor_heart_outlined;
      default:
        return Icons.health_and_safety;
    }
  }

  double _factorScore(dynamic value) {
    double score = 0;

    if (value == null) {
      score = 0;
    } else if (value is num) {
      score = value.toDouble();
    } else if (value is bool) {
      score = value ? 75 : 25;
    } else if (value is String) {
      final numericMatch = RegExp(r'[-+]?[0-9]*\.?[0-9]+').firstMatch(value);
      if (numericMatch != null) {
        final parsed = double.tryParse(numericMatch.group(0)!);
        if (parsed != null) {
          score = parsed;
        }
      } else {
        final normalized = value.toLowerCase();
        if (normalized.contains('critical') ||
            normalized.contains('very high')) {
          score = 95;
        } else if (normalized.contains('high') ||
            normalized.contains('elevated') ||
            normalized.contains('positive') ||
            normalized.contains('yes')) {
          score = 80;
        } else if (normalized.contains('moderate') ||
            normalized.contains('borderline') ||
            normalized.contains('pre')) {
          score = 65;
        } else if (normalized.contains('low') ||
            normalized.contains('good') ||
            normalized.contains('normal') ||
            normalized.contains('optimal') ||
            normalized.contains('negative') ||
            normalized.contains('no')) {
          score = 30;
        } else {
          score = 50;
        }
      }
    } else {
      score = 50;
    }

    return score.clamp(0, 100).toDouble();
  }

  Widget _buildInsightsSection(List<dynamic> insights) {
    return Container(
      padding: EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: Offset(0, 5),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.lightbulb_outline, color: Color(0xFFF59E0B), size: 24),
              SizedBox(width: 12),
              Text(
                'Key Insights',
                style: GoogleFonts.inter(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  color: Color(0xFF1E1E1E),
                ),
              ),
            ],
          ),
          SizedBox(height: 16),
          ...insights.map((insight) => Padding(
                padding: EdgeInsets.only(bottom: 12),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Icon(Icons.circle, size: 8, color: Color(0xFFF59E0B)),
                    SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        insight.toString(),
                        style: GoogleFonts.inter(
                          fontSize: 14,
                          fontWeight: FontWeight.w400,
                          color: Color(0xFF6B7280),
                        ),
                      ),
                    ),
                  ],
                ),
              )),
        ],
      ),
    );
  }

  Widget _buildRecommendationsSection(List<dynamic> recommendations) {
    return Container(
      padding: EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: Offset(0, 5),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.recommend, color: Color(0xFF16A34A), size: 24),
              SizedBox(width: 12),
              Text(
                'Recommendations',
                style: GoogleFonts.inter(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  color: Color(0xFF1E1E1E),
                ),
              ),
            ],
          ),
          SizedBox(height: 16),
          ...recommendations.map((rec) => Padding(
                padding: EdgeInsets.only(bottom: 12),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Icon(Icons.check_circle_outline,
                        size: 20, color: Color(0xFF16A34A)),
                    SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        rec.toString(),
                        style: GoogleFonts.inter(
                          fontSize: 14,
                          fontWeight: FontWeight.w400,
                          color: Color(0xFF6B7280),
                        ),
                      ),
                    ),
                  ],
                ),
              )),
        ],
      ),
    );
  }

  Widget _buildContributingFactorsSection(Map<String, dynamic> factors) {
    return Container(
      padding: EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: Offset(0, 5),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.analytics_outlined,
                  color: Color(0xFF3B82F6), size: 24),
              SizedBox(width: 12),
              Text(
                'Contributing Factors',
                style: GoogleFonts.inter(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  color: Color(0xFF1E1E1E),
                ),
              ),
            ],
          ),
          SizedBox(height: 16),
          ...factors.entries.map((entry) => Padding(
                padding: EdgeInsets.only(bottom: 12),
                child: Row(
                  children: [
                    Expanded(
                      child: Text(
                        entry.key,
                        style: GoogleFonts.inter(
                          fontSize: 14,
                          fontWeight: FontWeight.w500,
                          color: Color(0xFF1E1E1E),
                        ),
                      ),
                    ),
                    Container(
                      padding:
                          EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: Color(0xFF3B82F6).withOpacity(0.1),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        entry.value.toString(),
                        style: GoogleFonts.inter(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: Color(0xFF3B82F6),
                        ),
                      ),
                    ),
                  ],
                ),
              )),
        ],
      ),
    );
  }

  Widget _buildResourcesSection() {
    return Container(
      padding: EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: Offset(0, 5),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.library_books, color: Color(0xFF3B82F6), size: 24),
              SizedBox(width: 12),
              Text(
                'Understanding Risk Factors',
                style: GoogleFonts.inter(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  color: Color(0xFF1E1E1E),
                ),
              ),
            ],
          ),
          SizedBox(height: 16),
          _buildResourceItem('Age',
              'Risk increases with age, especially after 45 for men and 55 for women.'),
          _buildResourceItem('Gender',
              'Men are generally at higher risk, but women\'s risk increases after menopause.'),
          _buildResourceItem('Cholesterol',
              'High LDL (bad) cholesterol and low HDL (good) cholesterol increase risk.'),
          _buildResourceItem('Blood Pressure',
              'Hypertension (high blood pressure) is a major risk factor.'),
          _buildResourceItem('Heart Rate',
              'Abnormal resting heart rate may indicate cardiovascular issues.'),
          _buildResourceItem('BMI',
              'Obesity (BMI > 30) significantly increases heart disease risk.'),
          _buildResourceItem('Smoking',
              'Smoking damages blood vessels and increases heart disease risk.'),
          _buildResourceItem('Exercise',
              'Regular physical activity helps maintain heart health.'),
        ],
      ),
    );
  }

  Widget _buildResourceItem(String title, String description) {
    return Padding(
      padding: EdgeInsets.only(bottom: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: GoogleFonts.inter(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: Color(0xFF1E1E1E),
            ),
          ),
          SizedBox(height: 4),
          Text(
            description,
            style: GoogleFonts.inter(
              fontSize: 14,
              fontWeight: FontWeight.w400,
              color: Color(0xFF6B7280),
            ),
          ),
        ],
      ),
    );
  }
}
