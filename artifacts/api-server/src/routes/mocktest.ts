import { Router } from "express";
import { prisma } from "../lib/prisma";
import { generateQuestionsForSubject } from "../lib/gemini";

const router = Router();

const GS1_DISTRIBUTION = [
  { subject: "History",       count: 18, types: ["direct_mcq","multi_statement","chronological"] },
  { subject: "Geography",     count: 18, types: ["direct_mcq","multi_statement","match_following"] },
  { subject: "Polity",        count: 20, types: ["direct_mcq","multi_statement","assertion_reason"] },
  { subject: "Economy",       count: 16, types: ["direct_mcq","multi_statement","assertion_reason"] },
  { subject: "Environment",   count: 14, types: ["direct_mcq","multi_statement"] },
  { subject: "Science & Tech",count: 10, types: ["direct_mcq","multi_statement"] },
  { subject: "Art & Culture", count: 4,  types: ["direct_mcq"] },
];

const CSAT_DISTRIBUTION = [
  { subject: "CSAT", count: 80, types: ["comprehension","logical_reasoning","quantitative","data_interpretation"] },
];

async function getUnusedDBQuestions(
  clerkId: string,
  subject: string,
  count: number
): Promise<any[]> {
  const used = await prisma.mockTestQuestionUsed.findMany({
    where: { clerkUserId: clerkId },
    select: { questionId: true },
  });
  const usedIds = used.map((u) => u.questionId);

  const questions = await prisma.question.findMany({
    where: {
      subject,
      id: usedIds.length > 0 ? { notIn: usedIds } : undefined,
    },
    take: count,
    orderBy: { createdAt: "asc" },
  });

  return questions;
}

async function generateMockQuestions(
  subject: string,
  count: number,
  types: string[]
): Promise<any[]> {
  const chunks: any[][] = [];
  const chunkSize = subject === "CSAT" ? 3 : 5; 
  const numChunks = Math.ceil(count / chunkSize);

  for (let i = 0; i < numChunks; i++) {
    const thisCount = Math.min(chunkSize, count - i * chunkSize);
    let success = false;
    let retries = 3; 

    while (!success && retries > 0) {
      try {
        const result = await generateQuestionsForSubject(subject, thisCount, undefined, types);
        if (result && result.length > 0) {
          chunks.push(result);
          success = true;
        } else {
          throw new Error("Empty array returned from Gemini");
        }
      } catch (e: any) {
        retries--;
        const isQuotaError = e?.message?.includes("429") || e?.message?.includes("Quota");
        const delayMs = isQuotaError ? 15000 : 3000;
        console.log(`Chunk ${i+1}/${numChunks} for ${subject} failed. Retries left: ${retries}. Waiting ${delayMs}ms.`);
        if (retries > 0) await new Promise(r => setTimeout(r, delayMs)); 
      }
    }

    if (i < numChunks - 1) {
      // THE FIX: Strict 6-second delay to guarantee 10 requests/minute
      await new Promise(r => setTimeout(r, 6000));
    }
  }

  return chunks.flat().slice(0, count);
}

router.post("/generate", async (req, res) => {
  const { clerkId, paperType } = req.body; 

  if (!clerkId || !paperType) {
    return res.status(400).json({ error: "clerkId and paperType required" });
  }

  const distribution = paperType === "GS1" ? GS1_DISTRIBUTION : CSAT_DISTRIBUTION;
  const totalQuestions = paperType === "GS1" ? 100 : 80;
  const duration = 120; 

  try {
    const allQuestions: any[] = [];

    for (const dist of distribution) {
      let dbQuestions = await getUnusedDBQuestions(clerkId, dist.subject, dist.count);
      const needed = dist.count - dbQuestions.length;
      let aiQuestions: any[] = [];

      if (needed > 0) {
        const raw = await generateMockQuestions(dist.subject, needed, dist.types);

        for (const q of raw) {
          if (!q.question || !q.options) continue;

          let optionsArray: string[];
          if (Array.isArray(q.options)) {
            optionsArray = q.options;
          } else if (typeof q.options === "object") {
            optionsArray = [
              q.options.A || q.options["0"] || "",
              q.options.B || q.options["1"] || "",
              q.options.C || q.options["2"] || "",
              q.options.D || q.options["3"] || "",
            ];
          } else {
            continue;
          }

          const correctIndex = typeof q.correctAnswer === "number"
              ? q.correctAnswer > 3 ? q.correctAnswer - 1 : q.correctAnswer
              : 0;

          try {
            const saved = await prisma.question.create({
              data: {
                subject: dist.subject,
                difficulty: q.difficulty || "medium",
                questionType: q.questionType || "mcq",
                question: q.question,
                options: optionsArray,
                correctAnswer: Math.min(correctIndex, 3),
                explanation: q.explanation || "Refer to standard UPSC material.",
                isAIGenerated: true,
              },
            });
            aiQuestions.push(saved);
          } catch {
            
          }
        }
      }

      allQuestions.push(...dbQuestions, ...aiQuestions);
    }

    const shuffled = allQuestions.sort(() => Math.random() - 0.5).slice(0, totalQuestions);

    const mockTest = await prisma.mockTest.create({
      data: {
        clerkUserId: clerkId,
        paperType,
        title: paperType === "GS1"
          ? `UPSC GS Paper I — ${new Date().toLocaleDateString("en-IN")}`
          : `UPSC CSAT Paper II — ${new Date().toLocaleDateString("en-IN")}`,
        totalQuestions: shuffled.length,
      },
    });

    await prisma.mockTestAnswer.createMany({
      data: shuffled.map((q) => ({ mockTestId: mockTest.id, questionId: q.id })),
    });

    await prisma.mockTestQuestionUsed.createMany({
      data: shuffled.map((q) => ({ clerkUserId: clerkId, questionId: q.id, mockTestId: mockTest.id })),
      skipDuplicates: true,
    });

    res.json({
      mockTestId: mockTest.id,
      title: mockTest.title,
      paperType,
      duration,
      questions: shuffled.map((q) => ({
        id: q.id,
        subject: q.subject,
        difficulty: q.difficulty,
        questionType: q.questionType || "mcq",
        question: q.question,
        options: Array.isArray(q.options) ? q.options : JSON.parse(JSON.stringify(q.options)),
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
      })),
    });
  } catch (error) {
    console.error("Mock test generation error:", error);
    res.status(500).json({ error: "Failed to generate mock test" });
  }
});

router.post("/submit", async (req, res) => {
  const { mockTestId, clerkId, answers, timeTaken, incidents } = req.body;

  try {
    const mockTest = await prisma.mockTest.findUnique({
      where: { id: mockTestId },
      include: { answers: { include: { question: true } } },
    });

    if (!mockTest) return res.status(404).json({ error: "Test not found" });

    let score = 0;
    let attempted = 0;
    const subjectStats: Record<string, { correct: number; total: number }> = {};

    for (const answer of mockTest.answers) {
      const q = answer.question;
      const selectedAns = answers[answer.questionId];
      const isCorrect = selectedAns !== null && selectedAns !== undefined ? selectedAns === q.correctAnswer : false;

      if (selectedAns !== null && selectedAns !== undefined) {
        attempted++;
        score += isCorrect ? 2 : -0.67;
      }

      await prisma.mockTestAnswer.update({
        where: { id: answer.id },
        data: { selectedAns: selectedAns ?? null, isCorrect, timeTaken: 0 },
      });

      if (!subjectStats[q.subject]) subjectStats[q.subject] = { correct: 0, total: 0 };
      subjectStats[q.subject].total++;
      if (isCorrect) subjectStats[q.subject].correct++;

      if (selectedAns !== null && selectedAns !== undefined && !isCorrect) {
        const deckTitle = `Wrong Answers — ${q.subject}`;
        let deck = await prisma.flashcardDeck.findFirst({ where: { clerkUserId: clerkId, title: deckTitle } });
        if (!deck) {
          deck = await prisma.flashcardDeck.create({
            data: { clerkUserId: clerkId, title: deckTitle, subjectTag: q.subject, isAutoGen: true },
          });
        }
        const existing = await prisma.flashcard.findFirst({ where: { deckId: deck.id, sourceQuestionId: q.id } });
        if (!existing) {
          let options: string[] = Array.isArray(q.options) ? q.options as string[] : JSON.parse(JSON.stringify(q.options));
          const optionsList = options.map((opt, idx) => `${idx === q.correctAnswer ? "✅" : "  "} ${String.fromCharCode(65 + idx)}. ${opt}`).join("\n");

          await prisma.flashcard.create({
            data: {
              deckId: deck.id,
              front: q.question,
              back: `Options:\n${optionsList}\n\n✅ Correct: ${options[q.correctAnswer]}\n\n📖 ${q.explanation}`,
              easeFactor: 2.5, interval: 1, nextReviewAt: new Date(Date.now() - 1000), sourceQuestionId: q.id,
            },
          });
        }
      }
    }

    await prisma.mockTest.update({
      where: { id: mockTestId },
      data: { score, attempted, timeTaken, incidents, completed: true },
    });

    const istDate = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
    await prisma.dailyStudyLog.upsert({
      where: { clerkUserId_date: { clerkUserId: clerkId, date: istDate } },
      update: { mockTestCompleted: true },
      create: { clerkUserId: clerkId, date: istDate, mockTestCompleted: true },
    });

    const subjectBreakdown = Object.entries(subjectStats).map(([subject, stats]) => ({
      subject, correct: stats.correct, total: stats.total, accuracy: Math.round((stats.correct / stats.total) * 100),
    }));

    const maxScore = mockTest.totalQuestions * 2;
    const percentile = Math.round((score / maxScore) * 100);
    const rankEstimate = percentile >= 80 ? "Top 1%" : percentile >= 65 ? "Top 5%" : percentile >= 50 ? "Top 15%" : "Top 30%";

    res.json({
      success: true, score: Math.round(score * 100) / 100, maxScore, attempted,
      skipped: mockTest.totalQuestions - attempted,
      accuracy: attempted > 0 ? Math.round(((score + attempted * 0.67) / (attempted * 2.67)) * 100) : 0,
      rankEstimate, subjectBreakdown, incidents: incidents?.length || 0,
    });
  } catch (error) {
    console.error("Mock test submit error:", error);
    res.status(500).json({ error: "Failed to submit test" });
  }
});

router.get("/history/:clerkId", async (req, res) => {
  try {
    const tests = await prisma.mockTest.findMany({
      where: { clerkUserId: req.params.clerkId, completed: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    });
    res.json(tests);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch history" });
  }
});

router.get("/:testId", async (req, res) => {
  try {
    const test = await prisma.mockTest.findUnique({
      where: { id: req.params.testId },
      include: { answers: { include: { question: true } } }
    });
    if (!test) return res.status(404).json({ error: "Test not found" });

    const formattedQuestions = test.answers.map(a => {
      const q = a.question;
      return {
        id: q.id,
        subject: q.subject,
        difficulty: q.difficulty,
        questionType: q.questionType || "mcq",
        question: q.question,
        options: Array.isArray(q.options) ? q.options : Object.values(q.options || {}),
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
      };
    });

    res.json({ ...test, questions: formattedQuestions });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch specific test" });
  }
});

router.delete("/:testId", async (req, res) => {
  try {
    const { testId } = req.params;
    await prisma.mockTestAnswer.deleteMany({ where: { mockTestId: testId } });
    await prisma.mockTestQuestionUsed.deleteMany({ where: { mockTestId: testId } });
    await prisma.mockTest.delete({ where: { id: testId } });
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete test" });
  }
});

export default router;