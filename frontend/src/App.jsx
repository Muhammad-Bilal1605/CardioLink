import { Navigate, Route, Routes } from "react-router-dom";

import ECGAnalyzer from "./pages/AI DIagnosis/ECGAnalyzer";
import EchoAnalyzer from "./pages/AI DIagnosis/EchoAnalyzer";
import HeartbeatAnalyzer from "./pages/AI DIagnosis/HeartbeatAnalyzer";
import SignUpPage from "./pages/SignUpPage";
import LoginPage from "./pages/LoginPage";
import HospitalLoginPage from "./pages/HospitalLoginPage";
import EmailVerificationPage from "./pages/EmailVerificationPage";
import DashboardPage from "./pages/DashboardPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import LandingPage from "./pages/LandingPage";
import AppointmentSchedule from "./components/dashboards/AppointmentSchedule";
import DoctorPrescriptions from "./components/Prescriptions/DoctorPrescriptions";
import DoctorReqForMedicalHistory from "./components/MedicalHistory/DoctorReqForMedicalHistory";
import PatientImagingList from "./pages/PatientImagingList";
import PatientLabResultsList from "./pages/PatientLabResultsList";
import PatientProceduresList from "./pages/PatientProceduresList";
import PatientHospitalizationsList from "./pages/PatientHospitalizationsList";
import PatientVisitsList from "./pages/PatientVisitsList";
import HospitalRegistration from "./pages/HospitalRegistration";
import HospitalAdminDashboard from "./pages/HospitalAdminDashboard";
import HospitalPersonnelDashboard from "./components/dashboards/HospitalAdminDashboard";

// EHR related imports
import EHR from './pages/EHR Pages/EHR';
import UploadImaging from './pages/Uploading Pages/UploadImaging';
import UploadLabResults from './pages/Uploading Pages/UploadLabResults';
import UploadProcedures from './pages/Uploading Pages/UploadProcedures';
import UploadMedications from './pages/Uploading Pages/UploadMedications';
import UploadVisits from './pages/Uploading Pages/UploadVisits';
import UploadHospitalizations from './pages/Uploading Pages/UploadHospitalizations';
import UploadVitalSigns from './pages/Uploading Pages/UploadVitalSigns';
import PatientList from './pages/EHR Pages/PatientList';

import LoadingSpinner from "./components/LoadingSpinner";

import { Toaster } from "react-hot-toast";
import { useAuthStore } from "./store/authStore";
import { useEffect } from "react";
import DoctorProfile from "./components/Profile/DoctorProfile";
import DoctorChats from "./components/Chats/DoctorChats";
import DoctorSetting from "./components/Setting/DoctorSetting";
import { ProfileProvider } from './context/ProfileContext'; 
import { PatientProvider } from './context/PatientContext';

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

// redirect authenticated users to the appropriate dashboard
const RedirectAuthenticatedUser = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (isAuthenticated && user.isVerified) {
    // Redirect based on user role
    switch (user.role) {
      case "admin":
        return <Navigate to='/admin-dashboard' replace />;
      case "pharmacist":
        return <Navigate to='/pharmacist-dashboard' replace />;
      case "hospital-admin":
        return <Navigate to='/hospital-admin-dashboard' replace />;
      case "doctor":
        return <Navigate to='/doctor-dashboard' replace />;
      case "radiologist":
        return <Navigate to='/radiologist-dashboard' replace />;
      case "lab-technologist":
        return <Navigate to='/lab-dashboard' replace />;
      case "hospital-front-desk":
        return <Navigate to='/front-desk-dashboard' replace />;
      default:
        return <Navigate to='/dashboard' replace />;
    }
  }

  return children;
};

// Role-specific redirect for System Admin login
const RedirectAuthenticatedAdmin = ({ children }) => {
  const { isAuthenticated, user, logout } = useAuthStore();

  if (isAuthenticated && user.isVerified) {
    if (user.role === "admin") {
      return <Navigate to='/admin-dashboard' replace />;
    } else {
      // User is logged in with a different role
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
            <div className="text-center">
              <svg className="mx-auto h-12 w-12 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900">Already Logged In</h3>
              <p className="mt-2 text-sm text-gray-600">
                You are currently logged in as <span className="font-semibold">{user.role}</span>. 
                To access the System Admin portal, you need to logout first.
              </p>
              <div className="mt-6 flex space-x-3">
                <button
                  onClick={() => logout()}
                  className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
                >
                  Logout
                </button>
                <button
                  onClick={() => window.history.back()}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Go Back
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }
  }

  return children;
};

// Role-specific redirect for Pharmacist login
const RedirectAuthenticatedPharmacist = ({ children }) => {
  const { isAuthenticated, user, logout } = useAuthStore();

  if (isAuthenticated && user.isVerified) {
    if (user.role === "pharmacist") {
      return <Navigate to='/pharmacist-dashboard' replace />;
    } else {
      // User is logged in with a different role
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
            <div className="text-center">
              <svg className="mx-auto h-12 w-12 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900">Already Logged In</h3>
              <p className="mt-2 text-sm text-gray-600">
                You are currently logged in as <span className="font-semibold">{user.role}</span>. 
                To access the Pharmacist portal, you need to logout first.
              </p>
              <div className="mt-6 flex space-x-3">
                <button
                  onClick={() => logout()}
                  className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
                >
                  Logout
                </button>
                <button
                  onClick={() => window.history.back()}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Go Back
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }
  }

  return children;
};

// Role-specific redirect for Hospital login
const RedirectAuthenticatedHospital = ({ children }) => {
  const { isAuthenticated, user, logout } = useAuthStore();

  if (isAuthenticated && user.isVerified) {
    const hospitalRoles = ["hospital-admin", "doctor", "radiologist", "lab-technologist", "hospital-front-desk"];
    
    if (hospitalRoles.includes(user.role)) {
      // Redirect to appropriate hospital dashboard
      switch (user.role) {
        case "hospital-admin":
          return <Navigate to='/hospital-admin-dashboard' replace />;
        case "doctor":
          return <Navigate to='/doctor-dashboard' replace />;
        case "radiologist":
          return <Navigate to='/radiologist-dashboard' replace />;
        case "lab-technologist":
          return <Navigate to='/lab-dashboard' replace />;
        case "hospital-front-desk":
          return <Navigate to='/front-desk-dashboard' replace />;
        default:
          return <Navigate to='/dashboard' replace />;
      }
    } else {
      // User is logged in with a non-hospital role
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
            <div className="text-center">
              <svg className="mx-auto h-12 w-12 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900">Already Logged In</h3>
              <p className="mt-2 text-sm text-gray-600">
                You are currently logged in as <span className="font-semibold">{user.role}</span>. 
                To access the Hospital portal, you need to logout first.
              </p>
              <div className="mt-6 flex space-x-3">
                <button
                  onClick={() => logout()}
                  className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
                >
                  Logout
                </button>
                <button
                  onClick={() => window.history.back()}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Go Back
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }
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
    <ProfileProvider>
      <PatientProvider>
        <div className='min-h-screen bg-white'>
          
          <Routes>
            {/* Landing Page is now the default route */}
            <Route path='/' element={<LandingPage />} />
            
            {/* FOr ECG analysis */}
            <Route
              path='/ecg-analysis'
              element={
                <ProtectedRoute>
                  <ECGAnalyzer />
                </ProtectedRoute>
              }
            />

            {/* FOr ECHO analysis */}
            <Route
              path='/echo-analysis'
              element={
                <ProtectedRoute>
                  <EchoAnalyzer />
                </ProtectedRoute>
              }
            />

            {/* FOr heartbeat analysis */}
            <Route
              path='/heartbeat-analysis'
              element={
                <ProtectedRoute>
                  <HeartbeatAnalyzer />
                </ProtectedRoute>
              }
            />
            
            {/* Auth Routes with Redirection */}
            <Route
              path='/signup'
              element={
                <RedirectAuthenticatedUser>
                  <SignUpPage />
                </RedirectAuthenticatedUser>
              }
            />
            
            {/* General login route (defaults to admin) */}
            <Route
              path='/login'
              element={
                <RedirectAuthenticatedAdmin>
                  <LoginPage />
                </RedirectAuthenticatedAdmin>
              }
            />

            {/* Admin specific login route */}
            <Route
              path='/admin-login'
              element={
                <RedirectAuthenticatedAdmin>
                  <LoginPage />
                </RedirectAuthenticatedAdmin>
              }
            />

            {/* Pharmacist specific login route */}
            <Route
              path='/pharmacist-login'
              element={
                <RedirectAuthenticatedPharmacist>
                  <LoginPage />
                </RedirectAuthenticatedPharmacist>
              }
            />

            {/* Hospital Login Route */}
            <Route
              path='/hospital-login'
              element={
                <RedirectAuthenticatedHospital>
                  <HospitalLoginPage />
                </RedirectAuthenticatedHospital>
              }
            />

            {/* Hospital Registration Route */}
            <Route path='/hospital-registration' element={<HospitalRegistration />} />

            {/* Dashboard route */}
            <Route
              path='/dashboard'
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />

            {/* Role-specific Dashboard Routes */}
            <Route
              path='/hospital-admin-dashboard'
              element={
                <ProtectedRoute>
                  <HospitalPersonnelDashboard />
                </ProtectedRoute>
              }
            />

            {/* Hospital Management for Admin */}
            <Route
              path='/hospital-admin'
              element={
                <ProtectedRoute>
                  <HospitalAdminDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path='/admin-dashboard'
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />

            <Route
              path='/pharmacist-dashboard'
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />

            <Route
              path='/doctor-dashboard'
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />

            <Route
              path='/radiologist-dashboard'
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />

            <Route
              path='/lab-dashboard'
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />

            <Route
              path='/lab-technologist-dashboard'
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />

            <Route
              path='/front-desk-dashboard'
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />

            <Route
              path='/hospital-front-desk-dashboard'
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />

            {/* Appointment Schedule route */}
            <Route
              path='/dashboard/appointments'
              element={
              <ProtectedRoute>
                <AppointmentSchedule />
              </ProtectedRoute>
            }
          />

           {/* chat */}
           <Route
              path='/Docchat'
              element={
              <ProtectedRoute>
                <DoctorChats/>
              </ProtectedRoute>
            }
          />
           <Route
              path='/medicalhistory'
              element={
              <ProtectedRoute>
                <DoctorReqForMedicalHistory/>
              </ProtectedRoute>
            }
          />

          {/* Prescription */}
          <Route
              path='/prescriptions/DocPrec'
              element={
              <ProtectedRoute>
              <DoctorPrescriptions/>
              </ProtectedRoute>
            }
          />
          
          {/* Settings */}
          <Route
              path="/settings/DoctorSetting"
              element={
              <ProtectedRoute>
              <DoctorSetting/>
              </ProtectedRoute>
            }
          />

          {/* profile */}
          <Route
              path='/profile'
              element={
              <ProtectedRoute>
                <DoctorProfile/>
              </ProtectedRoute>
            }
          />

          {/* EHR Routes - All protected - Patient IDs removed from URLs */}
          <Route
            path='/patients'
            element={
              <ProtectedRoute>
                <PatientList />
              </ProtectedRoute>
            }
          />
          
          <Route
            path='/ehr'
            element={
              <ProtectedRoute>
                <EHR />
              </ProtectedRoute>
            }
          />
          
          <Route
            path='/upload-imaging'
            element={
              <ProtectedRoute>
                <UploadImaging />
              </ProtectedRoute>
            }
          />
          
          <Route
            path='/upload-lab-results'
            element={
              <ProtectedRoute>
                <UploadLabResults />
              </ProtectedRoute>
            }
          />
          
          <Route
            path='/upload-procedures'
            element={
              <ProtectedRoute>
                <UploadProcedures />
              </ProtectedRoute>
            }
          />
          
          <Route
            path='/upload-medications'
            element={
              <ProtectedRoute>
                <UploadMedications />
              </ProtectedRoute>
            }
          />
          
          <Route
            path='/upload-visits'
            element={
              <ProtectedRoute>
                <UploadVisits />
              </ProtectedRoute>
            }
          />
          
          <Route
            path='/upload-hospitalizations'
            element={
              <ProtectedRoute>
                <UploadHospitalizations />
              </ProtectedRoute>
            }
          />
          
          <Route
            path='/upload-vital-signs'
            element={
              <ProtectedRoute>
                <UploadVitalSigns />
              </ProtectedRoute>
            }
          />

            {/* Email Verification (public) */}
            <Route 
              path='/verify-email' 
              element={<EmailVerificationPage />} 
            />

            {/* Password Recovery */}
            <Route
              path='/forgot-password'
              element={
                <RedirectAuthenticatedUser>
                  <ForgotPasswordPage />
                </RedirectAuthenticatedUser>
              }
            />
            
            <Route
              path='/reset-password/:token'
              element={
                <RedirectAuthenticatedUser>
                  <ResetPasswordPage />
                </RedirectAuthenticatedUser>
              }
            />

            {/* Patient Imaging List route */}
            <Route
              path='/patient-imaging'
              element={
                <ProtectedRoute>
                  <PatientImagingList />
                </ProtectedRoute>
              }
            />

            {/* Patient Lab Results List route */}
            <Route
              path='/patient-lab-results'
              element={
                <ProtectedRoute>
                  <PatientLabResultsList />
                </ProtectedRoute>
              }
            />

            {/* Patient Procedures List route */}
            <Route
              path='/patient-procedures'
              element={
                <ProtectedRoute>
                  <PatientProceduresList />
                </ProtectedRoute>
              }
            />

            {/* Patient Hospitalizations List route */}
            <Route
              path='/patient-hospitalizations'
              element={
                <ProtectedRoute>
                  <PatientHospitalizationsList />
                </ProtectedRoute>
              }
            />

            {/* Patient Visits List route */}
            <Route
              path='/patient-visits'
              element={
                <ProtectedRoute>
                  <PatientVisitsList />
                </ProtectedRoute>
              }
            />

            {/* Catch-all fallback route */}
            <Route path='*' element={<Navigate to='/' replace />} />
          </Routes>
          
          <Toaster />

        </div>
      </PatientProvider>
    </ProfileProvider>
  );
}

export default App;