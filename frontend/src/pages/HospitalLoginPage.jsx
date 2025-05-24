import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, Loader, Hospital, ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Input from "../components/Input";
import { useAuthStore } from "../store/authStore";

const HospitalLoginPage = () => {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [role, setRole] = useState("hospital-admin");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState("");

	const navigate = useNavigate();
	const { hospitalAdminLogin, login } = useAuthStore();

	// Role options for hospital personnel
	const roleOptions = [
		{ value: "hospital-admin", label: "Hospital Administrator" },
		{ value: "doctor", label: "Doctor" },
		{ value: "radiologist", label: "Radiologist" },
		{ value: "lab-technologist", label: "Lab Technologist" },
		{ value: "hospital-front-desk", label: "Front Desk Staff" }
	];

	const handleLogin = async (e) => {
		e.preventDefault();
		setIsLoading(true);
		setError("");

		try {
			if (role === "hospital-admin") {
				// Hospital admin login
				await hospitalAdminLogin(email, password);
				navigate("/hospital-admin-dashboard");
			} else {
				// Regular hospital personnel login
				await login(email, password, role);
				
				// Navigate based on user role
				switch (role) {
					case "doctor":
						navigate("/doctor-dashboard");
						break;
					case "radiologist":
						navigate("/radiologist-dashboard");
						break;
					case "lab-technologist":
						navigate("/lab-technologist-dashboard");
						break;
					case "hospital-front-desk":
						navigate("/hospital-front-desk-dashboard");
						break;
					default:
						navigate("/dashboard");
				}
			}
		} catch (error) {
			setError("Invalid credentials or insufficient permissions");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-green-900 via-emerald-800 to-teal-700 flex items-center justify-center relative overflow-hidden">
			{/* Background Animation */}
			<div className="absolute inset-0">
				<div className="absolute top-0 left-1/4 w-32 h-32 rounded-full bg-emerald-400 filter blur-3xl opacity-20 animate-float1"></div>
				<div className="absolute top-1/3 right-1/4 w-40 h-40 rounded-full bg-teal-400 filter blur-3xl opacity-15 animate-float2"></div>
				<div className="absolute bottom-1/4 left-1/3 w-48 h-48 rounded-full bg-green-400 filter blur-3xl opacity-15 animate-float3"></div>
			</div>

			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5 }}
				className="max-w-md w-full bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl overflow-hidden border border-white/20 relative z-10"
			>
				<div className="p-8">
					{/* Header */}
					<div className="text-center mb-8">
						<div className="flex justify-center mb-4">
							<div className="bg-emerald-500/20 p-3 rounded-full">
								<Hospital className="h-8 w-8 text-emerald-300" />
							</div>
						</div>
						<h2 className="text-3xl font-bold text-white mb-2">Hospital Portal</h2>
						<p className="text-emerald-200">Login to access your hospital dashboard</p>
					</div>

					{/* Login Form */}
					<form onSubmit={handleLogin} className="space-y-6">
						<Input
							icon={Mail}
							type="email"
							placeholder="Email Address"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							className="bg-white/10 border-white/20 text-white placeholder-emerald-200"
						/>

						{/* Role Selector */}
						<div className="space-y-2">
							<label className="block text-sm font-medium text-emerald-200">
								Select Role
							</label>
							<select
								value={role}
								onChange={(e) => setRole(e.target.value)}
								className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
							>
								{roleOptions.map((option) => (
									<option key={option.value} value={option.value} className="bg-emerald-800 text-white">
										{option.label}
									</option>
								))}
							</select>
						</div>

						<Input
							icon={Lock}
							type="password"
							placeholder="Password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							className="bg-white/10 border-white/20 text-white placeholder-emerald-200"
						/>

						{error && (
							<motion.div
								initial={{ opacity: 0, y: -10 }}
								animate={{ opacity: 1, y: 0 }}
								className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg"
							>
								{error}
							</motion.div>
						)}

						<motion.button
							whileHover={{ scale: 1.02 }}
							whileTap={{ scale: 0.98 }}
							className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-lg transition duration-200 flex items-center justify-center"
							type="submit"
							disabled={isLoading}
						>
							{isLoading ? (
								<Loader className="w-6 h-6 animate-spin" />
							) : (
								"Sign In"
							)}
						</motion.button>
					</form>

					{/* Additional Links */}
					<div className="mt-6 text-center space-y-3">
						<Link
							to="/forgot-password"
							className="text-emerald-300 hover:text-emerald-200 text-sm transition-colors"
						>
							Forgot your password?
						</Link>
						
						<div className="border-t border-white/20 pt-4">
							<p className="text-emerald-200 text-sm mb-3">
								Need to register your hospital?
							</p>
							<Link
								to="/hospital-registration"
								className="inline-flex items-center text-emerald-300 hover:text-emerald-200 text-sm transition-colors"
							>
								Register Hospital
							</Link>
						</div>
					</div>

					{/* Back to Home */}
					<div className="mt-6 pt-4 border-t border-white/20">
						<Link
							to="/"
							className="flex items-center justify-center text-emerald-300 hover:text-emerald-200 text-sm transition-colors"
						>
							<ArrowLeft className="w-4 h-4 mr-2" />
							Back to Home
						</Link>
					</div>
				</div>
			</motion.div>

			{/* Role Information */}
			<motion.div
				initial={{ opacity: 0, x: 20 }}
				animate={{ opacity: 1, x: 0 }}
				transition={{ duration: 0.5, delay: 0.2 }}
				className="hidden lg:block absolute right-8 top-1/2 transform -translate-y-1/2 bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 max-w-sm"
			>
				<h3 className="text-white font-semibold mb-4">Hospital Portal Access</h3>
				<div className="space-y-3 text-sm">
					<div className="flex items-center text-emerald-200">
						<div className="w-2 h-2 bg-emerald-400 rounded-full mr-3"></div>
						Hospital Administrators
					</div>
					<div className="flex items-center text-emerald-200">
						<div className="w-2 h-2 bg-emerald-400 rounded-full mr-3"></div>
						Doctors & Specialists
					</div>
					<div className="flex items-center text-emerald-200">
						<div className="w-2 h-2 bg-emerald-400 rounded-full mr-3"></div>
						Radiologists
					</div>
					<div className="flex items-center text-emerald-200">
						<div className="w-2 h-2 bg-emerald-400 rounded-full mr-3"></div>
						Lab Technologists
					</div>
					<div className="flex items-center text-emerald-200">
						<div className="w-2 h-2 bg-emerald-400 rounded-full mr-3"></div>
						Front Desk Staff
					</div>
				</div>
				<div className="mt-4 pt-4 border-t border-white/20">
					<p className="text-emerald-200 text-xs">
						Select your role above to access the appropriate dashboard
					</p>
				</div>
			</motion.div>
		</div>
	);
};

export default HospitalLoginPage; 