import mongoose from "mongoose";

let patientConnection = null;

export const connectPatientDB = async () => {
  try {
    if (patientConnection) {
      console.log("Patient database already connected");
      return patientConnection;
    }

    const patientMongoURI = process.env.PATIENT_MONGO_URI;
    if (!patientMongoURI) {
      throw new Error("PATIENT_MONGO_URI not found in environment variables");
    }

    console.log("Connecting to Patient Database...");
    patientConnection = await mongoose.createConnection(patientMongoURI);
    
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
