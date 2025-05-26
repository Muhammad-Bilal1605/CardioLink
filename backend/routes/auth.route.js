import express from "express";
import {
	login,
	logout,
	signup,
	verifyEmail,
	forgotPassword,
	resetPassword,
	checkAuth,
	hospitalAdminLogin,
	addHospitalPersonnel,
	getHospitalPersonnel,
	checkEmailExists,
} from "../controllers/auth.controller.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

router.get("/check-auth", verifyToken, checkAuth);

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);

router.post("/hospital-admin-login", hospitalAdminLogin);
router.post("/add-hospital-personnel", verifyToken, addHospitalPersonnel);
router.get("/hospital-personnel", verifyToken, getHospitalPersonnel);
router.post("/check-email", checkEmailExists);

router.post("/verify-email", verifyEmail);
router.post("/forgot-password", forgotPassword);

router.post("/reset-password/:token", resetPassword);

export default router;
