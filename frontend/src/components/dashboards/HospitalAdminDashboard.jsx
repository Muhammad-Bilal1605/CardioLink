import { useState, useEffect } from "react";
import { useAuthStore } from "../../store/authStore";
import DashboardLayout from "../DashboardLayout";
import { 
  Users, 
  Calendar, 
  Hospital, 
  CreditCard, 
  ArrowUp, 
  ArrowDown, 
  FileText, 
  Building2, 
  Plus,
  UserPlus,
  Stethoscope,
  ImagePlus,
  Beaker,
  UserCheck,
  Phone,
  Mail,
  Calendar as CalendarIcon,
  Badge
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import AddHospitalPersonnelModal from "../Modals/AddHospitalPersonnelModal";

const HospitalAdminDashboard = () => {
  const { user, getHospitalPersonnel } = useAuthStore();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalStaff: 142,
    occupancyRate: 78,
    averageLOS: 4.3,
    revenueToday: 42750
  });

  // Personnel management states
  const [personnel, setPersonnel] = useState([]);
  const [loadingPersonnel, setLoadingPersonnel] = useState(false);
  const [showAddPersonnelModal, setShowAddPersonnelModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState('all');

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
    fetchPersonnel();
  }, []);

  // Fetch hospital personnel
  const fetchPersonnel = async () => {
    setLoadingPersonnel(true);
    try {
      const response = await getHospitalPersonnel();
      if (response.success) {
        setPersonnel(response.personnel);
        // Update staff count in stats
        setStats(prev => ({
          ...prev,
          totalStaff: response.personnel.length
        }));
      }
    } catch (error) {
      console.error('Error fetching personnel:', error);
    } finally {
      setLoadingPersonnel(false);
    }
  };

  // Handle personnel addition
  const handlePersonnelAdded = (newPersonnel) => {
    setPersonnel(prev => [...prev, newPersonnel]);
    setStats(prev => ({
      ...prev,
      totalStaff: prev.totalStaff + 1
    }));
  };

  // Filter personnel by role
  const filteredPersonnel = selectedRole === 'all' 
    ? personnel 
    : personnel.filter(p => p.role === selectedRole);

  // Get role icon
  const getRoleIcon = (role) => {
    switch (role) {
      case 'doctor':
        return <Stethoscope className="h-5 w-5" />;
      case 'radiologist':
        return <ImagePlus className="h-5 w-5" />;
      case 'lab-technologist':
        return <Beaker className="h-5 w-5" />;
      case 'hospital-front-desk':
        return <UserCheck className="h-5 w-5" />;
      default:
        return <Users className="h-5 w-5" />;
    }
  };

  // Get role color
  const getRoleColor = (role) => {
    switch (role) {
      case 'doctor':
        return 'bg-blue-100 text-blue-800';
      case 'radiologist':
        return 'bg-purple-100 text-purple-800';
      case 'lab-technologist':
        return 'bg-green-100 text-green-800';
      case 'hospital-front-desk':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Role statistics
  const roleStats = {
    all: personnel.length,
    doctor: personnel.filter(p => p.role === 'doctor').length,
    radiologist: personnel.filter(p => p.role === 'radiologist').length,
    'lab-technologist': personnel.filter(p => p.role === 'lab-technologist').length,
    'hospital-front-desk': personnel.filter(p => p.role === 'hospital-front-desk').length,
  };

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

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div 
            onClick={() => navigate('/hospital-admin')}
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md cursor-pointer transition-shadow duration-200"
          >
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-full">
                <Building2 className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Hospital Registrations</h3>
                <p className="text-sm text-gray-600">Manage hospital registration applications</p>
              </div>
            </div>
          </div>
          
          <div 
            onClick={() => navigate('/hospital-registration')}
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md cursor-pointer transition-shadow duration-200"
          >
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-full">
                <FileText className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Register New Hospital</h3>
                <p className="text-sm text-gray-600">Submit new hospital registration</p>
              </div>
            </div>
          </div>
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

        {/* Hospital Personnel Management */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Hospital Personnel</h3>
              <button
                onClick={() => setShowAddPersonnelModal(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add Personnel
              </button>
            </div>
          </div>

          {/* Role Filter Tabs */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center space-x-1">
              {[
                { key: 'all', label: 'All Personnel', count: roleStats.all },
                { key: 'doctor', label: 'Doctors', count: roleStats.doctor },
                { key: 'radiologist', label: 'Radiologists', count: roleStats.radiologist },
                { key: 'lab-technologist', label: 'Lab Technologists', count: roleStats['lab-technologist'] },
                { key: 'hospital-front-desk', label: 'Front Desk', count: roleStats['hospital-front-desk'] }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setSelectedRole(tab.key)}
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    selectedRole === tab.key
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>
          </div>

          {/* Personnel List */}
          <div className="p-6">
            {loadingPersonnel ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Loading personnel...</span>
              </div>
            ) : filteredPersonnel.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Personnel Found</h3>
                <p className="text-gray-600 mb-4">
                  {selectedRole === 'all' 
                    ? "No personnel have been added to your hospital yet." 
                    : `No ${selectedRole.replace('-', ' ')} personnel found.`}
                </p>
                <button
                  onClick={() => setShowAddPersonnelModal(true)}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Your First Personnel
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPersonnel.map((person) => (
                  <div key={person._id} className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-gray-300 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center">
                        <div className="bg-white p-2 rounded-full mr-3">
                          {getRoleIcon(person.role)}
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900">{person.name}</h4>
                          <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(person.role)}`}>
                            {person.role.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center text-gray-600">
                        <Mail className="h-4 w-4 mr-2" />
                        <span className="truncate">{person.email}</span>
                      </div>
                      
                      {person.specialty && (
                        <div className="flex items-center text-gray-600">
                          <Badge className="h-4 w-4 mr-2" />
                          <span>Specialty: {person.specialty}</span>
                        </div>
                      )}
                      
                      {person.department && (
                        <div className="flex items-center text-gray-600">
                          <Building2 className="h-4 w-4 mr-2" />
                          <span>Dept: {person.department}</span>
                        </div>
                      )}
                      
                      {person.licenseNumber && (
                        <div className="flex items-center text-gray-600">
                          <FileText className="h-4 w-4 mr-2" />
                          <span>License: {person.licenseNumber}</span>
                        </div>
                      )}
                      
                      {person.certificationNumber && (
                        <div className="flex items-center text-gray-600">
                          <FileText className="h-4 w-4 mr-2" />
                          <span>Cert: {person.certificationNumber}</span>
                        </div>
                      )}
                      
                      {person.employeeId && (
                        <div className="flex items-center text-gray-600">
                          <Badge className="h-4 w-4 mr-2" />
                          <span>ID: {person.employeeId}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center text-gray-600">
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        <span>Joined: {new Date(person.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Personnel Modal */}
      <AddHospitalPersonnelModal
        isOpen={showAddPersonnelModal}
        onClose={() => setShowAddPersonnelModal(false)}
        onPersonnelAdded={handlePersonnelAdded}
      />
    </DashboardLayout>
  );
};

export default HospitalAdminDashboard;