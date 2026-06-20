import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle, XCircle, ChevronRight, Filter,
  BookOpen, Trophy, RotateCcw, Loader2, AlertCircle, RefreshCw
} from "lucide-react";
import { useUser } from "@clerk/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import AIGeneratorButton from "@/components/AIGeneratorButton";

// ── Types ──────────────────────────────────────────────────────────────────
interface Question {
  id: string;
  subject: string;
  difficulty: "easy" | "medium" | "hard";
  question: string;
  options: any; 
  correctAnswer: any;
  explanation: string;
}

type Mode = "filter" | "quiz" | "result";

const SUBJECTS = [
  "Polity", "History", "Geography", "Economy",
  "Environment", "Science & Tech", "Art & Culture", "CSAT"
];

const DIFFICULTIES = ["easy", "medium", "hard"];

const difficultyColor: Record<string, string> = {
  easy: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  medium: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  hard: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
};

// ── Main Component ─────────────────────────────────────────────────────────
export default function Practice() {
  const { user } = useUser();
  const queryClient = useQueryClient();

  // Filter state
  const [filterSubject, setFilterSubject] = useState("all");
  const [filterDifficulty, setFilterDifficulty] = useState("all");

  // Quiz state
  const [mode, setMode] = useState<Mode>("filter");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [showExplanation, setShowExplanation] = useState(false);
  const [resetNotice, setResetNotice] = useState(false);

  // ── Fetch questions from backend ─────────────────────────────────────────
  const {
    refetch: fetchQuestions,
    isFetching,
  } = useQuery({
    queryKey: ["practiceQuestions", user?.id, filterSubject, filterDifficulty],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: "10" });
      if (filterSubject !== "all") params.append("subject", filterSubject);
      if (filterDifficulty !== "all") params.append("difficulty", filterDifficulty);
      
      // FIX: Explicitly target the backend URL to bypass Vite proxy drops
      const res = await fetch(`http://localhost:5000/api/questions/practice/${user?.id}?${params}`);
      if (!res.ok) throw new Error("Failed to fetch questions");
      return res.json();
    },
    enabled: false,
  });

  // ── Save attempt to backend ───────────────────────────────────────────────
  const attemptMutation = useMutation({
    mutationFn: async (payload: {
      questionId: string;
      selectedAns: number;
      isCorrect: boolean;
      subject: string;
    }) => {
      // FIX: Explicitly target the backend URL
      const res = await fetch("http://localhost:5000/api/questions/attempt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clerkId: user?.id, ...payload }),
      });
      if (!res.ok) throw new Error("Failed to save attempt");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
    },
  });

  // ── 🛡️ SAFELY PARSE AI DATA (Crash Prevention) ──────────────────────────
  const current = questions[currentIdx];
  
  // 1. Force options into a safe Array
  const safeOptions: string[] = current 
    ? (Array.isArray(current.options) ? current.options : Object.values(current.options || {}))
    : [];

  // 2. Convert Gemini's answer format (1-4 or A-D) into our React format (0-3)
  let safeCorrectIdx = current?.correctAnswer ?? 0;
  if (typeof safeCorrectIdx === "string") {
    safeCorrectIdx = ["A", "B", "C", "D"].indexOf(safeCorrectIdx.toUpperCase());
  } else if (safeCorrectIdx >= 1 && safeCorrectIdx <= 4) {
    safeCorrectIdx -= 1;
  }

  const isAnswered = selected !== null;
  const isCorrect = selected === safeCorrectIdx;
  
  const score = Object.entries(answers).filter(([idx, ans]) => {
    const q = questions[parseInt(idx)];
    if (!q) return false;
    let cAns = q.correctAnswer;
    if (typeof cAns === "string") cAns = ["A", "B", "C", "D"].indexOf(cAns.toUpperCase());
    else if (cAns >= 1 && cAns <= 4) cAns -= 1;
    return cAns === ans;
  }).length;

  const progress = questions.length > 0 ? (currentIdx / questions.length) * 100 : 0;

  // ── Handlers ──────────────────────────────────────────────────────────────
  const startQuiz = async () => {
    const result = await fetchQuestions();
    if (result.data) {
      setQuestions(result.data.questions || []);
      setResetNotice(result.data.reset || false);
      setCurrentIdx(0);
      setSelected(null);
      setAnswers({});
      setShowExplanation(false);
      setMode("quiz");
    }
  };

  const handleSelect = (idx: number) => {
    if (isAnswered) return;
    setSelected(idx);
    setAnswers((prev) => ({ ...prev, [currentIdx]: idx }));

    if (current) {
      attemptMutation.mutate({
        questionId: current.id,
        selectedAns: idx,
        isCorrect: idx === safeCorrectIdx,
        subject: current.subject,
      });
    }
  };

  const handleNext = () => {
    if (currentIdx + 1 >= questions.length) {
      setMode("result");
    } else {
      setCurrentIdx((i) => i + 1);
      setSelected(null);
      setShowExplanation(false);
    }
  };

  const resetAndGoBack = () => {
    setMode("filter");
    setQuestions([]);
    setCurrentIdx(0);
    setSelected(null);
    setAnswers({});
    setShowExplanation(false);
    setResetNotice(false);
  };

  // ── Filter Screen ─────────────────────────────────────────────────────────
  if (mode === "filter") {
    return (
      <div className="max-w-xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Practice Questions</h1>
          <p className="text-muted-foreground text-sm mt-1">
            200+ UPSC-standard questions. Questions you've already seen won't repeat.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="w-4 h-4" /> Filter Questions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Subject</label>
              <Select value={filterSubject} onValueChange={setFilterSubject}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {SUBJECTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Difficulty</label>
              <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  {DIFFICULTIES.map((d) => (
                    <SelectItem key={d} value={d} className="capitalize">
                      {d.charAt(0).toUpperCase() + d.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button onClick={startQuiz} className="w-full" disabled={isFetching}>
              {isFetching ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Loading questions...</>
              ) : (
                <><BookOpen className="w-4 h-4 mr-2" /> Start Practice</>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-dashed">
          <CardContent className="p-4 text-center text-sm text-muted-foreground">
            <RefreshCw className="w-4 h-4 mx-auto mb-2 opacity-50" />
            Questions you've already attempted won't appear again until you've seen them all.
          </CardContent>
        </Card>

        <div className="flex justify-center pt-2">
          <AIGeneratorButton 
            specificSubject={filterSubject !== "all" ? filterSubject : undefined} 
            specificDifficulty={filterDifficulty !== "all" ? filterDifficulty : undefined} 
          />
        </div>
      </div>
    );
  }

  // ── Result Screen ─────────────────────────────────────────────────────────
  if (mode === "result") {
    const accuracy = Math.round((score / questions.length) * 100) || 0;
    return (
      <div className="max-w-xl mx-auto space-y-6">
        <div className="text-center py-8">
          <Trophy className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground">Session Complete!</h1>
          <p className="text-muted-foreground mt-2">Your answers have been saved to your profile.</p>
        </div>

        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="text-center">
              <p className="text-5xl font-bold text-primary">{score}/{questions.length}</p>
              <p className="text-muted-foreground mt-1">Correct Answers</p>
              <p className={cn("text-2xl font-semibold mt-2", accuracy >= 70 ? "text-green-600" : accuracy >= 40 ? "text-amber-600" : "text-red-600")}>
                {accuracy}% Accuracy
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center pt-2 border-t">
              <div>
                <p className="text-lg font-bold text-green-600">{score}</p>
                <p className="text-xs text-muted-foreground">Correct</p>
              </div>
              <div>
                <p className="text-lg font-bold text-red-600">{questions.length - score}</p>
                <p className="text-xs text-muted-foreground">Wrong</p>
              </div>
              <div>
                <p className="text-lg font-bold text-primary">{questions.length}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>

            <div className="bg-muted rounded-lg p-3 text-xs text-muted-foreground">
              <p className="font-medium mb-1">UPSC Marking Scheme:</p>
              <p>+2 for correct • −0.67 for wrong</p>
              <p className="mt-1 font-medium text-foreground">
                Your UPSC score: {((score * 2) - ((questions.length - score) * 0.67)).toFixed(2)} / {questions.length * 2}
              </p>
            </div>
          </CardContent>
        </Card>

        <Button onClick={resetAndGoBack} className="w-full">
          <RotateCcw className="w-4 h-4 mr-2" /> Practice Again
        </Button>
      </div>
    );
  }

  // ── Quiz Screen ───────────────────────────────────────────────────────────
  if (!current) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-5">
        <AlertCircle className="w-12 h-12 text-amber-500" />
        <p className="text-foreground font-medium text-center text-lg">
          No more unseen questions found!
          <br />
          <span className="text-muted-foreground text-sm font-normal">
            You have exhausted the current bank for this filter.
          </span>
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
          <Button onClick={resetAndGoBack} variant="outline" className="flex-1">
            Go Back
          </Button>
          <div className="flex-1">
            <AIGeneratorButton 
              specificSubject={filterSubject !== "all" ? filterSubject : undefined} 
              specificDifficulty={filterDifficulty !== "all" ? filterDifficulty : undefined} 
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {resetNotice && (
        <div className="flex items-center gap-2 bg-amber-50 border-amber-200 rounded-lg p-3 text-sm text-amber-800">
          <RefreshCw className="w-4 h-4 shrink-0" />
          You've answered all questions in this category! Starting a fresh cycle.
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Question {currentIdx + 1} of {questions.length}</p>
          <Progress value={progress} className="h-1.5 w-48 mt-1.5" />
        </div>
        <div className="flex items-center gap-2">
          <Badge className={cn("capitalize text-xs", difficultyColor[current.difficulty])}>{current.difficulty}</Badge>
          <Badge variant="outline" className="text-xs">{current.subject}</Badge>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <p className="text-base font-medium text-foreground leading-relaxed mb-6">
            {current.question}
          </p>

          <div className="space-y-3">
            {safeOptions.map((option, idx) => {
              let style = "border-border bg-card hover:border-primary/50 hover:bg-primary/5";
              if (isAnswered) {
                if (idx === safeCorrectIdx)
                  style = "border-green-500 bg-green-50 dark:bg-green-950";
                else if (idx === selected && idx !== safeCorrectIdx)
                  style = "border-red-500 bg-red-50 dark:bg-red-950";
                else
                  style = "border-border bg-card opacity-50";
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSelect(idx)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3.5 rounded-lg border-2 text-left transition-all",
                    style,
                    !isAnswered && "cursor-pointer"
                  )}
                >
                  <span className={cn(
                    "w-7 h-7 rounded-full border-2 flex items-center justify-center text-sm font-bold shrink-0",
                    isAnswered && idx === safeCorrectIdx
                      ? "border-green-500 text-green-600"
                      : isAnswered && idx === selected && idx !== safeCorrectIdx
                      ? "border-red-500 text-red-600"
                      : "border-muted-foreground text-muted-foreground"
                  )}>
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="text-sm text-foreground">{option as string}</span>
                  {isAnswered && idx === safeCorrectIdx && <CheckCircle className="w-4 h-4 text-green-500 ml-auto shrink-0" />}
                  {isAnswered && idx === selected && idx !== safeCorrectIdx && <XCircle className="w-4 h-4 text-red-500 ml-auto shrink-0" />}
                </button>
              );
            })}
          </div>

          {isAnswered && (
            <div className="mt-4 space-y-3">
              <div className={cn("flex items-center gap-2 font-semibold", isCorrect ? "text-green-600" : "text-red-600")}>
                {isCorrect
                  ? <><CheckCircle className="w-5 h-5" /> Correct! +2 marks</>
                  : <><XCircle className="w-5 h-5" /> Incorrect. −0.67 marks</>
                }
              </div>
              <button
                onClick={() => setShowExplanation(!showExplanation)}
                className="text-sm text-primary hover:underline"
              >
                {showExplanation ? "Hide" : "Show"} Explanation
              </button>
              {showExplanation && (
                <div className="bg-muted rounded-lg p-3 text-sm text-foreground leading-relaxed">
                  {current.explanation}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={resetAndGoBack}>Exit</Button>
        {isAnswered && (
          <Button onClick={handleNext}>
            {currentIdx + 1 >= questions.length ? "See Results" : "Next"}
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        )}
      </div>
    </div>
  );
}