import mongoose from 'mongoose';

const automaticPrescriptionSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
    unique: true
  },
  facilityAvailed: {
    type: Boolean,
    default: false,
    required: true
  },
  preferredPharmacy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pharmacy',
    default: null
  },
  preferredDosage: {
    type: Number,
    default: 1,
    min: 1,
    max: 12,
    required: function() {
      return this.facilityAvailed === true;
    }
  }
}, {
  timestamps: true
});

// Index for faster queries
automaticPrescriptionSchema.index({ patientId: 1 });
automaticPrescriptionSchema.index({ facilityAvailed: 1 });

const AutomaticPrescription = mongoose.model('AutomaticPrescription', automaticPrescriptionSchema);

export default AutomaticPrescription;

