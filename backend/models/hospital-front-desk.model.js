import { User } from "./user.model.js";
import mongoose from "mongoose";

export const HospitalFrontDesk = User.discriminator(
    "hospital-front-desk",
    new mongoose.Schema({
      employeeId: { type: String, unique: true, sparse: true },
      department: { type: String, default: "Front Desk" },
      shift: { type: String, enum: ["Morning", "Evening", "Night"], default: "Morning" },
      accessLevel: { type: String, enum: ["Basic", "Advanced"], default: "Basic" }
    })
); 