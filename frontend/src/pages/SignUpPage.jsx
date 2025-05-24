import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, Loader, Heart, User, Package, ArrowLeft } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Input from "../components/Input";
import PasswordStrengthMeter from "../components/PasswordStrengthMeter";
import { useAuthStore } from "../store/authStore";

const SignUpPage = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const { signup, error, isLoading } = useAuthStore();

  // Set role from URL parameter
  useEffect(() => {
    const roleParam = searchParams.get('role');
    if (roleParam && ['admin', 'pharmacist'].includes(roleParam)) {
      setRole(roleParam);
    }
  }, [searchParams]);

  const handleSignUp = async (e) => {
    e.preventDefault();

    if (!role) {
      return;
    }

    try {
      await signup(email, password, name, role);
      navigate("/verify-email");
    } catch (error) {
      console.log(error);
    }
  };

  const roles = [
    { 
      id: "admin", 
      icon: <User className="h-5 w-5" />, 
      color: "blue", 
      description: "System administration & hospital approvals",
      title: "System Admin"
    },
    { 
      id: "pharmacist", 
      icon: <Package className="h-5 w-5" />, 
      color: "purple", 
      description: "Medication management & inventory",
      title: "Pharmacist"
    }
  ];

  const colorMap = {
    blue: {
      bg: "bg-blue-100", border: "border-blue-600", text: "text-blue-600",
      activeBg: "bg-blue-600", activeText: "text-white"
    },
    purple: {
      bg: "bg-purple-100", border: "border-purple-600", text: "text-purple-600",
      activeBg: "bg-purple-600", activeText: "text-white"
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full bg-gradient-to-b from-blue-50 to-indigo-50 py-10 px-4">
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
            Join CardioLink
          </h2>
          <p className="text-gray-600 text-center mb-8">
            Create your account to get started
          </p>

          <form onSubmit={handleSignUp}>
            <div className="mb-4">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="name"
                  type="text"
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="mb-4">
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

            <div className="mb-4">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
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

            <PasswordStrengthMeter password={password} />

            {/* Role Selection */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Your Role</label>
              <div className="grid grid-cols-1 gap-3">
                {roles.map((r) => {
                  const colors = colorMap[r.color];
                  const isActive = role === r.id;

                  return (
                    <button
                      type="button"
                      key={r.id}
                      onClick={() => setRole(r.id)}
                      className={`flex items-center p-4 rounded-lg border-2 transition duration-200 ${isActive ? `${colors.activeBg} ${colors.activeText} ${colors.border}` : `${colors.bg} ${colors.text} border-transparent hover:border-gray-300`}`}
                    >
                      <div className={`mr-3 ${isActive ? "text-white" : colors.text}`}>{r.icon}</div>
                      <div className="text-left">
                        <div className="font-medium text-sm">{r.title}</div>
                        <div className="text-xs opacity-80">{r.description}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {error && (
              <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">
                {error}
              </div>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 px-4 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg shadow transition duration-200 flex items-center justify-center mt-6"
              type="submit"
              disabled={isLoading || !role}
            >
              {isLoading ? <Loader className="w-5 h-5 animate-spin" /> : "Create Account"}
            </motion.button>
          </form>

          {/* Additional Links */}
          <div className="mt-6 text-center space-y-3">
            <p className="text-gray-600 text-sm">
              Already have an account?{" "}
              <Link to={`/login${role ? `?role=${role}` : ''}`} className="text-blue-600 hover:text-blue-800 font-medium">
                Sign in
              </Link>
            </p>
            
            <div className="border-t border-gray-200 pt-4">
              <p className="text-gray-600 text-sm mb-3">
                Looking for hospital access?
              </p>
              <Link
                to="/hospital-login"
                className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Hospital Portal
              </Link>
            </div>
          </div>

          {/* Back to Home */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <Link
              to="/"
              className="flex items-center justify-center text-gray-600 hover:text-gray-800 text-sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
          </div>
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

export default SignUpPage;
