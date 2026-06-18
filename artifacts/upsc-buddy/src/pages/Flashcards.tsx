import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Layers, Lightbulb, ArrowLeft, BrainCircuit } from "lucide-react";
import { useUser } from "@clerk/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────
interface Flashcard {
  id: string;
  front: string;
  back: string;
  nextReviewAt: string;
}

interface Deck {
  id: string;
  title: string;
  subjectTag: string;
  cards: Flashcard[];
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function Flashcards() {
  const { user } = useUser();
  const queryClient = useQueryClient();

  const [activeDeck, setActiveDeck] = useState<Deck | null>(null);
  const [currentCardIdx, setCurrentCardIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Fetch all decks for the user
  const { data: decks, isLoading } = useQuery<Deck[]>({
    queryKey: ["flashcardDecks", user?.id],
    queryFn: async () => {
      const res = await fetch(`/api/flashcards/${user?.id}/decks`);
      if (!res.ok) throw new Error("Failed to fetch decks");
      return res.json();
    },
    enabled: !!user?.id,
  });

  // Review Mutation
  const reviewMutation = useMutation({
    mutationFn: async (payload: { cardId: string; result: "easy" | "hard" | "again" }) => {
      const res = await fetch("/api/flashcards/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clerkId: user?.id, ...payload }),
      });
      if (!res.ok) throw new Error("Failed to review card");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["flashcardDecks"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] }); // Updates Daily Targets!
    },
  });

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleStudyClick = (deck: Deck) => {
    setActiveDeck(deck);
    setCurrentCardIdx(0);
    setIsFlipped(false);
  };

  const handleReview = (result: "easy" | "hard" | "again") => {
    if (!activeDeck) return;
    const currentCard = activeDeck.cards[currentCardIdx];

    // Trigger backend SRS update
    reviewMutation.mutate({ cardId: currentCard.id, result });

    // Move to next card
    if (currentCardIdx + 1 < activeDeck.cards.length) {
      setIsFlipped(false);
      setCurrentCardIdx((prev) => prev + 1);
    } else {
      // Finished deck for today
      setActiveDeck(null);
    }
  };

  // ── Loading State ───────────────────────────────────────────────────────
  if (isLoading) {
    return <div className="flex justify-center p-12 text-muted-foreground">Loading your decks...</div>;
  }

  // ── Study Mode UI ───────────────────────────────────────────────────────
  if (activeDeck) {
    const currentCard = activeDeck.cards[currentCardIdx];
    
    if (!currentCard) {
       setActiveDeck(null);
       return null;
    }

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => setActiveDeck(null)} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Decks
          </Button>
          <Badge variant="outline">{activeDeck.subjectTag}</Badge>
        </div>

        <div className="flex justify-between items-center text-sm text-muted-foreground">
          <p>Card {currentCardIdx + 1} of {activeDeck.cards.length}</p>
          <p>Deck: {activeDeck.title}</p>
        </div>
        <Progress value={((currentCardIdx) / activeDeck.cards.length) * 100} className="h-1.5" />

        {/* The Flashcard */}
        <div 
          className="relative min-h-[350px] w-full perspective-1000 cursor-pointer"
          onClick={() => !isFlipped && setIsFlipped(true)}
        >
          <Card className={cn(
            "absolute inset-0 w-full h-full transition-all duration-500 transform-style-3d",
            isFlipped ? "[transform:rotateY(180deg)]" : ""
          )}>
            
            {/* Front of Card */}
            <CardContent className={cn(
              "absolute inset-0 flex flex-col items-center justify-center p-8 text-center backface-hidden",
              isFlipped && "opacity-0 pointer-events-none"
            )}>
              <BrainCircuit className="w-12 h-12 text-primary/20 mb-6" />
              <h2 className="text-xl font-medium text-foreground">{currentCard.front}</h2>
              <p className="absolute bottom-6 text-sm text-muted-foreground animate-pulse">Click anywhere to flip</p>
            </CardContent>

            {/* Back of Card */}
            <CardContent className={cn(
              "absolute inset-0 flex flex-col items-center justify-center p-8 text-center backface-hidden [transform:rotateY(180deg)]",
              !isFlipped && "opacity-0 pointer-events-none"
            )}>
              <div className="w-full text-left space-y-4 overflow-y-auto max-h-[250px] scrollbar-thin">
                <p className="text-base text-foreground whitespace-pre-wrap">{currentCard.back}</p>
              </div>
            </CardContent>
            
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center pt-4">
          <Button 
            disabled={!isFlipped || reviewMutation.isPending} 
            onClick={() => handleReview("again")}
            variant="outline"
            className="w-32 border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-red-900 dark:hover:bg-red-950"
          >
            Again (1d)
          </Button>
          <Button 
            disabled={!isFlipped || reviewMutation.isPending} 
            onClick={() => handleReview("hard")}
            variant="outline"
            className="w-32 border-amber-200 hover:bg-amber-50 hover:text-amber-600 dark:border-amber-900 dark:hover:bg-amber-950"
          >
            Hard (2d+)
          </Button>
          <Button 
            disabled={!isFlipped || reviewMutation.isPending} 
            onClick={() => handleReview("easy")}
            variant="outline"
            className="w-32 border-green-200 hover:bg-green-50 hover:text-green-600 dark:border-green-900 dark:hover:bg-green-950"
          >
            Easy (4d+)
          </Button>
        </div>
      </div>
    );
  }

  // ── Grid View UI ────────────────────────────────────────────────────────
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Layers className="w-8 h-8 text-amber-500" />
          Flashcard Decks
        </h1>
        <p className="text-muted-foreground mt-2">Spaced repetition system for long-term retention. Decks auto-generate based on your practice mistakes.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {decks?.map((deck) => {
          const totalCards = deck.cards.length; // In a real app, you'd aggregate a true total vs due, but here cards[] is filtered to what's due today by the backend route
          const dueToday = deck.cards.length; 
          
          if (dueToday === 0) return null; // Hide decks with nothing due

          return (
            <Card key={deck.id} className="flex flex-col border-border/50 bg-card/50">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="p-2 bg-amber-500/10 rounded-lg">
                    <Layers className="w-5 h-5 text-amber-500" />
                  </div>
                  <Badge variant="outline" className="bg-background">{deck.subjectTag}</Badge>
                </div>
                <CardTitle className="text-lg font-bold">{deck.title}</CardTitle>
                <p className="text-sm text-muted-foreground">{totalCards} cards due for review</p>
              </CardHeader>
              
              <CardContent className="mt-auto pt-4 border-t border-border/50">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  <span className="text-sm font-medium text-amber-500">{dueToday} cards due today</span>
                </div>
                <Button 
                  onClick={() => handleStudyClick(deck)} 
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold"
                >
                  Study Now
                </Button>
              </CardContent>
            </Card>
          );
        })}

        {(!decks || decks.filter(d => d.cards.length > 0).length === 0) && (
          <div className="col-span-full text-center py-12 bg-muted/30 rounded-xl border border-dashed">
            <Lightbulb className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-50" />
            <h3 className="text-lg font-medium text-foreground">You're all caught up!</h3>
            <p className="text-muted-foreground mt-1">No flashcards due for review right now. Go do some practice questions to build your decks!</p>
          </div>
        )}
      </div>

      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4 text-center flex items-center justify-center gap-2">
        <Lightbulb className="w-4 h-4 text-amber-500" />
        <span className="text-sm text-slate-300">SRS algorithm will automatically schedule cards based on your performance when connected to the backend.</span>
      </div>
    </div>
  );
}