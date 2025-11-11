import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import { useAuthStore } from "../store/authStore";

function ViewLabResult() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchItem = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`http://localhost:5000/api/lab-results/${id}`, { credentials: "include" });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.error || json.message || "Failed to load lab result");
        setData(json.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchItem();
  }, [id]);

  const fileUrl = (() => {
    if (!data?.reportUrl) return '';
    const isAbsolute = typeof data.reportUrl === 'string' && /^https?:\/\//i.test(data.reportUrl);
    if (isAbsolute) return data.reportUrl;
    const fileName = data.reportUrl.split('/').pop();
    return fileName ? `http://localhost:5000/api/lab-results/file/${encodeURIComponent(fileName)}` : data.reportUrl;
  })();

  return (
    <DashboardLayout title="View Lab Result" role={user?.role || "lab-technologist"}>
      <div className="max-w-3xl mx-auto bg-white shadow rounded-md p-6">
        {loading && <div>Loading...</div>}
        {error && <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded">{error}</div>}
        {!loading && !error && data && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-500">Test Name</div>
                <div className="font-medium">{data.testName}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Test Type</div>
                <div className="font-medium">{data.testType}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Date</div>
                <div className="font-medium">{data.date ? new Date(data.date).toLocaleDateString() : '-'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Doctor</div>
                <div className="font-medium">{data.doctor}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Facility</div>
                <div className="font-medium">{data.facility}</div>
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-500">Notes</div>
              <div className="mt-1 p-3 border rounded bg-gray-50 whitespace-pre-wrap">{data.notes || '-'}</div>
            </div>

            {fileUrl && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-gray-500">Report</div>
                  <div className="flex gap-2">
                    <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="px-3 py-1 text-sm border rounded bg-gray-50 hover:bg-gray-100">Open</a>
                    <a href={fileUrl} download className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">Download</a>
                  </div>
                </div>
                {/\.(png|jpg|jpeg|gif)$/i.test(fileUrl) ? (
                  <img src={fileUrl} alt="report" className="max-h-96 object-contain border rounded w-full bg-black/5" />
                ) : (
                  <iframe title="report" src={fileUrl} className="w-full h-96 border rounded" />
                )}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button className="px-4 py-2 border rounded" onClick={() => navigate(-1)}>Back</button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default ViewLabResult;


