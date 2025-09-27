import { User } from "./user.model.js";
import mongoose from "mongoose";

export const LabTechnologist = User.discriminator(
    "lab-technologist",
    new mongoose.Schema({
      certificationNumber: { type: String, required: true, unique: true },
      employeeId: { type: String, unique: true, sparse: true },
      specializations: [{ type: String }],
      department: { type: String, default: "Laboratory" },
      yearsOfExperience: { type: Number, min: 0 }
    })
  );
  