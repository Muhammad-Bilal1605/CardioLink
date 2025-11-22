import AutomaticPrescription from '../models/AutomaticPrescription.js';
import Pharmacy from '../models/Pharmacy.js';

// Create or update automatic prescription settings
export const createOrUpdateAutomaticPrescription = async (req, res) => {
  try {
    const { patientId, facilityAvailed, preferredPharmacy, preferredDosage } = req.body;

    // Validate patientId
    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: 'Patient ID is required'
      });
    }

    // If facility is availed, validate preferredPharmacy and preferredDosage
    if (facilityAvailed === true) {
      if (!preferredPharmacy) {
        return res.status(400).json({
          success: false,
          message: 'Preferred pharmacy is required when facility is availed'
        });
      }

      // Verify pharmacy exists and is active
      const pharmacy = await Pharmacy.findOne({
        _id: preferredPharmacy,
        status: 'Approved',
        isActive: true
      });

      if (!pharmacy) {
        return res.status(404).json({
          success: false,
          message: 'Pharmacy not found or not available'
        });
      }

      if (!preferredDosage || preferredDosage < 1 || preferredDosage > 12) {
        return res.status(400).json({
          success: false,
          message: 'Preferred dosage must be between 1 and 12 months'
        });
      }
    }

    // Find existing or create new
    const existingPrescription = await AutomaticPrescription.findOne({ patientId });

    let prescription;
    if (existingPrescription) {
      // Update existing
      existingPrescription.facilityAvailed = facilityAvailed;
      existingPrescription.preferredPharmacy = facilityAvailed ? preferredPharmacy : null;
      existingPrescription.preferredDosage = facilityAvailed ? preferredDosage : 1;
      prescription = await existingPrescription.save();
    } else {
      // Create new
      prescription = new AutomaticPrescription({
        patientId,
        facilityAvailed: facilityAvailed || false,
        preferredPharmacy: facilityAvailed ? preferredPharmacy : null,
        preferredDosage: facilityAvailed ? preferredDosage : 1
      });
      prescription = await prescription.save();
    }

    // Populate pharmacy details
    await prescription.populate('preferredPharmacy', 'pharmacyName address phoneNumber');

    res.status(200).json({
      success: true,
      message: 'Automatic prescription settings updated successfully',
      data: prescription
    });
  } catch (error) {
    console.error('Error creating/updating automatic prescription:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update automatic prescription settings',
      error: error.message
    });
  }
};

// Get automatic prescription settings for a patient
export const getAutomaticPrescription = async (req, res) => {
  try {
    const { patientId } = req.params;

    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: 'Patient ID is required'
      });
    }

    const prescription = await AutomaticPrescription.findOne({ patientId })
      .populate('preferredPharmacy', 'pharmacyName address phoneNumber coordinates');

    if (!prescription) {
      // Return default settings if not found
      return res.status(200).json({
        success: true,
        data: {
          patientId,
          facilityAvailed: false,
          preferredPharmacy: null,
          preferredDosage: 1
        }
      });
    }

    res.status(200).json({
      success: true,
      data: prescription
    });
  } catch (error) {
    console.error('Error getting automatic prescription:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve automatic prescription settings',
      error: error.message
    });
  }
};

// Get all active pharmacies for selection
export const getAvailablePharmacies = async (req, res) => {
  try {
    const pharmacies = await Pharmacy.find({
      status: 'Approved',
      isActive: true
    })
      .select('pharmacyName address phoneNumber coordinates')
      .sort({ pharmacyName: 1 });

    res.status(200).json({
      success: true,
      count: pharmacies.length,
      data: pharmacies
    });
  } catch (error) {
    console.error('Error getting available pharmacies:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve pharmacies',
      error: error.message
    });
  }
};

// Delete automatic prescription settings
export const deleteAutomaticPrescription = async (req, res) => {
  try {
    const { patientId } = req.params;

    const prescription = await AutomaticPrescription.findOneAndDelete({ patientId });

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Automatic prescription settings not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Automatic prescription settings deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting automatic prescription:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete automatic prescription settings',
      error: error.message
    });
  }
};

