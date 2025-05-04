// ForgotPasswordPage.jsx
import { motion } from "framer-motion";
import { useState } from "react";
import { useAuthStore } from "../store/authStore";
import { ArrowLeft, Loader, Mail, Heart } from "lucide-react";
import { Link } from "react-router-dom";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const { isLoading, forgotPassword } = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    await forgotPassword(email);
    setIsSubmitted(true);
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
            Forgot Password
          </h2>
          
          {!isSubmitted ? (
            <form onSubmit={handleSubmit}>
              <p className="text-gray-600 text-center mb-8">
                Enter your email address and we'll send you a link to reset your password.
              </p>
              
              <div className="mb-6">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
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
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3 px-4 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg shadow transition duration-200 flex items-center justify-center"
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? <Loader className="w-5 h-5 animate-spin" /> : "Send Reset Link"}
              </motion.button>
            </form>
          ) : (
            <div className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <Mail className="h-8 w-8 text-blue-500" />
              </motion.div>
              <p className="text-gray-600 mb-6">
                If an account exists for {email}, you will receive a password reset link shortly.
              </p>
            </div>
          )}
        </div>
        
        <div className="px-8 py-4 bg-gray-50 flex justify-center">
          <Link to="/login" className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Login
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

export default ForgotPasswordPage;