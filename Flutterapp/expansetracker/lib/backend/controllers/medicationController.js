import Medication from '../models/Medication.js';

// Create a new medication
export const createMedication = async (req, res) => {
  try {
    const medication = new Medication(req.body);
    await medication.save();
    res.status(201).json({ success: true, data: medication });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get all medications for a patient
export const getPatientMedications = async (req, res) => {
  try {
    const medications = await Medication.find({ patientId: req.params.patientId })
      .sort({ startDate: -1 });
    res.status(200).json({ success: true, data: medications });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get active medications for a patient
export const getActiveMedications = async (req, res) => {
  try {
    const medications = await Medication.find({
      patientId: req.params.patientId,
      status: 'Active'
    }).sort({ startDate: -1 });
    res.status(200).json({ success: true, data: medications });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get a single medication
export const getMedication = async (req, res) => {
  try {
    const medication = await Medication.findById(req.params.id);
    if (!medication) {
      return res.status(404).json({ success: false, message: 'Medication not found' });
    }
    res.status(200).json({ success: true, data: medication });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Update a medication
export const updateMedication = async (req, res) => {
  try {
    const medication = await Medication.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!medication) {
      return res.status(404).json({ success: false, message: 'Medication not found' });
    }

    res.status(200).json({ success: true, data: medication });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Delete a medication
export const deleteMedication = async (req, res) => {
  try {
    const medication = await Medication.findByIdAndDelete(req.params.id);
    if (!medication) {
      return res.status(404).json({ success: false, message: 'Medication not found' });
    }
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}; 