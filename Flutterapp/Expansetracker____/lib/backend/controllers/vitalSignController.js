import VitalSign from '../models/VitalSign.js';

// Create a new vital sign record
export const createVitalSign = async (req, res) => {
  try {
    const vitalSign = new VitalSign(req.body);
    await vitalSign.save();
    res.status(201).json({ success: true, data: vitalSign });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get all vital signs for a patient
export const getPatientVitalSigns = async (req, res) => {
  try {
    const vitalSigns = await VitalSign.find({ patientId: req.params.patientId })
      .sort({ date: -1 });
    res.status(200).json({ success: true, data: vitalSigns });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get vital signs for a patient within a date range
export const getVitalSignsByDateRange = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = {
      patientId: req.params.patientId,
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };

    const vitalSigns = await VitalSign.find(query).sort({ date: -1 });
    res.status(200).json({ success: true, data: vitalSigns });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get a single vital sign record
export const getVitalSign = async (req, res) => {
  try {
    const vitalSign = await VitalSign.findById(req.params.id);
    if (!vitalSign) {
      return res.status(404).json({ success: false, message: 'Vital sign record not found' });
    }
    res.status(200).json({ success: true, data: vitalSign });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Update a vital sign record
export const updateVitalSign = async (req, res) => {
  try {
    const vitalSign = await VitalSign.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!vitalSign) {
      return res.status(404).json({ success: false, message: 'Vital sign record not found' });
    }

    res.status(200).json({ success: true, data: vitalSign });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Delete a vital sign record
export const deleteVitalSign = async (req, res) => {
  try {
    const vitalSign = await VitalSign.findByIdAndDelete(req.params.id);
    if (!vitalSign) {
      return res.status(404).json({ success: false, message: 'Vital sign record not found' });
    }
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}; 