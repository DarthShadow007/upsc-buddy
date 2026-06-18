import { Router } from "express";
import { prisma } from "../lib/prisma";

const router = Router();

// Helper: get today's date as YYYY-MM-DD in IST
function getTodayIST(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}

// Helper: get yesterday's date as YYYY-MM-DD in IST
function getYesterdayIST(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}

// Helper: update streak logic
async function updateStreak(clerkId: string) {
  const today = getTodayIST();
  const yesterday = getYesterdayIST();

  let progress = await prisma.userProgress.findUnique({
    where: { clerkUserId: clerkId },
  });

  if (!progress) {
    progress = await prisma.userProgress.create({
      data: {
        clerkUserId: clerkId,
        lastStudiedDate: today,
        currentStreak: 1,
        longestStreak: 1,
      },
    });
    return progress;
  }

  // Already updated today — no change needed
  if (progress.lastStudiedDate === today) return progress;

  let newStreak: number;
  if (progress.lastStudiedDate === yesterday) {
    newStreak = progress.currentStreak + 1;
  } else {
    newStreak = 1;
  }

  const newLongest = Math.max(newStreak, progress.longestStreak);

  return await prisma.userProgress.update({
    where: { clerkUserId: clerkId },
    data: {
      currentStreak: newStreak,
      longestStreak: newLongest,
      lastStudiedDate: today,
    },
  });
}

// ── GET dashboard stats ────────────────────────────────────────────────────
router.get("/dashboard/:clerkId", async (req, res) => {
  const { clerkId } = req.params;
  const today = getTodayIST();

  try {
    const progress = await updateStreak(clerkId);

    const subjects = await prisma.subjectPerformance.findMany({
      where: { clerkUserId: clerkId },
    });

    let todayLog = await prisma.dailyStudyLog.findUnique({
      where: { clerkUserId_date: { clerkUserId: clerkId, date: today } },
    });

    if (!todayLog) {
      todayLog = await prisma.dailyStudyLog.create({
        data: { clerkUserId: clerkId, date: today },
      });
    }

    const todayQuestionsCount = await prisma.userQuestionAttempt.count({
      where: {
        clerkUserId: clerkId,
        attemptedAt: {
          gte: new Date(`${today}T00:00:00.000+05:30`),
          lte: new Date(`${today}T23:59:59.999+05:30`),
        },
      },
    });

    const targets = [
      {
        task: "Attempt 30 questions",
        done: todayQuestionsCount >= 30,
        progress: Math.min(todayQuestionsCount, 30),
        total: 30,
      },
      {
        task: "Review 10 flashcards",
        done: todayLog.flashcardsReviewed >= 10,
        progress: Math.min(todayLog.flashcardsReviewed, 10),
        total: 10,
      },
      {
        task: "Read current affairs",
        done: todayLog.currentAffairsRead,
        progress: todayLog.currentAffairsRead ? 1 : 0,
        total: 1,
      },
      {
        task: "Complete mock test",
        done: todayLog.mockTestCompleted,
        progress: todayLog.mockTestCompleted ? 1 : 0,
        total: 1,
      },
    ];

    // Return progress with today's study minutes (resets daily automatically)
    res.json({
      progress: {
        ...progress,
        studyHours: todayLog.studyMinutes ?? 0,
      },
      subjects,
      targets,
      todayQuestions: todayQuestionsCount,
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({ error: "Failed to fetch dashboard data" });
  }
});

// ── POST save study time ───────────────────────────────────────────────────
router.post("/study-time", async (req, res) => {
  const { clerkId, minutes } = req.body;
  if (!clerkId || !minutes || minutes <= 0) return res.json({ success: true });

  const today = getTodayIST();

  try {
    // Only save to DailyStudyLog — resets automatically each new day
    await prisma.dailyStudyLog.upsert({
      where: { clerkUserId_date: { clerkUserId: clerkId, date: today } },
      update: { studyMinutes: { increment: minutes } },
      create: { clerkUserId: clerkId, date: today, studyMinutes: minutes },
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Study time error:", error);
    res.status(500).json({ error: "Failed to save study time" });
  }
});

export default router;