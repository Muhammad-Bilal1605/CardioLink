import express from "express";
import { getAllDoctors, getDoctorById, getDoctorsBySpecialty } from "../controllers/doctor.controller.js";

const router = express.Router();

// Get all doctors
router.get("/", getAllDoctors);

// Get doctor by ID
router.get("/:doctorId", getDoctorById);

// Get doctors by specialty
router.get("/specialty/:specialty", getDoctorsBySpecialty);

export default router;
