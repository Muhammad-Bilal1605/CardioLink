import { Navigate, Route, Routes } from "react-router-dom";

import SignUpPage from "./pages/SignUpPage";
import LoginPage from "./pages/LoginPage";
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
    <ProfileProvider>
      <PatientProvider>
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

            {/* Hospital Registration route */}
            <Route
              path='/hospital-registration'
              element={
                <ProtectedRoute>
                  <HospitalRegistration />
                </ProtectedRoute>
              }
            />

            {/* Hospital Admin Dashboard route */}
            <Route
              path='/hospital-admin'
              element={
                <ProtectedRoute>
                  <HospitalAdminDashboard />
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