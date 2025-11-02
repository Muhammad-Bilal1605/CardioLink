import 'package:flutter/material.dart';
import 'package:flutter_ai_toolkit/flutter_ai_toolkit.dart';
import 'package:google_generative_ai/google_generative_ai.dart';

class MedicalChatScreen extends StatefulWidget {
  const MedicalChatScreen({super.key});

  @override
  State<MedicalChatScreen> createState() => _MedicalChatScreenState();
}

class _MedicalChatScreenState extends State<MedicalChatScreen> {
  String apiKey = "AIzaSyDB-gMpjz36M0GSN3jAQS_ocp32lU8haNc"; // IMPORTANT: Replace with your actual Gemini API Key

  @override
  void initState() {
    super.initState();
    // It's a good practice to load the API key from a secure source
    // rather than hardcoding it, especially for production apps.
    // For this demo, we'll keep it simple.
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.red[50],
        automaticallyImplyLeading: false,
        title: Row(
          children: [
            Icon(Icons.favorite, color: Colors.red[600], size: 24),
            const SizedBox(width: 8),
            Text(
              "HeartWiseAI",
              style: TextStyle(
                color: Colors.red[700],
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
        elevation: 0,
      ),
      body: LlmChatView(
        suggestions: const [
          "What are the warning signs of a heart attack?",
          "How often should I get my heart checked?",
          "What lifestyle changes can prevent heart disease?",
          "I have high blood pressure. How can I manage it?",
          "What exercises are safe for someone with heart disease?"
        ],
        style: LlmChatViewStyle(
          backgroundColor: Colors.white,
          chatInputStyle: ChatInputStyle(
            hintText: "Enter your message",
            decoration: const BoxDecoration().copyWith(
              borderRadius: BorderRadius.circular(50),
            ),
          ),
        ),
        provider: GeminiProvider(
          model: GenerativeModel(
            model: "gemini-2.0-flash",
            apiKey: apiKey,
            systemInstruction: Content.system(
              """You are HeartWiseAI, a specialized cardiac health assistant designed to provide comprehensive heart health education, prevention advice, and disease management guidance. Your role includes:

CARDIOVASCULAR EDUCATION :
- Provide detailed educational content on cardiac conditions, symptoms, and treatments
- Explain heart anatomy, function, and common disorders
- Share information about risk factors, warning signs, and when to seek medical help
- Offer insights on diagnostic procedures and treatment options

HEALTH CHECKUP REMINDERS (FR-70):
- Remind users about the importance of regular health checkups
- Suggest appropriate screening intervals based on age, risk factors, and medical history
- Recommend specific cardiac tests and monitoring schedules
- Emphasize preventive care and early detection

PERSONALIZED PREVENTION ADVICE :
- Analyze user health data to provide tailored heart disease prevention tips
- Offer lifestyle recommendations including diet, exercise, and stress management
- Provide smoking cessation and alcohol moderation guidance
- Suggest specific preventive measures based on individual risk factors

DISEASE MANAGEMENT GUIDANCE :
- Provide step-by-step guidance for managing heart disease
- Offer medication adherence strategies and side effect management
- Share lifestyle adjustment recommendations for cardiac patients
- Provide emergency response guidance and when to contact healthcare providers

IMPORTANT GUIDELINES:
- Always emphasize that your advice supplements, not replaces, professional medical care
- Encourage users to consult with certified cardiologists for serious concerns
- Provide evidence-based information from reputable medical sources
- Maintain a supportive, encouraging tone while being medically accurate
- If asked about non-cardiac topics, politely redirect to heart health or suggest consulting appropriate specialists

Remember: You are a cardiac health specialist focused on heart wellness, prevention, and management.""",
            ),
          ),
        ),
        welcomeMessage:
        "🫀 Welcome to HeartWiseAI! I'm your specialized cardiac health assistant. I can help you with:\n\n• Heart health education and cardiac conditions\n• Personalized prevention advice\n• Disease management guidance\n• Health checkup reminders\n\nHow can I assist you with your heart health today?"
      ),
    );
  }
}

