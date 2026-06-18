import { Router } from "express";
import { prisma } from "../lib/prisma";

const router = Router();

// GET fresh unseen questions for a user
router.get("/practice/:clerkId", async (req, res) => {
  const { clerkId } = req.params;
  const { subject, difficulty, limit = "10" } = req.query;

  try {
    const attempted = await prisma.userQuestionAttempt.findMany({
      where: { clerkUserId: clerkId },
      select: { questionId: true },
    });

    const attemptedIds = attempted.map((a) => a.questionId);

    const where: any = {};
    if (attemptedIds.length > 0) where.id = { notIn: attemptedIds };
    if (subject && subject !== "all") where.subject = subject;
    if (difficulty && difficulty !== "all") where.difficulty = difficulty;

    let questions = await prisma.question.findMany({
      where,
      take: parseInt(limit as string),
      orderBy: { createdAt: "asc" },
    });

    let reset = false;

    // If exhausted, reset and start fresh cycle
    if (questions.length === 0) {
      reset = true;
      const resetWhere: any = {};
      if (subject && subject !== "all") resetWhere.subject = subject;
      if (difficulty && difficulty !== "all") resetWhere.difficulty = difficulty;
      questions = await prisma.question.findMany({
        where: resetWhere,
        take: parseInt(limit as string),
        orderBy: { createdAt: "asc" },
      });
    }

    res.json({ questions, reset });
  } catch (error) {
    console.error("Questions fetch error:", error);
    res.status(500).json({ error: "Failed to fetch questions" });
  }
});

// POST save a user's answer
router.post("/attempt", async (req, res) => {
  const { clerkId, questionId, selectedAns, isCorrect, subject } = req.body;

  try {
    await prisma.userQuestionAttempt.upsert({
      where: { clerkUserId_questionId: { clerkUserId: clerkId, questionId } },
      update: { isCorrect, selectedAns, attemptedAt: new Date() },
      create: { clerkUserId: clerkId, questionId, isCorrect, selectedAns },
    });

    const allAttempts = await prisma.userQuestionAttempt.findMany({
      where: { clerkUserId: clerkId },
    });
    const correct = allAttempts.filter((a) => a.isCorrect).length;
    const accuracy = Math.round((correct / allAttempts.length) * 100);

    await prisma.userProgress.upsert({
      where: { clerkUserId: clerkId },
      update: { questionsAttempted: allAttempts.length, accuracy },
      create: { clerkUserId: clerkId, questionsAttempted: 1, accuracy: isCorrect ? 100 : 0 },
    });

    const subjectCorrect = await prisma.userQuestionAttempt.count({
      where: { clerkUserId: clerkId, isCorrect: true, question: { subject } },
    });
    const subjectTotal = await prisma.userQuestionAttempt.count({
      where: { clerkUserId: clerkId, question: { subject } },
    });
    const subjectAccuracy = subjectTotal > 0 ? Math.round((subjectCorrect / subjectTotal) * 100) : 0;

    await prisma.subjectPerformance.upsert({
      where: { clerkUserId_subjectName: { clerkUserId: clerkId, subjectName: subject } },
      update: { accuracy: subjectAccuracy, attemptedQs: subjectTotal },
      create: { clerkUserId: clerkId, subjectName: subject, accuracy: subjectAccuracy, attemptedQs: subjectTotal },
    });

    res.json({ success: true, totalAttempted: allAttempts.length, accuracy });
  } catch (error) {
    console.error("Attempt save error:", error);
    res.status(500).json({ error: "Failed to save attempt" });
  }
});

export default router;