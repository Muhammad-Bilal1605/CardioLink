import { User } from "./user.model.js";
import mongoose from "mongoose";

export const HospitalFrontDesk = User.discriminator(
    "hospital-front-desk",
    new mongoose.Schema({
      department: String,
      shift: {
        type: String,
        enum: ['Day', 'Night', 'Evening'],
        default: 'Day'
      },
      hospital: String,
    })
); 