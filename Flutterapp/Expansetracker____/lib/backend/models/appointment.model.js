import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    appointmentDate: {
      type: Date,
      required: true
    },
    appointmentTime: {
      type: String,
      required: true
    },
    reason: {
      type: String,
      default: 'General Consultation'
    },
    paymentMethod: {
      type: String,
      enum: ['Credit/Debit Card', 'Cash', 'Insurance', 'Online Payment'],
      default: 'Credit/Debit Card'
    },
    appointmentType: {
      type: String,
      enum: ['Consultation', 'Follow-up', 'Emergency', 'Routine Checkup'],
      default: 'Consultation'
    },
    status: {
      type: String,
      enum: ['Upcoming', 'Completed', 'Cancelled', 'Rescheduled'],
      default: 'Upcoming'
    },
    consultationFee: {
      type: Number,
      default: 500
    },
    location: {
      type: String,
      default: 'CardioLink Hospital'
    },
    roomNumber: {
      type: String,
      default: '101'
    },
    chatEnabled: {
      type: Boolean,
      default: true
    },
    chatRoomId: {
      type: String,
      unique: true,
      sparse: true
    },
    cancellationReason: {
      type: String
    },
    cancelledAt: {
      type: Date
    },
    completedAt: {
      type: Date
    },
    notes: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

// Generate chat room ID before saving
appointmentSchema.pre('save', function(next) {
  if (!this.chatRoomId) {
    this.chatRoomId = `chat_${this.patientId}_${this.doctorId}_${Date.now()}`;
  }
  next();
});

// Populate patient and doctor info
appointmentSchema.methods.toJSON = function() {
  const appointment = this.toObject();
  return appointment;
};

export const Appointment = mongoose.model("Appointment", appointmentSchema);
