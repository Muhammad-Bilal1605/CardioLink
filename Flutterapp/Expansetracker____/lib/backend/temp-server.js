import express from "express";
import cors from "cors";
import bcryptjs from "bcryptjs";

const app = express();
const PORT = 5001;

// In-memory storage (temporary for testing)
const users = new Map();

// Middleware
app.use(cors());
app.use(express.json());

// Simple signup endpoint for testing
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password, name, role, phoneNumber, gender, age, dateOfBirth, bloodType, allergies, emergencyContact } = req.body;
    
    console.log('Signup request received:', { email, name, role });
    
    // Check if user exists
    if (users.has(email)) {
      return res.status(400).json({ success: false, message: "User already exists" });
    }
    
    // Hash password
    const hashedPassword = await bcryptjs.hash(password, 10);
    
    // Create user object
    const user = {
      id: Date.now().toString(),
      email,
      password: hashedPassword,
      name,
      role: role || 'patient',
      phoneNumber,
      gender,
      age,
      dateOfBirth,
      bloodType,
      allergies,
      emergencyContact,
      isVerified: true, // Skip verification for testing
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Store user
    users.set(email, user);
    
    console.log('User created successfully:', email);
    
    // Return success response
    res.status(201).json({
      success: true,
      message: "User created successfully",
      user: {
        ...user,
        password: undefined // Don't send password back
      }
    });
    
  } catch (error) {
    console.error('Signup error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

// Simple login endpoint for testing
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    
    console.log('Login request received:', { email, role });
    
    // Find user
    const user = users.get(email);
    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid credentials" });
    }
    
    // Check role if provided
    if (role && role !== user.role) {
      return res.status(400).json({ success: false, message: "Role mismatch" });
    }
    
    // Check password
    const isPasswordValid = await bcryptjs.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ success: false, message: "Invalid credentials" });
    }
    
    console.log('Login successful:', email);
    
    // Return success response
    res.status(200).json({
      success: true,
      message: "Logged in successfully",
      user: {
        ...user,
        password: undefined // Don't send password back
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running', users: users.size });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Temporary server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔐 Auth endpoints ready: /api/auth/signup, /api/auth/login`);
});
