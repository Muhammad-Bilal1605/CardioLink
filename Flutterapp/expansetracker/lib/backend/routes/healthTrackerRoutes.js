import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import {
  createHealthTrackerEntry,
  deleteHealthTrackerEntry,
  deleteHealthTrackerReport,
  generateHealthTrackerReport,
  generateMonthlyHealthReport,
  getHealthTrackerEntries,
  getHealthTrackerReportPdf,
  listHealthTrackerReports,
  updateHealthTrackerEntry,
} from "../controllers/healthTrackerController.js";

const router = express.Router();

router.use(protect);

router
  .route("/")
  .get(getHealthTrackerEntries)
  .post(createHealthTrackerEntry);

router
  .route("/:id")
  .patch(updateHealthTrackerEntry)
  .delete(deleteHealthTrackerEntry);

router.post("/report", generateHealthTrackerReport);
router.post("/report/monthly", generateMonthlyHealthReport);
router.get("/reports", listHealthTrackerReports);
router.get("/reports/:reportId/pdf", getHealthTrackerReportPdf);
router.delete("/reports/:reportId", deleteHealthTrackerReport);

export default router;


