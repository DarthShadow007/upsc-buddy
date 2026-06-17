import { Router } from "express";
import healthRouter from "./health";
import progressRouter from "./progress";

const router = Router();

// Existing routes
router.use("/health", healthRouter);

// Connect the database progress endpoints
router.use("/progress", progressRouter);

export default router;