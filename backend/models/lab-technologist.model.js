import { User } from "./user.model.js";
import mongoose from "mongoose";

export const LabTechnologist = User.discriminator(
    "lab-technologist",
    new mongoose.Schema({
      labDepartment: String,
    })
  );
  