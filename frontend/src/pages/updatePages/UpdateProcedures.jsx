import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import { useAuthStore } from "../../store/authStore";

function UpdateProcedures() {
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
        const res = await fetch(`http://localhost:5000/api/procedures/hospital`, {
          credentials: "include",
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error || data.message || "Failed to load procedures");
        setItems(data.data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, []);

  const handleRowClick = (id) => navigate(`/update-procedures/${id}`);

  return (
    <DashboardLayout title="Update Procedures" role={user?.role || "hospital-front-desk"}>
      <div className="max-w-6xl mx-auto">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Hospital Procedures</h2>
        </div>
        {loading && <div className="p-6 text-gray-600">Loading...</div>}
        {error && <div className="p-4 mb-4 bg-red-50 text-red-700 border border-red-200 rounded">{error}</div>}
        {!loading && !error && (
          <div className="bg-white shadow rounded-md overflow-hidden">
            <div className="grid grid-cols-12 gap-2 px-4 py-2 text-sm font-medium bg-gray-100 text-gray-700">
              <div className="col-span-3">Procedure</div>
              <div className="col-span-2">Date</div>
              <div className="col-span-3">Patient</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2 text-right">Action</div>
            </div>
            {items.length === 0 && <div className="p-6 text-gray-600">No procedures found.</div>}
            {items.map((item) => (
              <div key={item._id} className="grid grid-cols-12 gap-2 px-4 py-3 border-t cursor-pointer hover:bg-gray-50" onClick={() => handleRowClick(item._id)}>
                <div className="col-span-3 font-medium">{item.procedureName}</div>
                <div className="col-span-2">{item.date ? new Date(item.date).toLocaleDateString() : '-'}</div>
                <div className="col-span-3 truncate">{item.patientId}</div>
                <div className="col-span-2">
                  <span className="px-2 py-1 rounded text-xs bg-gray-100 border">{item.status || 'Scheduled'}</span>
                </div>
                <div className="col-span-2 text-right">
                  <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded" onClick={(e) => { e.stopPropagation(); handleRowClick(item._id); }}>Edit</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default UpdateProcedures;


