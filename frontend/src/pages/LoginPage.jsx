import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, Loader, Heart, User, Stethoscope, Package, UserPlus, Activity, TestTube } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const { login, isLoading, error } = useAuthStore();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!role) {
      // Show error if no role is selected
      return;
    }
    await login(email, password, role);
  };

  const roles = [
    { 
      id: "admin", 
      icon: <User className="h-5 w-5" />, 
      color: "blue", 
      description: "System controls" 
    },
    { 
      id: "doctor", 
      icon: <Stethoscope className="h-5 w-5" />, 
      color: "green", 
      description: "Patient care" 
    },
    { 
      id: "pharmacist", 
      icon: <Package className="h-5 w-5" />, 
      color: "purple", 
      description: "Medication management" 
    },
    { 
      id: "hospital-admin", 
      icon: <UserPlus className="h-5 w-5" />, 
      color: "indigo", 
      description: "Hospital management" 
    },
    { 
      id: "radiologist", 
      icon: <Activity className="h-5 w-5" />, 
      color: "red", 
      description: "Imaging specialist" 
    },
    { 
      id: "lab-technologist", 
      icon: <TestTube className="h-5 w-5" />, 
      color: "yellow", 
      description: "Laboratory tests" 
    }
  ];

  const colorMap = {
    blue: {
      bg: "bg-blue-100", border: "border-blue-600", text: "text-blue-600",
      activeBg: "bg-blue-600", activeText: "text-white"
    },
    green: {
      bg: "bg-green-100", border: "border-green-600", text: "text-green-600",
      activeBg: "bg-green-600", activeText: "text-white"
    },
    purple: {
      bg: "bg-purple-100", border: "border-purple-600", text: "text-purple-600",
      activeBg: "bg-purple-600", activeText: "text-white"
    },
    indigo: {
      bg: "bg-indigo-100", border: "border-indigo-600", text: "text-indigo-600",
      activeBg: "bg-indigo-600", activeText: "text-white"
    },
    red: {
      bg: "bg-red-100", border: "border-red-600", text: "text-red-600",
      activeBg: "bg-red-600", activeText: "text-white"
    },
    yellow: {
      bg: "bg-yellow-100", border: "border-yellow-600", text: "text-yellow-600",
      activeBg: "bg-yellow-600", activeText: "text-white"
    }
  };

  return (
    <div className="flex flex-col items-center w-full min-h-screen bg-gradient-to-b from-blue-50 to-indigo-50 py-10 px-4">
      {/* Logo */}
      <div className="mb-6 flex items-center">
        <Heart className="text-red-500 h-8 w-8 mr-2" />
        <span className="text-2xl font-bold text-blue-900">CardioLink</span>
      </div>

      <div className="max-w-md w-full bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-6 pb-2 bg-white sticky top-0 z-10 border-b border-gray-100">
          <h2 className="text-2xl font-bold text-center text-blue-900">Welcome Back</h2>
          <p className="text-gray-600 text-center text-sm">
            Sign in to access your CardioLink account
          </p>
        </div>

        <div className="p-6">
          <form onSubmit={handleLogin}>
            {/* Email */}
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                <Link to="/forgot-password" className="text-sm text-blue-600 hover:text-blue-800">Forgot password?</Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  type="password"
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Role Selection */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Your Role</label>
              <div className="grid grid-cols-2 gap-2">
                {roles.map((r) => {
                  const colors = colorMap[r.color];
                  const isActive = role === r.id;

                  return (
                    <button
                      type="button"
                      key={r.id}
                      onClick={() => setRole(r.id)}
                      className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition duration-200 ${isActive ? `${colors.activeBg} ${colors.activeText} ${colors.border}` : `${colors.bg} ${colors.text} border-transparent hover:border-gray-300`}`}
                    >
                      <div className={`${isActive ? "text-white" : colors.text}`}>{r.icon}</div>
                      <span className="font-medium text-sm mt-1">{r.id.replace('-', ' ')}</span>
                      <span className="text-xs opacity-80">{r.description}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">
                {error}
              </div>
            )}

            {/* Login Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 px-4 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg shadow transition duration-200 flex items-center justify-center mt-2"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? <Loader className="w-5 h-5 animate-spin" /> : "Sign In"}
            </motion.button>
          </form>
        </div>

        <div className="px-6 py-3 bg-gray-50 flex justify-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{" "}
            <Link to="/signup" className="text-blue-600 hover:text-blue-800 font-medium">
              Sign up
            </Link>
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-500">© {new Date().getFullYear()} CardioLink. All rights reserved.</p>
      </div>
    </div>
  );
};

export default LoginPage;