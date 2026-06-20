import { Router } from "express";
import multer from "multer";
import { generateQuestionsForSubject } from "../lib/gemini";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/generate-from-pdf", upload.single("pdf"), async (req, res) => {
  // Extract PDF text here...
  // Call generateQuestionsForSubject with MCQ prompt...
  // Return quiz structure...
});

export default router;