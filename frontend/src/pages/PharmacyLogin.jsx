import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, Loader, Pill, ArrowLeft, Heart } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Input from "../components/Input";
import { useAuthStore } from "../store/authStore";

const PharmacyLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const navigate = useNavigate();
  const location = useLocation();
  const { pharmacyAdminLogin } = useAuthStore();

  // Check for success message from registration
  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      // Clear the message after 5 seconds
      setTimeout(() => setSuccessMessage(""), 5000);
    }
  }, [location]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      await pharmacyAdminLogin(email, password);
      navigate("/pharmacy-dashboard");
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Invalid credentials or pharmacy not approved yet"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-800 to-blue-700 flex items-center justify-center relative overflow-hidden">
      {/* Background Animation */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-32 h-32 rounded-full bg-purple-400 filter blur-3xl opacity-20 animate-float1"></div>
        <div className="absolute top-1/3 right-1/4 w-40 h-40 rounded-full bg-blue-400 filter blur-3xl opacity-15 animate-float2"></div>
        <div className="absolute bottom-1/4 left-1/3 w-48 h-48 rounded-full bg-indigo-400 filter blur-3xl opacity-15 animate-float3"></div>
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
            <div className="flex justify-center items-center mb-4">
              <div className="bg-purple-500/20 p-3 rounded-full">
                <Pill className="h-8 w-8 text-purple-300" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">
              Pharmacy Portal
            </h2>
            <p className="text-purple-200">
              Login to access your pharmacy dashboard
            </p>
          </div>

          {/* Success Message */}
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 bg-green-500/20 border border-green-500/50 text-green-200 px-4 py-3 rounded-lg"
            >
              {successMessage}
            </motion.div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            <Input
              icon={Mail}
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-white/10 border-white/20 text-white placeholder-purple-200"
            />

            <Input
              icon={Lock}
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-white/10 border-white/20 text-white placeholder-purple-200"
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
              className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg shadow-lg transition duration-200 flex items-center justify-center"
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
              className="text-purple-300 hover:text-purple-200 text-sm transition-colors"
            >
              Forgot your password?
            </Link>

            <div className="border-t border-white/20 pt-4">
              <p className="text-purple-200 text-sm mb-3">
                Need to register your pharmacy?
              </p>
              <Link
                to="/pharmacy-registration"
                className="inline-flex items-center text-purple-300 hover:text-purple-200 text-sm transition-colors font-medium"
              >
                Register Pharmacy
              </Link>
            </div>
          </div>

          {/* Back to Home */}
          <div className="mt-6 pt-4 border-t border-white/20">
            <Link
              to="/"
              className="flex items-center justify-center text-purple-300 hover:text-purple-200 text-sm transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Info Panel */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="hidden lg:block absolute right-8 top-1/2 transform -translate-y-1/2 bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 max-w-sm"
      >
        <h3 className="text-white font-semibold mb-4">Pharmacy Portal Benefits</h3>
        <div className="space-y-3 text-sm">
          <div className="flex items-start text-purple-200">
            <div className="w-2 h-2 bg-purple-400 rounded-full mr-3 mt-1.5 flex-shrink-0"></div>
            <span>Manage your product inventory online</span>
          </div>
          <div className="flex items-start text-purple-200">
            <div className="w-2 h-2 bg-purple-400 rounded-full mr-3 mt-1.5 flex-shrink-0"></div>
            <span>Receive and process orders digitally</span>
          </div>
          <div className="flex items-start text-purple-200">
            <div className="w-2 h-2 bg-purple-400 rounded-full mr-3 mt-1.5 flex-shrink-0"></div>
            <span>Reach customers across your delivery area</span>
          </div>
          <div className="flex items-start text-purple-200">
            <div className="w-2 h-2 bg-purple-400 rounded-full mr-3 mt-1.5 flex-shrink-0"></div>
            <span>Track sales and business analytics</span>
          </div>
          <div className="flex items-start text-purple-200">
            <div className="w-2 h-2 bg-purple-400 rounded-full mr-3 mt-1.5 flex-shrink-0"></div>
            <span>Manage prescription validation</span>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-white/20">
          <p className="text-purple-200 text-xs">
            Only approved pharmacies can access the dashboard. Your registration will be reviewed by our admin team.
          </p>
        </div>
      </motion.div>

      <style>{`
        @keyframes float1 {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        
        @keyframes float2 {
          0%, 100% { transform: translateY(-10px); }
          50% { transform: translateY(10px); }
        }
        
        @keyframes float3 {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(15px); }
        }
        
        .animate-float1 {
          animation: float1 6s ease-in-out infinite;
        }
        
        .animate-float2 {
          animation: float2 8s ease-in-out infinite;
        }
        
        .animate-float3 {
          animation: float3 7s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default PharmacyLogin;

