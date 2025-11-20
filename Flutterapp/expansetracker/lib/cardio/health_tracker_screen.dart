// health_tracker_screen.dart
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:awesome_notifications/awesome_notifications.dart';
import 'package:awesome_snackbar_content/awesome_snackbar_content.dart';
import 'package:provider/provider.dart';
import 'package:syncfusion_flutter_charts/charts.dart';

import 'package:expansetracker/provider/auth_provider.dart';
import 'package:expansetracker/services/health_tracker_service.dart';

class HealthTrackerScreen extends StatefulWidget {
  @override
  _HealthTrackerScreenState createState() => _HealthTrackerScreenState();
}

class _HealthTrackerScreenState extends State<HealthTrackerScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  final HealthTrackerService _healthTrackerService = HealthTrackerService();
  AuthProvider? _authProvider;

  int todaySteps = 0;
  int goalSteps = 10000;
  List<ActivityEntry> activities = [];
  List<MealEntry> meals = [];
  List<Medication> medications = [];
  List<HealthTrackerReportSummary> reports = [];
  bool _isLoading = true;
  bool _isSaving = false;
  String? _errorMessage;
  DateTime? _lastRefreshedAt;
  bool _isLoadingReports = false;
  String? _reportErrorMessage;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
    _initializeNotifications();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _initializeData();
    });
  }

  void _initializeNotifications() async {
    await AwesomeNotifications().initialize(
      null, // Use default app icon
      [
        NotificationChannel(
          channelKey: 'health_tracker',
          channelName: 'Health Tracker Notifications',
          channelDescription:
              'Notifications for medication reminders and health tracking',
          defaultColor: const Color(0xFF3B82F6),
          ledColor: Colors.blue,
          importance: NotificationImportance.High,
          playSound: true,
          enableVibration: true,
        ),
      ],
      channelGroups: [],
      debug: true,
    );

    // Request permission for notifications
    bool isAllowed =
        await AwesomeNotifications().requestPermissionToSendNotifications();
    if (!isAllowed) {
      print('Notification permission not granted');
    }
  }

  Future<void> _initializeData() async {
    if (!mounted) return;
    setState(() {
      _isLoading = true;
      _errorMessage = null;
      _reportErrorMessage = null;
    });

    try {
      _authProvider ??= Provider.of<AuthProvider>(context, listen: false);
    } catch (_) {
      _authProvider = null;
    }

    await _loadHealthTrackerData();
    await _loadAiReports();
  }

  Future<void> _loadHealthTrackerData() async {
    if (!mounted) return;

    final auth =
        _authProvider ?? Provider.of<AuthProvider>(context, listen: false);
    _authProvider = auth;

    if (!(auth.isAuthenticated)) {
      setState(() {
        activities = [];
        meals = [];
        medications = [];
        todaySteps = 0;
        _lastRefreshedAt = null;
        _errorMessage = 'Please log in to view your health tracker data.';
        _isLoading = false;
      });
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final data = await _healthTrackerService.fetchTrackerData(
        authToken: auth.authToken,
      );

      final activitiesData = _extractEntries(data, 'activities');
      final mealsData = _extractEntries(data, 'meals');
      final medicationsData = _extractEntries(data, 'medications');

      final parsedActivities = activitiesData
          .map<ActivityEntry>((entry) => ActivityEntry.fromJson(entry))
          .toList();
      final parsedMeals = mealsData
          .map<MealEntry>((entry) => MealEntry.fromJson(entry))
          .toList();
      final parsedMedications = medicationsData
          .map<Medication>((entry) => Medication.fromJson(entry))
          .toList();

      final updatedSteps = _calculateTodaySteps(parsedActivities);

      setState(() {
        activities = parsedActivities;
        meals = parsedMeals;
        medications = parsedMedications;
        todaySteps = updatedSteps;
        _lastRefreshedAt = DateTime.now();
        _isLoading = false;
        _errorMessage = null;
      });
    } catch (error) {
      setState(() {
        _isLoading = false;
        _errorMessage = _friendlyErrorMessage(error);
      });
    }
  }

  Future<void> _loadAiReports() async {
    if (!mounted) return;

    final auth =
        _authProvider ?? Provider.of<AuthProvider>(context, listen: false);
    _authProvider = auth;

    if (!(auth.isAuthenticated)) {
      setState(() {
        reports = [];
        _reportErrorMessage = 'Please log in to access AI reports.';
        _isLoadingReports = false;
      });
      return;
    }

    setState(() {
      _isLoadingReports = true;
      _reportErrorMessage = null;
    });

    try {
      final data = await _healthTrackerService.fetchReports(
        authToken: auth.authToken,
      );
      setState(() {
        reports = data
            .map((item) => HealthTrackerReportSummary.fromJson(item))
            .toList();
        _reportErrorMessage = null;
        _isLoadingReports = false;
      });
    } catch (error) {
      setState(() {
        _reportErrorMessage = _friendlyErrorMessage(error);
        _isLoadingReports = false;
      });
    }
  }

  Future<void> _generateAiReport({String? entryId}) async {
    if (_isSaving) return;

    final auth = await _ensureAuthenticated();
    if (auth == null) return;

    setState(() {
      _isSaving = true;
    });

    try {
      await _healthTrackerService.generateAiReport(
        entryId: entryId,
        authToken: auth.authToken,
      );
      _showSnackBar(
        'HeartWise AI report generated successfully.',
        ContentType.success,
      );
      await _loadAiReports();
    } catch (error) {
      _showSnackBar(
        'Failed to generate report: ${_friendlyErrorMessage(error)}',
        ContentType.failure,
      );
    } finally {
      if (mounted) {
        setState(() {
          _isSaving = false;
        });
      }
    }
  }

  Future<void> _openReport(String reportId) async {
    final auth = await _ensureAuthenticated();
    if (auth == null) return;

    setState(() {
      _isSaving = true;
    });

    try {
      await _healthTrackerService.downloadReportPdf(
        reportId,
        authToken: auth.authToken,
      );
      _showSnackBar(
        'Report downloaded and opened successfully.',
        ContentType.success,
      );
    } catch (error) {
      _showSnackBar(
        'Failed to download report: ${_friendlyErrorMessage(error)}',
        ContentType.failure,
      );
    } finally {
      if (mounted) {
        setState(() {
          _isSaving = false;
        });
      }
    }
  }

  Future<void> _deleteReport(String reportId) async {
    final auth = await _ensureAuthenticated();
    if (auth == null) return;

    // Show confirmation dialog
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Delete Report'),
        content: Text(
            'Are you sure you want to delete this report? This action cannot be undone.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: Color(0xFFDC2626),
            ),
            child: Text('Delete'),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    setState(() {
      _isSaving = true;
    });

    try {
      await _healthTrackerService.deleteReport(
        reportId,
        authToken: auth.authToken,
      );
      _showSnackBar(
        'Report deleted successfully.',
        ContentType.success,
      );
      await _loadAiReports();
    } catch (error) {
      _showSnackBar(
        'Failed to delete report: ${_friendlyErrorMessage(error)}',
        ContentType.failure,
      );
    } finally {
      if (mounted) {
        setState(() {
          _isSaving = false;
        });
      }
    }
  }

  Future<void> _generateMonthlyReport() async {
    final auth = await _ensureAuthenticated();
    if (auth == null) return;

    setState(() {
      _isSaving = true;
    });

    try {
      await _healthTrackerService.generateMonthlyReport(
        authToken: auth.authToken,
      );
      _showSnackBar(
        'Monthly health report generated successfully.',
        ContentType.success,
      );
      await _loadAiReports();
    } catch (error) {
      _showSnackBar(
        'Failed to generate monthly report: ${_friendlyErrorMessage(error)}',
        ContentType.failure,
      );
    } finally {
      if (mounted) {
        setState(() {
          _isSaving = false;
        });
      }
    }
  }

  List<Map<String, dynamic>> _extractEntries(
    Map<String, dynamic> data,
    String key,
  ) {
    final raw = data[key];
    if (raw is List) {
      return raw
          .whereType<Map>()
          .map((entry) => Map<String, dynamic>.from(entry))
          .toList();
    } else if (raw is Map) {
      return [Map<String, dynamic>.from(raw)];
    }
    return <Map<String, dynamic>>[];
  }

  int _calculateTodaySteps(List<ActivityEntry> entries) {
    final now = DateTime.now();
    return entries.where((entry) => _isSameDay(entry.date, now)).fold<int>(
          0,
          (sum, entry) => sum + _estimateStepsFromActivity(entry),
        );
  }

  int _estimateStepsFromActivity(ActivityEntry entry) {
    if (entry.steps != null && entry.steps! > 0) {
      return entry.steps!;
    }
    return _estimateSteps(
      distance: entry.distance,
      duration: entry.duration,
      calories: entry.calories,
    );
  }

  int _estimateSteps({
    double distance = 0,
    int duration = 0,
    int calories = 0,
  }) {
    if (distance > 0) {
      // Average ~1312 steps per kilometer
      return (distance * 1312).round();
    }
    if (duration > 0) {
      // Approximate 100 steps per minute if distance unavailable
      return duration * 100;
    }
    if (calories > 0) {
      // Roughly convert calories to steps (varies widely, fallback only)
      return (calories * 20).round();
    }
    return 0;
  }

  bool _isSameDay(DateTime a, DateTime b) {
    return a.year == b.year && a.month == b.month && a.day == b.day;
  }

  String _friendlyErrorMessage(Object error) {
    final message = error.toString();
    if (message.contains('Failed host lookup')) {
      return 'Unable to connect to the server. Please check your network connection.';
    }
    if (message.contains('401')) {
      return 'Authentication failed. Please log in again.';
    }
    if (message.contains('403')) {
      return 'You do not have permission to perform this action.';
    }
    if (message.contains('timeout')) {
      return 'The request timed out. Please try again.';
    }
    return message;
  }

  Future<AuthProvider?> _ensureAuthenticated() async {
    try {
      _authProvider ??= Provider.of<AuthProvider>(context, listen: false);
      final auth = _authProvider!;
      if (!auth.isAuthenticated) {
        _showSnackBar('Please log in to continue.', ContentType.warning);
        return null;
      }
      return auth;
    } catch (error) {
      _showSnackBar(
        'Authentication is not available. Please try again.',
        ContentType.warning,
      );
      return null;
    }
  }

  Future<void> _createActivityEntry({
    required String type,
    required int duration,
    required double distance,
    required int calories,
  }) async {
    final auth = await _ensureAuthenticated();
    if (auth == null) return;

    final now = DateTime.now();
    final steps = _estimateSteps(
      distance: distance,
      duration: duration,
      calories: calories,
    );

    setState(() {
      _isSaving = true;
    });

    try {
      final created = await _healthTrackerService.createEntry(
        entryType: 'activity',
        payload: {
          'type': type,
          'duration': duration,
          'distance': distance,
          'calories': calories,
          'steps': steps,
          'date': now.toIso8601String(),
        },
        recordedAt: now,
        authToken: auth.authToken,
      );

      final entry = ActivityEntry.fromJson(created);
      setState(() {
        activities.insert(0, entry);
        todaySteps = _calculateTodaySteps(activities);
        _lastRefreshedAt = DateTime.now();
      });

      _showSnackBar('Activity logged successfully!', ContentType.success);
    } catch (error) {
      _showSnackBar(
        'Failed to log activity: ${_friendlyErrorMessage(error)}',
        ContentType.failure,
      );
    } finally {
      if (mounted) {
        setState(() {
          _isSaving = false;
        });
      }
    }
  }

  Future<void> _createMealEntry(
    String mealType, {
    required String foodItems,
    required double calories,
    required double saturatedFat,
    required double cholesterol,
  }) async {
    final auth = await _ensureAuthenticated();
    if (auth == null) return;

    final now = DateTime.now();

    setState(() {
      _isSaving = true;
    });

    try {
      final created = await _healthTrackerService.createEntry(
        entryType: 'meal',
        payload: {
          'mealType': mealType,
          'foodItems': foodItems,
          'calories': calories,
          'saturatedFat': saturatedFat,
          'cholesterol': cholesterol,
          'date': now.toIso8601String(),
        },
        recordedAt: now,
        authToken: auth.authToken,
      );

      final meal = MealEntry.fromJson(created);
      setState(() {
        meals.insert(0, meal);
        _lastRefreshedAt = DateTime.now();
      });

      _showSnackBar('Meal logged successfully!', ContentType.success);
    } catch (error) {
      _showSnackBar(
        'Failed to log meal: ${_friendlyErrorMessage(error)}',
        ContentType.failure,
      );
    } finally {
      if (mounted) {
        setState(() {
          _isSaving = false;
        });
      }
    }
  }

  Future<void> _createMedicationEntry({
    required String name,
    required String dosage,
    required String frequency,
    required TimeOfDay time,
  }) async {
    final auth = await _ensureAuthenticated();
    if (auth == null) return;

    final timeString = _formatTimeOfDay(time);
    final now = DateTime.now();

    setState(() {
      _isSaving = true;
    });

    try {
      final created = await _healthTrackerService.createEntry(
        entryType: 'medication',
        payload: {
          'name': name,
          'dosage': dosage,
          'frequency': frequency,
          'time': timeString,
          'reminderEnabled': true,
        },
        recordedAt: now,
        authToken: auth.authToken,
      );

      final medication = Medication.fromJson(created);
      setState(() {
        medications.insert(0, medication);
        _lastRefreshedAt = DateTime.now();
      });

      _showSnackBar('Medication added successfully!', ContentType.success);
    } catch (error) {
      _showSnackBar(
        'Failed to add medication: ${_friendlyErrorMessage(error)}',
        ContentType.failure,
      );
    } finally {
      if (mounted) {
        setState(() {
          _isSaving = false;
        });
      }
    }
  }

  Future<void> _toggleMedicationReminder(
    Medication medication,
    bool enable,
  ) async {
    final previousValue = medication.reminderEnabled;
    setState(() {
      medication.reminderEnabled = enable;
    });

    if (medication.id == null) {
      _showSnackBar(
        'Medication not synced with server yet.',
        ContentType.warning,
      );
      return;
    }

    final auth = await _ensureAuthenticated();
    if (auth == null) {
      setState(() {
        medication.reminderEnabled = previousValue;
      });
      return;
    }

    try {
      final updated = await _healthTrackerService.updateEntry(
        medication.id!,
        payload: {
          'name': medication.name,
          'dosage': medication.dosage,
          'frequency': medication.frequency,
          'time': _formatTimeOfDay(medication.time),
          'reminderEnabled': enable,
        },
        authToken: auth.authToken,
      );

      final updatedMedication = Medication.fromJson(updated);
      setState(() {
        final index =
            medications.indexWhere((med) => med.id == updatedMedication.id);
        if (index != -1) {
          medications[index] = updatedMedication;
        }
      });

      _showSnackBar(
        enable ? 'Reminder enabled' : 'Reminder disabled',
        ContentType.success,
      );
    } catch (error) {
      setState(() {
        medication.reminderEnabled = previousValue;
      });
      _showSnackBar(
        'Failed to update reminder: ${_friendlyErrorMessage(error)}',
        ContentType.failure,
      );
    }
  }

  String _formatTimeOfDay(TimeOfDay time) {
    final hour = time.hour.toString().padLeft(2, '0');
    final minute = time.minute.toString().padLeft(2, '0');
    return '$hour:$minute';
  }

  Future<void> _handleManualRefresh() async {
    if (_isLoading) return;
    await _loadHealthTrackerData();
  }

  Widget _buildDataContainer(Widget child) {
    if (_isLoading) {
      return _buildLoadingState();
    }
    if (_errorMessage != null) {
      return _buildErrorState();
    }
    return child;
  }

  Widget _buildLoadingState() {
    return const Center(
      child: CircularProgressIndicator(
        color: Color(0xFF3B82F6),
      ),
    );
  }

  Widget _buildErrorState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(
              Icons.cloud_off,
              size: 48,
              color: Color(0xFFEF4444),
            ),
            const SizedBox(height: 16),
            Text(
              _errorMessage ?? 'Something went wrong while fetching your data.',
              style: GoogleFonts.inter(
                fontSize: 14,
                fontWeight: FontWeight.w500,
                color: const Color(0xFF6B7280),
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            ElevatedButton.icon(
              onPressed: _initializeData,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF3B82F6),
                foregroundColor: Colors.white,
                padding:
                    const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12)),
              ),
              icon: const Icon(Icons.refresh),
              label: const Text('Retry'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState({
    required IconData icon,
    required String title,
    required String description,
  }) {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE5E7EB)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Icon(icon, size: 48, color: const Color(0xFF9CA3AF)),
          const SizedBox(height: 16),
          Text(
            title,
            style: GoogleFonts.inter(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: const Color(0xFF1F2937),
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 8),
          Text(
            description,
            style: GoogleFonts.inter(
              fontSize: 13,
              color: const Color(0xFF6B7280),
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildSyncInfo() {
    if (_isLoading || _errorMessage != null || _lastRefreshedAt == null) {
      return const SizedBox(height: 0);
    }

    final formatted =
        DateFormat('MMM d, yyyy • h:mm a').format(_lastRefreshedAt!.toLocal());

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Row(
        children: [
          const Icon(Icons.cloud_done, size: 18, color: Color(0xFF16A34A)),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              'Synced with CardioLink at $formatted',
              style: GoogleFonts.inter(
                fontSize: 12,
                color: const Color(0xFF6B7280),
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          IconButton(
            icon: const Icon(Icons.refresh, size: 20, color: Color(0xFF3B82F6)),
            tooltip: 'Refresh',
            onPressed: _handleManualRefresh,
          ),
        ],
      ),
    );
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Color(0xFFF5F6FA),
      appBar: _buildAppBar(),
      body: Column(
        children: [
          if (_isSaving)
            const LinearProgressIndicator(
              minHeight: 2,
              color: Color(0xFF3B82F6),
              backgroundColor: Colors.transparent,
            ),
          _buildTabBar(),
          _buildSyncInfo(),
          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: [
                _buildDataContainer(_buildActivityTab()),
                _buildDataContainer(_buildDietTab()),
                _buildDataContainer(_buildMedicationTab()),
                _buildDataContainer(_buildReportsTab()),
              ],
            ),
          ),
        ],
      ),
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
        'Health Tracker',
        style: GoogleFonts.inter(
          fontSize: 20,
          fontWeight: FontWeight.w700,
          color: Color(0xFF1E1E1E),
        ),
      ),
      actions: [
        IconButton(
          icon: Icon(Icons.calendar_today, color: Color(0xFF16A34A)),
          onPressed: _showDatePicker,
        ),
      ],
    );
  }

  Widget _buildTabBar() {
    return Container(
      margin: EdgeInsets.all(16),
      padding: EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Color(0xFFE5E7EB)),
      ),
      child: TabBar(
        controller: _tabController,
        indicator: BoxDecoration(
          gradient: LinearGradient(
            colors: [Color(0xFF06B6D4), Color(0xFF3B82F6)],
          ),
          borderRadius: BorderRadius.circular(8),
        ),
        labelColor: Colors.white,
        unselectedLabelColor: Color(0xFF6B7280),
        labelStyle: GoogleFonts.inter(
          fontSize: 11,
          fontWeight: FontWeight.w600,
        ),
        tabs: [
          Tab(icon: Icon(Icons.directions_run, size: 20), text: 'Activity'),
          Tab(icon: Icon(Icons.restaurant, size: 20), text: 'Diet'),
          Tab(icon: Icon(Icons.medication, size: 20), text: 'Meds'),
          Tab(icon: Icon(Icons.assessment, size: 20), text: 'Reports'),
        ],
      ),
    );
  }

  // ACTIVITY TAB
  Widget _buildActivityTab() {
    double progress = goalSteps > 0 ? todaySteps / goalSteps : 0;
    if (progress > 1) {
      progress = 1;
    }

    return SingleChildScrollView(
      padding: EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildStepsCard(progress),
          SizedBox(height: 20),
          _buildQuickActivityButtons(),
          SizedBox(height: 20),
          _buildActivityHistory(),
        ],
      ),
    );
  }

  Widget _buildStepsCard(double progress) {
    return Container(
      padding: EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [Color(0xFF06B6D4), Color(0xFF3B82F6)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Color(0xFF3B82F6).withOpacity(0.3),
            blurRadius: 20,
            offset: Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Today\'s Steps',
                    style: GoogleFonts.inter(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: Colors.white.withOpacity(0.9),
                    ),
                  ),
                  SizedBox(height: 8),
                  Text(
                    '$todaySteps',
                    style: GoogleFonts.inter(
                      fontSize: 40,
                      fontWeight: FontWeight.w700,
                      color: Colors.white,
                      letterSpacing: -1,
                    ),
                  ),
                  Text(
                    'Goal: $goalSteps steps',
                    style: GoogleFonts.inter(
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                      color: Colors.white.withOpacity(0.8),
                    ),
                  ),
                ],
              ),
              Container(
                width: 100,
                height: 100,
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    SizedBox(
                      width: 100,
                      height: 100,
                      child: CircularProgressIndicator(
                        value: progress,
                        strokeWidth: 8,
                        backgroundColor: Colors.white.withOpacity(0.2),
                        valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                      ),
                    ),
                    Text(
                      '${(progress * 100).toInt()}%',
                      style: GoogleFonts.inter(
                        fontSize: 18,
                        fontWeight: FontWeight.w700,
                        color: Colors.white,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          SizedBox(height: 20),
          LinearProgressIndicator(
            value: progress,
            backgroundColor: Colors.white.withOpacity(0.2),
            valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
            minHeight: 8,
            borderRadius: BorderRadius.circular(4),
          ),
        ],
      ),
    );
  }

  Widget _buildQuickActivityButtons() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Quick Log Activity',
          style: GoogleFonts.inter(
            fontSize: 18,
            fontWeight: FontWeight.w700,
            color: Color(0xFF1E1E1E),
          ),
        ),
        SizedBox(height: 12),
        Row(
          children: [
            Expanded(
                child: _buildActivityButton(
                    'Walking', Icons.directions_walk, Color(0xFF16A34A))),
            SizedBox(width: 12),
            Expanded(
                child: _buildActivityButton(
                    'Jogging', Icons.directions_run, Color(0xFF3B82F6))),
          ],
        ),
        SizedBox(height: 12),
        Row(
          children: [
            Expanded(
                child: _buildActivityButton(
                    'Cycling', Icons.directions_bike, Color(0xFFF59E0B))),
            SizedBox(width: 12),
            Expanded(
                child: _buildActivityButton(
                    'Gym', Icons.fitness_center, Color(0xFF8B5CF6))),
          ],
        ),
      ],
    );
  }

  Widget _buildActivityButton(String label, IconData icon, Color color) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: () => _showAddActivityDialog(label),
        child: Container(
          padding: EdgeInsets.symmetric(vertical: 16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Color(0xFFE5E7EB)),
          ),
          child: Column(
            children: [
              Container(
                padding: EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.1),
                  shape: BoxShape.circle,
                ),
                child: Icon(icon, color: color, size: 28),
              ),
              SizedBox(height: 8),
              Text(
                label,
                style: GoogleFonts.inter(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF1E1E1E),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildActivityHistory() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'Recent Activities',
              style: GoogleFonts.inter(
                fontSize: 18,
                fontWeight: FontWeight.w700,
                color: Color(0xFF1E1E1E),
              ),
            ),
            TextButton(
              onPressed: () {},
              child: Text(
                'View All',
                style: GoogleFonts.inter(
                  color: Color(0xFF3B82F6),
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ],
        ),
        SizedBox(height: 12),
        if (activities.isEmpty)
          _buildEmptyState(
            icon: Icons.directions_run,
            title: 'No activity logs yet',
            description:
                'Use the quick log buttons to record your first activity.',
          )
        else
          ...activities.map((activity) => _buildActivityCard(activity)),
      ],
    );
  }

  Widget _buildActivityCard(ActivityEntry activity) {
    IconData icon;
    Color color;

    switch (activity.type) {
      case 'Walking':
        icon = Icons.directions_walk;
        color = Color(0xFF16A34A);
        break;
      case 'Jogging':
        icon = Icons.directions_run;
        color = Color(0xFF3B82F6);
        break;
      case 'Cycling':
        icon = Icons.directions_bike;
        color = Color(0xFFF59E0B);
        break;
      default:
        icon = Icons.fitness_center;
        color = Color(0xFF8B5CF6);
    }

    return Container(
      margin: EdgeInsets.only(bottom: 12),
      padding: EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Color(0xFFE5E7EB)),
      ),
      child: Row(
        children: [
          Container(
            padding: EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: color, size: 24),
          ),
          SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  activity.type,
                  style: GoogleFonts.inter(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF1E1E1E),
                  ),
                ),
                SizedBox(height: 4),
                Text(
                  '${activity.duration} min • ${activity.distance} km • ${activity.calories} cal',
                  style: GoogleFonts.inter(
                    fontSize: 13,
                    color: Color(0xFF6B7280),
                  ),
                ),
              ],
            ),
          ),
          Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              IconButton(
                icon: Icon(Icons.auto_awesome,
                    color: Color(0xFF3B82F6), size: 22),
                tooltip: 'Generate HeartWise AI report',
                onPressed: activity.id == null
                    ? null
                    : () => _generateAiReport(entryId: activity.id),
              ),
              Text(
                DateFormat('MMM d').format(activity.date),
                style: GoogleFonts.inter(
                  fontSize: 12,
                  color: Color(0xFF6B7280),
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // DIET TAB
  Widget _buildDietTab() {
    double totalCalories = meals.fold(0, (sum, meal) => sum + meal.calories);
    double totalSatFat = meals.fold(0, (sum, meal) => sum + meal.saturatedFat);
    double totalCholesterol =
        meals.fold(0, (sum, meal) => sum + meal.cholesterol);

    return SingleChildScrollView(
      padding: EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildNutritionSummaryCard(
              totalCalories, totalSatFat, totalCholesterol),
          SizedBox(height: 20),
          _buildAddMealButtons(),
          SizedBox(height: 20),
          _buildMealHistory(),
        ],
      ),
    );
  }

  Widget _buildNutritionSummaryCard(
      double calories, double satFat, double cholesterol) {
    return Container(
      padding: EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [Color(0xFF10B981), Color(0xFF16A34A)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Color(0xFF16A34A).withOpacity(0.3),
            blurRadius: 20,
            offset: Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Today\'s Nutrition',
            style: GoogleFonts.inter(
              fontSize: 18,
              fontWeight: FontWeight.w700,
              color: Colors.white,
            ),
          ),
          SizedBox(height: 20),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _buildNutritionItem('Calories', '${calories.toInt()}', 'kcal',
                  Icons.local_fire_department),
              _buildNutritionItem('Sat. Fat', '${satFat.toStringAsFixed(1)}',
                  'g', Icons.water_drop),
              _buildNutritionItem(
                  'Cholesterol', '${cholesterol.toInt()}', 'mg', Icons.science),
            ],
          ),
          SizedBox(height: 16),
          Container(
            padding: EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.2),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Row(
              children: [
                Icon(Icons.info_outline, color: Colors.white, size: 20),
                SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Heart-healthy diet: Low sat. fat & cholesterol',
                    style: GoogleFonts.inter(
                      fontSize: 12,
                      color: Colors.white,
                      fontWeight: FontWeight.w500,
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

  Widget _buildNutritionItem(
      String label, String value, String unit, IconData icon) {
    return Column(
      children: [
        Container(
          padding: EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.2),
            shape: BoxShape.circle,
          ),
          child: Icon(icon, color: Colors.white, size: 20),
        ),
        SizedBox(height: 8),
        Text(
          value,
          style: GoogleFonts.inter(
            fontSize: 20,
            fontWeight: FontWeight.w700,
            color: Colors.white,
          ),
        ),
        Text(
          unit,
          style: GoogleFonts.inter(
            fontSize: 11,
            color: Colors.white.withOpacity(0.9),
          ),
        ),
        SizedBox(height: 4),
        Text(
          label,
          style: GoogleFonts.inter(
            fontSize: 12,
            fontWeight: FontWeight.w500,
            color: Colors.white.withOpacity(0.8),
          ),
        ),
      ],
    );
  }

  Widget _buildAddMealButtons() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Log Meal',
          style: GoogleFonts.inter(
            fontSize: 18,
            fontWeight: FontWeight.w700,
            color: Color(0xFF1E1E1E),
          ),
        ),
        SizedBox(height: 12),
        Row(
          children: [
            Expanded(
                child: _buildMealButton(
                    'Breakfast', Icons.wb_sunny, Color(0xFFF59E0B))),
            SizedBox(width: 12),
            Expanded(
                child: _buildMealButton(
                    'Lunch', Icons.lunch_dining, Color(0xFF16A34A))),
          ],
        ),
        SizedBox(height: 12),
        Row(
          children: [
            Expanded(
                child: _buildMealButton(
                    'Dinner', Icons.dinner_dining, Color(0xFF3B82F6))),
            SizedBox(width: 12),
            Expanded(
                child: _buildMealButton(
                    'Snack', Icons.fastfood, Color(0xFF8B5CF6))),
          ],
        ),
      ],
    );
  }

  Widget _buildMealButton(String label, IconData icon, Color color) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: () => _showAddMealDialog(label),
        child: Container(
          padding: EdgeInsets.symmetric(vertical: 16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Color(0xFFE5E7EB)),
          ),
          child: Column(
            children: [
              Container(
                padding: EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.1),
                  shape: BoxShape.circle,
                ),
                child: Icon(icon, color: color, size: 28),
              ),
              SizedBox(height: 8),
              Text(
                label,
                style: GoogleFonts.inter(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF1E1E1E),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildMealHistory() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'Recent Meals',
              style: GoogleFonts.inter(
                fontSize: 18,
                fontWeight: FontWeight.w700,
                color: Color(0xFF1E1E1E),
              ),
            ),
            TextButton(
              onPressed: () {},
              child: Text(
                'View All',
                style: GoogleFonts.inter(
                  color: Color(0xFF16A34A),
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ],
        ),
        SizedBox(height: 12),
        if (meals.isEmpty)
          _buildEmptyState(
            icon: Icons.restaurant,
            title: 'No meals logged yet',
            description:
                'Add your meals to keep track of your nutrition and daily intake.',
          )
        else
          ...meals.map((meal) => _buildMealCard(meal)),
      ],
    );
  }

  Widget _buildMealCard(MealEntry meal) {
    IconData icon;
    Color color;

    switch (meal.mealType) {
      case 'Breakfast':
        icon = Icons.wb_sunny;
        color = Color(0xFFF59E0B);
        break;
      case 'Lunch':
        icon = Icons.lunch_dining;
        color = Color(0xFF16A34A);
        break;
      case 'Dinner':
        icon = Icons.dinner_dining;
        color = Color(0xFF3B82F6);
        break;
      default:
        icon = Icons.fastfood;
        color = Color(0xFF8B5CF6);
    }

    return Container(
      margin: EdgeInsets.only(bottom: 12),
      padding: EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Color(0xFFE5E7EB)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                padding: EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, color: color, size: 24),
              ),
              SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      meal.mealType,
                      style: GoogleFonts.inter(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: Color(0xFF1E1E1E),
                      ),
                    ),
                    SizedBox(height: 4),
                    Text(
                      meal.foodItems,
                      style: GoogleFonts.inter(
                        fontSize: 13,
                        color: Color(0xFF6B7280),
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
              Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  IconButton(
                    icon: Icon(Icons.auto_awesome,
                        color: Color(0xFF16A34A), size: 22),
                    tooltip: 'Generate HeartWise AI report',
                    onPressed: meal.id == null
                        ? null
                        : () => _generateAiReport(entryId: meal.id),
                  ),
                ],
              ),
            ],
          ),
          SizedBox(height: 12),
          Divider(color: Color(0xFFE5E7EB)),
          SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _buildMealStat('${meal.calories} cal',
                  Icons.local_fire_department, Color(0xFFEF4444)),
              _buildMealStat('${meal.saturatedFat}g fat', Icons.water_drop,
                  Color(0xFF3B82F6)),
              _buildMealStat('${meal.cholesterol}mg chol', Icons.science,
                  Color(0xFF8B5CF6)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildMealStat(String text, IconData icon, Color color) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 14, color: color),
        SizedBox(width: 4),
        Text(
          text,
          style: GoogleFonts.inter(
            fontSize: 11,
            fontWeight: FontWeight.w500,
            color: Color(0xFF6B7280),
          ),
        ),
      ],
    );
  }

  // MEDICATION TAB
  Widget _buildMedicationTab() {
    return SingleChildScrollView(
      padding: EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildMedicationComplianceCard(),
          SizedBox(height: 20),
          _buildAddMedicationButton(),
          SizedBox(height: 20),
          _buildMedicationList(),
        ],
      ),
    );
  }

  Widget _buildMedicationComplianceCard() {
    int totalMeds = medications.length;
    int takenToday =
        medications.where((medication) => medication.reminderEnabled).length;
    double compliance = totalMeds > 0 ? takenToday / totalMeds : 0;

    return Container(
      padding: EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [Color(0xFF8B5CF6), Color(0xFF7C3AED)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Color(0xFF8B5CF6).withOpacity(0.3),
            blurRadius: 20,
            offset: Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Medication Adherence',
                    style: GoogleFonts.inter(
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                      color: Colors.white,
                    ),
                  ),
                  SizedBox(height: 8),
                  Text(
                    '$takenToday of $totalMeds taken today',
                    style: GoogleFonts.inter(
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                      color: Colors.white.withOpacity(0.9),
                    ),
                  ),
                ],
              ),
              Container(
                width: 80,
                height: 80,
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    SizedBox(
                      width: 80,
                      height: 80,
                      child: CircularProgressIndicator(
                        value: compliance,
                        strokeWidth: 6,
                        backgroundColor: Colors.white.withOpacity(0.2),
                        valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                      ),
                    ),
                    Text(
                      '${(compliance * 100).toInt()}%',
                      style: GoogleFonts.inter(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: Colors.white,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          SizedBox(height: 16),
          Container(
            padding: EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.2),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Row(
              children: [
                Icon(Icons.notifications_active, color: Colors.white, size: 20),
                SizedBox(width: 8),
                Expanded(
                  child: Text(
                    totalMeds == 0
                        ? 'Add medications to start receiving reminders'
                        : 'Reminders enabled for $takenToday of $totalMeds medications',
                    style: GoogleFonts.inter(
                      fontSize: 12,
                      color: Colors.white,
                      fontWeight: FontWeight.w500,
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

  Widget _buildAddMedicationButton() {
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton.icon(
        onPressed: () => _showAddMedicationDialog(),
        icon: Icon(Icons.add_circle_outline),
        label: Text('Add New Medication'),
        style: ElevatedButton.styleFrom(
          backgroundColor: Color(0xFF8B5CF6),
          foregroundColor: Colors.white,
          padding: EdgeInsets.symmetric(vertical: 16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          elevation: 0,
        ),
      ),
    );
  }

  Widget _buildMedicationList() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'My Medications',
          style: GoogleFonts.inter(
            fontSize: 18,
            fontWeight: FontWeight.w700,
            color: Color(0xFF1E1E1E),
          ),
        ),
        SizedBox(height: 12),
        if (medications.isEmpty)
          _buildEmptyState(
            icon: Icons.medication,
            title: 'No medications tracked yet',
            description:
                'Add your prescriptions to receive reminders and maintain adherence.',
          )
        else
          ...medications.map((med) => _buildMedicationCard(med)),
      ],
    );
  }

  Widget _buildMedicationCard(Medication medication) {
    return Container(
      margin: EdgeInsets.only(bottom: 12),
      padding: EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Color(0xFFE5E7EB)),
      ),
      child: Column(
        children: [
          Row(
            children: [
              Container(
                padding: EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Color(0xFF8B5CF6).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child:
                    Icon(Icons.medication, color: Color(0xFF8B5CF6), size: 24),
              ),
              SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      medication.name,
                      style: GoogleFonts.inter(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: Color(0xFF1E1E1E),
                      ),
                    ),
                    SizedBox(height: 4),
                    Text(
                      '${medication.dosage} • ${medication.frequency}',
                      style: GoogleFonts.inter(
                        fontSize: 13,
                        color: Color(0xFF6B7280),
                      ),
                    ),
                  ],
                ),
              ),
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  IconButton(
                    icon: Icon(Icons.auto_awesome,
                        color: Color(0xFF16A34A), size: 22),
                    tooltip: 'Generate HeartWise AI report',
                    onPressed: medication.id == null
                        ? null
                        : () => _generateAiReport(entryId: medication.id),
                  ),
                  Switch(
                    value: medication.reminderEnabled,
                    onChanged: medication.id == null
                        ? null
                        : (value) =>
                            _toggleMedicationReminder(medication, value),
                    activeColor: Color(0xFF8B5CF6),
                  ),
                ],
              ),
            ],
          ),
          SizedBox(height: 12),
          Container(
            padding: EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Color(0xFFF8F9FA),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              children: [
                Icon(Icons.access_time, color: Color(0xFF8B5CF6), size: 16),
                SizedBox(width: 8),
                Text(
                  'Take at ${medication.time.format(context)}',
                  style: GoogleFonts.inter(
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                    color: Color(0xFF6B7280),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // REPORTS TAB
  Widget _buildReportsTab() {
    return SingleChildScrollView(
      padding: EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildMonthlyReportCard(),
          SizedBox(height: 20),
          _buildGeneratedReportsSection(),
          SizedBox(height: 20),
          _buildActivityChart(),
          SizedBox(height: 20),
          _buildNutritionChart(),
          SizedBox(height: 20),
          _buildComplianceChart(),
        ],
      ),
    );
  }

  Widget _buildGeneratedReportsSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'HeartWise AI Reports',
              style: GoogleFonts.inter(
                fontSize: 18,
                fontWeight: FontWeight.w700,
                color: Color(0xFF1E1E1E),
              ),
            ),
            if (_isLoadingReports)
              SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(strokeWidth: 2),
              ),
          ],
        ),
        SizedBox(height: 12),
        if (_reportErrorMessage != null)
          Container(
            padding: EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Color(0xFFFEF2F2),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: Color(0xFFFECACA)),
            ),
            child: Row(
              children: [
                Icon(Icons.error_outline, color: Color(0xFFDC2626), size: 20),
                SizedBox(width: 8),
                Expanded(
                  child: Text(
                    _reportErrorMessage!,
                    style: GoogleFonts.inter(
                      fontSize: 13,
                      color: Color(0xFFDC2626),
                    ),
                  ),
                ),
              ],
            ),
          )
        else if (reports.isEmpty)
          _buildEmptyState(
            icon: Icons.assessment,
            title: 'No reports generated yet',
            description:
                'Generate a HeartWise AI report from any activity, meal, or medication entry, or create a comprehensive monthly report.',
          )
        else
          ...reports.map((report) => _buildReportCard(report)),
      ],
    );
  }

  Widget _buildReportCard(HealthTrackerReportSummary report) {
    return Container(
      margin: EdgeInsets.only(bottom: 12),
      padding: EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Color(0xFFE5E7EB)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: Color(0xFFEF4444).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(Icons.auto_awesome,
                    color: Color(0xFFEF4444), size: 24),
              ),
              SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      report.title,
                      style: GoogleFonts.inter(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: Color(0xFF1E1E1E),
                      ),
                    ),
                    SizedBox(height: 4),
                    Text(
                      DateFormat('MMM d, yyyy • h:mm a')
                          .format(report.createdAt),
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        color: Color(0xFF6B7280),
                      ),
                    ),
                  ],
                ),
              ),
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  IconButton(
                    icon: Icon(Icons.download, color: Color(0xFF3B82F6)),
                    tooltip: 'Download PDF',
                    onPressed: () => _openReport(report.reportId),
                  ),
                  IconButton(
                    icon: Icon(Icons.delete_outline, color: Color(0xFFDC2626)),
                    tooltip: 'Delete Report',
                    onPressed: () => _deleteReport(report.reportId),
                  ),
                ],
              ),
            ],
          ),
          if (report.summary != null && report.summary!.isNotEmpty) ...[
            SizedBox(height: 12),
            Text(
              report.summary!,
              style: GoogleFonts.inter(
                fontSize: 13,
                color: Color(0xFF6B7280),
              ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildMonthlyReportCard() {
    return Container(
      padding: EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [Color(0xFFEF4444), Color(0xFFDC2626)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Color(0xFFEF4444).withOpacity(0.3),
            blurRadius: 20,
            offset: Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Monthly Report',
                    style: GoogleFonts.inter(
                      fontSize: 20,
                      fontWeight: FontWeight.w700,
                      color: Colors.white,
                    ),
                  ),
                  SizedBox(height: 4),
                  Text(
                    DateFormat('MMMM yyyy').format(DateTime.now()),
                    style: GoogleFonts.inter(
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                      color: Colors.white.withOpacity(0.9),
                    ),
                  ),
                ],
              ),
              Container(
                padding: EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.2),
                  shape: BoxShape.circle,
                ),
                child: Icon(Icons.assessment, color: Colors.white, size: 28),
              ),
            ],
          ),
          SizedBox(height: 24),
          Row(
            children: [
              Expanded(
                child: _buildReportStat(
                    'Activities', '${activities.length}', Icons.directions_run),
              ),
              Expanded(
                child: _buildReportStat(
                    'Meals', '${meals.length}', Icons.restaurant),
              ),
              Expanded(
                child: _buildReportStat(
                    'Meds',
                    medications.isEmpty
                        ? '0'
                        : '${((medications.where((m) => m.reminderEnabled).length / medications.length) * 100).toInt()}%',
                    Icons.medication),
              ),
            ],
          ),
          SizedBox(height: 16),
          ElevatedButton.icon(
            onPressed: _generateMonthlyReport,
            icon: Icon(Icons.download, size: 18),
            label: Text('Download Full Report'),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.white,
              foregroundColor: Color(0xFFEF4444),
              padding: EdgeInsets.symmetric(vertical: 12),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
              ),
              elevation: 0,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildReportStat(String label, String value, IconData icon) {
    return Column(
      children: [
        Icon(icon, color: Colors.white, size: 24),
        SizedBox(height: 8),
        Text(
          value,
          style: GoogleFonts.inter(
            fontSize: 24,
            fontWeight: FontWeight.w700,
            color: Colors.white,
          ),
        ),
        Text(
          label,
          style: GoogleFonts.inter(
            fontSize: 12,
            fontWeight: FontWeight.w500,
            color: Colors.white.withOpacity(0.9),
          ),
        ),
      ],
    );
  }

  Widget _buildActivityChart() {
    return Container(
      padding: EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Color(0xFFE5E7EB)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Weekly Activity Trend',
            style: GoogleFonts.inter(
              fontSize: 16,
              fontWeight: FontWeight.w700,
              color: Color(0xFF1E1E1E),
            ),
          ),
          SizedBox(height: 20),
          Container(
            height: 200,
            child: SfCartesianChart(
              plotAreaBorderWidth: 0,
              primaryXAxis: CategoryAxis(
                majorGridLines: MajorGridLines(width: 0),
                axisLine: AxisLine(width: 0),
              ),
              primaryYAxis: NumericAxis(
                majorGridLines: MajorGridLines(color: Color(0xFFE5E7EB)),
                axisLine: AxisLine(width: 0),
              ),
              series: <CartesianSeries>[
                LineSeries<ChartDataPoint, String>(
                  dataSource: [
                    ChartDataPoint('Mon', 45),
                    ChartDataPoint('Tue', 60),
                    ChartDataPoint('Wed', 55),
                    ChartDataPoint('Thu', 70),
                    ChartDataPoint('Fri', 50),
                    ChartDataPoint('Sat', 80),
                    ChartDataPoint('Sun', 65),
                  ],
                  xValueMapper: (ChartDataPoint data, _) => data.x,
                  yValueMapper: (ChartDataPoint data, _) => data.y,
                  color: Color(0xFF3B82F6),
                  width: 3,
                  markerSettings: MarkerSettings(
                    isVisible: true,
                    color: Color(0xFF3B82F6),
                    borderColor: Colors.white,
                    borderWidth: 2,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildNutritionChart() {
    return Container(
      padding: EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Color(0xFFE5E7EB)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Nutrition Overview',
            style: GoogleFonts.inter(
              fontSize: 16,
              fontWeight: FontWeight.w700,
              color: Color(0xFF1E1E1E),
            ),
          ),
          SizedBox(height: 20),
          Container(
            height: 200,
            child: SfCircularChart(
              legend: Legend(
                isVisible: true,
                position: LegendPosition.bottom,
                overflowMode: LegendItemOverflowMode.wrap,
                textStyle: GoogleFonts.inter(fontSize: 11),
              ),
              series: <CircularSeries>[
                DoughnutSeries<NutritionData, String>(
                  dataSource: [
                    NutritionData('Protein', 30, Color(0xFF16A34A)),
                    NutritionData('Carbs', 45, Color(0xFF3B82F6)),
                    NutritionData('Fats', 25, Color(0xFFF59E0B)),
                  ],
                  xValueMapper: (NutritionData data, _) => data.category,
                  yValueMapper: (NutritionData data, _) => data.value,
                  pointColorMapper: (NutritionData data, _) => data.color,
                  dataLabelSettings: DataLabelSettings(
                    isVisible: true,
                    labelPosition: ChartDataLabelPosition.outside,
                  ),
                  innerRadius: '60%',
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildComplianceChart() {
    return Container(
      padding: EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Color(0xFFE5E7EB)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Medication Compliance',
            style: GoogleFonts.inter(
              fontSize: 16,
              fontWeight: FontWeight.w700,
              color: Color(0xFF1E1E1E),
            ),
          ),
          SizedBox(height: 20),
          Container(
            height: 200,
            child: SfCartesianChart(
              plotAreaBorderWidth: 0,
              primaryXAxis: CategoryAxis(
                majorGridLines: MajorGridLines(width: 0),
                axisLine: AxisLine(width: 0),
              ),
              primaryYAxis: NumericAxis(
                minimum: 0,
                maximum: 100,
                majorGridLines: MajorGridLines(color: Color(0xFFE5E7EB)),
                axisLine: AxisLine(width: 0),
              ),
              series: <CartesianSeries>[
                ColumnSeries<ChartDataPoint, String>(
                  dataSource: [
                    ChartDataPoint('Week 1', 95),
                    ChartDataPoint('Week 2', 88),
                    ChartDataPoint('Week 3', 92),
                    ChartDataPoint('Week 4', 98),
                  ],
                  xValueMapper: (ChartDataPoint data, _) => data.x,
                  yValueMapper: (ChartDataPoint data, _) => data.y,
                  color: Color(0xFF8B5CF6),
                  borderRadius: BorderRadius.vertical(top: Radius.circular(4)),
                  dataLabelSettings: DataLabelSettings(
                    isVisible: true,
                    textStyle: GoogleFonts.inter(fontSize: 10),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // DIALOG METHODS
  void _showAddActivityDialog(String activityType) {
    TextEditingController durationController = TextEditingController();
    TextEditingController distanceController = TextEditingController();
    TextEditingController caloriesController = TextEditingController();

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Text(
          'Log $activityType',
          style: GoogleFonts.inter(fontWeight: FontWeight.w700),
        ),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: durationController,
                keyboardType: TextInputType.number,
                decoration: InputDecoration(
                  labelText: 'Duration (minutes)',
                  border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8)),
                  prefixIcon: Icon(Icons.access_time),
                ),
              ),
              SizedBox(height: 12),
              TextField(
                controller: distanceController,
                keyboardType: TextInputType.number,
                decoration: InputDecoration(
                  labelText: 'Distance (km)',
                  border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8)),
                  prefixIcon: Icon(Icons.straighten),
                ),
              ),
              SizedBox(height: 12),
              TextField(
                controller: caloriesController,
                keyboardType: TextInputType.number,
                decoration: InputDecoration(
                  labelText: 'Calories Burned',
                  border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8)),
                  prefixIcon: Icon(Icons.local_fire_department),
                ),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () async {
              final duration = int.tryParse(durationController.text.trim());
              final distance = double.tryParse(distanceController.text.trim());
              final calories = int.tryParse(caloriesController.text.trim());

              if (duration == null || distance == null || calories == null) {
                _showSnackBar(
                  'Please enter valid values for duration, distance, and calories.',
                  ContentType.warning,
                );
                return;
              }

              Navigator.pop(context);
              await _createActivityEntry(
                type: activityType,
                duration: duration,
                distance: distance,
                calories: calories,
              );
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Color(0xFF3B82F6),
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8)),
            ),
            child: Text('Save'),
          ),
        ],
      ),
    );
  }

  void _showAddMealDialog(String mealType) {
    TextEditingController foodController = TextEditingController();
    TextEditingController caloriesController = TextEditingController();
    TextEditingController fatController = TextEditingController();
    TextEditingController cholesterolController = TextEditingController();

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Text(
          'Log $mealType',
          style: GoogleFonts.inter(fontWeight: FontWeight.w700),
        ),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: foodController,
                decoration: InputDecoration(
                  labelText: 'Food Items',
                  border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8)),
                  prefixIcon: Icon(Icons.restaurant),
                ),
              ),
              SizedBox(height: 12),
              TextField(
                controller: caloriesController,
                keyboardType: TextInputType.number,
                decoration: InputDecoration(
                  labelText: 'Calories',
                  border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8)),
                  prefixIcon: Icon(Icons.local_fire_department),
                ),
              ),
              SizedBox(height: 12),
              TextField(
                controller: fatController,
                keyboardType: TextInputType.number,
                decoration: InputDecoration(
                  labelText: 'Saturated Fat (g)',
                  border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8)),
                  prefixIcon: Icon(Icons.water_drop),
                ),
              ),
              SizedBox(height: 12),
              TextField(
                controller: cholesterolController,
                keyboardType: TextInputType.number,
                decoration: InputDecoration(
                  labelText: 'Cholesterol (mg)',
                  border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8)),
                  prefixIcon: Icon(Icons.science),
                ),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () async {
              final foodItems = foodController.text.trim();
              final calories = double.tryParse(caloriesController.text.trim());
              final saturatedFat = double.tryParse(fatController.text.trim());
              final cholesterol =
                  double.tryParse(cholesterolController.text.trim());

              if (foodItems.isEmpty ||
                  calories == null ||
                  saturatedFat == null ||
                  cholesterol == null) {
                _showSnackBar(
                  'Please provide valid meal details before saving.',
                  ContentType.warning,
                );
                return;
              }

              Navigator.pop(context);
              await _createMealEntry(
                mealType,
                foodItems: foodItems,
                calories: calories,
                saturatedFat: saturatedFat,
                cholesterol: cholesterol,
              );
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Color(0xFF16A34A),
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8)),
            ),
            child: Text('Save'),
          ),
        ],
      ),
    );
  }

  void _showAddMedicationDialog() {
    TextEditingController nameController = TextEditingController();
    TextEditingController dosageController = TextEditingController();
    String frequency = 'Daily';
    TimeOfDay selectedTime = TimeOfDay.now();

    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          title: Text(
            'Add Medication',
            style: GoogleFonts.inter(fontWeight: FontWeight.w700),
          ),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(
                  controller: nameController,
                  decoration: InputDecoration(
                    labelText: 'Medication Name',
                    border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8)),
                    prefixIcon: Icon(Icons.medication),
                  ),
                ),
                SizedBox(height: 12),
                TextField(
                  controller: dosageController,
                  decoration: InputDecoration(
                    labelText: 'Dosage (e.g., 20mg)',
                    border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8)),
                    prefixIcon: Icon(Icons.medical_information),
                  ),
                ),
                SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  value: frequency,
                  decoration: InputDecoration(
                    labelText: 'Frequency',
                    border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8)),
                    prefixIcon: Icon(Icons.repeat),
                  ),
                  items: ['Daily', 'Twice Daily', 'Weekly', 'As Needed']
                      .map((freq) =>
                          DropdownMenuItem(value: freq, child: Text(freq)))
                      .toList(),
                  onChanged: (value) {
                    setDialogState(() => frequency = value!);
                  },
                ),
                SizedBox(height: 12),
                ListTile(
                  leading: Icon(Icons.access_time),
                  title: Text('Reminder Time'),
                  subtitle: Text(selectedTime.format(context)),
                  trailing: Icon(Icons.edit),
                  onTap: () async {
                    TimeOfDay? picked = await showTimePicker(
                      context: context,
                      initialTime: selectedTime,
                    );
                    if (picked != null) {
                      setDialogState(() => selectedTime = picked);
                    }
                  },
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                    side: BorderSide(color: Color(0xFFE5E7EB)),
                  ),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () async {
                final name = nameController.text.trim();
                final dosage = dosageController.text.trim();

                if (name.isEmpty || dosage.isEmpty) {
                  _showSnackBar(
                    'Please provide the medication name and dosage.',
                    ContentType.warning,
                  );
                  return;
                }

                Navigator.pop(context);
                await _createMedicationEntry(
                  name: name,
                  dosage: dosage,
                  frequency: frequency,
                  time: selectedTime,
                );
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: Color(0xFF8B5CF6),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8)),
              ),
              child: Text('Save'),
            ),
          ],
        ),
      ),
    );
  }

  void _showDatePicker() async {
    await showDatePicker(
      context: context,
      initialDate: DateTime.now(),
      firstDate: DateTime(2020),
      lastDate: DateTime.now(),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: ColorScheme.light(
              primary: Color(0xFF3B82F6),
            ),
          ),
          child: child!,
        );
      },
    );
    // Date picker result can be used for filtering data in the future
  }

  void _showSnackBar(String message, ContentType type) {
    final snackBar = SnackBar(
      elevation: 0,
      behavior: SnackBarBehavior.floating,
      backgroundColor: Colors.transparent,
      content: AwesomeSnackbarContent(
        title: type == ContentType.success ? 'Success' : 'Info',
        message: message,
        contentType: type,
      ),
    );
    ScaffoldMessenger.of(context).showSnackBar(snackBar);
  }
}

// Data Models
class ActivityEntry {
  final String? id;
  final String type;
  final int duration;
  final double distance;
  final int calories;
  final int? steps;
  final DateTime date;

  ActivityEntry({
    this.id,
    required this.type,
    required this.duration,
    required this.distance,
    required this.calories,
    this.steps,
    required this.date,
  });

  factory ActivityEntry.fromJson(Map<String, dynamic> json) {
    final data = json['data'] is Map
        ? Map<String, dynamic>.from(json['data'] as Map)
        : json;

    DateTime parseDate(dynamic value) {
      if (value is DateTime) return value;
      if (value is String && value.isNotEmpty) {
        final parsed = DateTime.tryParse(value);
        if (parsed != null) return parsed;
      }
      return DateTime.now();
    }

    final recordedAt = parseDate(json['recordedAt']);
    final date = parseDate(data['date'] ?? recordedAt);

    return ActivityEntry(
      id: json['id']?.toString(),
      type: data['type']?.toString() ?? '',
      duration:
          (data['duration'] is num) ? (data['duration'] as num).toInt() : 0,
      distance:
          (data['distance'] is num) ? (data['distance'] as num).toDouble() : 0,
      calories:
          (data['calories'] is num) ? (data['calories'] as num).toInt() : 0,
      steps: (data['steps'] is num) ? (data['steps'] as num).toInt() : null,
      date: date,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'type': type,
      'duration': duration,
      'distance': distance,
      'calories': calories,
      'steps': steps,
      'date': date.toIso8601String(),
    };
  }
}

class MealEntry {
  final String? id;
  final String mealType;
  final String foodItems;
  final double calories;
  final double saturatedFat;
  final double cholesterol;
  final DateTime date;

  MealEntry({
    this.id,
    required this.mealType,
    required this.foodItems,
    required this.calories,
    required this.saturatedFat,
    required this.cholesterol,
    required this.date,
  });

  factory MealEntry.fromJson(Map<String, dynamic> json) {
    final data = json['data'] is Map
        ? Map<String, dynamic>.from(json['data'] as Map)
        : json;

    DateTime parseDate(dynamic value) {
      if (value is DateTime) return value;
      if (value is String && value.isNotEmpty) {
        final parsed = DateTime.tryParse(value);
        if (parsed != null) return parsed;
      }
      return DateTime.now();
    }

    final recordedAt = parseDate(json['recordedAt']);
    final date = parseDate(data['date'] ?? recordedAt);

    return MealEntry(
      id: json['id']?.toString(),
      mealType: data['mealType']?.toString() ?? '',
      foodItems: data['foodItems']?.toString() ?? '',
      calories:
          (data['calories'] is num) ? (data['calories'] as num).toDouble() : 0,
      saturatedFat: (data['saturatedFat'] is num)
          ? (data['saturatedFat'] as num).toDouble()
          : 0,
      cholesterol: (data['cholesterol'] is num)
          ? (data['cholesterol'] as num).toDouble()
          : 0,
      date: date,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'mealType': mealType,
      'foodItems': foodItems,
      'calories': calories,
      'saturatedFat': saturatedFat,
      'cholesterol': cholesterol,
      'date': date.toIso8601String(),
    };
  }
}

class Medication {
  final String? id;
  final String name;
  final String dosage;
  final String frequency;
  final TimeOfDay time;
  bool reminderEnabled;

  Medication({
    this.id,
    required this.name,
    required this.dosage,
    required this.frequency,
    required this.time,
    required this.reminderEnabled,
  });

  factory Medication.fromJson(Map<String, dynamic> json) {
    final data = json['data'] is Map
        ? Map<String, dynamic>.from(json['data'] as Map)
        : json;

    TimeOfDay parseTime(dynamic value) {
      if (value is TimeOfDay) {
        return value;
      }
      if (value is String && value.contains(':')) {
        final parts = value.split(':');
        if (parts.length == 2) {
          final hour = int.tryParse(parts[0]) ?? 0;
          final minute = int.tryParse(parts[1]) ?? 0;
          return TimeOfDay(hour: hour, minute: minute);
        }
      }
      return const TimeOfDay(hour: 0, minute: 0);
    }

    return Medication(
      id: json['id']?.toString(),
      name: data['name']?.toString() ?? '',
      dosage: data['dosage']?.toString() ?? '',
      frequency: data['frequency']?.toString() ?? '',
      time: parseTime(data['time']),
      reminderEnabled: data['reminderEnabled'] is bool
          ? data['reminderEnabled'] as bool
          : true,
    );
  }

  Map<String, dynamic> toJson() {
    final hour = time.hour.toString().padLeft(2, '0');
    final minute = time.minute.toString().padLeft(2, '0');
    return {
      'id': id,
      'name': name,
      'dosage': dosage,
      'frequency': frequency,
      'time': '$hour:$minute',
      'reminderEnabled': reminderEnabled,
    };
  }
}

class ChartDataPoint {
  final String x;
  final double y;

  ChartDataPoint(this.x, this.y);
}

class NutritionData {
  final String category;
  final int value;
  final Color color;

  NutritionData(this.category, this.value, this.color);
}

class HealthTrackerReportSummary {
  final String reportId;
  final String title;
  final String? summary;
  final List<String>? recommendations;
  final DateTime createdAt;
  final String? entryId;
  final String? reportType;

  HealthTrackerReportSummary({
    required this.reportId,
    required this.title,
    this.summary,
    this.recommendations,
    required this.createdAt,
    this.entryId,
    this.reportType,
  });

  factory HealthTrackerReportSummary.fromJson(Map<String, dynamic> json) {
    DateTime parseDate(dynamic value) {
      if (value is DateTime) return value;
      if (value is String && value.isNotEmpty) {
        final parsed = DateTime.tryParse(value);
        if (parsed != null) return parsed;
      }
      return DateTime.now();
    }

    return HealthTrackerReportSummary(
      reportId: json['reportId']?.toString() ?? json['_id']?.toString() ?? '',
      title: json['title']?.toString() ?? 'HeartWise AI Report',
      summary: json['summary']?.toString(),
      recommendations: json['recommendations'] is List
          ? (json['recommendations'] as List)
              .map((item) => item.toString())
              .toList()
          : null,
      createdAt: parseDate(json['createdAt']),
      entryId: json['entryId']?.toString(),
      reportType: json['reportType']?.toString(),
    );
  }
}
