import mongoose from "mongoose";

const { Schema } = mongoose;

const HealthTrackerReportSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    entryId: {
      type: Schema.Types.ObjectId,
      ref: "HealthTrackerEntry",
    },
    reportType: {
      type: String,
      default: "HeartWiseAI",
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    summary: {
      type: String,
    },
    keyFindings: {
      type: [String],
      default: [],
    },
    recommendations: {
      type: [String],
      default: [],
    },
    aiResponse: {
      type: Schema.Types.Mixed,
    },
    pdf: {
      data: { type: Buffer, required: true },
      contentType: { type: String, default: "application/pdf" },
    },
  },
  {
    timestamps: true,
    collection: "health_tracker_reports",
  }
);

HealthTrackerReportSchema.index({ userId: 1, createdAt: -1 });

export const HealthTrackerReport =
  mongoose.models.HealthTrackerReport ||
  mongoose.model("HealthTrackerReport", HealthTrackerReportSchema);


