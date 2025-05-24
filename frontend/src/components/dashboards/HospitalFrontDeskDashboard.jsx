import { useState, useEffect } from "react";
import { useAuthStore } from "../../store/authStore";
import DashboardLayout from "../DashboardLayout";
import { ClipboardList, Building, Users, Calendar, Activity } from "lucide-react";

const HospitalFrontDeskDashboard = () => {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({
    proceduresToday: 12,
    admissionsToday: 8,
    discharges: 5,
    activePatients: 45
  });

  // Simulated procedures data
  const [recentActivities, setRecentActivities] = useState([
    {
      id: "PR001",
      type: "procedure",
      patient: "John Smith",
      description: "Cardiac Catheterization",
      doctor: "Dr. Sarah Johnson",
      status: "scheduled",
      time: "09:30 AM",
      room: "OR-2"
    },
    {
      id: "AD001",
      type: "admission",
      patient: "Maria Garcia",
      description: "Emergency Admission",
      doctor: "Dr. Michael Chen",
      status: "admitted",
      time: "11:15 AM",
      room: "Room 204"
    },
    {
      id: "PR002",
      type: "procedure",
      patient: "Robert Davis",
      description: "Endoscopy",
      doctor: "Dr. Lisa Wong",
      status: "completed",
      time: "08:00 AM",
      room: "Procedure Room 1"
    },
    {
      id: "DC001",
      type: "discharge",
      patient: "Emma Thompson",
      description: "Routine Discharge",
      doctor: "Dr. James Wilson",
      status: "discharged",
      time: "02:30 PM",
      room: "Room 301"
    }
  ]);

  // Fetch data in a real implementation
  useEffect(() => {
    // This would be an API call in a real application
    // fetchDashboardData();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case "scheduled":
        return "text-blue-600 bg-blue-100";
      case "completed":
        return "text-green-600 bg-green-100";
      case "admitted":
        return "text-purple-600 bg-purple-100";
      case "discharged":
        return "text-gray-600 bg-gray-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case "procedure":
        return <ClipboardList className="h-4 w-4" />;
      case "admission":
        return <Building className="h-4 w-4" />;
      case "discharge":
        return <Users className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case "procedure":
        return "text-purple-600";
      case "admission":
        return "text-blue-600";
      case "discharge":
        return "text-gray-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <DashboardLayout title="Front Desk Dashboard" role="hospital-front-desk">
      <div className="space-y-6">
        {/* Welcome message */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Welcome, {user?.name}</h2>
          <p className="text-gray-600">Hospital Front Desk Dashboard • {new Date().toLocaleDateString()}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="bg-purple-100 p-3 rounded-full">
                <ClipboardList className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Procedures Today</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.proceduresToday}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-full">
                <Building className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Admissions Today</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.admissionsToday}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="bg-gray-100 p-3 rounded-full">
                <Users className="h-6 w-6 text-gray-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Discharges</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.discharges}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="bg-teal-100 p-3 rounded-full">
                <Activity className="h-6 w-6 text-teal-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Active Patients</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.activePatients}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recent Activities</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Room</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentActivities.map((activity) => (
                  <tr key={activity.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-teal-600">{activity.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className={`flex items-center ${getTypeColor(activity.type)}`}>
                        {getTypeIcon(activity.type)}
                        <span className="ml-2 capitalize">{activity.type}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{activity.patient}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{activity.description}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{activity.doctor}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(activity.status)}`}>
                        {activity.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{activity.time}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{activity.room}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 border-t border-gray-200">
            <button className="text-teal-600 hover:text-teal-900 text-sm font-medium">View all activities</button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default HospitalFrontDeskDashboard; 