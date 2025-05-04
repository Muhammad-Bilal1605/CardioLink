import { User } from "./user.model.js";
import mongoose from "mongoose";

export const Radiologist = User.discriminator(
    "radiologist",
    new mongoose.Schema({
      imagingExpertise: String,
    })
  );
  