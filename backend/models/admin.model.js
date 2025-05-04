import { User } from "./user.model.js";
import mongoose from "mongoose";

export const Admin = User.discriminator(
    "admin",
    new mongoose.Schema({})
  );
  