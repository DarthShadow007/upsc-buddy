import { Router } from "express";
import healthRouter from "./health";
import progressRouter from "./progress";
import questionsRouter from "./questions";
import adminRouter from "./admin";
import flashcardsRouter from "./flashcards"; // <--- Add this import

const router = Router();

router.use("/health", healthRouter);
router.use("/progress", progressRouter);
router.use("/questions", questionsRouter);
router.use("/admin", adminRouter);
router.use("/flashcards", flashcardsRouter); // <--- Add this route

export default router;