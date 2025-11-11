import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import { useAuthStore } from "../../store/authStore";

function EditProcedure() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [form, setForm] = useState({
    procedureName: "",
    date: "",
    hospital: "",
    physician: "",
    indication: "",
    findings: "",
    complications: "",
    followUpPlan: "",
    status: "Scheduled",
    notes: "",
  });
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/procedures/${id}`, { credentials: "include" });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error || data.message || "Failed to load procedure");
        const d = data.data;
        setForm({
          procedureName: d.procedureName || "",
          date: d.date ? new Date(d.date).toISOString().slice(0, 10) : "",
          hospital: d.hospital || "",
          physician: d.physician || "",
          indication: d.indication || "",
          findings: d.findings || "",
          complications: d.complications || "",
          followUpPlan: d.followUpPlan || "",
          status: d.status || "Scheduled",
          notes: d.notes || "",
        });
      } catch (err) {
        setError(err.message);
      }
    };
    fetchItem();
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
      const res = await fetch(`http://localhost:5000/api/procedures/${id}`, {
        method: "PUT",
        credentials: "include",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || data.message || "Failed to update procedure");
      navigate("/update-procedures");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout title="Edit Procedure" role={user?.role || "hospital-front-desk"}>
      <div className="max-w-3xl mx-auto bg-white shadow rounded-md p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded">{error}</div>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Procedure Name</label>
              <input className="w-full border rounded px-3 py-2" name="procedureName" value={form.procedureName} onChange={handleChange} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Date</label>
              <input type="date" className="w-full border rounded px-3 py-2" name="date" value={form.date} onChange={handleChange} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Hospital</label>
              <input className="w-full border rounded px-3 py-2" name="hospital" value={form.hospital} onChange={handleChange} />
            </div>
            <div>
              <label className="block text sm font-medium mb-1">Physician</label>
              <input className="w-full border rounded px-3 py-2" name="physician" value={form.physician} onChange={handleChange} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Indication</label>
              <input className="w-full border rounded px-3 py-2" name="indication" value={form.indication} onChange={handleChange} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Findings</label>
              <textarea className="w-full border rounded px-3 py-2" rows={3} name="findings" value={form.findings} onChange={handleChange} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Complications</label>
              <input className="w-full border rounded px-3 py-2" name="complications" value={form.complications} onChange={handleChange} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Follow Up Plan</label>
              <input className="w-full border rounded px-3 py-2" name="followUpPlan" value={form.followUpPlan} onChange={handleChange} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select className="w-full border rounded px-3 py-2" name="status" value={form.status} onChange={handleChange}>
                <option>Scheduled</option>
                <option>Completed</option>
                <option>Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Notes</label>
              <input className="w-full border rounded px-3 py-2" name="notes" value={form.notes} onChange={handleChange} />
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => navigate(-1)} className="px-4 py-2 border rounded">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded">{saving ? 'Saving...' : 'Save Changes'}</button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}

export default EditProcedure;


