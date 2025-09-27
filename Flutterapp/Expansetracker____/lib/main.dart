import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'provider/auth_provider.dart';
import 'provider/chat_provider.dart';
import 'cardio/splash_screen.dart';
import 'services/config_service.dart';
import 'services/ip_config_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize configuration services before running the app
  await ConfigService.initialize();
  await IPConfigService().init();
  
  // Print current configuration for debugging
  ConfigService.instance.printConfig();
  
  runApp(const CardioLinkApp());
}

class CardioLinkApp extends StatelessWidget {
  const CardioLinkApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => ChatProvider()),
      ],
      child: MaterialApp(
        title: 'CardioLink',
        debugShowCheckedModeBanner: false,
        theme: ThemeData(
          primarySwatch: Colors.green,
          primaryColor: const Color(0xFF6B8E3D),
          scaffoldBackgroundColor: const Color(0xFFF8FAF5),
          textTheme: GoogleFonts.interTextTheme(),
          appBarTheme: AppBarTheme(
            elevation: 0,
            centerTitle: true,
            backgroundColor: const Color(0xFF6B8E3D),
            titleTextStyle: GoogleFonts.inter(
              fontSize: 20,
              fontWeight: FontWeight.w600,
              color: Colors.white,
            ),
          ),
        ),
        home: SplashScreen(),
      ),
    );
  }
}