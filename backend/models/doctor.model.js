import { User } from "./user.model.js";
import mongoose from "mongoose";


export const Doctor = User.discriminator(
    "doctor",
    new mongoose.Schema({
      specialty: { type: String, required: true },
      department: { type: String, required: true },
      licenseNumber: { type: String, required: true, unique: true },
      employeeId: { type: String, unique: true, sparse: true },
      yearsOfExperience: { type: Number, min: 0 },
      qualifications: [{ type: String }]
    })
  );
  