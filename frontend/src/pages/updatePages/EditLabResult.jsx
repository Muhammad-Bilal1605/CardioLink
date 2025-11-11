import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import { useAuthStore } from "../../store/authStore";

function EditLabResult() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [form, setForm] = useState({
    testName: "",
    testType: "",
    date: "",
    facility: "",
    doctor: "",
    results: [],
    status: "Pending",
    notes: "",
    reportUrl: "",
  });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchItem = async () => {
      try {
        setLoading(true);
        const res = await fetch(`http://localhost:5000/api/lab-results/${id}`, { credentials: "include" });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error || data.message || "Failed to load lab result");
        const d = data.data;
        setForm({
          testName: d.testName || "",
          testType: d.testType || "",
          date: d.date ? new Date(d.date).toISOString().slice(0, 10) : "",
          facility: d.facility || "",
          doctor: d.doctor || "",
          results: d.results || [],
          status: d.status || "Pending",
          notes: d.notes || "",
          reportUrl: d.reportUrl || "",
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchItem();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleResultChange = (index, field, value) => {
    setForm((prev) => {
      const next = [...prev.results];
      next[index] = { ...next[index], [field]: value };
      return { ...prev, results: next };
    });
  };

  const addResultRow = () => setForm((prev) => ({ ...prev, results: [...prev.results, { parameter: "", value: "", unit: "", referenceRange: "", status: "Normal" }] }));
  const removeResultRow = (index) => setForm((prev) => ({ ...prev, results: prev.results.filter((_, i) => i !== index) }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      const formData = new FormData();
      formData.append("testName", form.testName);
      formData.append("testType", form.testType);
      formData.append("date", form.date);
      formData.append("facility", form.facility);
      formData.append("doctor", form.doctor);
      formData.append("status", form.status);
      formData.append("notes", form.notes);
      formData.append("results", JSON.stringify(form.results));
      if (file) formData.append("document", file);

      const res = await fetch(`http://localhost:5000/api/lab-results/${id}`, {
        method: "PUT",
        credentials: "include",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || data.message || "Failed to update lab result");
      navigate("/update-lab-results");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout title="Edit Lab Result" role={user?.role || "lab-technologist"}>
      <div className="max-w-3xl mx-auto bg-white shadow rounded-md p-6">
        {loading ? (
          <div>Loading...</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded">{error}</div>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Test Name</label>
                <input type="text" name="testName" value={form.testName} onChange={handleChange} className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Test Type</label>
                <select name="testType" value={form.testType} onChange={handleChange} className="w-full border rounded px-3 py-2">
                  <option value="">Select type</option>
                  <option>Blood Test</option>
                  <option>Urine Test</option>
                  <option>Stool Test</option>
                  <option>Culture</option>
                  <option>Biopsy</option>
                  <option>Other</option>
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
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium">Results</label>
                <button type="button" className="px-2 py-1 text-sm border rounded" onClick={addResultRow}>Add</button>
              </div>
              <div className="space-y-3">
                {form.results.map((r, i) => (
                  <div key={i} className="grid grid-cols-1 md:grid-cols-6 gap-2 items-end">
                    <input placeholder="Parameter" className="border rounded px-2 py-1" value={r.parameter} onChange={(e) => handleResultChange(i, 'parameter', e.target.value)} />
                    <input placeholder="Value" className="border rounded px-2 py-1" value={r.value} onChange={(e) => handleResultChange(i, 'value', e.target.value)} />
                    <input placeholder="Unit" className="border rounded px-2 py-1" value={r.unit || ''} onChange={(e) => handleResultChange(i, 'unit', e.target.value)} />
                    <input placeholder="Ref Range" className="border rounded px-2 py-1" value={r.referenceRange || ''} onChange={(e) => handleResultChange(i, 'referenceRange', e.target.value)} />
                    <select className="border rounded px-2 py-1" value={r.status || 'Normal'} onChange={(e) => handleResultChange(i, 'status', e.target.value)}>
                      <option>Normal</option>
                      <option>High</option>
                      <option>Low</option>
                      <option>Critical</option>
                    </select>
                    <button type="button" className="px-2 py-1 text-sm border rounded" onClick={() => removeResultRow(i)}>Remove</button>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <label className="block text-sm font-medium mb-1">Replace Document (optional)</label>
                <input type="file" accept=".pdf,image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                {form.reportUrl && (
                  <div className="mt-2 text-sm">
                    Current: <a className="text-blue-600 underline" href={form.reportUrl.startsWith('http') ? form.reportUrl : `http://localhost:5000${form.reportUrl}`} target="_blank" rel="noreferrer">Open</a>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => navigate(-1)} className="px-4 py-2 border rounded">Cancel</button>
              <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded">{saving ? "Saving..." : "Save Changes"}</button>
            </div>
          </form>
        )}
      </div>
    </DashboardLayout>
  );
}

export default EditLabResult;


