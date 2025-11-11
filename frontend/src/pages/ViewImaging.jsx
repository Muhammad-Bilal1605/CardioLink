import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import { useAuthStore } from "../store/authStore";

function ViewImaging() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchImaging = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`http://localhost:5000/api/imaging/${id}`, { credentials: "include" });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.error || json.message || "Failed to load imaging");
        setData(json.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchImaging();
  }, [id]);

  return (
    <DashboardLayout title="View Imaging" role={user?.role || "radiologist"}>
      <div className="max-w-3xl mx-auto bg-white shadow rounded-md p-6">
        {loading && <div>Loading...</div>}
        {error && <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded">{error}</div>}
        {!loading && !error && data && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-500">Type</div>
                <div className="font-medium">{data.type}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Date</div>
                <div className="font-medium">{data.date ? new Date(data.date).toLocaleDateString() : '-'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Hospital</div>
                <div className="font-medium">{typeof data.hospitalId === 'object' ? (data.hospitalId?.name || data.hospitalId?._id) : data.hospitalId}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Patient</div>
                <div className="font-medium">{typeof data.patientId === 'object' ? (data.patientId?.name || data.patientId?._id) : data.patientId}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Doctor</div>
                <div className="font-medium">{data.doctor}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Facility</div>
                <div className="font-medium">{data.facility}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Status</div>
                <div className="font-medium">{data.status || 'Pending'}</div>
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-500">Description</div>
              <div className="mt-1 p-3 border rounded bg-gray-50 whitespace-pre-wrap">{data.description}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Findings</div>
              <div className="mt-1 p-3 border rounded bg-gray-50 whitespace-pre-wrap">{data.findings}</div>
            </div>

            {data.imageUrl && (() => {
              const fileName = typeof data.imageUrl === 'string' ? data.imageUrl.split('/').pop() : '';
              const fileUrl = fileName ? `http://localhost:5000/api/imaging/file/${encodeURIComponent(fileName)}` : data.imageUrl;
              return (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm text-gray-500">Image</div>
                    {fileUrl && (
                      <div className="flex gap-2">
                        <a
                          href={fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1 text-sm border rounded bg-gray-50 hover:bg-gray-100"
                        >
                          Open in new tab
                        </a>
                        <a
                          href={fileUrl}
                          download
                          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          Download
                        </a>
                      </div>
                    )}
                  </div>
                  <img src={fileUrl} alt="imaging" className="max-h-96 object-contain border rounded w-full bg-black/5" />
                </div>
              );
            })()}

            <div className="flex justify-end gap-3 pt-2">
              <button className="px-4 py-2 border rounded" onClick={() => navigate(-1)}>Back</button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default ViewImaging;


