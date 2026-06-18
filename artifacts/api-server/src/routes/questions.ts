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

// POST save a user's answer + auto-create flashcard on wrong answer
router.post("/attempt", async (req, res) => {
  const { clerkId, questionId, selectedAns, isCorrect, subject } = req.body;

  try {
    // 1. Save the attempt
    await prisma.userQuestionAttempt.upsert({
      where: { clerkUserId_questionId: { clerkUserId: clerkId, questionId } },
      update: { isCorrect, selectedAns, attemptedAt: new Date() },
      create: { clerkUserId: clerkId, questionId, isCorrect, selectedAns },
    });

    // 2. If wrong answer → auto-create flashcard for SRS review
    if (!isCorrect) {
      const question = await prisma.question.findUnique({
        where: { id: questionId },
      });

      if (question) {
        const deckTitle = `Wrong Answers — ${question.subject}`;

        let deck = await prisma.flashcardDeck.findFirst({
          where: { clerkUserId: clerkId, title: deckTitle },
        });

        if (!deck) {
          deck = await prisma.flashcardDeck.create({
            data: {
              clerkUserId: clerkId,
              title: deckTitle,
              subjectTag: question.subject,
              isAutoGen: true,
            },
          });
        }

        const existingCard = await prisma.flashcard.findFirst({
          where: { deckId: deck.id, sourceQuestionId: questionId },
        });

        if (!existingCard) {
          // ── FIX: properly parse JSON options from DB ──────────────────
          let options: string[] = [];
          if (Array.isArray(question.options)) {
            options = question.options as string[];
          } else if (typeof question.options === "string") {
            options = JSON.parse(question.options);
          } else {
            // Prisma returns Json as object — cast via JSON stringify/parse
            options = JSON.parse(JSON.stringify(question.options)) as string[];
          }

          const correctOptionText = options[question.correctAnswer] ?? "See explanation";

          // Build a rich back with all options + correct highlighted
          const optionsList = options
            .map((opt, idx) => {
              const letter = String.fromCharCode(65 + idx);
              const isCorrectOpt = idx === question.correctAnswer;
              return `${isCorrectOpt ? "✅" : "  "} ${letter}. ${opt}`;
            })
            .join("\n");

          await prisma.flashcard.create({
            data: {
              deckId: deck.id,
              front: question.question,
              back: `Options:\n${optionsList}\n\n✅ Correct Answer: ${correctOptionText}\n\n📖 Explanation:\n${question.explanation}`,
              easeFactor: 2.5,
              interval: 1,
              nextReviewAt: new Date(Date.now() - 1000),
              sourceQuestionId: questionId,
            },
          });
        } else {
          // Card exists — reset it so it resurfaces for review
          await prisma.flashcard.update({
            where: { id: existingCard.id },
            data: {
              nextReviewAt: new Date(Date.now() - 1000),
              lastResult: "again",
              interval: 1,
            },
          });
        }
      }
    }

    // 3. Update overall progress stats
    const allAttempts = await prisma.userQuestionAttempt.findMany({
      where: { clerkUserId: clerkId },
    });
    const correct = allAttempts.filter((a) => a.isCorrect).length;
    const accuracy = Math.round((correct / allAttempts.length) * 100);

    await prisma.userProgress.upsert({
      where: { clerkUserId: clerkId },
      update: { questionsAttempted: allAttempts.length, accuracy },
      create: {
        clerkUserId: clerkId,
        questionsAttempted: 1,
        accuracy: isCorrect ? 100 : 0,
      },
    });

    // 4. Update subject performance
    const subjectCorrect = await prisma.userQuestionAttempt.count({
      where: { clerkUserId: clerkId, isCorrect: true, question: { subject } },
    });
    const subjectTotal = await prisma.userQuestionAttempt.count({
      where: { clerkUserId: clerkId, question: { subject } },
    });
    const subjectAccuracy =
      subjectTotal > 0 ? Math.round((subjectCorrect / subjectTotal) * 100) : 0;

    await prisma.subjectPerformance.upsert({
      where: {
        clerkUserId_subjectName: { clerkUserId: clerkId, subjectName: subject },
      },
      update: { accuracy: subjectAccuracy, attemptedQs: subjectTotal },
      create: {
        clerkUserId: clerkId,
        subjectName: subject,
        accuracy: subjectAccuracy,
        attemptedQs: subjectTotal,
      },
    });

    res.json({
      success: true,
      totalAttempted: allAttempts.length,
      accuracy,
      flashcardCreated: !isCorrect,
    });
  } catch (error) {
    console.error("Attempt save error:", error);
    res.status(500).json({ error: "Failed to save attempt" });
  }
});

export default router;