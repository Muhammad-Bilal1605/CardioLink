import { useState } from "react";
import { motion } from "framer-motion";
import { useAuthStore } from "../store/authStore";
import { useNavigate, useParams, Link } from "react-router-dom";
import { Lock, Heart, Loader } from "lucide-react";
import toast from "react-hot-toast";

const ResetPasswordPage = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { resetPassword, error, isLoading, message } = useAuthStore();

  const { token } = useParams();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    try {
      await resetPassword(token, password);

      toast.success("Password reset successfully, redirecting to login page...");
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Error resetting password");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full bg-gradient-to-b from-blue-50 to-indigo-50">
      {/* Logo */}
      <div className="mb-8 flex items-center">
        <Heart className="text-red-500 h-8 w-8 mr-2" />
        <span className="text-2xl font-bold text-blue-900">CardioLink</span>
      </div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full bg-white rounded-xl shadow-lg overflow-hidden"
      >
        <div className="p-8">
          <h2 className="text-3xl font-bold mb-2 text-center text-blue-900">
            Reset Password
          </h2>
          <p className="text-gray-600 text-center mb-8">
            Create a new secure password for your account
          </p>

          {error && <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">{error}</div>}
          {message && <div className="p-4 mb-4 text-sm text-green-700 bg-green-100 rounded-lg" role="alert">{message}</div>}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
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

            <div className="mb-6">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  type="password"
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 px-4 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg shadow transition duration-200 flex items-center justify-center"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? <Loader className="w-5 h-5 animate-spin" /> : "Set New Password"}
            </motion.button>
          </form>
        </div>
        
        <div className="px-8 py-4 bg-gray-50 flex justify-center">
          <Link to="/login" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
            Back to Login
          </Link>
        </div>
      </motion.div>
      
      {/* Footer */}
      <div className="mt-8 text-center">
        <p className="text-sm text-gray-500">
          © {new Date().getFullYear()} CardioLink. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default ResetPasswordPage;