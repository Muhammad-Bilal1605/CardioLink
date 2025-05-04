import { useState, useEffect } from "react";
import { useAuthStore } from "../../store/authStore";
import DashboardLayout from "../DashboardLayout";
import { BeakerIcon, FileCheck, Clock, AlertCircle, Activity } from "lucide-react";

const LabTechnologistDashboard = () => {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({
    pendingTests: 14,
    completedToday: 36,
    criticalResults: 3,
    testsThisWeek: 182
  });

  // Simulated lab tests data
  const [labTests, setLabTests] = useState([
    {
      id: "LT38945",
      patient: "William Johnson",
      testName: "Complete Blood Count",
      orderingDoctor: "Dr. Sarah Miller",
      status: "pending",
      priority: "routine",
      receivedAt: "2025-05-04 08:45"
    },
    {
      id: "LT38944",
      patient: "Rebecca Davis",
      testName: "Lipid Panel",
      orderingDoctor: "Dr. Lee Wong",
      status: "completed",
      priority: "routine",
      receivedAt: "2025-05-03 14:20"
    },
    {
      id: "LT38943",
      patient: "Joseph Martinez",
      testName: "Cardiac Enzymes",
      orderingDoctor: "Dr. Emma Thompson",
      status: "critical",
      priority: "urgent",
      receivedAt: "2025-05-03 10:15"
    },
    {
      id: "LT38939",
      patient: "Elizabeth Brown",
      testName: "Thyroid Function",
      orderingDoctor: "Dr. James Wilson",
      status: "completed",
      priority: "routine",
      receivedAt: "2025-05-02 16:30"
    }
  ]);

  // Fetch data in a real implementation
  useEffect(() => {
    // This would be an API call in a real application
    // fetchDashboardData();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "text-yellow-600 bg-yellow-100";
      case "completed":
        return "text-green-600 bg-green-100";
      case "critical":
        return "text-red-600 bg-red-100";
      case "in-progress":
        return "text-blue-600 bg-blue-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "urgent":
        return "text-red-600";
      case "high":
        return "text-orange-600";
      case "routine":
        return "text-blue-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <DashboardLayout title="Laboratory Dashboard" role="lab-technologist">
      <div className="space-y-6">
        {/* Welcome message */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Welcome, {user?.name}</h2>
          <p className="text-gray-600">Laboratory Dashboard • {new Date().toLocaleDateString()}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="bg-yellow-100 p-3 rounded-full">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pending Tests</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.pendingTests}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-full">
                <FileCheck className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Completed Today</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.completedToday}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="bg-red-100 p-3 rounded-full">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Critical Results</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.criticalResults}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-full">
                <Activity className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Tests This Week</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.testsThisWeek}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Lab Tests */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recent Laboratory Tests</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Test</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ordering Doctor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Received</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {labTests.map((test) => (
                  <tr key={test.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">{test.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{test.patient}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{test.testName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{test.orderingDoctor}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`font-medium ${getPriorityColor(test.priority)}`}>
                        {test.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(test.status)}`}>
                        {test.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{test.receivedAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 border-t border-gray-200">
            <button className="text-blue-600 hover:text-blue-900 text-sm font-medium">View all laboratory tests</button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default LabTechnologistDashboard;