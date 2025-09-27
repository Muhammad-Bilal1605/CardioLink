//c:/Users/PMLS/Desktop/CardioLink/CardioLink/Flutterapp/Expansetracker____/lib/cardio/chat_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'doctor.dart';
import '../services/doctor_service.dart';
import 'doctor_chat_screen.dart';
import 'appointment.dart';

class ChatScreen extends StatefulWidget {
  @override
  _ChatScreenState createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> with TickerProviderStateMixin {
  late AnimationController _fadeController;
  late AnimationController _slideController;
  late Animation<double> _fadeAnimation;
  late Animation<Offset> _slideAnimation;
  
  List<Doctor> _chatDoctors = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fadeController = AnimationController(
      duration: Duration(milliseconds: 800),
      vsync: this,
    );
    _slideController = AnimationController(
      duration: Duration(milliseconds: 600),
      vsync: this,
    );

    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _fadeController, curve: Curves.easeInOut),
    );

    _slideAnimation = Tween<Offset>(
      begin: Offset(0, 0.3),
      end: Offset.zero,
    ).animate(CurvedAnimation(parent: _slideController, curve: Curves.elasticOut));

    _loadDoctors();
    _fadeController.forward();
    _slideController.forward();
  }

  Future<void> _loadDoctors() async {
    try {
      // Merge online doctors with doctors from upcoming appointments
      final onlineDoctors = await DoctorService.getOnlineDoctors();
      final Map<String, Doctor> merged = {};

      // Seed with online doctors
      for (final d in onlineDoctors) {
        merged[d.id] = d;
      }

      // Add doctors referenced by upcoming appointments
      for (final appt in AppointmentStore.upcomingAppointments) {
        final docId = appt.doctorId;
        if (docId.isEmpty) continue;
        if (!merged.containsKey(docId)) {
          try {
            final fetched = await DoctorService.getDoctorById(docId);
            if (fetched != null) {
              merged[docId] = fetched;
            }
          } catch (_) {
            // Ignore fetch errors for individual doctors
          }
        }
      }

      // Ensure at least one fallback doctor if none available
      if (merged.isEmpty) {
        merged['fallback_emergency'] = Doctor(
          id: 'fallback_emergency',
          name: 'Emergency Doctor',
          email: 'emergency@hospital.com',
          specialty: 'Emergency Medicine',
          department: 'Emergency',
          yearsOfExperience: 5,
          qualifications: const ['MD', 'Emergency Medicine'],
          isVerified: true,
          isOnline: true,
        );
      }

      setState(() {
        _chatDoctors = merged.values.toList();
        _isLoading = false;
      });
    } catch (e) {
      print('❌ Error loading doctors for chat: $e');
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  void dispose() {
    _fadeController.dispose();
    _slideController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Color(0xFFF8F9FA),
      appBar: PreferredSize(
        preferredSize: Size.fromHeight(70),
        child: Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [Color(0xFF667eea), Color(0xFF764ba2)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            boxShadow: [
              BoxShadow(
                color: Color(0xFF667eea).withOpacity(0.3),
                blurRadius: 10,
                offset: Offset(0, 4),
              ),
            ],
          ),
          child: AppBar(
            backgroundColor: Colors.transparent,
            elevation: 0,
            centerTitle: true,
            title: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  padding: EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(Icons.chat_bubble_outline, color: Colors.white, size: 20),
                ),
                SizedBox(width: 12),
                Text(
                  'My Chats',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 22,
                    fontWeight: FontWeight.w600,
                    letterSpacing: 0.5,
                  ),
                ),
              ],
            ),
            systemOverlayStyle: SystemUiOverlayStyle.light,
          ),
        ),
      ),
      body: AnimatedBuilder(
        animation: _fadeAnimation,
        builder: (context, child) {
          return Opacity(
            opacity: _fadeAnimation.value,
            child: SlideTransition(
              position: _slideAnimation,
              child: _isLoading
                  ? Center(child: CircularProgressIndicator())
                  : _chatDoctors.isEmpty
                      ? _buildEmptyState()
                      : _buildChatList(),
            ),
          );
        },
      ),
    );
  }

  Widget _buildChatList() {
    return Container(
      margin: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: ListView.separated(
        physics: BouncingScrollPhysics(),
        itemCount: _chatDoctors.length,
        separatorBuilder: (_, __) => SizedBox(height: 12),
        itemBuilder: (ctx, index) => AnimatedContainer(
          duration: Duration(milliseconds: 300),
          curve: Curves.easeInOut,
          child: _DoctorChatTile(
            doctor: _chatDoctors[index],
            lastMessage: index == 0 ? "Hello! How can I help?" : null,
            index: index,
          ),
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: EdgeInsets.all(24),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [Color(0xFF667eea).withOpacity(0.1), Color(0xFF764ba2).withOpacity(0.1)],
              ),
              shape: BoxShape.circle,
            ),
            child: Icon(
              Icons.chat_bubble_outline,
              size: 64,
              color: Color(0xFF667eea),
            ),
          ),
          SizedBox(height: 24),
          Text(
            'No active chats',
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.w600,
              color: Color(0xFF2D3436),
            ),
          ),
          SizedBox(height: 8),
          Text(
            'Book an appointment to chat with doctors',
            style: TextStyle(
              fontSize: 16,
              color: Color(0xFF636E72),
            ),
            textAlign: TextAlign.center,
          ),
          SizedBox(height: 32),
          ElevatedButton.icon(
            onPressed: () {},
            icon: Icon(Icons.calendar_today),
            label: Text('Book Appointment'),
            style: ElevatedButton.styleFrom(
              backgroundColor: Color(0xFF667eea),
              foregroundColor: Colors.white,
              padding: EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(25),
              ),
              elevation: 4,
            ),
          ),
        ],
      ),
    );
  }
}

class _DoctorChatTile extends StatefulWidget {
  final Doctor doctor;
  final String? lastMessage;
  final int index;

  const _DoctorChatTile({
    required this.doctor,
    this.lastMessage,
    required this.index,
  });

  @override
  _DoctorChatTileState createState() => _DoctorChatTileState();
}

class _DoctorChatTileState extends State<_DoctorChatTile>
    with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  late Animation<double> _scaleAnimation;
  bool _isPressed = false;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: Duration(milliseconds: 150),
      vsync: this,
    );
    _scaleAnimation = Tween<double>(begin: 1.0, end: 0.95).animate(
      CurvedAnimation(parent: _animationController, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ScaleTransition(
      scale: _scaleAnimation,
      child: GestureDetector(
        onTapDown: (_) {
          setState(() => _isPressed = true);
          _animationController.forward();
        },
        onTapUp: (_) {
          setState(() => _isPressed = false);
          _animationController.reverse();
          Future.delayed(Duration(milliseconds: 100), () {
            Navigator.push(
              context,
              PageRouteBuilder(
                pageBuilder: (context, animation, secondaryAnimation) =>
                    DoctorChatScreen.fromDoctor(doctor: widget.doctor),
                transitionsBuilder: (context, animation, secondaryAnimation, child) {
                  return SlideTransition(
                    position: Tween<Offset>(
                      begin: Offset(1.0, 0.0),
                      end: Offset.zero,
                    ).animate(CurvedAnimation(
                      parent: animation,
                      curve: Curves.easeOutCubic,
                    )),
                    child: child,
                  );
                },
                transitionDuration: Duration(milliseconds: 300),
              ),
            );
          });
        },
        onTapCancel: () {
          setState(() => _isPressed = false);
          _animationController.reverse();
        },
        child: Container(
          padding: EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            boxShadow: [
              BoxShadow(
                color: _isPressed
                    ? Color(0xFF667eea).withOpacity(0.2)
                    : Colors.black.withOpacity(0.05),
                blurRadius: _isPressed ? 15 : 8,
                offset: Offset(0, _isPressed ? 8 : 4),
              ),
            ],
            border: Border.all(
              color: _isPressed
                  ? Color(0xFF667eea).withOpacity(0.3)
                  : Colors.transparent,
              width: 1,
            ),
          ),
          child: Row(
            children: [
              Stack(
                children: [
                  Container(
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: LinearGradient(
                        colors: [Color(0xFF667eea), Color(0xFF764ba2)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: Color(0xFF667eea).withOpacity(0.3),
                          blurRadius: 8,
                          offset: Offset(0, 4),
                        ),
                      ],
                    ),
                    padding: EdgeInsets.all(2),
                    child: CircleAvatar(
                      radius: 28,
                      backgroundColor: Colors.white,
                      child: CircleAvatar(
                        radius: 26,
                        backgroundImage: NetworkImage(widget.doctor.imageUrl),
                      ),
                    ),
                  ),
                  if (widget.doctor.isOnline)
                    Positioned(
                      bottom: 0,
                      right: 0,
                      child: Container(
                        width: 16,
                        height: 16,
                        decoration: BoxDecoration(
                          color: Color(0xFF00D2FF),
                          shape: BoxShape.circle,
                          border: Border.all(color: Colors.white, width: 3),
                          boxShadow: [
                            BoxShadow(
                              color: Color(0xFF00D2FF).withOpacity(0.4),
                              blurRadius: 4,
                            ),
                          ],
                        ),
                      ),
                    ),
                ],
              ),
              SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      widget.doctor.name,
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w600,
                        color: Color(0xFF2D3436),
                      ),
                    ),
                    SizedBox(height: 4),
                    Text(
                      widget.lastMessage ?? "Tap to start chatting",
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontSize: 14,
                        color: Color(0xFF636E72),
                      ),
                    ),
                    SizedBox(height: 4),
                    Row(
                      children: [
                        Container(
                          padding: EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(
                            color: widget.doctor.isOnline
                                ? Color(0xFF00D2FF).withOpacity(0.1)
                                : Colors.grey.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Text(
                            widget.doctor.isOnline ? 'Online' : 'Offline',
                            style: TextStyle(
                              fontSize: 12,
                              color: widget.doctor.isOnline
                                  ? Color(0xFF00D2FF)
                                  : Colors.grey[600],
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    '12:30 PM',
                    style: TextStyle(
                      color: Color(0xFF636E72),
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  SizedBox(height: 8),
                  if (widget.index == 0)
                    Container(
                      width: 8,
                      height: 8,
                      decoration: BoxDecoration(
                        color: Color(0xFFFF6B6B),
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: Color(0xFFFF6B6B).withOpacity(0.4),
                            blurRadius: 4,
                          ),
                        ],
                      ),
                    ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}