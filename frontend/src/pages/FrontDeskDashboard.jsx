import React, { useEffect, useState } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { useAuthStore } from "../store/authStore";

function FrontDeskDashboard() {
  const { user } = useAuthStore();
  const [hospitalizations, setHospitalizations] = useState([]);
  const [procedures, setProcedures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        setError(null);
        const [hRes, pRes] = await Promise.all([
          fetch('http://localhost:5000/api/hospitalizations/hospital', { credentials: 'include' }),
          fetch('http://localhost:5000/api/procedures/hospital', { credentials: 'include' })
        ]);
        const [hJson, pJson] = await Promise.all([hRes.json(), pRes.json()]);
        if (!hRes.ok || !hJson.success) throw new Error(hJson.error || hJson.message || 'Failed to load hospitalizations');
        if (!pRes.ok || !pJson.success) throw new Error(pJson.error || pJson.message || 'Failed to load procedures');
        setHospitalizations(hJson.data || []);
        setProcedures(pJson.data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const deleteHospitalization = async (id) => {
    const confirmed = window.confirm('Delete this hospitalization record?');
    if (!confirmed) return;
    try {
      const res = await fetch(`http://localhost:5000/api/hospitalizations/${id}`, { method: 'DELETE', credentials: 'include' });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || data.message || 'Failed to delete');
      setHospitalizations(prev => prev.filter(x => x._id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  const deleteProcedure = async (id) => {
    const confirmed = window.confirm('Delete this procedure record?');
    if (!confirmed) return;
    try {
      const res = await fetch(`http://localhost:5000/api/procedures/${id}`, { method: 'DELETE', credentials: 'include' });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || data.message || 'Failed to delete');
      setProcedures(prev => prev.filter(x => x._id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <DashboardLayout title="Front Desk Dashboard" role={user?.role || "hospital-front-desk"}>
      <div className="max-w-7xl mx-auto">
        <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white rounded-md p-5 mb-6 shadow">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">Front Desk Dashboard</h2>
              <p className="text-sm opacity-90">Welcome, {user?.name}</p>
            </div>
            <div className="text-sm opacity-90">{new Date().toLocaleString()}</div>
          </div>
        </div>

        {error && <div className="p-4 m-4 bg-red-50 text-red-700 border border-red-200 rounded">{error}</div>}
        {loading && <div className="p-6 text-gray-600">Loading...</div>}

        {!loading && !error && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Hospitalizations */}
            <div className="bg-white shadow rounded-md overflow-hidden">
              <div className="px-4 py-4 border-b bg-gray-50 flex items-center justify-between">
                <h3 className="text-base font-semibold text-gray-900">Hospitalizations</h3>
                <div className="text-xs text-gray-500">{hospitalizations.length} records</div>
              </div>
              <div>
                <div className="grid grid-cols-12 gap-2 px-4 py-2 text-sm font-medium bg-gray-100 text-gray-700">
                  <div className="col-span-6">Date</div>
                  <div className="col-span-6 text-right">Actions</div>
                </div>
                {hospitalizations.length === 0 && <div className="p-6 text-gray-600">No records.</div>}
                {hospitalizations.map(item => (
                  <div key={item._id} className="grid grid-cols-12 gap-2 px-4 py-3 border-t items-center">
                    <div className="col-span-6">{item.date ? new Date(item.date).toLocaleDateString() : '-'}</div>
                    <div className="col-span-6 text-right">
                      <button className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 mr-2" onClick={() => window.location.href = `/view-hospitalization/${item._id}`}>View</button>
                      <button className="px-3 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-700" onClick={() => deleteHospitalization(item._id)}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Procedures */}
            <div className="bg-white shadow rounded-md overflow-hidden">
              <div className="px-4 py-4 border-b bg-gray-50 flex items-center justify-between">
                <h3 className="text-base font-semibold text-gray-900">Procedures</h3>
                <div className="text-xs text-gray-500">{procedures.length} records</div>
              </div>
              <div>
                <div className="grid grid-cols-12 gap-2 px-4 py-2 text-sm font-medium bg-gray-100 text-gray-700">
                  <div className="col-span-6">Procedure</div>
                  <div className="col-span-6 text-right">Actions</div>
                </div>
                {procedures.length === 0 && <div className="p-6 text-gray-600">No records.</div>}
                {procedures.map(item => (
                  <div key={item._id} className="grid grid-cols-12 gap-2 px-4 py-3 border-t items-center">
                    <div className="col-span-6 truncate">{item.procedureName}</div>
                    <div className="col-span-6 text-right">
                      <button className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 mr-2" onClick={() => window.location.href = `/view-procedure/${item._id}`}>View</button>
                      <button className="px-3 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-700" onClick={() => deleteProcedure(item._id)}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default FrontDeskDashboard;


