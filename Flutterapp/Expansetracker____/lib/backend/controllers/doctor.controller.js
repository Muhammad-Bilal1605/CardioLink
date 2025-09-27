import { Doctor } from "../models/doctor.model.js";

// Get all doctors
export const getAllDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find({ role: 'doctor' })
      .select('name email specialty department yearsOfExperience qualifications isVerified')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      message: "Doctors retrieved successfully",
      doctors: doctors
    });
  } catch (error) {
    console.error("Error fetching doctors:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching doctors",
      error: error.message
    });
  }
};

// Get doctor by ID
export const getDoctorById = async (req, res) => {
  try {
    const { doctorId } = req.params;
    
    const doctor = await Doctor.findById(doctorId)
      .select('name email specialty department yearsOfExperience qualifications isVerified');

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Doctor retrieved successfully",
      doctor: doctor
    });
  } catch (error) {
    console.error("Error fetching doctor:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching doctor",
      error: error.message
    });
  }
};

// Get doctors by specialty
export const getDoctorsBySpecialty = async (req, res) => {
  try {
    const { specialty } = req.params;
    
    const doctors = await Doctor.find({ 
      role: 'doctor',
      specialty: { $regex: specialty, $options: 'i' }
    })
      .select('name email specialty department yearsOfExperience qualifications isVerified')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      message: `Doctors in ${specialty} retrieved successfully`,
      doctors: doctors
    });
  } catch (error) {
    console.error("Error fetching doctors by specialty:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching doctors by specialty",
      error: error.message
    });
  }
};
