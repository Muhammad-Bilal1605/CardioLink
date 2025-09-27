# Expansetracker Cardio - Flutter Patient App with MERN Backend

## Quick Start Guide

### Prerequisites
- Node.js (v16 or higher)
- Flutter SDK
- MongoDB Atlas account (already configured)

### Starting the Application

#### 1. Start Backend Server (REQUIRED FIRST)
```bash
# Navigate to project root
cd C:\Users\PMLS\Desktop\Expansetracker____

# Option A: Using batch script (recommended)
start-backend.bat

# Option B: Manual commands
cd lib\backend
npm install
npm run dev

# Option C: Using npm script from root
npm run backend
```

The server will start on port 5000 and show:
- Local access: `http://localhost:5000`
- Network access: `http://[YOUR-IP]:5000` (for Android devices)

#### 2. Start Flutter App
```bash
# In a new terminal, navigate to project root
cd C:\Users\PMLS\Desktop\Expansetracker____

# Install Flutter dependencies
flutter pub get

# Run on web (Chrome/Edge)
flutter run -d chrome

# Run on Windows
flutter run -d windows

# Run on Android device
flutter run
```

### API Endpoints
- **Base URL (Web)**: `http://localhost:5000/api`
- **Base URL (Android)**: `http://192.168.1.7:5000/api`
- **Patient Signup**: `POST /auth/signup`
- **Patient Login**: `POST /auth/login`

### Database
- **MongoDB Atlas**: Connected to `Hospitals` database
- **Patient Collection**: Stores patient data with role-based authentication

### Troubleshooting

#### Network Error: "Failed to fetch"
- **Cause**: Backend server is not running
- **Solution**: Start the backend server first (see step 1 above)

#### CORS Errors
- **Cause**: Origin not allowed
- **Solution**: Backend is configured for multiple origins, but ensure you're using the correct URL

#### Android Connection Issues
- **Cause**: Wrong IP address in Flutter app
- **Solution**: Check your computer's IP address and update if needed

### Project Structure
```
Expansetracker____/
├── lib/
│   ├── backend/          # Node.js/Express backend
│   ├── models/           # Flutter data models
│   ├── provider/         # State management
│   ├── services/         # API services
│   └── screens/          # Flutter UI screens
├── start-backend.bat     # Quick start script
└── package.json          # Root npm scripts
```

### Development Notes
- Backend runs on port 5000
- Flutter web dev server typically runs on port 8080
- Patient data is stored in the same database as other hospital users
- Authentication uses JWT tokens with role-based access
