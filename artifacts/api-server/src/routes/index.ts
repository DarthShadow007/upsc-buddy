import { Router } from "express";
import healthRouter from "./health";
import progressRouter from "./progress";
import questionsRouter from "./questions";
import adminRouter from "./admin";

// Create the router FIRST
const router = Router(); 

// THEN attach the routes to it
router.use("/health", healthRouter);
router.use("/progress", progressRouter);
router.use("/questions", questionsRouter);
router.use("/admin", adminRouter);

export default router;