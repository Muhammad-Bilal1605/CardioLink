import { User } from "./user.model.js";
import mongoose from "mongoose";

export const HospitalAdmin = User.discriminator(
    "hospital-admin",
    new mongoose.Schema({
      designation: { type: String, default: "Hospital Administrator" },
      department: { type: String, default: "Administration" },
      employeeId: { type: String, unique: true, sparse: true }
    })
  );
  