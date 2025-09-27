import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const API_URL = `${BASE_URL}/api`;

// Test data
const testPatient = {
  email: 'testpatient@example.com',
  password: 'testpassword123',
  name: 'Test Patient',
  role: 'patient',
  phoneNumber: '+1234567890',
  gender: 'Male',
  age: 30,
  dateOfBirth: '1994-01-01',
  bloodType: 'O+',
  allergies: 'None',
  emergencyContact: {
    name: 'Emergency Contact',
    phone: '+0987654321',
    relationship: 'Spouse'
  }
};

const testDoctor = {
  email: 'testdoctor@example.com',
  password: 'testpassword123',
  name: 'Dr. Test Doctor',
  role: 'doctor',
  specialty: 'Cardiology',
  department: 'Cardiology',
  experience: 10,
  qualifications: ['MD', 'MBBS'],
  consultationFee: 100,
  isVerified: true,
  isOnline: true,
  profileImage: 'https://example.com/doctor.jpg'
};

let patientToken = '';
let doctorToken = '';
let doctorId = '';
let appointmentId = '';

async function makeRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    const data = await response.json();
    return { success: response.ok, data, status: response.status };
  } catch (error) {
    console.error('Request failed:', error);
    return { success: false, error: error.message };
  }
}

async function testPatientSignup() {
  console.log('\n🔸 Testing Patient Signup...');
  const result = await makeRequest(`${API_URL}/auth/signup`, {
    method: 'POST',
    body: JSON.stringify(testPatient)
  });
  
  if (result.success) {
    console.log('✅ Patient signup successful');
    return true;
  } else {
    console.log('❌ Patient signup failed:', result.data?.message || result.error);
    return false;
  }
}

async function testDoctorSignup() {
  console.log('\n🔸 Testing Doctor Signup...');
  const result = await makeRequest(`${API_URL}/auth/signup`, {
    method: 'POST',
    body: JSON.stringify(testDoctor)
  });
  
  if (result.success) {
    console.log('✅ Doctor signup successful');
    doctorId = result.data.user._id;
    return true;
  } else {
    console.log('❌ Doctor signup failed:', result.data?.message || result.error);
    return false;
  }
}

async function testPatientLogin() {
  console.log('\n🔸 Testing Patient Login...');
  const result = await makeRequest(`${API_URL}/auth/login`, {
    method: 'POST',
    body: JSON.stringify({
      email: testPatient.email,
      password: testPatient.password,
      role: 'patient'
    })
  });
  
  if (result.success) {
    patientToken = result.data.token;
    console.log('✅ Patient login successful');
    return true;
  } else {
    console.log('❌ Patient login failed:', result.data?.message || result.error);
    return false;
  }
}

async function testGetDoctors() {
  console.log('\n🔸 Testing Get Doctors...');
  const result = await makeRequest(`${API_URL}/doctors`);
  
  if (result.success && result.data.length > 0) {
    console.log(`✅ Found ${result.data.length} doctors`);
    if (!doctorId && result.data[0]._id) {
      doctorId = result.data[0]._id;
    }
    return true;
  } else {
    console.log('❌ Get doctors failed:', result.data?.message || result.error);
    return false;
  }
}

async function testCreateAppointment() {
  console.log('\n🔸 Testing Create Appointment...');
  
  if (!patientToken) {
    console.log('❌ No patient token available');
    return false;
  }
  
  if (!doctorId) {
    console.log('❌ No doctor ID available');
    return false;
  }
  
  const appointmentData = {
    doctorId: doctorId,
    appointmentDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    appointmentTime: '10:00 AM',
    reason: 'Regular checkup',
    paymentMethod: 'Credit/Debit Card',
    appointmentType: 'Consultation'
  };
  
  const result = await makeRequest(`${API_URL}/appointments`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${patientToken}`
    },
    body: JSON.stringify(appointmentData)
  });
  
  if (result.success) {
    appointmentId = result.data._id;
    console.log('✅ Appointment created successfully');
    console.log(`   Appointment ID: ${appointmentId}`);
    return true;
  } else {
    console.log('❌ Create appointment failed:', result.data?.message || result.error);
    return false;
  }
}

async function testGetPatientAppointments() {
  console.log('\n🔸 Testing Get Patient Appointments...');
  
  if (!patientToken) {
    console.log('❌ No patient token available');
    return false;
  }
  
  const result = await makeRequest(`${API_URL}/appointments/patient`, {
    headers: {
      'Authorization': `Bearer ${patientToken}`
    }
  });
  
  if (result.success) {
    console.log(`✅ Found ${result.data.length} appointments`);
    return true;
  } else {
    console.log('❌ Get patient appointments failed:', result.data?.message || result.error);
    return false;
  }
}

async function testCancelAppointment() {
  console.log('\n🔸 Testing Cancel Appointment...');
  
  if (!patientToken || !appointmentId) {
    console.log('❌ No patient token or appointment ID available');
    return false;
  }
  
  const result = await makeRequest(`${API_URL}/appointments/${appointmentId}/cancel`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${patientToken}`
    },
    body: JSON.stringify({
      reason: 'Test cancellation'
    })
  });
  
  if (result.success) {
    console.log('✅ Appointment cancelled successfully');
    return true;
  } else {
    console.log('❌ Cancel appointment failed:', result.data?.message || result.error);
    return false;
  }
}

async function testGetChatableDoctors() {
  console.log('\n🔸 Testing Get Chatable Doctors...');
  
  if (!patientToken) {
    console.log('❌ No patient token available');
    return false;
  }
  
  const result = await makeRequest(`${API_URL}/appointments/chatable`, {
    headers: {
      'Authorization': `Bearer ${patientToken}`
    }
  });
  
  if (result.success) {
    console.log(`✅ Found ${result.data.length} chatable doctors`);
    return true;
  } else {
    console.log('❌ Get chatable doctors failed:', result.data?.message || result.error);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting Appointment System Tests...');
  console.log(`📍 Testing against: ${API_URL}`);
  
  const tests = [
    { name: 'Patient Signup', fn: testPatientSignup },
    { name: 'Doctor Signup', fn: testDoctorSignup },
    { name: 'Patient Login', fn: testPatientLogin },
    { name: 'Get Doctors', fn: testGetDoctors },
    { name: 'Create Appointment', fn: testCreateAppointment },
    { name: 'Get Patient Appointments', fn: testGetPatientAppointments },
    { name: 'Get Chatable Doctors', fn: testGetChatableDoctors },
    { name: 'Cancel Appointment', fn: testCancelAppointment }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    const result = await test.fn();
    if (result) {
      passed++;
    } else {
      failed++;
    }
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n📊 Test Results:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed! Appointment system is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the backend server and database connection.');
  }
}

// Run the tests
runTests().catch(console.error);
