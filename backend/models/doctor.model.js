import { User } from "./user.model.js";
import mongoose from "mongoose";


export const Doctor = User.discriminator(
    "doctor",
    new mongoose.Schema({
      specialty: String,
      department: String,
    })
  );
  