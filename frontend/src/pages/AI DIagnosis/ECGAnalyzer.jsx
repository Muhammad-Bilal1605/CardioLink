import React from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { useAuthStore } from '../../store/authStore';
import ECGClassifier from '../../components/ECGClassifier';

const ECGAnalyzer = () => {
  const { user } = useAuthStore();
  return (
    <DashboardLayout title="ECG Analysis" role={user?.role}>
        <div className="px-6 py-6">
        <ECGClassifier />
      </div>
    </DashboardLayout>
  );
};

export default ECGAnalyzer;