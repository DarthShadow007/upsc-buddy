import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

// GET user dashboard stats using their secure Clerk ID
router.get('/dashboard/:clerkId', async (req: Request, res: Response) => {
  const { clerkId } = req.params;

  try {
    // 1. Try to find the user's existing progress
    let progress = await prisma.userProgress.findUnique({
      where: { clerkUserId: clerkId },
    });

    // 2. If they are a new user, create a blank stats profile!
    if (!progress) {
      progress = await prisma.userProgress.create({
        data: { clerkUserId: clerkId },
      });
    }

    // 3. Fetch their subject-wise performance
    const subjects = await prisma.subjectPerformance.findMany({
      where: { clerkUserId: clerkId },
    });

    // 4. Send it all back to the React frontend
    res.json({ progress, subjects });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Failed to fetch dashboard data" });
  }
});

export default router;