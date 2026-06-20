import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { generateMockTestChunk } from "../lib/gemini"; // 👈 Updated Import

const router = Router();
const prisma = new PrismaClient();
const SUBJECTS = ["Polity", "History", "Geography", "Economy", "Science", "Current Affairs", "Environment", "Art & Culture", "CSAT"];

router.post("/generate-questions", async (req, res) => {
  try {
    const { subject, difficulty } = req.body; 
    const subjectsToProcess = subject ? [subject] : SUBJECTS;
    
    // 👈 Always target exactly 10 questions to fill the practice bank
    const questionsPerSubject = 10; 
    let totalAdded = 0;
    
    for (const sub of subjectsToProcess) {
      console.log(`Asking Gemini for new ${sub} questions... (Difficulty: ${difficulty || 'mixed'})`);
      
      const targetEngine = sub === "Current Affairs" ? "ca" : "practice";
      const isCSAT = sub === "CSAT";
      
      // 👈 Use chunker to guarantee diverse formats and safely bypass the 5-cap
      const newQuestions = await generateMockTestChunk(sub, questionsPerSubject, isCSAT, targetEngine); 
      
      for (const q of newQuestions) {
        const exists = await prisma.question.findFirst({ where: { question: q.question } });
        if (!exists) {
          await prisma.question.create({
            data: {
              subject: q.subject, 
              difficulty: q.difficulty?.toLowerCase() || "medium", 
              question: q.question,
              options: q.options, 
              correctAnswer: q.correctAnswer, 
              explanation: q.explanation, 
              isAIGenerated: true
            }
          });
          totalAdded++;
        }
      }
      
      // 👈 8-second delay guarantees we stay below Gemini's 15 Requests Per Minute limit across all subjects
      await new Promise((resolve) => setTimeout(resolve, 8000));
    }
    
    res.json({ success: true, message: `Added ${totalAdded} new AI questions.`, totalAdded });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ success: false, error: "Server Error" });
  }
});

router.get("/new-ai-questions", async (req, res) => {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const count = await prisma.question.count({
        where: { isAIGenerated: true, createdAt: { gte: sevenDaysAgo } }
      });
      res.json({ hasNewQuestions: count > 0, count });
    } catch (error) {
      res.status(500).json({ success: false, error: "Server Error" });
    }
});

export default router;