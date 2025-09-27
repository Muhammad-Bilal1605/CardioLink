// ambulanceRequestRoutes.js
import express from "express";
import { AmbulanceRequest } from "../models/ambulanceRequest.model.js"; // You'll need this model

const router = express.Router();

// CREATE NEW AMBULANCE REQUEST
router.post("/", async (req, res) => {
  try {
    console.log("🚑 New ambulance request received:", req.body);

    const newRequest = new AmbulanceRequest({
      ...req.body,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await newRequest.save();

    console.log("✅ Ambulance request saved:", newRequest._id);

    res.status(201).json({
      success: true,
      message: "Ambulance request created successfully",
      request: newRequest
    });

  } catch (error) {
    console.error("❌ Create ambulance request error:", error);
    res.status(500).json({
      success: false,
      message: "Error creating ambulance request",
      error: error.message
    });
  }
});

// GET ALL AMBULANCE REQUESTS
router.get("/", async (req, res) => {
  try {
    const requests = await AmbulanceRequest.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      requests: requests
    });

  } catch (error) {
    console.error("❌ Get ambulance requests error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching ambulance requests"
    });
  }
});

// ACCEPT AMBULANCE REQUEST
router.put("/:id/accept", async (req, res) => {
  try {
    const request = await AmbulanceRequest.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'Assigned',
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Request not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Request accepted successfully",
      request: request
    });

  } catch (error) {
    console.error("❌ Accept request error:", error);
    res.status(500).json({
      success: false,
      message: "Error accepting request"
    });
  }
});

// DELETE/DECLINE AMBULANCE REQUEST
router.delete("/:id", async (req, res) => {
  try {
    const request = await AmbulanceRequest.findByIdAndDelete(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Request not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Request declined/deleted successfully"
    });

  } catch (error) {
    console.error("❌ Delete request error:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting request"
    });
  }
});

export default router;