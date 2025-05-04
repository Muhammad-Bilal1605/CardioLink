import { User } from "./user.model.js";
import mongoose from "mongoose";

export const Pharmacist = User.discriminator(
    "pharmacist",
    new mongoose.Schema({})
  );
  