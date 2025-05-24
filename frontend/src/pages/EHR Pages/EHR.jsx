// src/pages/EHR.jsx

import React, { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import LeftRow1 from '../../components/DoctorComponents/EHR/Overview/LeftRow1';
import LeftRow2 from '../../components/DoctorComponents/EHR/Overview/LeftRow2';
import RightRow1 from '../../components/DoctorComponents/EHR/Overview/RightRow1/RightRow1Final';
import RightRow2Column2 from '../../components/DoctorComponents/EHR/Overview/RightRow2Column2';
import RightRow2Column1 from '../../components/DoctorComponents/EHR/Overview/RightRow2Column1';
import RightRow3 from '../../components/DoctorComponents/EHR/Overview/RightRow3';
import CurrentMedications from '../../components/DoctorComponents/EHR/Overview/Medications/CurrentMedications';
import PatientVisits from '../../components/DoctorComponents/EHR/Visits/PatientVisits';
import VitalsPage from '../../components/DoctorComponents/EHR/Vitals/VitalsPage';

import SocialHistory from '../../components/DoctorComponents/EHR/SocialHistory';
import SpecialDirectives from '../../components/DoctorComponents/EHR/SpecialDirectives';
import axios from 'axios';
import PatientHospitalizations from '../../components/DoctorComponents/EHR/Hospitalizations/PatientHospitalizations';
import PatientProcedures from '../../components/DoctorComponents/EHR/Procedures/PatientProcedures';
import PatientLabs from '../../components/DoctorComponents/EHR/Labs/PatientLabs';
import PatientImaging from '../../components/DoctorComponents/EHR/Imaging/PatientImaging';
import { ArrowLeft, Menu, X, User, UserCheck, Users, Calendar, Clipboard, FileText, Activity, Upload, Heart } from 'lucide-react';
import { usePatient } from '../../context/PatientContext';


function EHR() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentPatientId, currentPatient, getActivePatientId, getActivePatient, setActivePatient } = usePatient();
  
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activePage, setActivePage] = useState('overview');
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Get patient ID from context
  const patientId = getActivePatientId();
  
  // Log patientId for debugging
  console.log('EHR - Using patientId from context:', patientId);

  // Check for tab query parameter
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tabParam = searchParams.get('tab');
    if (tabParam) {
      setActivePage(tabParam);
    }
  }, [location.search]);

  // Redirect to patient list if no patient is selected
  useEffect(() => {
    if (!patientId) {
      console.log('No patient selected, redirecting to patient list');
      navigate('/patients');
      return;
    }
  }, [patientId, navigate]);

  // Fetch patient data
  useEffect(() => {
    const fetchPatientData = async () => {
      if (!patientId) return;
      
      // First check if we already have patient data in context
      const existingPatient = getActivePatient();
      if (existingPatient) {
        setPatient(existingPatient);
        setLoading(false);
        return;
      }
      
      // If not, fetch from API
      try {
        setLoading(true);
        const response = await axios.get(`http://localhost:5000/api/patients/${patientId}`);
        if (response.data.success) {
          const patientData = response.data.data;
          setPatient(patientData);
          // Update context with fetched data
          setActivePatient(patientId, patientData);
        } else {
          setError('Failed to fetch patient data');
        }
      } catch (err) {
        console.error('Error fetching patient:', err);
        setError('Failed to connect to server');
      } finally {
        setLoading(false);
      }
    };

    fetchPatientData();
  }, [patientId, getActivePatient, setActivePatient]);

  // Check screen size on mount and window resize
  useEffect(() => {
    const checkScreenSize = () => {
      const newIsMobile = window.innerWidth < 768;
      setIsMobile(newIsMobile);
      
      // Only auto-close sidebar on initial load if mobile
      if (!sidebarOpen && !newIsMobile) {
        setSidebarOpen(true);
      }
    };

    // Initial check
    checkScreenSize();

    // Add event listener
    window.addEventListener('resize', checkScreenSize);

    // Clean up
    return () => window.removeEventListener('resize', checkScreenSize);
  }, [sidebarOpen]);

  // Show loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="bg-red-100 text-red-700 p-4 rounded-md">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-screen w-full overflow-hidden bg-gray-50">
      
      

      {/* Mobile Toggle Button */}
      {isMobile && (
        <button 
          className="bg-blue-600 text-white p-2 m-2 rounded-md shadow-md fixed top-0 right-0 z-50"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
        >
          {sidebarOpen ? '✕' : '≡'}
        </button>
      )}
      
      {/* Left Sidebar - Modified for better mobile support */}
      <div 
        className={`${
          isMobile 
            ? 'fixed z-40 top-0 left-0 h-full w-4/5 shadow-lg' 
            : 'w-full md:w-1/5'} 
          bg-gray-100 flex flex-col justify-between overflow-y-auto transition-all duration-300 ease-in-out
          ${isMobile && !sidebarOpen ? '-translate-x-full' : 'translate-x-0'}`}
        style={{ maxHeight: '100vh' }}
      >
        {/* Sidebar Content */}
        <div className="p-4 flex flex-col h-full">
          {/* Left Row 1 */}
          <div className="mb-4 flex-grow">
            <LeftRow1
              patientId={patientId}
              name="John Doe"
              age={32}
              gender="Male"
              socialHistory={[
                { key: 'Smoker', value: 'No' },
                { key: 'Alcohol', value: 'Occasionally' }
              ]}
              advancedDirective={[
                { key: 'DNR', value: 'No' },
                { key: 'Living Will', value: 'Yes' }
              ]}
              allergies={[
                { key: 'Peanuts', value: 'Severe' },
                { key: 'Dust', value: 'Mild' }
              ]}
            />
          </div>

          {/* Left Row 2 */}
          <div className="mb-2">
            <LeftRow2 
              activePage={activePage} 
              onPageChange={(pageId) => setActivePage(pageId)} 
            />
          </div>
        </div>
      </div>

      {/* Semi-transparent overlay that closes sidebar when clicked (mobile only) */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close sidebar overlay"
        />
      )}

      {/* Right Content */}
      <div 
        className={`w-full md:w-4/5 p-2 md:p-4 flex flex-col space-y-4 overflow-y-auto bg-gray-50`}
        style={{ 
          paddingTop: isMobile ? '3rem' : '1rem',
          height: '100vh'
        }}
      >
        {activePage === 'overview' && (
          <>
            {/* Right Row 1 */}
            <div className="bg-green-50 rounded-lg p-3 md:p-6 flex justify-center items-center shadow-md">
              <RightRow1 patientId={patientId} />
            </div>

            {/* Right Row 2 (30% / 70%) */}
            <div className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-4">
              <div className="w-full lg:w-[30%] bg-green-50 rounded-lg p-2 md:p-3 flex flex-col justify-center items-center shadow-md">
                <RightRow2Column1 patientId={patientId} />
              </div>
              <div className="w-full lg:w-[70%] bg-gray-50 rounded-lg p-2 md:p-4 flex justify-center items-center shadow-md overflow-hidden">
                <RightRow2Column2 patientId={patientId} />
              </div>
            </div>

            {/* Right Row 3 */}
            <div className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-4">
              <div className="w-full lg:w-1/3">
                <div className="h-[400px] bg-green-50 rounded-lg p-1 md:p-2 flex flex-col justify-start items-start shadow-md overflow-y-auto">
                  <CurrentMedications patientId={patientId} />
                </div>
              </div>
              <div className="w-full lg:w-2/3">
                <div className="h-[400px] overflow-y-auto space-y-4 pr-2">
                  {patient && (
                    <>
                      <SocialHistory patient={patient} />
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Right Row 4 */}
            <div className="bg-green-50 rounded-lg p-3 md:p-4 shadow-md">
              <div className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-4">
                <div className="w-full lg:w-1/3">
                  <div className="h-[200px] bg-white rounded-lg p-1 md:p-2 flex flex-col justify-start items-start shadow-md overflow-y-auto">
                    {/* First column content */}
                  </div>
                </div>
                <div className="w-full lg:w-1/3">
                  <div className="h-[200px] bg-white rounded-lg p-1 md:p-2 flex flex-col justify-start items-start shadow-md overflow-y-auto">
                    {/* Second column content */}
                  </div>
                </div>
                <div className="w-full lg:w-1/3">
                  <div className="h-[200px] bg-white rounded-lg p-1 md:p-2 shadow-md overflow-y-auto">
                    {patient && (
                      <SpecialDirectives patient={patient} />
                    )}
                  </div>
                </div>
              </div>
            </div>

            
          </>
        )}

        {activePage === 'visits' && (
          <div className="bg-green-50 rounded-lg p-3 md:p-6 flex justify-center items-center shadow-md w-full">
            <div className="w-full bg-gray-50">
              <h2 className="text-xl font-bold text-green-800 mb-4">Patient Visits</h2>
              <PatientVisits patientId={patientId} />
            </div>
          </div>
        )}

        {activePage === 'labs' && (
          <div className="bg-green-50 rounded-lg p-3 md:p-6 flex justify-center items-center shadow-md w-full">
            <div className="w-full bg-gray-50">
              <h2 className="text-xl font-bold text-green-800 mb-4">Laboratory Results</h2>
              <PatientLabs patientId={patientId} />
            </div>
          </div>
        )}

        {activePage === 'imaging' && (
          <div className="bg-green-50 rounded-lg p-3 md:p-6 flex justify-center items-center shadow-md w-full">
            <div className="w-full bg-gray-50">
              <h2 className="text-xl font-bold text-green-800 mb-4">Imaging Studies</h2>
              <PatientImaging patientId={patientId} />
            </div>
          </div>
        )}

        {activePage === 'medications' && (
          <div className="bg-green-50 rounded-lg p-3 md:p-6 flex justify-center items-center shadow-md w-full">
            <div className="w-full">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-green-800">Medications</h2>
                <button
                  onClick={() => navigate('/upload-medications')}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Medications
                </button>
              </div>
              <CurrentMedications patientId={patientId} />
            </div>
          </div>
        )}

        {activePage === 'vitals' && (
          <div className="bg-green-50 rounded-lg p-3 md:p-6 flex justify-center items-center shadow-md w-full">
            <div className="w-full">
              <h2 className="text-xl font-bold text-green-800 mb-4">Vital Signs</h2>
              <VitalsPage patientId={patientId} />
            </div>
          </div>
        )}

        {activePage === 'hospitalizations' && (
          <div className="bg-green-50 rounded-lg p-3 md:p-6 flex justify-center items-center shadow-md w-full">
            <div className="w-full">
              <h2 className="text-xl font-bold text-green-800 mb-4">Hospitalizations</h2>
              <PatientHospitalizations patientId={patientId} />
            </div>
          </div>
        )}

        {activePage === 'procedures' && (
          <div className="bg-green-50 rounded-lg p-3 md:p-6 flex justify-center items-center shadow-md w-full">
            <div className="w-full">
              <h2 className="text-xl font-bold text-green-800 mb-4">Procedures</h2>
              <PatientProcedures patientId={patientId} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default EHR;