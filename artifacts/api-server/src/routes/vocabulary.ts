import { Router } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";

const router = Router();
const genAI = new GoogleGenerativeAI(process.env.VOCAB_API_KEY || "");

// Endpoint: Generate UPSC Quiz for a word
router.post("/generate-mocktest", async (req, res) => {
  const { words } = req.body; // Array of word strings
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite" });
    const prompt = `Create a multiple-choice mock test for these words: ${words.join(", ")}.
    For each word, ask for its meaning. Provide 4 options (one correct, three plausible distractors).and a detailed UPSC-grade explanation.keep in mind that this is for UPSC aspirant so the difficulty level should be accordingly okkkkkk.
    Return ONLY a valid JSON array: 
    [{"word": "...", "question": "What is the meaning of the word '...'?", "options": ["...", "...", "...", "..."], "correct": "..."}]`;
    
    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/```json|```/g, "").trim();
    res.json(JSON.parse(text));
  } catch (e) {
    res.status(500).json({ error: "Quiz generation failed." });
  }
});
router.post("/generate-batch", async (req, res) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite" });
    const prompt = `Generate an array of 10 complex, UPSC-level vocabulary words. 
    Return ONLY a valid JSON array of objects: [{"id": "<random_number>", "word": "...", "meaning": "...", "example": "..."}]`;
    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/```json|```/g, "").trim();
    res.json(JSON.parse(text));
  } catch (e) {
    res.status(500).json({ error: "Batch generation failed." });
  }
});


// Endpoint: Search/Define a word using Gemini
router.post("/search-word", async (req, res) => {
  const { word } = req.body;
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite" });
    const prompt = `Define the word "${word}" for a UPSC aspirant.work as a dictionary if necessary and also provide examples too. Return ONLY a valid JSON object: {"id": "${Date.now()}", "word": "${word}", "meaning": "...", "example": "..."}`;
    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/```json|```/g, "").trim();
    res.json(JSON.parse(text));
  } catch (e) {
    res.status(500).json({ error: "Word search failed." });
  }
});
export default router;