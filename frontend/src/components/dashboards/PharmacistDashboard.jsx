import { useState, useEffect } from "react";
import { useAuthStore } from "../../store/authStore";
import DashboardLayout from "../DashboardLayout";
import { Package, Clipboard, Users, AlertCircle, Activity } from "lucide-react";

const PharmacistDashboard = () => {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({
    pendingPrescriptions: 12,
    dispensedToday: 28,
    availableMedications: 437,
    lowStockItems: 8
  });

  // Simulated recent prescriptions data
  const [recentPrescriptions, setRecentPrescriptions] = useState([
    {
      id: "RX23945",
      patient: "Maria Johnson",
      doctor: "Dr. Lee Wong",
      medication: "Atorvastatin 20mg",
      status: "pending",
      date: "2025-05-03"
    },
    {
      id: "RX23944",
      patient: "James Smith",
      doctor: "Dr. Sarah Miller",
      medication: "Lisinopril 10mg",
      status: "dispensed",
      date: "2025-05-03"
    },
    {
      id: "RX23942",
      patient: "Robert Brown",
      doctor: "Dr. Emma Thompson",
      medication: "Metoprolol 50mg",
      status: "pending",
      date: "2025-05-03"
    },
    {
      id: "RX23936",
      patient: "Linda Davis",
      doctor: "Dr. Lee Wong",
      medication: "Amlodipine 5mg",
      status: "dispensed",
      date: "2025-05-02"
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
      case "dispensed":
        return "text-green-600 bg-green-100";
      case "cancelled":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  return (
    <DashboardLayout title="Pharmacy Dashboard" role="pharmacist">
      <div className="space-y-6">
        {/* Welcome message */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Welcome, {user?.name}</h2>
          <p className="text-gray-600">Pharmacy Dashboard • {new Date().toLocaleDateString()}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-full">
                <Clipboard className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pending Prescriptions</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.pendingPrescriptions}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-full">
                <Activity className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Dispensed Today</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.dispensedToday}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="bg-purple-100 p-3 rounded-full">
                <Package className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Available Medications</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.availableMedications}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="bg-red-100 p-3 rounded-full">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Low Stock Items</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.lowStockItems}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Prescriptions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recent Prescriptions</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Medication</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentPrescriptions.map((prescription) => (
                  <tr key={prescription.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">{prescription.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{prescription.patient}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{prescription.doctor}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{prescription.medication}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(prescription.status)}`}>
                        {prescription.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{prescription.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 border-t border-gray-200">
            <button className="text-blue-600 hover:text-blue-900 text-sm font-medium">View all prescriptions</button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PharmacistDashboard;