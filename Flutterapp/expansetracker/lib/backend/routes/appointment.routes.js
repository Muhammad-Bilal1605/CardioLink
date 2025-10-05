import express from "express";
import { 
  createAppointment, 
  getPatientAppointments, 
  getDoctorAppointments,
  cancelAppointment,
  getChatableAppointments,
  getAppointmentById
} from "../controllers/appointment.controller.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// Create appointment
router.post("/", createAppointment);

// Get patient's appointments
router.get("/patient", getPatientAppointments);

// Get doctor's appointments  
router.get("/doctor", getDoctorAppointments);

// Get appointments for chat
router.get("/chat", getChatableAppointments);

// Get specific appointment
router.get("/:appointmentId", getAppointmentById);

// Cancel appointment
router.patch("/:appointmentId/cancel", cancelAppointment);

export default router;
