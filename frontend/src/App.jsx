import { Navigate, Route, Routes } from "react-router-dom";

import SignUpPage from "./pages/SignUpPage";
import LoginPage from "./pages/LoginPage";
import EmailVerificationPage from "./pages/EmailVerificationPage";
import DashboardPage from "./pages/DashboardPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import LandingPage from "./pages/LandingPage";

import LoadingSpinner from "./components/LoadingSpinner";

import { Toaster } from "react-hot-toast";
import { useAuthStore } from "./store/authStore";
import { useEffect } from "react";

// protect routes that require authentication
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to='/login' replace />;
  }

  if (!user.isVerified) {
    return <Navigate to='/verify-email' replace />;
  }

  return children;
};

// redirect authenticated users to the dashboard
const RedirectAuthenticatedUser = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (isAuthenticated && user.isVerified) {
    return <Navigate to='/dashboard' replace />;
  }

  return children;
};

function App() {
  const { isCheckingAuth, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isCheckingAuth) return <LoadingSpinner />;

  return (
    <div className='min-h-screen bg-white'>
      <Routes>
        {/* Landing Page is now the default route */}
        <Route path='/' element={<LandingPage />} />
        
        {/* Auth Routes with Redirection */}
        <Route
          path='/signup'
          element={
            <RedirectAuthenticatedUser>
              <div className="flex items-center justify-center h-screen">
                <SignUpPage />
              </div>
            </RedirectAuthenticatedUser>
          }
        />
        
        <Route
          path='/login'
          element={
            <RedirectAuthenticatedUser>
              <div className="flex items-center justify-center h-screen">
                <LoginPage />
              </div>
            </RedirectAuthenticatedUser>
          }
        />

        {/* Dashboard route */}
        <Route
          path='/dashboard'
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        {/* Email Verification (public) */}
        <Route 
          path='/verify-email' 
          element={
            <div className="flex items-center justify-center h-screen">
              <EmailVerificationPage />
            </div>
          } 
        />

        {/* Password Recovery */}
        <Route
          path='/forgot-password'
          element={
            <RedirectAuthenticatedUser>
              <div className="flex items-center justify-center h-screen">
                <ForgotPasswordPage />
              </div>
            </RedirectAuthenticatedUser>
          }
        />
        
        <Route
          path='/reset-password/:token'
          element={
            <RedirectAuthenticatedUser>
              <div className="flex items-center justify-center h-screen">
                <ResetPasswordPage />
              </div>
            </RedirectAuthenticatedUser>
          }
        />

        {/* Catch-all fallback route */}
        <Route path='*' element={<Navigate to='/' replace />} />
      </Routes>
      
      <Toaster />
    </div>
  );
}

export default App;