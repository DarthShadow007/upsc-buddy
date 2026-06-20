import { Router } from "express";
import multer from "multer";
import { createRequire } from "module";
import { generateQuestionsForSubject } from "../lib/gemini";

const require = createRequire(import.meta.url);
const rawPdfParse = require("pdf-parse");

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Failsafe parser loader
const parsePdf = async (buffer: Buffer) => {
    // This handles both the default export and the direct function export
    const parser = (typeof rawPdfParse === 'function') 
        ? rawPdfParse 
        : (rawPdfParse.default || rawPdfParse);
    
    return await parser(buffer);
};

router.get("/list", (req, res) => {
  res.json([]); 
});

router.post("/fetch-pib", async (req, res) => {
  res.json({ success: true, message: "PIB Feature Coming Soon!" });
});

router.post("/upload-ca", upload.single("pdf"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No PDF uploaded" });

    // Use the failsafe parser
    console.log("Parsing PDF...");
    const pdfData = await parsePdf(req.file.buffer);
    const content = pdfData.text.substring(0, 8000);
    
    console.log("PDF Parsed. Generating Quiz...");

    const quiz = await generateQuestionsForSubject(
      `Current Affairs Analysis: ${content.substring(0, 30)}`,
      5,
      "medium",
      ["direct_mcq", "multi_statement"],
      "ca"
    );

    res.json({ success: true, quiz });
  } catch (error: any) {
    console.error("Backend Error:", error);
    res.status(500).json({ error: "Failed to process PDF: " + error.message });
  }
});

export default router;