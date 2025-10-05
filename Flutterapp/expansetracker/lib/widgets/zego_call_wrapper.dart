// lib/widgets/zego_call_wrapper.dart
// Create this file to wrap ZegoCloud functionality

import 'package:flutter/material.dart';
import 'package:zego_uikit_prebuilt_call/zego_uikit_prebuilt_call.dart';

class ZegoCallWrapper extends StatelessWidget {
  final Widget child;
  final String userId;
  final String userName;

  const ZegoCallWrapper({
    Key? key,
    required this.child,
    required this.userId,
    required this.userName,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return ZegoUIKitPrebuiltCallMiniOverlayPage(
      contextQuery: () => context,
      child: child,
    );
  }
}

// Alternative simpler approach - just use the basic widget structure
class SimpleCallWrapper extends StatelessWidget {
  final Widget child;

  const SimpleCallWrapper({Key? key, required this.child}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return child; // For now, just return the child without ZegoCloud wrapper
  }
}