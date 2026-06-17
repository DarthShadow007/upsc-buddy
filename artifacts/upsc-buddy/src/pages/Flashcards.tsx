import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Layers, RotateCcw, ThumbsUp, ThumbsDown, Minus, ChevronLeft } from "lucide-react";
import { mockFlashcardDecks } from "@/lib/mockData";
import { cn } from "@/lib/utils";

type View = "decks" | "study";

export default function Flashcards() {
  const [view, setView] = useState<View>("decks");
  const [activeDeck, setActiveDeck] = useState(mockFlashcardDecks[0]);
  const [cardIdx, setCardIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [ratings, setRatings] = useState<Record<number, "easy" | "hard" | "skip">>({});
  const [done, setDone] = useState(false);

  const cards = activeDeck.cards;
  const current = cards[cardIdx];
  const progress = (cardIdx / cards.length) * 100;

  const startDeck = (deck: typeof mockFlashcardDecks[0]) => {
    setActiveDeck(deck);
    setCardIdx(0);
    setFlipped(false);
    setRatings({});
    setDone(false);
    setView("study");
  };

  const rate = (r: "easy" | "hard" | "skip") => {
    setRatings(prev => ({ ...prev, [cardIdx]: r }));
    if (cardIdx + 1 >= cards.length) {
      setDone(true);
    } else {
      setCardIdx(i => i + 1);
      setFlipped(false);
    }
  };

  if (view === "decks") return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Layers className="w-6 h-6 text-primary" /> Flashcard Decks
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Spaced repetition system for long-term retention</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {mockFlashcardDecks.map(deck => {
          const masteredPct = Math.round((deck.mastered / deck.totalCards) * 100);
          return (
            <Card key={deck.id} className="hover:shadow-md transition-shadow" data-testid={`deck-card-${deck.id}`}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                    <Layers className="w-5 h-5 text-primary" />
                  </div>
                  <Badge variant="outline" className="text-xs">{deck.subject}</Badge>
                </div>
                <h3 className="font-semibold text-foreground mb-1">{deck.title}</h3>
                <p className="text-xs text-muted-foreground mb-3">{deck.totalCards} cards total</p>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Mastered</span>
                    <span>{deck.mastered}/{deck.totalCards} ({masteredPct}%)</span>
                  </div>
                  <Progress value={masteredPct} className="h-1.5" />
                </div>
                {deck.dueToday > 0 && (
                  <div className="flex items-center gap-1.5 mb-3">
                    <div className="w-2 h-2 bg-amber-500 rounded-full" />
                    <span className="text-xs text-amber-600 font-medium">{deck.dueToday} cards due today</span>
                  </div>
                )}
                <Button onClick={() => startDeck(deck)} className="w-full" size="sm" data-testid={`button-study-deck-${deck.id}`}>
                  Study Now
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="bg-muted/50">
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground text-center">
            💡 SRS algorithm will automatically schedule cards based on your performance when connected to the backend.
          </p>
        </CardContent>
      </Card>
    </div>
  );

  if (done) {
    const easy = Object.values(ratings).filter(r => r === "easy").length;
    const hard = Object.values(ratings).filter(r => r === "hard").length;
    const skip = Object.values(ratings).filter(r => r === "skip").length;
    return (
      <div className="max-w-sm mx-auto space-y-6 text-center py-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <ThumbsUp className="w-8 h-8 text-green-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Deck Complete!</h2>
          <p className="text-muted-foreground text-sm mt-1">{activeDeck.title}</p>
        </div>
        <Card>
          <CardContent className="p-4 grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-2xl font-bold text-green-600">{easy}</p>
              <p className="text-xs text-muted-foreground">Easy</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-600">{skip}</p>
              <p className="text-xs text-muted-foreground">Okay</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">{hard}</p>
              <p className="text-xs text-muted-foreground">Hard</p>
            </div>
          </CardContent>
        </Card>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setView("decks")} className="flex-1" data-testid="button-back-to-decks">Back</Button>
          <Button onClick={() => startDeck(activeDeck)} className="flex-1" data-testid="button-study-again">
            <RotateCcw className="w-4 h-4 mr-1.5" /> Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => setView("decks")} data-testid="button-back-decks">
          <ChevronLeft className="w-4 h-4 mr-1" /> Decks
        </Button>
        <div className="flex-1">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>{activeDeck.title}</span>
            <span>{cardIdx + 1}/{cards.length}</span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>
      </div>

      <div
        className="relative cursor-pointer"
        onClick={() => setFlipped(f => !f)}
        data-testid="flashcard-container"
        style={{ perspective: "1000px" }}
      >
        <div className={cn("relative transition-all duration-500", flipped && "[transform:rotateY(180deg)]")}
          style={{ transformStyle: "preserve-3d" }}>
          <Card className="min-h-56 flex items-center justify-center p-8" style={{ backfaceVisibility: "hidden" }}>
            <CardContent className="p-0 text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3">Front</p>
              <p className="text-xl font-bold text-foreground" data-testid="card-front">{current.front}</p>
              <p className="text-xs text-muted-foreground mt-4">Tap to reveal answer</p>
            </CardContent>
          </Card>
          <Card className="min-h-56 flex items-center justify-center p-8 absolute inset-0 bg-primary/5 border-primary/30"
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
            <CardContent className="p-0 text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3">Answer</p>
              <p className="text-base text-foreground leading-relaxed" data-testid="card-back">{current.back}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {flipped ? (
        <div className="flex gap-3">
          <Button onClick={() => rate("hard")} variant="outline" className="flex-1 border-red-300 text-red-600 hover:bg-red-50" data-testid="button-rate-hard">
            <ThumbsDown className="w-4 h-4 mr-1.5" /> Hard
          </Button>
          <Button onClick={() => rate("skip")} variant="outline" className="flex-1" data-testid="button-rate-okay">
            <Minus className="w-4 h-4 mr-1.5" /> Okay
          </Button>
          <Button onClick={() => rate("easy")} className="flex-1 bg-green-600 hover:bg-green-700" data-testid="button-rate-easy">
            <ThumbsUp className="w-4 h-4 mr-1.5" /> Easy
          </Button>
        </div>
      ) : (
        <Button onClick={() => setFlipped(true)} className="w-full" variant="outline" data-testid="button-show-answer">
          Show Answer
        </Button>
      )}
    </div>
  );
}
