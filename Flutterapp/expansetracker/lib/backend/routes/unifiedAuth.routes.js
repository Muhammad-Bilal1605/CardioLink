// unifiedAuth.routes.js
import express from "express";
import { 
  patientSignup, 
  ambulanceEmployerSignup, 
  patientLogin, 
  ambulanceEmployerLogin, 
  universalLogout,
  verifyPatientEmail,
  forgotPatientPassword,
  verifyPasswordResetCode,
  resetPatientPassword
} from "../controllers/unified.auth.controller.js";

const router = express.Router();

// SIGNUP ROUTES
router.post("/patient/signup", patientSignup);
router.post("/ambulance-employer/signup", ambulanceEmployerSignup);

// LOGIN ROUTES  
router.post("/patient/login", patientLogin);
router.post("/ambulance-employer/login", ambulanceEmployerLogin);

// VERIFICATION ROUTES
router.post("/patient/verify-email", verifyPatientEmail);

// PASSWORD RESET ROUTES
router.post("/patient/forgot-password", forgotPatientPassword);
router.post("/patient/verify-reset-code", verifyPasswordResetCode);
router.post("/patient/reset-password", resetPatientPassword);

// LOGOUT ROUTE (universal)
router.post("/logout", universalLogout);

export default router;