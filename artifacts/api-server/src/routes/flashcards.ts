import { Router } from "express";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

// Fetch all decks for a user with the count of cards due today
router.get("/:clerkId/decks", async (req, res) => {
  try {
    const { clerkId } = req.params;
    const today = new Date();

    // Change this block in your GET /:clerkId/decks route
    const decks = await prisma.flashcardDeck.findMany({
      where: { clerkUserId: clerkId },
      include: {
        cards: {
          // Remove the date filter for testing to see if cards show up
          where: { NOT: { id: "" } }, 
        },
      },
    });

    res.json(decks);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch decks" });
  }
});

// Update a flashcard after review (Spaced Repetition & Daily Goals)
router.post("/review", async (req, res) => {
  try {
    const { clerkId, cardId, result } = req.body; 
    
    const card = await prisma.flashcard.findUnique({ where: { id: cardId } });
    if (!card) return res.status(404).json({ error: "Card not found" });

    let { easeFactor, interval } = card;

    // Super basic Spaced Repetition (SRS) math
    if (result === "easy") {
      interval = Math.max(1, Math.round(interval * easeFactor));
      easeFactor += 0.15;
    } else if (result === "hard") {
      interval = Math.max(1, Math.round(interval * 1.2));
      easeFactor -= 0.15;
    } else { // "again"
      interval = 1;
      easeFactor -= 0.20;
    }

    // Ensure easeFactor doesn't drop too low and make cards appear too often
    easeFactor = Math.max(1.3, easeFactor);

    // Calculate next review date
    const nextReviewAt = new Date();
    nextReviewAt.setDate(nextReviewAt.getDate() + interval);

    const updatedCard = await prisma.flashcard.update({
      where: { id: cardId },
      data: { easeFactor, interval, nextReviewAt, lastResult: result },
    });

    // Update the Daily Study Log for the Dashboard Progress Bar
    const istDate = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    await prisma.dailyStudyLog.upsert({
      where: { clerkUserId_date: { clerkUserId: clerkId, date: istDate } },
      update: { flashcardsReviewed: { increment: 1 } },
      create: { clerkUserId: clerkId, date: istDate, flashcardsReviewed: 1 }
    });

    res.json({ success: true, nextReviewAt: updatedCard.nextReviewAt });
  } catch (error) {
    res.status(500).json({ error: "Failed to update review" });
  }
});

export default router;