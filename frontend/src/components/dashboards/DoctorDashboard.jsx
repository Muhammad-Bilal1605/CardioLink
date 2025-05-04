import { useState } from "react";
import { 
  Stethoscope, Users, Calendar, FileText, Clock, ChevronRight, 
  Activity, Heart, AlertCircle, Plus
} from "lucide-react";
import DashboardLayout from "../DashboardLayout";
import { useAuthStore } from "../../store/authStore";

const DoctorDashboard = () => {
  const { user } = useAuthStore();
  const [appointments, setAppointments] = useState([
    { id: 1, patient: "John Smith", time: "09:00 AM", status: "confirmed", purpose: "Annual checkup" },
    { id: 2, patient: "Emily Johnson", time: "10:30 AM", status: "confirmed", purpose: "Cardiac evaluation" },
    { id: 3, patient: "Robert Williams", time: "11:45 AM", status: "confirmed", purpose: "Post-surgery follow-up" },
    { id: 4, patient: "Maria Garcia", time: "02:15 PM", status: "pending", purpose: "Echocardiogram results" },
    { id: 5, patient: "James Wilson", time: "03:30 PM", status: "confirmed", purpose: "New patient consultation" }
  ]);

  const [stats] = useState({
    patients: 248,
    appointments: {
      today: 8,
      pending: 3
    },
    criticalCases: 4
  });

  const [recentPatients] = useState([
    { id: 101, name: "Robert Brown", age: 62, condition: "Hypertension", lastVisit: "Yesterday" },
    { id: 102, name: "Linda Davis", age: 54, condition: "Arrhythmia", lastVisit: "2 days ago" },
    { id: 103, name: "Michael Lee", age: 70, condition: "Post MI recovery", lastVisit: "1 week ago" }
  ]);

  return (
    <DashboardLayout title="Doctor Dashboard" role="doctor">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Welcome back, Dr. {user?.name}</h2>
        <p className="text-gray-600">Here's your schedule and patient overview for today.</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-700">Your Patients</h3>
            <Users className="h-8 w-8 text-blue-500" />
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats.patients}</div>
          <div className="mt-2 text-sm text-gray-500">Total patients under care</div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-700">Today</h3>
            <Calendar className="h-8 w-8 text-green-500" />
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats.appointments.today}</div>
          <div className="mt-2 text-sm text-gray-500">Appointments scheduled</div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-700">Pending</h3>
            <Clock className="h-8 w-8 text-yellow-500" />
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats.appointments.pending}</div>
          <div className="mt-2 text-sm text-gray-500">Appointment requests</div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-700">Critical Cases</h3>
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats.criticalCases}</div>
          <div className="mt-2 text-sm text-gray-500">Requiring attention</div>
        </div>
      </div>

      {/* Today's appointments */}
      <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-700">Today's Appointments</h3>
          <a href="#" className="text-sm font-medium text-blue-600 hover:text-blue-500 flex items-center">
            View All <ChevronRight className="h-4 w-4 ml-1" />
          </a>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Purpose
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {appointments.map((appointment) => (
                <tr key={appointment.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {appointment.patient}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{appointment.time}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{appointment.purpose}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${appointment.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {appointment.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <a href="#" className="text-blue-600 hover:text-blue-900 mr-3">View</a>
                    <a href="#" className="text-green-600 hover:text-green-900">Start</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent patients and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Recent patients */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-700">Recent Patients</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {recentPatients.map((patient) => (
              <div key={patient.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{patient.name}</p>
                    <p className="text-sm text-gray-500">
                      Age: {patient.age} | Condition: {patient.condition}
                    </p>
                  </div>
                  <div className="flex items-center">
                    <span className="text-xs text-gray-500 mr-4">Last visit: {patient.lastVisit}</span>
                    <button className="text-blue-600 hover:text-blue-800">
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="px-6 py-4 bg-gray-50">
            <a href="#" className="text-sm font-medium text-blue-600 hover:text-blue-500">
              View all patients
            </a>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-700">Quick Actions</h3>
          </div>
          <div className="p-6 space-y-4">
            <button className="w-full flex items-center justify-center px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition">
              <Plus className="mr-2 h-5 w-5" />
              New Appointment
            </button>
            
            <button className="w-full flex items-center justify-center px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition">
              <FileText className="mr-2 h-5 w-5" />
              Create Patient Record
            </button>
            
            <button className="w-full flex items-center justify-center px-4 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition">
              <Activity className="mr-2 h-5 w-5" />
              Write Prescription
            </button>

            <button className="w-full flex items-center justify-center px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition">
              <Heart className="mr-2 h-5 w-5" />
              Cardiac Emergency
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DoctorDashboard;