import { useState } from "react";
import { Users, Settings, Shield, AlertCircle, Clipboard, User, BarChart2 } from "lucide-react";
import DashboardLayout from "../DashboardLayout";
import { useAuthStore } from "../../store/authStore";

const AdminDashboard = () => {
  const { user } = useAuthStore();
  const [userCount, setUserCount] = useState({
    total: 127,
    doctors: 45,
    pharmacists: 23,
    radiologists: 12,
    labTechnologists: 18,
    hospitalAdmins: 9,
    admins: 3
  });

  const [recentActivity] = useState([
    { id: 1, user: "Dr. Johnson", action: "Updated patient record", time: "5 minutes ago" },
    { id: 2, user: "Pharmacy Team", action: "Fulfilled prescription", time: "15 minutes ago" },
    { id: 3, user: "Lab Tech Michael", action: "Uploaded new test results", time: "30 minutes ago" },
    { id: 4, user: "Hospital Admin Sarah", action: "Added new staff member", time: "1 hour ago" },
    { id: 5, user: "Dr. Williams", action: "Created new patient record", time: "2 hours ago" }
  ]);

  const [systemHealth] = useState({
    uptime: "99.98%",
    responseTime: "230ms",
    activeUsers: 42,
    pendingTasks: 8
  });

  return (
    <DashboardLayout title="Admin Dashboard" role="admin">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Welcome back, {user?.name}</h2>
        <p className="text-gray-600">Here's what's happening across the system today.</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-700">Total Users</h3>
            <Users className="h-8 w-8 text-blue-500" />
          </div>
          <div className="text-3xl font-bold text-gray-900">{userCount.total}</div>
          <div className="mt-2 text-sm text-gray-500">Across all roles</div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-700">System Uptime</h3>
            <BarChart2 className="h-8 w-8 text-green-500" />
          </div>
          <div className="text-3xl font-bold text-gray-900">{systemHealth.uptime}</div>
          <div className="mt-2 text-sm text-gray-500">Last 30 days</div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-700">Active Users</h3>
            <User className="h-8 w-8 text-indigo-500" />
          </div>
          <div className="text-3xl font-bold text-gray-900">{systemHealth.activeUsers}</div>
          <div className="mt-2 text-sm text-gray-500">Currently online</div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-700">Pending Tasks</h3>
            <AlertCircle className="h-8 w-8 text-amber-500" />
          </div>
          <div className="text-3xl font-bold text-gray-900">{systemHealth.pendingTasks}</div>
          <div className="mt-2 text-sm text-gray-500">Requiring attention</div>
        </div>
      </div>

      {/* User distribution and Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* User distribution chart */}
        <div className="lg:col-span-2 bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">User Distribution</h3>
          <div className="flex flex-wrap gap-4">
            {Object.entries(userCount)
              .filter(([key]) => key !== "total")
              .map(([role, count], index) => (
                <div key={role} className="flex-1 min-w-[120px] bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm font-medium text-gray-500">{role.replace(/([A-Z])/g, ' $1').trim()}</div>
                  <div className="text-2xl font-bold mt-1">{count}</div>
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-red-500', 'bg-yellow-500', 'bg-indigo-500'][index % 6]
                      }`}
                      style={{ width: `${(count / userCount.total) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Recent activity */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {recentActivity.map(activity => (
              <div key={activity.id} className="border-b border-gray-100 pb-3 last:border-b-0">
                <div className="font-medium">{activity.user}</div>
                <div className="text-sm text-gray-600">{activity.action}</div>
                <div className="text-xs text-gray-500 mt-1">{activity.time}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="flex flex-col items-center justify-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition">
            <Users className="h-8 w-8 text-blue-600 mb-2" />
            <span className="text-sm font-medium text-blue-900">Add User</span>
          </button>
          
          <button className="flex flex-col items-center justify-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition">
            <Settings className="h-8 w-8 text-green-600 mb-2" />
            <span className="text-sm font-medium text-green-900">System Config</span>
          </button>
          
          <button className="flex flex-col items-center justify-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition">
            <Shield className="h-8 w-8 text-purple-600 mb-2" />
            <span className="text-sm font-medium text-purple-900">Security Report</span>
          </button>
          
          <button className="flex flex-col items-center justify-center p-4 bg-amber-50 rounded-lg hover:bg-amber-100 transition">
            <Clipboard className="h-8 w-8 text-amber-600 mb-2" />
            <span className="text-sm font-medium text-amber-900">View Logs</span>
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;