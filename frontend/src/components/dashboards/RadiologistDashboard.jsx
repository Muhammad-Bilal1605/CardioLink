import { useState, useEffect } from "react";
import { useAuthStore } from "../../store/authStore";
import DashboardLayout from "../DashboardLayout";
import { Image, FileText, Clock, CheckCircle, Calendar } from "lucide-react";

const RadiologistDashboard = () => {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({
    pendingReports: 8,
    completedToday: 12,
    scheduledExams: 15,
    totalImages: 256
  });

  // Simulated imaging studies data
  const [imagingStudies, setImagingStudies] = useState([
    {
      id: "IM24681",
      patient: "Sophia Miller",
      type: "Chest X-Ray",
      orderingDoctor: "Dr. James Wilson",
      status: "pending",
      priority: "urgent",
      date: "2025-05-04"
    },
    {
      id: "IM24680",
      patient: "Daniel Anderson",
      type: "CT Scan - Cardiac",
      orderingDoctor: "Dr. Emma Thompson",
      status: "completed",
      priority: "normal",
      date: "2025-05-03"
    },
    {
      id: "IM24679",
      patient: "Emily Johnson",
      type: "MRI - Brain",
      orderingDoctor: "Dr. Sarah Miller",
      status: "pending",
      priority: "normal",
      date: "2025-05-03"
    },
    {
      id: "IM24677",
      patient: "Michael Roberts",
      type: "Ultrasound - Carotid",
      orderingDoctor: "Dr. Lee Wong",
      status: "completed",
      priority: "normal",
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
      case "completed":
        return "text-green-600 bg-green-100";
      case "cancelled":
        return "text-red-600 bg-red-100";
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
      case "normal":
        return "text-blue-600";
      case "low":
        return "text-gray-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <DashboardLayout title="Radiology Dashboard" role="radiologist">
      <div className="space-y-6">
        {/* Welcome message */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Welcome, {user?.name}</h2>
          <p className="text-gray-600">Radiology Dashboard • {new Date().toLocaleDateString()}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="bg-yellow-100 p-3 rounded-full">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pending Reports</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.pendingReports}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Completed Today</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.completedToday}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-full">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Scheduled Exams</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.scheduledExams}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="bg-purple-100 p-3 rounded-full">
                <Image className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Images</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalImages}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Imaging Studies */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recent Imaging Studies</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ordering Doctor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {imagingStudies.map((study) => (
                  <tr key={study.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">{study.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{study.patient}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{study.type}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{study.orderingDoctor}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`font-medium ${getPriorityColor(study.priority)}`}>
                        {study.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(study.status)}`}>
                        {study.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{study.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 border-t border-gray-200">
            <button className="text-blue-600 hover:text-blue-900 text-sm font-medium">View all imaging studies</button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )};
  export default RadiologistDashboard;