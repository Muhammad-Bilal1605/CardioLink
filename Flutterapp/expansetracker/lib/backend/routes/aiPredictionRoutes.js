import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import {
  checkUserHealthData,
  predictHeartDisease,
} from "../controllers/aiPredictionController.js";

const router = express.Router();

router.use(protect);

router.get("/check-data", checkUserHealthData);
router.post("/predict", predictHeartDisease);

export default router;

