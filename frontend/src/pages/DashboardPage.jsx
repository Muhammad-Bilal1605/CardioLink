import { useAuthStore } from "../store/authStore";
import AdminDashboard from "../components/dashboards/AdminDashboard";
import PharmacistDashboard from "../components/dashboards/PharmacistDashboard";
import DoctorDashboard from "../components/dashboards/DoctorDashboard";
import HospitalAdminDashboard from "../components/dashboards/HospitalAdminDashboard";
import RadiologistDashboard from "../components/dashboards/RadiologistDashboard.jsx";
import LabTechnologistDashboard from "../components/dashboards/LabTechnologistDashboard";
import HospitalFrontDeskDashboard from "../components/dashboards/HospitalFrontDeskDashboard";
import LoadingSpinner from "../components/LoadingSpinner";

const DashboardPage = () => {
  const { user, isCheckingAuth } = useAuthStore();

  if (isCheckingAuth) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <div>User not found. Please log in again.</div>;
  }

  // Direct users to their role-specific dashboard
  switch (user.role) {
    case "admin":
      return <AdminDashboard />;
    case "pharmacist":
      return <PharmacistDashboard />;
    case "doctor":
      return <DoctorDashboard />;
    case "hospital-admin":
      return <HospitalAdminDashboard />;
    case "radiologist":
      return <RadiologistDashboard />;
    case "lab-technologist":
      return <LabTechnologistDashboard />;
    case "hospital-front-desk":
      return <HospitalFrontDeskDashboard />;
    default:
      return <div>Invalid role. Please contact system administrator.</div>;
  }
};

export default DashboardPage;