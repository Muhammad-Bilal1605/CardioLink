/*import mongoose from "mongoose";

let patientConnection = null;

export const connectPatientDB = async () => {
  try {
    if (patientConnection) {
      console.log("Using existing patient database connection");
      return patientConnection;
    }

    const patientMongoURI = process.env.PATIENT_MONGO_URI || process.env.MONGO_URI;
    if (!patientMongoURI) {
      throw new Error("No MongoDB URI found in environment variables");
    }

    console.log("Connecting to Patient Database...");
    patientConnection = await mongoose.createConnection(patientMongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    patientConnection.on('connected', () => {
      console.log("✅ Patient Database Connected Successfully");
    });

    patientConnection.on('error', (err) => {
      console.error("❌ Patient Database Connection Error:", err);
    });

    patientConnection.on('disconnected', () => {
      console.log("⚠️ Patient Database Disconnected");
    });

    return patientConnection;
  } catch (error) {
    console.error("❌ Failed to connect to Patient Database:", error);
    process.exit(1);
  }
};

export const getPatientModel = async () => {
  try {
    const connection = await connectPatientDB();
    if (!connection.models.Patient) {
      const { Patient } = await import('../models/Patient.js');
      return connection.model('Patient', Patient.schema);
    }
    return connection.model('Patient');
  } catch (error) {
    console.error("❌ Error getting Patient model:", error);
    throw error;
  }
};*/