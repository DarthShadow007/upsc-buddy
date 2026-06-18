import { Router } from "express";
import { prisma } from "../lib/prisma";

const router = Router();

// GET all decks for a user with cards due for review
router.get("/:clerkId/decks", async (req, res) => {
  try {
    const { clerkId } = req.params;

    const decks = await prisma.flashcardDeck.findMany({
      where: { clerkUserId: clerkId },
      include: {
        cards: {
          where: {
            nextReviewAt: {
              lte: new Date(Date.now() + 24 * 60 * 60 * 1000),
            },
          },
          orderBy: { nextReviewAt: "asc" },
        },
      },
      // NO orderBy createdAt — field doesn't exist in schema
    });

    const decksWithCards = decks.filter((d) => d.cards.length > 0);
    res.json(decksWithCards);
  } catch (error) {
    console.error("Flashcard fetch error:", error);
    res.status(500).json({ error: "Failed to fetch decks" });
  }
});

// POST review a card — update SRS interval
router.post("/review", async (req, res) => {
  try {
    const { clerkId, cardId, result } = req.body;

    const card = await prisma.flashcard.findUnique({ where: { id: cardId } });
    if (!card) return res.status(404).json({ error: "Card not found" });

    let { easeFactor, interval } = card;

    if (result === "easy") {
      interval = Math.max(1, Math.round(interval * easeFactor));
      easeFactor = Math.min(3.0, easeFactor + 0.15);
    } else if (result === "hard") {
      interval = Math.max(1, Math.round(interval * 1.2));
      easeFactor = Math.max(1.3, easeFactor - 0.15);
    } else {
      interval = 1;
      easeFactor = Math.max(1.3, easeFactor - 0.2);
    }

    const nextReviewAt = new Date();
    nextReviewAt.setDate(nextReviewAt.getDate() + interval);

    await prisma.flashcard.update({
      where: { id: cardId },
      data: { easeFactor, interval, nextReviewAt, lastResult: result },
    });

    const istDate = new Date().toLocaleDateString("en-CA", {
      timeZone: "Asia/Kolkata",
    });

    await prisma.dailyStudyLog.upsert({
      where: { clerkUserId_date: { clerkUserId: clerkId, date: istDate } },
      update: { flashcardsReviewed: { increment: 1 } },
      create: { clerkUserId: clerkId, date: istDate, flashcardsReviewed: 1 },
    });

    res.json({ success: true, nextReviewAt, interval });
  } catch (error) {
    console.error("Flashcard review error:", error);
    res.status(500).json({ error: "Failed to update review" });
  }
});

// POST create a custom deck manually
router.post("/deck", async (req, res) => {
  try {
    const { clerkId, title, subjectTag } = req.body;
    const deck = await prisma.flashcardDeck.create({
      data: { clerkUserId: clerkId, title, subjectTag, isAutoGen: false },
    });
    res.json(deck);
  } catch (error) {
    console.error("Deck create error:", error);
    res.status(500).json({ error: "Failed to create deck" });
  }
});

// POST add a card to a deck manually
router.post("/card", async (req, res) => {
  try {
    const { deckId, front, back } = req.body;
    const card = await prisma.flashcard.create({
      data: { deckId, front, back, easeFactor: 2.5, interval: 1, nextReviewAt: new Date() },
    });
    res.json(card);
  } catch (error) {
    console.error("Card create error:", error);
    res.status(500).json({ error: "Failed to create card" });
  }
});

export default router;