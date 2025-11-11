import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import { useAuthStore } from "../store/authStore";

function RadiologistDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [imagings, setImagings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchImagings = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`http://localhost:5000/api/imaging/hospital`, {
          credentials: "include",
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || data.message || "Failed to load imagings");
        }
        setImagings(data.data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchImagings();
  }, []);

  const handleView = (id) => {
    navigate(`/view-imaging/${id}`);
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm('Are you sure you want to delete this imaging record? This action cannot be undone.');
    if (!confirmed) return;
    try {
      const res = await fetch(`http://localhost:5000/api/imaging/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || data.message || 'Failed to delete imaging');
      setImagings((prev) => prev.filter((x) => x._id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <DashboardLayout title="Radiologist Dashboard" role={user?.role || "radiologist"}>
      <div className="max-w-7xl mx-auto">
        {/* Header card */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-md p-5 mb-6 shadow">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">Radiologist Dashboard</h2>
              <p className="text-sm opacity-90">Welcome, {user?.name}</p>
            </div>
            <div className="text-sm opacity-90">{new Date().toLocaleString()}</div>
          </div>
        </div>

        {/* Imaging list */}
        <div className="bg-white shadow rounded-md overflow-hidden">
          <div className="px-4 py-4 border-b bg-gray-50 flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-900">Hospital Imaging Records</h3>
            <div className="text-xs text-gray-500">{imagings.length} records</div>
          </div>

          {loading && <div className="p-6 text-gray-600">Loading...</div>}
          {error && (
            <div className="p-4 m-4 bg-red-50 text-red-700 border border-red-200 rounded">{error}</div>
          )}

          {!loading && !error && (
            <>
              <div className="grid grid-cols-12 gap-2 px-4 py-2 text-sm font-medium bg-gray-100 text-gray-700">
                <div className="col-span-4">Type</div>
                <div className="col-span-4">Date</div>
                <div className="col-span-4 text-right">Actions</div>
              </div>
              {imagings.length === 0 && (
                <div className="p-6 text-gray-600">No imaging records found.</div>
              )}
              {imagings.map((item) => (
                <div key={item._id} className="grid grid-cols-12 gap-2 px-4 py-3 border-t items-center">
                  <div className="col-span-4 font-medium">{item.type}</div>
                  <div className="col-span-4">{item.date ? new Date(item.date).toLocaleDateString() : '-'}</div>
                  <div className="col-span-4 text-right">
                    <button
                      className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 mr-2"
                      onClick={() => handleView(item._id)}
                    >
                      View
                    </button>
                    <button
                      className="px-3 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                      onClick={() => handleDelete(item._id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default RadiologistDashboard;


