import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { generateQuestionsForSubject } from "../lib/gemini";

const router = Router();
const prisma = new PrismaClient();
const SUBJECTS = ["Polity", "History", "Geography", "Economy", "Science", "Current Affairs", "Environment", "Art & Culture", "CSAT"];

router.post("/generate-questions", async (req, res) => {
  try {
    // We now extract both subject and difficulty from the frontend request
    const { subject, difficulty } = req.body; 
    const subjectsToProcess = subject ? [subject] : SUBJECTS;
    
    // If generating for one subject manually, make 10 questions. If doing all weekly, make 6 each.
    const questionsPerSubject = subject ? 10 : 6; 
    let totalAdded = 0;
    
    for (const sub of subjectsToProcess) {
      console.log(`Asking Gemini for new ${sub} questions... (Difficulty: ${difficulty || 'mixed'})`);
      
      // Pass the difficulty to the Gemini service
      const newQuestions = await generateQuestionsForSubject(sub, questionsPerSubject, difficulty); 
      
      for (const q of newQuestions) {
        const exists = await prisma.question.findFirst({ where: { question: q.question } });
        if (!exists) {
          await prisma.question.create({
            data: {
              subject: q.subject, 
              // Force lowercase so it perfectly matches your frontend filters (easy, medium, hard)
              difficulty: q.difficulty.toLowerCase(), 
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
      // 4-second delay to respect Gemini rate limits
      await new Promise((resolve) => setTimeout(resolve, 4000));
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