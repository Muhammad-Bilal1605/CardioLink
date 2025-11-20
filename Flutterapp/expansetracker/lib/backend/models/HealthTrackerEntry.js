import mongoose from "mongoose";

const { Schema } = mongoose;

const activitySchema = new Schema(
  {
    type: { type: String, required: true, trim: true },
    duration: { type: Number, required: true },
    distance: { type: Number, required: true },
    calories: { type: Number, required: true },
    steps: { type: Number },
    date: { type: Date, required: true },
  },
  { _id: false }
);

const mealSchema = new Schema(
  {
    mealType: { type: String, required: true, trim: true },
    foodItems: { type: String, required: true, trim: true },
    calories: { type: Number, required: true },
    saturatedFat: { type: Number, required: true },
    cholesterol: { type: Number, required: true },
    date: { type: Date, required: true },
  },
  { _id: false }
);

const medicationSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    dosage: { type: String, required: true, trim: true },
    frequency: { type: String, required: true, trim: true },
    time: { type: String, required: true, trim: true },
    reminderEnabled: { type: Boolean, default: true },
    notes: { type: String, trim: true },
  },
  { _id: false }
);

const HealthTrackerEntrySchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    user: {
      id: { type: Schema.Types.ObjectId, required: true },
      email: { type: String, trim: true },
      name: { type: String, trim: true },
    },
    entryType: {
      type: String,
      enum: ["activity", "meal", "medication"],
      required: true,
      index: true,
    },
    activity: { type: activitySchema },
    meal: { type: mealSchema },
    medication: { type: medicationSchema },
    recordedAt: { type: Date, default: Date.now, index: true },
  },
  {
    timestamps: true,
    collection: "health_tracker",
  }
);

HealthTrackerEntrySchema.index({ userId: 1, entryType: 1, recordedAt: -1 });

export const HealthTrackerEntry =
  mongoose.models.HealthTrackerEntry ||
  mongoose.model("HealthTrackerEntry", HealthTrackerEntrySchema, "health_tracker");


