import { Router } from "express";
import healthRouter from "./health";
import progressRouter from "./progress";
import questionsRouter from "./questions";
import adminRouter from "./admin";
import flashcardsRouter from "./flashcards";
import mocktestRouter from "./mocktest";
import caRouter from "./ca"; // Ensure this matches exactly

const router = Router();

router.use("/health", healthRouter);
router.use("/progress", progressRouter);
router.use("/questions", questionsRouter);
router.use("/admin", adminRouter);
router.use("/flashcards", flashcardsRouter);
router.use("/mocktest", mocktestRouter);
router.use("/ca", caRouter); // The route is /api/ca/...

export default router;