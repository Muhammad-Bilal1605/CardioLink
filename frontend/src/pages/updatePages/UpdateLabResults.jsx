import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import { useAuthStore } from "../../store/authStore";

function UpdateLabResults() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuthStore();

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`http://localhost:5000/api/lab-results/hospital`, {
          credentials: "include",
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error || data.message || "Failed to load lab results");
        setItems(data.data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, []);

  const handleRowClick = (id) => navigate(`/update-lab-results/${id}`);

  return (
    <DashboardLayout title="Update Lab Results" role={user?.role || "lab-technologist"}>
      <div className="max-w-6xl mx-auto">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Hospital Lab Results</h2>
          <Link to="/upload-lab-results" className="px-3 py-2 bg-green-700 text-white rounded-md text-sm">Upload New</Link>
        </div>

        {loading && <div className="p-6 text-gray-600">Loading...</div>}
        {error && <div className="p-4 mb-4 bg-red-50 text-red-700 border border-red-200 rounded">{error}</div>}

        {!loading && !error && (
          <div className="bg-white shadow rounded-md overflow-hidden">
            <div className="grid grid-cols-12 gap-2 px-4 py-2 text-sm font-medium bg-gray-100 text-gray-700">
              <div className="col-span-5">Test Name</div>
              <div className="col-span-3">Date</div>
              <div className="col-span-4 text-right">Action</div>
            </div>
            {items.length === 0 && <div className="p-6 text-gray-600">No lab results found.</div>}
            {items.map((item) => {
              const patientLabel = typeof item.patientId === 'object' ? (item.patientId?.name || item.patientId?._id || '') : (item.patientId || '');
              return (
              <div key={item._id} className="grid grid-cols-12 gap-2 px-4 py-3 border-t cursor-pointer hover:bg-gray-50" onClick={() => handleRowClick(item._id)}>
                <div className="col-span-5 font-medium">{item.testName}</div>
                <div className="col-span-3">{item.date ? new Date(item.date).toLocaleDateString() : '-'}</div>
                <div className="col-span-4 text-right">
                  <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded" onClick={(e) => { e.stopPropagation(); handleRowClick(item._id); }}>Edit</button>
                </div>
              </div>
            )})}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default UpdateLabResults;


