import { User } from "./user.model.js";
import mongoose from "mongoose";

export const Radiologist = User.discriminator(
    "radiologist",
    new mongoose.Schema({
      licenseNumber: { type: String, required: true, unique: true },
      employeeId: { type: String, unique: true, sparse: true },
      specializations: [{ type: String }],
      department: { type: String, default: "Radiology" },
      yearsOfExperience: { type: Number, min: 0 }
    })
  );
  