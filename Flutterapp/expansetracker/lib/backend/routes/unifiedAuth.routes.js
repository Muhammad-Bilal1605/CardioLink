// unifiedAuth.routes.js
import express from "express";
import { 
  patientSignup, 
  ambulanceEmployerSignup, 
  patientLogin, 
  ambulanceEmployerLogin, 
  universalLogout 
} from "../controllers/unified.auth.controller.js";

const router = express.Router();

// SIGNUP ROUTES
router.post("/patient/signup", patientSignup);
router.post("/ambulance-employer/signup", ambulanceEmployerSignup);

// LOGIN ROUTES  
router.post("/patient/login", patientLogin);
router.post("/ambulance-employer/login", ambulanceEmployerLogin);

// LOGOUT ROUTE (universal)
router.post("/logout", universalLogout);

export default router;