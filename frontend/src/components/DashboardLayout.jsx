import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { 
  LogOut, 
  Menu, 
  X, 
  Heart, 
  Home, 
  Users, 
  Settings, 
  PieChart, 
  User, 
  Bell,
  Calendar,FileText,
  ClipboardList
} from "lucide-react";

const DashboardLayout = ({ children, title, role }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { logout, user } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // Role-specific navigation items
  const getNavItems = () => {
    const baseItems = [
      { name: "Dashboard", href: "/dashboard", icon: <Home className="w-5 h-5" /> },
      { name: "Profile and Settings", href: "/profile", icon: <User className="w-5 h-5" /> },
     
    ];

    // Add role-specific items
    switch (role) {
      case "admin":
        return [
          ...baseItems,
          { name: "Users", href: "/users", icon: <Users className="w-5 h-5" /> },
          { name: "Reports", href: "/reports", icon: <PieChart className="w-5 h-5" /> },
        ];
        case "doctor":
          return [
            ...baseItems,
            { name: "EHR", href: "/patients", icon: <Users className="w-5 h-5" /> },
            { name: "Appointments", href: "/dashboard/appointments", icon: <Calendar className="w-5 h-5" /> },
            { name: "Prescriptions", href: "/prescriptions/DocPrec", icon:  <FileText className="w-5 h-5" /> },
            {name:"Chat", href:"/Docchat", icon:<ClipboardList className="w-5 h-5" />},
           // { name: "Settings", href: "/settings/DoctorSetting", icon: <Settings className="w-5 h-5" /> },
          ];
      case "pharmacist":
        return [
          ...baseItems,
          { name: "Medications", href: "/medications", icon: <PieChart className="w-5 h-5" /> },
          { name: "Prescriptions", href: "/prescriptions", icon: <Users className="w-5 h-5" /> },
        ];
      case "hospital-admin":
        return [
          ...baseItems,
          { name: "Staff", href: "/staff", icon: <Users className="w-5 h-5" /> },
          { name: "Departments", href: "/departments", icon: <PieChart className="w-5 h-5" /> },
        ];
      case "radiologist":
        return [
          ...baseItems,
          { name: "Images", href: "/images", icon: <PieChart className="w-5 h-5" /> },
          { name: "Reports", href: "/reports", icon: <Users className="w-5 h-5" /> },
        ];
      case "lab-technologist":
        return [
          ...baseItems,
          { name: "Tests", href: "/tests", icon: <PieChart className="w-5 h-5" /> },
          { name: "Results", href: "/results", icon: <Users className="w-5 h-5" /> },
        ];
      default:
        return baseItems;
    }
  };

  

 
  

  return (



    
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar for desktop */}
      <aside className="hidden md:flex md:flex-col md:w-64 md:fixed md:inset-y-0 bg-green-900 text-white">
        <div className="flex items-center justify-center h-20 border-b border-red-800">
          <div className="flex items-center">
            <Heart className="text-red-500 h-8 w-8 mr-2" />
            <span className="text-xl font-bold">CardioLink</span>
          </div>
        </div>
        <div className="flex flex-col flex-grow overflow-y-auto">
          <nav className="flex-1 px-2 py-4 space-y-1">
            {getNavItems().map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className="flex items-center px-4 py-2 text-sm font-medium rounded-md hover:bg-blue-800 transition-colors"
              >
                {item.icon}
                <span className="ml-3">{item.name}</span>
              </Link>
            ))}
          </nav>
          <div className="p-4 border-t border-gray-800">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="bg-gray-700 rounded-full p-2">
                  <User className="h-5 w-5 text-blue-200" />
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">{user?.name}</p>
                <p className="text-xs text-blue-300">{role.replace('-', ' ')}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="mt-4 flex items-center w-full px-4 py-2 text-sm font-medium text-white bg-blue-800 rounded-md hover:bg-blue-700 transition-colors"
            >
              <LogOut className="w-5 h-5 mr-2" />
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile sidebar */}
      <div className="md:hidden">
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 flex">
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)}></div>
            <div className="relative flex-1 flex flex-col max-w-xs w-full bg-blue-900 text-white">
              <div className="absolute top-0 right-0 -mr-12 pt-2">
                <button
                  className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                  onClick={() => setSidebarOpen(false)}
                >
                  <X className="h-6 w-6 text-white" />
                </button>
              </div>
              <div className="flex items-center justify-center h-20 border-b border-blue-800">
                <div className="flex items-center">
                  <Heart className="text-red-500 h-8 w-8 mr-2" />
                  <span className="text-xl font-bold">CardioLink</span>
                </div>
              </div>
              <div className="flex-1 h-0 overflow-y-auto">
                <nav className="px-2 py-4 space-y-1">
                  {getNavItems().map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      className="flex items-center px-4 py-2 text-sm font-medium rounded-md hover:bg-blue-800 transition-colors"
                      onClick={() => setSidebarOpen(false)}
                    >
                      {item.icon}
                      <span className="ml-3">{item.name}</span>
                    </Link>
                  ))}
                </nav>
                <div className="p-4 border-t border-blue-800">
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-2 text-sm font-medium text-white bg-blue-800 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    <LogOut className="w-5 h-5 mr-2" />
                    Sign out
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 md:pl-64">
        {/* Top navbar */}
        <header className="bg-white shadow-sm z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <button
                  className="md:hidden -ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none"
                  onClick={() => setSidebarOpen(true)}
                >
                  <Menu className="h-6 w-6" />
                </button>
                <h1 className="text-xl font-semibold text-gray-900 ml-2 md:ml-0">{title}</h1>
              </div>
              <div className="flex items-center">
                <button className="p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none">
                  <Bell className="h-6 w-6" />
                </button>
                <div className="ml-3 relative">
                  <div className="text-sm font-medium text-gray-500 hidden md:block">
                    Welcome, {user?.name}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto py-6 px-4 sm:px-6 lg:px-8 bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;

