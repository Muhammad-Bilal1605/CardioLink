import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import { useAuthStore } from "../../store/authStore";

function EditImaging() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [form, setForm] = useState({
    type: "",
    date: "",
    facility: "",
    doctor: "",
    description: "",
    findings: "",
    status: "Pending",
    notes: "",
    imageUrl: "",
  });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchImaging = async () => {
      try {
        setLoading(true);
        const res = await fetch(`http://localhost:5000/api/imaging/${id}`, { credentials: "include" });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error || data.message || "Failed to load imaging");
        const d = data.data;
        setForm({
          type: d.type || "",
          date: d.date ? new Date(d.date).toISOString().slice(0, 10) : "",
          facility: d.facility || "",
          doctor: d.doctor || "",
          description: d.description || "",
          findings: d.findings || "",
          status: d.status || "Pending",
          notes: d.notes || "",
          imageUrl: d.imageUrl || "",
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchImaging();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => formData.append(k, v ?? ""));
      if (file) formData.append("image", file);
      const res = await fetch(`http://localhost:5000/api/imaging/${id}`, {
        method: "PUT",
        credentials: "include",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || data.message || "Failed to update imaging");
      navigate("/update-imagings");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout title="Edit Imaging" role={user?.role || "radiologist"}>
      <div className="max-w-3xl mx-auto bg-white shadow rounded-md p-6">
        {loading ? (
          <div>Loading...</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded">{error}</div>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select name="type" value={form.type} onChange={handleChange} className="w-full border rounded px-3 py-2">
                  <option value="">Select type</option>
                  <option value="X-Ray">X-Ray</option>
                  <option value="MRI">MRI</option>
                  <option value="CT Scan">CT Scan</option>
                  <option value="Ultrasound">Ultrasound</option>
                  <option value="Mammogram">Mammogram</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Date</label>
                <input type="date" name="date" value={form.date} onChange={handleChange} className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Facility</label>
                <input type="text" name="facility" value={form.facility} onChange={handleChange} className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Doctor</label>
                <input type="text" name="doctor" value={form.doctor} onChange={handleChange} className="w-full border rounded px-3 py-2" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea name="description" value={form.description} onChange={handleChange} className="w-full border rounded px-3 py-2" rows={3} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Findings</label>
                <textarea name="findings" value={form.findings} onChange={handleChange} className="w-full border rounded px-3 py-2" rows={4} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select name="status" value={form.status} onChange={handleChange} className="w-full border rounded px-3 py-2">
                  <option>Pending</option>
                  <option>Completed</option>
                  <option>Cancelled</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <input type="text" name="notes" value={form.notes} onChange={handleChange} className="w-full border rounded px-3 py-2" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Replace Image (optional)</label>
                <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                {form.imageUrl && (
                  <div className="mt-2">
                    <img src={form.imageUrl} alt="imaging" className="h-40 object-contain border rounded" />
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => navigate(-1)} className="px-4 py-2 border rounded">Cancel</button>
              <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded">
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        )}
      </div>
    </DashboardLayout>
  );
}

export default EditImaging;


