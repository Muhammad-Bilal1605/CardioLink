import { User } from "./user.model.js";
import mongoose from "mongoose";

export const HospitalAdmin = User.discriminator(
    "hospital-admin",
    new mongoose.Schema({
      hospitalName: { type: String },
    })
  );
  