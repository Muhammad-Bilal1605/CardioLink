// C:\Users\PMLS\Desktop\CardioLink\CardioLink\Flutterapp\expansetracker\lib\cardio\new_videocall_screen.dart

import 'package:flutter/material.dart';
import 'package:agora_rtc_engine/agora_rtc_engine.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

class NewVideocallScreen extends StatefulWidget {
  const NewVideocallScreen({Key? key}) : super(key: key);

  @override
  State<NewVideocallScreen> createState() => _NewVideocallScreenState();
}

class _NewVideocallScreenState extends State<NewVideocallScreen> {
  final String appId = '88a403916325401a8e5f04beff756692';
  final String baseUrl = 'http://192.168.1.4:5001/api/videocall';
  
  RtcEngine? _engine;
  bool _isJoined = false;
  bool _isMuted = false;
  bool _isVideoOff = false;
  int? _remoteUid;
  String _channelName = '';
  final TextEditingController _channelController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _initAgora();
  }

  Future<void> _initAgora() async {
    await [Permission.microphone, Permission.camera].request();

    _engine = createAgoraRtcEngine();
    await _engine!.initialize(RtcEngineContext(appId: appId));

    _engine!.registerEventHandler(
      RtcEngineEventHandler(
        onJoinChannelSuccess: (RtcConnection connection, int elapsed) {
          setState(() {
            _isJoined = true;
          });
        },
        onUserJoined: (RtcConnection connection, int remoteUid, int elapsed) {
          setState(() {
            _remoteUid = remoteUid;
          });
        },
        onUserOffline: (RtcConnection connection, int remoteUid, UserOfflineReasonType reason) {
          setState(() {
            _remoteUid = null;
          });
        },
      ),
    );

    await _engine!.enableVideo();
    await _engine!.startPreview();
  }

  Future<void> _joinChannel() async {
    if (_channelController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter channel name')),
      );
      return;
    }

    try {
      final response = await http.post(
        Uri.parse('$baseUrl/generate-token'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'channelName': _channelController.text,
          'uid': 0,
        }),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        await _engine!.joinChannel(
          token: data['token'],
          channelId: data['channelName'],
          uid: data['uid'],
          options: const ChannelMediaOptions(
            channelProfile: ChannelProfileType.channelProfileCommunication,
            clientRoleType: ClientRoleType.clientRoleBroadcaster,
          ),
        );
        setState(() {
          _channelName = data['channelName'];
        });
      }
    } catch (e) {
      print('Error joining channel: $e');
    }
  }

  Future<void> _leaveChannel() async {
    await _engine!.leaveChannel();
    setState(() {
      _isJoined = false;
      _remoteUid = null;
      _channelName = '';
    });
  }

  void _toggleMute() {
    setState(() {
      _isMuted = !_isMuted;
    });
    _engine!.muteLocalAudioStream(_isMuted);
  }

  void _toggleVideo() {
    setState(() {
      _isVideoOff = !_isVideoOff;
    });
    _engine!.muteLocalVideoStream(_isVideoOff);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Video Call'),
        backgroundColor: Colors.blue,
      ),
      body: _isJoined ? _buildCallScreen() : _buildJoinScreen(),
    );
  }

  Widget _buildJoinScreen() {
    return Padding(
      padding: const EdgeInsets.all(20.0),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          TextField(
            controller: _channelController,
            decoration: const InputDecoration(
              labelText: 'Enter Channel Name',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 20),
          ElevatedButton(
            onPressed: _joinChannel,
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.blue,
              padding: const EdgeInsets.symmetric(horizontal: 50, vertical: 15),
            ),
            child: const Text('Join Call', style: TextStyle(fontSize: 18)),
          ),
        ],
      ),
    );
  }

  Widget _buildCallScreen() {
    return Stack(
      children: [
        // Remote video (full screen)
        _remoteUid != null
            ? AgoraVideoView(
                controller: VideoViewController.remote(
                  rtcEngine: _engine!,
                  canvas: VideoCanvas(uid: _remoteUid),
                  connection: RtcConnection(channelId: _channelName),
                ),
              )
            : Container(
                color: Colors.black,
                child: const Center(
                  child: Text(
                    'Waiting for others to join...',
                    style: TextStyle(color: Colors.white, fontSize: 18),
                  ),
                ),
              ),
        
        // Local video (small preview)
        Positioned(
          top: 40,
          right: 20,
          child: Container(
            width: 120,
            height: 160,
            decoration: BoxDecoration(
              border: Border.all(color: Colors.white, width: 2),
              borderRadius: BorderRadius.circular(10),
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: AgoraVideoView(
                controller: VideoViewController(
                  rtcEngine: _engine!,
                  canvas: const VideoCanvas(uid: 0),
                ),
              ),
            ),
          ),
        ),
        
        // Controls
        Positioned(
          bottom: 40,
          left: 0,
          right: 0,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              FloatingActionButton(
                onPressed: _toggleMute,
                backgroundColor: _isMuted ? Colors.red : Colors.white,
                child: Icon(
                  _isMuted ? Icons.mic_off : Icons.mic,
                  color: _isMuted ? Colors.white : Colors.black,
                ),
              ),
              FloatingActionButton(
                onPressed: _toggleVideo,
                backgroundColor: _isVideoOff ? Colors.red : Colors.white,
                child: Icon(
                  _isVideoOff ? Icons.videocam_off : Icons.videocam,
                  color: _isVideoOff ? Colors.white : Colors.black,
                ),
              ),
              FloatingActionButton(
                onPressed: _leaveChannel,
                backgroundColor: Colors.red,
                child: const Icon(Icons.call_end, color: Colors.white),
              ),
            ],
          ),
        ),
      ],
    );
  }

  @override
  void dispose() {
    _engine?.leaveChannel();
    _engine?.release();
    _channelController.dispose();
    super.dispose();
  }
}