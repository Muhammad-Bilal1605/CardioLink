import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import { useAuthStore } from "../../store/authStore";

function EditHospitalization() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [form, setForm] = useState({
    date: "",
    hospital: "",
    reason: "",
    admissionType: "Emergency",
    attendingPhysician: "",
    proceduresDone: [],
    durationOfStay: "",
    outcome: "",
    dischargeSummary: "",
    status: "Active",
    notes: "",
  });
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/hospitalizations/${id}`, { credentials: "include" });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error || data.message || "Failed to load hospitalization");
        const d = data.data;
        setForm({
          date: d.date ? new Date(d.date).toISOString().slice(0, 10) : "",
          hospital: d.hospital || "",
          reason: d.reason || "",
          admissionType: d.admissionType || "Emergency",
          attendingPhysician: d.attendingPhysician || "",
          proceduresDone: d.proceduresDone || [],
          durationOfStay: d.durationOfStay || "",
          outcome: d.outcome || "",
          dischargeSummary: d.dischargeSummary || "",
          status: d.status || "Active",
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

  const handleProceduresChange = (index, value) => {
    setForm((prev) => {
      const next = [...prev.proceduresDone];
      next[index] = value;
      return { ...prev, proceduresDone: next };
    });
  };
  const addProcedure = () => setForm((prev) => ({ ...prev, proceduresDone: [...prev.proceduresDone, ""] }));
  const removeProcedure = (i) => setForm((prev) => ({ ...prev, proceduresDone: prev.proceduresDone.filter((_, idx) => idx !== i) }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      const res = await fetch(`http://localhost:5000/api/hospitalizations/${id}`, {
        method: "PUT",
        credentials: "include",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || data.message || "Failed to update hospitalization");
      navigate("/update-hospitalizations");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout title="Edit Hospitalization" role={user?.role || "hospital-front-desk"}>
      <div className="max-w-3xl mx-auto bg-white shadow rounded-md p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded">{error}</div>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Date</label>
              <input type="date" className="w-full border rounded px-3 py-2" name="date" value={form.date} onChange={handleChange} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Hospital</label>
              <input className="w-full border rounded px-3 py-2" name="hospital" value={form.hospital} onChange={handleChange} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Reason</label>
              <input className="w-full border rounded px-3 py-2" name="reason" value={form.reason} onChange={handleChange} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Admission Type</label>
              <select className="w-full border rounded px-3 py-2" name="admissionType" value={form.admissionType} onChange={handleChange}>
                <option>Emergency</option>
                <option>Elective</option>
                <option>Urgent</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Attending Physician</label>
              <input className="w-full border rounded px-3 py-2" name="attendingPhysician" value={form.attendingPhysician} onChange={handleChange} />
            </div>
            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium">Procedures Done</label>
                <button type="button" className="px-2 py-1 text-sm border rounded" onClick={addProcedure}>Add</button>
              </div>
              <div className="space-y-2">
                {form.proceduresDone.map((p, i) => (
                  <div key={i} className="flex gap-2">
                    <input className="flex-1 border rounded px-2 py-1" value={p} onChange={(e) => handleProceduresChange(i, e.target.value)} />
                    <button type="button" className="px-2 py-1 text-sm border rounded" onClick={() => removeProcedure(i)}>Remove</button>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Duration of Stay</label>
              <input className="w-full border rounded px-3 py-2" name="durationOfStay" value={form.durationOfStay} onChange={handleChange} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Outcome</label>
              <input className="w-full border rounded px-3 py-2" name="outcome" value={form.outcome} onChange={handleChange} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Discharge Summary</label>
              <textarea className="w-full border rounded px-3 py-2" rows={4} name="dischargeSummary" value={form.dischargeSummary} onChange={handleChange} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select className="w-full border rounded px-3 py-2" name="status" value={form.status} onChange={handleChange}>
                <option>Active</option>
                <option>Discharged</option>
                <option>Transferred</option>
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

export default EditHospitalization;


