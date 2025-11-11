import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import { useAuthStore } from "../store/authStore";

function ViewProcedure() {
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
        const res = await fetch(`http://localhost:5000/api/procedures/${id}`, { credentials: "include" });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.error || json.message || "Failed to load procedure");
        setData(json.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchItem();
  }, [id]);

  const fileLinks = (paths) => {
    if (!Array.isArray(paths)) return [];
    return paths.map((p) => (/^https?:\/\//i.test(p) ? p : `http://localhost:5000${p}`));
  };

  const documentLinks = fileLinks(data?.documents);
  const imageLinks = fileLinks(data?.images);

  return (
    <DashboardLayout title="View Procedure" role={user?.role || "hospital-front-desk"}>
      <div className="max-w-3xl mx-auto bg-white shadow rounded-md p-6">
        {loading && <div>Loading...</div>}
        {error && <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded">{error}</div>}
        {!loading && !error && data && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-500">Procedure</div>
                <div className="font-medium">{data.procedureName}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Date</div>
                <div className="font-medium">{data.date ? new Date(data.date).toLocaleDateString() : '-'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Physician</div>
                <div className="font-medium">{data.physician || '-'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Hospital</div>
                <div className="font-medium">{data.hospital || '-'}</div>
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-500">Indication</div>
              <div className="mt-1 p-3 border rounded bg-gray-50 whitespace-pre-wrap">{data.indication || '-'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Findings</div>
              <div className="mt-1 p-3 border rounded bg-gray-50 whitespace-pre-wrap">{data.findings || '-'}</div>
            </div>
            {data.complications && (
              <div>
                <div className="text-sm text-gray-500">Complications</div>
                <div className="mt-1 p-3 border rounded bg-gray-50 whitespace-pre-wrap">{data.complications}</div>
              </div>
            )}
            <div>
              <div className="text-sm text-gray-500">Follow-up Plan</div>
              <div className="mt-1 p-3 border rounded bg-gray-50 whitespace-pre-wrap">{data.followUpPlan || '-'}</div>
            </div>

            {imageLinks.length > 0 && (
              <div>
                <div className="text-sm text-gray-500 mb-2">Images</div>
                <div className="grid grid-cols-2 gap-3">
                  {imageLinks.map((url, i) => (
                    <div key={i} className="border rounded p-2 bg-black/5">
                      <img src={url} alt={`image-${i+1}`} className="max-h-56 w-full object-contain" />
                      <div className="mt-2 flex justify-end gap-2">
                        <a href={url} target="_blank" rel="noopener noreferrer" className="px-2 py-1 text-xs border rounded bg-gray-50 hover:bg-gray-100">Open</a>
                        <a href={url} download className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700">Download</a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {documentLinks.length > 0 && (
              <div>
                <div className="text-sm text-gray-500 mb-2">Documents</div>
                <div className="space-y-2">
                  {documentLinks.map((url, i) => (
                    <div key={i} className="flex items-center justify-between p-2 border rounded">
                      <div className="text-sm truncate">Document {i+1}</div>
                      <div className="flex gap-2">
                        <a href={url} target="_blank" rel="noopener noreferrer" className="px-2 py-1 text-xs border rounded bg-gray-50 hover:bg-gray-100">Open</a>
                        <a href={url} download className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700">Download</a>
                      </div>
                    </div>
                  ))}
                </div>
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

export default ViewProcedure;


