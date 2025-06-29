import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import morgan from "morgan";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

import { connectDB } from "./db/connectDB.js";

// Import auth routes (ES6 module)
import authRoutes from "./routes/auth.route.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;
const __dirname = path.resolve();

// CORS Configuration
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware
app.use(express.json()); // allows us to parse incoming requests:req.body
app.use(cookieParser()); // allows us to parse incoming cookies
app.use(morgan('dev')); // logging middleware

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
const hospitalsDir = path.join(__dirname, 'uploads', 'hospitals');

if (!fs.existsSync(uploadsDir)) {
  try {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('Created uploads directory at:', uploadsDir);
  } catch (err) {
    console.error('Failed to create uploads directory:', err);
  }
}

if (!fs.existsSync(hospitalsDir)) {
  try {
    fs.mkdirSync(hospitalsDir, { recursive: true });
    console.log('Created hospitals directory at:', hospitalsDir);
  } catch (err) {
    console.error('Failed to create hospitals directory:', err);
  }
}

// Verify uploads directory is writable
try {
  fs.accessSync(uploadsDir, fs.constants.W_OK);
  console.log('Uploads directory is writable');
} catch (err) {
  console.error('Uploads directory is not writable:', err);
}

// Serve static files from uploads directory
console.log('Setting up static file serving...');
console.log('Uploads directory path:', uploadsDir);
console.log('Hospitals directory path:', hospitalsDir);

// Add debugging middleware for file requests
app.use('/uploads', (req, res, next) => {
  console.log('=====================================');
  console.log('File request received:', req.url);
  console.log('Request method:', req.method);
  console.log('Full request path:', req.path);
  console.log('Request headers:', req.headers);
  
  // Construct the full file path
  const filePath = path.join(__dirname, 'uploads', req.url);
  console.log('Looking for file at:', filePath);
  
  // Check if file exists
  if (fs.existsSync(filePath)) {
    console.log('✓ File exists at:', filePath);
    const stats = fs.statSync(filePath);
    console.log('File size:', stats.size, 'bytes');
    console.log('File modified:', stats.mtime);
  } else {
    console.log('✗ File NOT found at:', filePath);
    
    // List directory contents for debugging
    const dirPath = path.dirname(filePath);
    console.log('Checking directory:', dirPath);
    
    if (fs.existsSync(dirPath)) {
      console.log('Directory exists, contents:');
      try {
        const contents = fs.readdirSync(dirPath);
        contents.forEach(item => {
          const itemPath = path.join(dirPath, item);
          const stats = fs.statSync(itemPath);
          console.log(`  ${stats.isDirectory() ? '[DIR]' : '[FILE]'} ${item} (${stats.size} bytes)`);
        });
      } catch (err) {
        console.log('Error reading directory:', err.message);
      }
    } else {
      console.log('Directory does not exist');
    }
  }
  console.log('=====================================');
  next();
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/Backend/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use("/api/auth", authRoutes);

// Dynamic imports for models
const loadModels = async () => {
  try {
    await import("./models/User.js");
    await import("./models/Hospitalization.js");
    await import("./models/Imaging.js");
    await import("./models/LabResult.js");
    await import("./models/Medication.js");
    await import("./models/Visit.js");
    await import("./models/VitalSign.js");
    await import("./models/Procedure.js");
    await import("./models/Hospital.js");
    console.log('Models loaded successfully');
    return true;
  } catch (error) {
    console.error('Error loading models:', error.message);
    console.log('Models may not be available. Make sure model files exist.');
    return false;
  }
};

// Dynamic imports for routes
const loadMedicalRoutes = async () => {
  try {
    const patientRoutes = await import("./routes/patientRoutes.js");
    const imagingRoutes = await import("./routes/imagingRoutes.js");
    const labResultRoutes = await import("./routes/labResultRoutes.js");
    const visitRoutes = await import("./routes/visitRoutes.js");
    const hospitalizationRoutes = await import("./routes/hospitalizationRoutes.js");
    const procedureRoutes = await import("./routes/procedureRoutes.js");
    const medicationRoutes = await import("./routes/medicationRoutes.js");
    const vitalSignRoutes = await import("./routes/vitalSignRoutes.js");
    const hospitalRoutes = await import("./routes/hospitalRoutes.js");

    app.use('/api/patients', patientRoutes.default);
    app.use('/api/imaging', imagingRoutes.default);
    app.use('/api/lab-results', labResultRoutes.default);
    app.use('/api/visits', visitRoutes.default);
    app.use('/api/hospitalizations', hospitalizationRoutes.default);
    app.use('/api/procedures', procedureRoutes.default);
    app.use('/api/medications', medicationRoutes.default);
    app.use('/api/vital-signs', vitalSignRoutes.default);
    app.use('/api/hospitals', hospitalRoutes.default);
    
    console.log('Medical routes loaded successfully');
    return true;
  } catch (error) {
    console.error('Error loading medical routes:', error.message);
    console.log('Medical routes may not be available. Make sure route files exist.');
    return false;
  }
};

// Enhanced error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  console.error('Error stack:', err.stack);
  
  // Return specific error message in development
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  res.status(500).json({
    success: false,
    error: isDevelopment ? `${err.message}\n${err.stack}` : 'Something went wrong!'
  });
});

// Production static file serving
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "/frontend/dist")));

  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "frontend", "dist", "index.html"));
  });
}

// Initialize server
const startServer = async () => {
  try {
    // Connect to database
    await connectDB();
    
    // Load models
    const modelsLoaded = await loadModels();
    if (!modelsLoaded) {
      throw new Error('Failed to load models');
    }
    
    // Load routes
    const routesLoaded = await loadMedicalRoutes();
    if (!routesLoaded) {
      throw new Error('Failed to load routes');
    }
    
    // Start server
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();