import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import { useAuthStore } from "../store/authStore";
import HospitalizationDetails from "../components/DoctorComponents/EHR/Hospitalizations/HospitalizationDetails";

function ViewHospitalization() {
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
        const res = await fetch(`http://localhost:5000/api/hospitalizations/${id}`, { credentials: "include" });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.error || json.message || "Failed to load hospitalization");
        setData(json.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchItem();
  }, [id]);

  // Normalize fields so HospitalizationDetails loads associated items like in EHR
  const transformed = data ? {
    ...data,
    labResults: Array.isArray(data.labResults)
      ? data.labResults
      : (Array.isArray(data.associatedLabResults) ? data.associatedLabResults : []),
    imagingStudies: Array.isArray(data.imagingStudies)
      ? data.imagingStudies
      : (Array.isArray(data.associatedImaging) ? data.associatedImaging : []),
    procedures: Array.isArray(data.procedures)
      ? data.procedures
      : (Array.isArray(data.associatedProcedures) ? data.associatedProcedures : []),
  } : null;

  return (
    <DashboardLayout title="View Hospitalization" role={user?.role || "hospital-front-desk"}>
      <div className="max-w-6xl mx-auto">
        {loading && <div className="p-6 text-gray-600">Loading...</div>}
        {error && <div className="p-4 m-4 bg-red-50 text-red-700 border border-red-200 rounded">{error}</div>}
        {!loading && !error && transformed && (
          <HospitalizationDetails hospitalization={transformed} onClose={() => navigate(-1)} />
        )}
      </div>
    </DashboardLayout>
  );
}

export default ViewHospitalization;


