import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, XCircle, ChevronRight, Filter, BookOpen, Trophy, RotateCcw } from "lucide-react";
import { mockQuestions, subjects, difficulties } from "@/lib/mockData";
import { cn } from "@/lib/utils";

type Mode = "filter" | "quiz" | "result";

export default function Practice() {
  const [mode, setMode] = useState<Mode>("filter");
  const [filterSubject, setFilterSubject] = useState("all");
  const [filterDifficulty, setFilterDifficulty] = useState("all");
  const [questions, setQuestions] = useState(mockQuestions);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [showExplanation, setShowExplanation] = useState(false);

  const current = questions[currentIdx];
  const isAnswered = selected !== null;
  const isCorrect = selected === current?.correctAnswer;
  const score = Object.entries(answers).filter(([idx, ans]) => questions[parseInt(idx)]?.correctAnswer === ans).length;
  const progress = ((currentIdx) / questions.length) * 100;

  const startQuiz = () => {
    let filtered = mockQuestions;
    if (filterSubject !== "all") filtered = filtered.filter(q => q.subject === filterSubject);
    if (filterDifficulty !== "all") filtered = filtered.filter(q => q.difficulty === filterDifficulty);
    setQuestions(filtered.length > 0 ? filtered : mockQuestions);
    setCurrentIdx(0);
    setSelected(null);
    setAnswers({});
    setShowExplanation(false);
    setMode("quiz");
  };

  const handleSelect = (idx: number) => {
    if (isAnswered) return;
    setSelected(idx);
    setAnswers(prev => ({ ...prev, [currentIdx]: idx }));
  };

  const handleNext = () => {
    if (currentIdx + 1 >= questions.length) {
      setMode("result");
    } else {
      setCurrentIdx(i => i + 1);
      setSelected(null);
      setShowExplanation(false);
    }
  };

  const difficultyColor = { easy: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300", medium: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300", hard: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300" };

  if (mode === "filter") return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Practice Questions</h1>
        <p className="text-muted-foreground text-sm mt-1">{mockQuestions.length} questions across all UPSC subjects</p>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Filter className="w-4 h-4" /> Filter Questions</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Subject</label>
            <Select value={filterSubject} onValueChange={setFilterSubject}>
              <SelectTrigger data-testid="select-subject"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {subjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Difficulty</label>
            <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
              <SelectTrigger data-testid="select-difficulty"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                {difficulties.map(d => <SelectItem key={d} value={d} className="capitalize">{d.charAt(0).toUpperCase() + d.slice(1)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={startQuiz} className="w-full" data-testid="button-start-practice">
            <BookOpen className="w-4 h-4 mr-2" /> Start Practice
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  if (mode === "result") return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="text-center py-8">
        <Trophy className="w-16 h-16 text-amber-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-foreground">Session Complete!</h1>
        <p className="text-muted-foreground mt-2">Here's how you did</p>
      </div>
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="text-center">
            <p className="text-5xl font-bold text-primary">{score}/{questions.length}</p>
            <p className="text-muted-foreground mt-1">Correct Answers</p>
            <p className={cn("text-2xl font-semibold mt-2", score / questions.length >= 0.7 ? "text-green-600" : "text-amber-600")}>
              {Math.round((score / questions.length) * 100)}% Accuracy
            </p>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center pt-2">
            <div><p className="text-lg font-bold text-green-600">{score}</p><p className="text-xs text-muted-foreground">Correct</p></div>
            <div><p className="text-lg font-bold text-red-600">{questions.length - score}</p><p className="text-xs text-muted-foreground">Wrong</p></div>
            <div><p className="text-lg font-bold text-foreground">{questions.length}</p><p className="text-xs text-muted-foreground">Total</p></div>
          </div>
        </CardContent>
      </Card>
      <Button onClick={() => setMode("filter")} className="w-full" data-testid="button-practice-again">
        <RotateCcw className="w-4 h-4 mr-2" /> Practice Again
      </Button>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-5">
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
          <p className="text-base font-medium text-foreground leading-relaxed mb-6" data-testid="question-text">
            {current.question}
          </p>
          <div className="space-y-3">
            {current.options.map((option, idx) => {
              let variant = "border-border bg-card hover:border-primary/50 hover:bg-primary/5";
              if (isAnswered) {
                if (idx === current.correctAnswer) variant = "border-green-500 bg-green-50 dark:bg-green-950";
                else if (idx === selected && idx !== current.correctAnswer) variant = "border-red-500 bg-red-50 dark:bg-red-950";
                else variant = "border-border bg-card opacity-60";
              }
              return (
                <button
                  key={idx}
                  onClick={() => handleSelect(idx)}
                  data-testid={`option-${idx}`}
                  className={cn("w-full flex items-center gap-3 p-3.5 rounded-lg border-2 text-left transition-all", variant, !isAnswered && "cursor-pointer")}
                >
                  <span className={cn("w-7 h-7 rounded-full border-2 flex items-center justify-center text-sm font-bold shrink-0",
                    isAnswered && idx === current.correctAnswer ? "border-green-500 text-green-600" :
                    isAnswered && idx === selected && idx !== current.correctAnswer ? "border-red-500 text-red-600" :
                    "border-muted-foreground text-muted-foreground"
                  )}>
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="text-sm text-foreground">{option}</span>
                  {isAnswered && idx === current.correctAnswer && <CheckCircle className="w-4 h-4 text-green-500 ml-auto shrink-0" />}
                  {isAnswered && idx === selected && idx !== current.correctAnswer && <XCircle className="w-4 h-4 text-red-500 ml-auto shrink-0" />}
                </button>
              );
            })}
          </div>

          {isAnswered && (
            <div className="mt-4 space-y-3">
              <div className={cn("flex items-center gap-2 font-semibold", isCorrect ? "text-green-600" : "text-red-600")}>
                {isCorrect ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                {isCorrect ? "Correct!" : "Incorrect"}
              </div>
              <button onClick={() => setShowExplanation(!showExplanation)} className="text-sm text-primary hover:underline" data-testid="button-show-explanation">
                {showExplanation ? "Hide" : "Show"} Explanation
              </button>
              {showExplanation && (
                <div className="bg-muted rounded-lg p-3 text-sm text-foreground leading-relaxed" data-testid="explanation-text">
                  {current.explanation}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setMode("filter")} data-testid="button-exit-quiz">Exit</Button>
        {isAnswered && (
          <Button onClick={handleNext} data-testid="button-next-question">
            {currentIdx + 1 >= questions.length ? "See Results" : "Next"} <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        )}
      </div>
    </div>
  );
}
