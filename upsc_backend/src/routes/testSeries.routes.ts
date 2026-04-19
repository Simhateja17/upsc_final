import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { submissionLimiter } from "../middleware/rateLimit";
import { uploadSingle } from "../middleware/upload";
import {
  listSeries,
  getEnrolledSeries,
  enrollInSeries,
  unenrollFromSeries,
  createSeries,
  updateSeries,
  deleteSeries,
  getSeriesStats,
} from "../controllers/testSeries.controller";
import {
  getMainsQuestion,
  submitMainsAnswer,
  getMainsEvaluationStatus,
  getMainsResults,
  createMainsQuestion,
} from "../controllers/testSeriesMains.controller";

const router = Router();

// Public — stats for hero section
router.get("/stats", getSeriesStats);

// Public — list all active series
router.get("/", listSeries);

// Auth required
router.get("/enrolled", authenticate, getEnrolledSeries);
router.post("/:id/enroll", authenticate, enrollInSeries);
router.delete("/:id/enroll", authenticate, unenrollFromSeries);

// Mains AI evaluation (typed or handwritten)
router.get("/:seriesId/mains-question", authenticate, getMainsQuestion);
router.post(
  "/:seriesId/mains-submit",
  authenticate,
  submissionLimiter,
  uploadSingle("file"),
  submitMainsAnswer
);
router.get(
  "/:seriesId/mains-evaluation-status",
  authenticate,
  getMainsEvaluationStatus
);
router.get("/:seriesId/mains-results", authenticate, getMainsResults);

// Admin only
router.post("/", authenticate, createSeries);
router.put("/:id", authenticate, updateSeries);
router.delete("/:id", authenticate, deleteSeries);
router.post("/:seriesId/mains-questions", authenticate, createMainsQuestion);

export default router;
