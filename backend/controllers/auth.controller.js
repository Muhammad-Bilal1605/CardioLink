import bcryptjs from "bcryptjs";
import crypto from "crypto";
import { Admin } from "../models/admin.model.js";
import { Pharmacist } from "../models/pharmacist.model.js";
import { HospitalAdmin } from "../models/hospital-admin.model.js";
import { Doctor } from "../models/doctor.model.js";
import { Radiologist } from "../models/radiologist.model.js";
import { LabTechnologist } from "../models/lab-technologist.model.js";
import { HospitalFrontDesk } from "../models/hospital-front-desk.model.js";
import Hospital from "../models/Hospital.js";

import { generateTokenAndSetCookie } from "../utils/generateTokenAndSetCookie.js";
import {
	sendPasswordResetEmail,
	sendResetSuccessEmail,
	sendVerificationEmail,
	sendWelcomeEmail,
} from "../mailtrap/emails.js";
import { User } from "../models/user.model.js";

export const signup = async (req, res) => {
	const { email, password, name, role } = req.body; // Expecting role in the request body

	try {
		// Validate that all required fields are provided
		if (!email || !password || !name || !role) {
			throw new Error("All fields are required");
		}

		// Ensure the role is valid (from a predefined set of roles)
		const validRoles = ["admin", "pharmacist", "hospital-admin", "radiologist", "lab-technologist", "doctor", "hospital-front-desk"];
		if (!validRoles.includes(role)) {
			throw new Error("Invalid role provided");
		}

		// Check if a user with the given email already exists
		const userAlreadyExists = await User.findOne({ email });
		if (userAlreadyExists) {
			return res.status(400).json({ success: false, message: "User already exists" });
		}

		// Hash the password
		const hashedPassword = await bcryptjs.hash(password, 10);

		// Create a verification token
		const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();

		// Create a new user based on the role
		let user;
		switch (role) {
			case "admin":
				user = new Admin({ email, password: hashedPassword, name, verificationToken, verificationTokenExpiresAt: Date.now() + 24 * 60 * 60 * 1000 });
				break;
			case "pharmacist":
				user = new Pharmacist({ email, password: hashedPassword, name, verificationToken, verificationTokenExpiresAt: Date.now() + 24 * 60 * 60 * 1000 });
				break;
			case "hospital-admin":
				user = new HospitalAdmin({ email, password: hashedPassword, name, verificationToken, verificationTokenExpiresAt: Date.now() + 24 * 60 * 60 * 1000 });
				break;
			case "doctor":
				user = new Doctor({ email, password: hashedPassword, name, verificationToken, verificationTokenExpiresAt: Date.now() + 24 * 60 * 60 * 1000 });
				break;
			case "radiologist":
				user = new Radiologist({ email, password: hashedPassword, name, verificationToken, verificationTokenExpiresAt: Date.now() + 24 * 60 * 60 * 1000 });
				break;
			case "lab-technologist":
				user = new LabTechnologist({ email, password: hashedPassword, name, verificationToken, verificationTokenExpiresAt: Date.now() + 24 * 60 * 60 * 1000 });
				break;
			case "hospital-front-desk":
				user = new HospitalFrontDesk({ email, password: hashedPassword, name, verificationToken, verificationTokenExpiresAt: Date.now() + 24 * 60 * 60 * 1000 });
				break;
			default:
				throw new Error("Invalid role provided");
		}

		// Save the new user to the database
		await user.save();

		// Generate a token and set a cookie for the user
		generateTokenAndSetCookie(res, user._id);

		// Send the verification email with the token
		await sendVerificationEmail(user.email, verificationToken);

		// Send the response
		res.status(201).json({
			success: true,
			message: "User created successfully",
			user: {
				...user._doc,
				password: undefined, // Exclude the password from the response
			},
		});
	} catch (error) {
		// Handle errors
		res.status(400).json({ success: false, message: error.message });
	}
};

export const verifyEmail = async (req, res) => {
	const { code } = req.body;
	try {
		const user = await User.findOne({
			verificationToken: code,
			verificationTokenExpiresAt: { $gt: Date.now() },
		});

		if (!user) {
			return res.status(400).json({ success: false, message: "Invalid or expired verification code" });
		}

		user.isVerified = true;
		user.verificationToken = undefined;
		user.verificationTokenExpiresAt = undefined;
		await user.save();

		await sendWelcomeEmail(user.email, user.name);

		res.status(200).json({
			success: true,
			message: "Email verified successfully",
			user: {
				...user._doc,
				password: undefined,
			},
		});
	} catch (error) {
		console.log("error in verifyEmail ", error);
		res.status(500).json({ success: false, message: "Server error" });
	}
};

export const login = async (req, res) => {
	const { email, password, role } = req.body; // Now also expecting role in the request body
	try {
		// Find the user by email
		const user = await User.findOne({ email });
		if (!user) {
			return res.status(400).json({ success: false, message: "Invalid credentials" });
		}

		// Check if the provided role matches the user's role
		if (role && role !== user.role) {
			return res.status(400).json({ success: false, message: "Role mismatch" });
		}

		// Compare the password
		const isPasswordValid = await bcryptjs.compare(password, user.password);
		if (!isPasswordValid) {
			return res.status(400).json({ success: false, message: "Invalid credentials" });
		}

		// Generate token and set cookie
		generateTokenAndSetCookie(res, user._id);

		// Update last login date
		user.lastLogin = new Date();
		await user.save();

		// Return the success response with the user data excluding the password
		res.status(200).json({
			success: true,
			message: "Logged in successfully",
			user: {
				...user._doc,
				password: undefined,
			},
		});
	} catch (error) {
		console.log("Error in login ", error);
		res.status(400).json({ success: false, message: error.message });
	}
};

export const logout = async (req, res) => {
	res.clearCookie("token");
	res.status(200).json({ success: true, message: "Logged out successfully" });
};

export const forgotPassword = async (req, res) => {
	const { email } = req.body;
	try {
		const user = await User.findOne({ email });

		if (!user) {
			return res.status(400).json({ success: false, message: "User not found" });
		}

		// Generate reset token
		const resetToken = crypto.randomBytes(20).toString("hex");
		const resetTokenExpiresAt = Date.now() + 1 * 60 * 60 * 1000; // 1 hour

		user.resetPasswordToken = resetToken;
		user.resetPasswordExpiresAt = resetTokenExpiresAt;

		await user.save();

		// send email
		await sendPasswordResetEmail(user.email, `${process.env.CLIENT_URL}/reset-password/${resetToken}`);

		res.status(200).json({ success: true, message: "Password reset link sent to your email" });
	} catch (error) {
		console.log("Error in forgotPassword ", error);
		res.status(400).json({ success: false, message: error.message });
	}
};

export const resetPassword = async (req, res) => {
	try {
		const { token } = req.params;
		const { password } = req.body;

		const user = await User.findOne({
			resetPasswordToken: token,
			resetPasswordExpiresAt: { $gt: Date.now() },
		});

		if (!user) {
			return res.status(400).json({ success: false, message: "Invalid or expired reset token" });
		}

		// update password
		const hashedPassword = await bcryptjs.hash(password, 10);

		user.password = hashedPassword;
		user.resetPasswordToken = undefined;
		user.resetPasswordExpiresAt = undefined;
		await user.save();

		await sendResetSuccessEmail(user.email);

		res.status(200).json({ success: true, message: "Password reset successful" });
	} catch (error) {
		console.log("Error in resetPassword ", error);
		res.status(400).json({ success: false, message: error.message });
	}
};

export const checkAuth = async (req, res) => {
	try {
		const user = await User.findById(req.userId).select("-password");
		if (!user) {
			return res.status(400).json({ success: false, message: "User not found" });
		}

		res.status(200).json({ success: true, user });
	} catch (error) {
		console.log("Error in checkAuth ", error);
		res.status(400).json({ success: false, message: error.message });
	}
};

// Hospital Admin Login (after hospital approval)
export const hospitalAdminLogin = async (req, res) => {
	const { email, password } = req.body;
	try {
		// Find the hospital by admin email
		const hospital = await Hospital.findOne({ 
			'administrativeContact.emailAddress': email,
			status: 'Approved'
		});
		
		if (!hospital) {
			return res.status(400).json({ 
				success: false, 
				message: "Hospital not found or not approved" 
			});
		}

		// Compare the password
		const isPasswordValid = await bcryptjs.compare(password, hospital.administrativeContact.password);
		if (!isPasswordValid) {
			return res.status(400).json({ success: false, message: "Invalid credentials" });
		}

		// Check if hospital admin user exists, if not create one
		let hospitalAdmin = await HospitalAdmin.findOne({ email });
		if (!hospitalAdmin) {
			hospitalAdmin = new HospitalAdmin({
				email: hospital.administrativeContact.emailAddress,
				password: hospital.administrativeContact.password,
				name: hospital.administrativeContact.fullName,
				hospitalId: hospital._id,
				designation: hospital.administrativeContact.designation,
				isVerified: true
			});
			await hospitalAdmin.save();
		}

		// Generate token and set cookie
		generateTokenAndSetCookie(res, hospitalAdmin._id);

		// Update last login date
		hospitalAdmin.lastLogin = new Date();
		await hospitalAdmin.save();

		// Return the success response
		res.status(200).json({
			success: true,
			message: "Logged in successfully",
			user: {
				...hospitalAdmin._doc,
				password: undefined,
				hospitalName: hospital.hospitalName
			},
		});
	} catch (error) {
		console.log("Error in hospital admin login ", error);
		res.status(400).json({ success: false, message: error.message });
	}
};

// Add Hospital Personnel (only hospital admin can do this)
export const addHospitalPersonnel = async (req, res) => {
	const { email, password, name, role, ...additionalFields } = req.body;
	
	try {
		// Verify that the requester is a hospital admin
		const requester = await User.findById(req.userId);
		if (!requester || requester.role !== 'hospital-admin') {
			return res.status(403).json({ 
				success: false, 
				message: "Only hospital administrators can add personnel" 
			});
		}

		// Validate that all required fields are provided
		if (!email || !password || !name || !role) {
			throw new Error("All fields are required");
		}

		// Ensure the role is valid for hospital personnel
		const validHospitalRoles = ["doctor", "radiologist", "lab-technologist", "hospital-front-desk"];
		if (!validHospitalRoles.includes(role)) {
			throw new Error("Invalid role for hospital personnel");
		}

		// Check if a user with the given email already exists
		const userAlreadyExists = await User.findOne({ email });
		if (userAlreadyExists) {
			return res.status(400).json({ success: false, message: "User already exists" });
		}

		// Hash the password
		const hashedPassword = await bcryptjs.hash(password, 10);

		// Create a new user based on the role
		let user;
		const baseUserData = {
			email,
			password: hashedPassword,
			name,
			hospitalId: requester.hospitalId,
			isVerified: true // Hospital personnel are pre-verified
		};

		switch (role) {
			case "doctor":
				const { specialty, department, licenseNumber, employeeId, yearsOfExperience, qualifications } = additionalFields;
				if (!specialty || !department || !licenseNumber) {
					throw new Error("Specialty, department, and license number are required for doctors");
				}
				user = new Doctor({
					...baseUserData,
					specialty,
					department,
					licenseNumber,
					employeeId,
					yearsOfExperience,
					qualifications: qualifications || []
				});
				break;
			
			case "radiologist":
				const { licenseNumber: radLicense, employeeId: radEmployeeId, specializations: radSpecs, yearsOfExperience: radExp } = additionalFields;
				if (!radLicense) {
					throw new Error("License number is required for radiologists");
				}
				user = new Radiologist({
					...baseUserData,
					licenseNumber: radLicense,
					employeeId: radEmployeeId,
					specializations: radSpecs || [],
					yearsOfExperience: radExp
				});
				break;
			
			case "lab-technologist":
				const { certificationNumber, employeeId: labEmployeeId, specializations: labSpecs, yearsOfExperience: labExp } = additionalFields;
				if (!certificationNumber) {
					throw new Error("Certification number is required for lab technologists");
				}
				user = new LabTechnologist({
					...baseUserData,
					certificationNumber,
					employeeId: labEmployeeId,
					specializations: labSpecs || [],
					yearsOfExperience: labExp
				});
				break;
			
			case "hospital-front-desk":
				const { employeeId: deskEmployeeId, shift, accessLevel } = additionalFields;
				user = new HospitalFrontDesk({
					...baseUserData,
					employeeId: deskEmployeeId,
					shift: shift || "Morning",
					accessLevel: accessLevel || "Basic"
				});
				break;
			
			default:
				throw new Error("Invalid role provided");
		}

		// Save the new user to the database
		await user.save();

		// Send the response
		res.status(201).json({
			success: true,
			message: "Hospital personnel added successfully",
			user: {
				...user._doc,
				password: undefined,
			},
		});
	} catch (error) {
		// Handle errors
		res.status(400).json({ success: false, message: error.message });
	}
};

// Get Hospital Personnel (for hospital admin dashboard)
export const getHospitalPersonnel = async (req, res) => {
	try {
		// Verify that the requester is a hospital admin
		const requester = await User.findById(req.userId);
		if (!requester || requester.role !== 'hospital-admin') {
			return res.status(403).json({ 
				success: false, 
				message: "Only hospital administrators can view personnel" 
			});
		}

		// Get all personnel for this hospital
		const personnel = await User.find({ 
			hospitalId: requester.hospitalId,
			role: { $in: ["doctor", "radiologist", "lab-technologist", "hospital-front-desk"] }
		}).select('-password');

		res.status(200).json({
			success: true,
			personnel
		});
	} catch (error) {
		console.log("Error in getting hospital personnel ", error);
		res.status(500).json({ success: false, message: "Server error" });
	}
};
