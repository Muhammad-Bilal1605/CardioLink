import { useState, useEffect } from "react";
import { useAuthStore } from "../../store/authStore";
import DashboardLayout from "../DashboardLayout";
import { Users, Calendar, Hospital, CreditCard, ArrowUp, ArrowDown } from "lucide-react";

const HospitalAdminDashboard = () => {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({
    totalStaff: 142,
    occupancyRate: 78,
    averageLOS: 4.3,
    revenueToday: 42750
  });

  // Simulated department data
  const [departments, setDepartments] = useState([
    {
      name: "Cardiology",
      beds: 45,
      occupiedBeds: 38,
      staff: 24,
      status: "optimal"
    },
    {
      name: "Emergency",
      beds: 30,
      occupiedBeds: 28,
      staff: 32,
      status: "high"
    },
    {
      name: "Pediatrics",
      beds: 35,
      occupiedBeds: 22,
      staff: 19,
      status: "normal"
    },
    {
      name: "Surgery",
      beds: 40,
      occupiedBeds: 31,
      staff: 27,
      status: "normal"
    }
  ]);

  // Fetch data in a real implementation
  useEffect(() => {
    // This would be an API call in a real application
    // fetchDashboardData();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case "high":
        return "text-red-600 bg-red-100";
      case "optimal":
        return "text-green-600 bg-green-100";
      case "normal":
        return "text-blue-600 bg-blue-100";
      case "low":
        return "text-yellow-600 bg-yellow-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  return (
    <DashboardLayout title="Hospital Administration" role="hospital-admin">
      <div className="space-y-6">
        {/* Welcome message */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Welcome, {user?.name}</h2>
          <p className="text-gray-600">Hospital Administration Dashboard • {new Date().toLocaleDateString()}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="bg-indigo-100 p-3 rounded-full">
                <Users className="h-6 w-6 text-indigo-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Staff</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalStaff}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-full">
                <Hospital className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Occupancy Rate</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.occupancyRate}%</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-full">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Avg. Length of Stay</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.averageLOS} days</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="bg-purple-100 p-3 rounded-full">
                <CreditCard className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Today's Revenue</p>
                <p className="text-2xl font-semibold text-gray-900">${stats.revenueToday.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Department Status */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Departments Status</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Beds</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Occupied</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Occupancy %</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Staff</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {departments.map((dept) => (
                  <tr key={dept.name} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{dept.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{dept.beds}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{dept.occupiedBeds}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <span className="mr-2">{Math.round((dept.occupiedBeds / dept.beds) * 100)}%</span>
                        {(dept.occupiedBeds / dept.beds) > 0.8 ? (
                          <ArrowUp className="h-4 w-4 text-red-500" />
                        ) : (
                          <ArrowDown className="h-4 w-4 text-green-500" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{dept.staff}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(dept.status)}`}>
                        {dept.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 border-t border-gray-200">
            <button className="text-blue-600 hover:text-blue-900 text-sm font-medium">View all departments</button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default HospitalAdminDashboard;