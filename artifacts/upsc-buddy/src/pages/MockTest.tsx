import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Clock, AlertCircle, CheckCircle, Trophy, Play, RotateCcw, BookOpen } from "lucide-react";
import { mockQuestions } from "@/lib/mockData";
import { cn } from "@/lib/utils";

type Mode = "home" | "running" | "result";

const MOCK_TESTS = [
  { id: 1, title: "UPSC Prelims Mock 1", questions: 8, duration: 8, subject: "Mixed", difficulty: "hard" as const },
  { id: 2, title: "Polity Special Test", questions: 5, duration: 5, subject: "Polity", difficulty: "medium" as const },
  { id: 3, title: "History & Geography", questions: 6, duration: 6, subject: "Mixed", difficulty: "medium" as const },
];

export default function MockTest() {
  const [mode, setMode] = useState<Mode>("home");
  const [selectedTest, setSelectedTest] = useState(MOCK_TESTS[0]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [flagged, setFlagged] = useState<Set<number>>(new Set());

  const questions = mockQuestions.slice(0, selectedTest.questions);

  const endTest = useCallback(() => setMode("result"), []);

  useEffect(() => {
    if (mode !== "running") return;
    const interval = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(interval); endTest(); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [mode, endTest]);

  const startTest = (test: typeof MOCK_TESTS[0]) => {
    setSelectedTest(test);
    setCurrentIdx(0);
    setAnswers({});
    setFlagged(new Set());
    setTimeLeft(test.duration * 60);
    setMode("running");
  };

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;
  const score = questions.filter((q, i) => answers[i] === q.correctAnswer).length;
  const attempted = Object.keys(answers).length;
  const accuracy = attempted > 0 ? Math.round((score / attempted) * 100) : 0;

  if (mode === "home") return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Mock Tests</h1>
        <p className="text-muted-foreground text-sm mt-1">Simulate real UPSC exam conditions</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MOCK_TESTS.map(test => (
          <Card key={test.id} className="hover:shadow-md transition-shadow" data-testid={`test-card-${test.id}`}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <BookOpen className="w-8 h-8 text-primary bg-primary/10 p-1.5 rounded-lg" />
                <Badge className={cn("text-xs capitalize", test.difficulty === "hard" ? "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300" : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300")}>{test.difficulty}</Badge>
              </div>
              <h3 className="font-semibold text-foreground mb-1">{test.title}</h3>
              <p className="text-xs text-muted-foreground mb-3">{test.subject}</p>
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                <span>{test.questions} questions</span>
                <span>{test.duration} mins</span>
              </div>
              <Button onClick={() => startTest(test)} className="w-full" size="sm" data-testid={`button-start-test-${test.id}`}>
                <Play className="w-3.5 h-3.5 mr-1.5" /> Start Test
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900">
        <CardContent className="p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-900 dark:text-amber-200">AI Proctoring Notice</p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
              Full AI proctoring with face detection (face-api.js) will be integrated by the developer. 
              Questions, timer, and scoring are fully functional.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  if (mode === "result") {
    const grade = score / questions.length >= 0.8 ? "Excellent" : score / questions.length >= 0.6 ? "Good" : score / questions.length >= 0.4 ? "Average" : "Needs Improvement";
    const gradeColor = score / questions.length >= 0.8 ? "text-green-600" : score / questions.length >= 0.6 ? "text-amber-600" : "text-red-600";
    return (
      <div className="max-w-xl mx-auto space-y-6">
        <div className="text-center py-6">
          <Trophy className="w-16 h-16 text-amber-500 mx-auto mb-3" />
          <h1 className="text-2xl font-bold text-foreground">Test Complete!</h1>
          <p className={cn("text-lg font-semibold mt-1", gradeColor)}>{grade}</p>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center mb-6">
              <p className="text-5xl font-bold text-primary">{score}<span className="text-2xl text-muted-foreground">/{questions.length}</span></p>
              <p className="text-muted-foreground mt-1">Score</p>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-green-50 dark:bg-green-950 rounded-lg p-3">
                <p className="text-2xl font-bold text-green-600">{score}</p>
                <p className="text-xs text-muted-foreground">Correct</p>
              </div>
              <div className="bg-red-50 dark:bg-red-950 rounded-lg p-3">
                <p className="text-2xl font-bold text-red-600">{attempted - score}</p>
                <p className="text-xs text-muted-foreground">Wrong</p>
              </div>
              <div className="bg-muted rounded-lg p-3">
                <p className="text-2xl font-bold text-muted-foreground">{questions.length - attempted}</p>
                <p className="text-xs text-muted-foreground">Skipped</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Accuracy (attempted)</span>
                <span className="font-medium">{accuracy}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <div className="space-y-2">
          {questions.map((q, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg border" data-testid={`result-q-${i}`}>
              {answers[i] === q.correctAnswer ? <CheckCircle className="w-4 h-4 text-green-500 shrink-0" /> : <div className="w-4 h-4 rounded-full border-2 border-red-400 shrink-0" />}
              <p className="text-sm text-foreground truncate flex-1">{q.question.substring(0, 60)}...</p>
              <Badge variant="outline" className="text-xs shrink-0">{q.subject}</Badge>
            </div>
          ))}
        </div>
        <Button onClick={() => setMode("home")} className="w-full" data-testid="button-back-to-tests">
          <RotateCcw className="w-4 h-4 mr-2" /> Back to Tests
        </Button>
      </div>
    );
  }

  const current = questions[currentIdx];
  const timerColor = timeLeft < 60 ? "text-red-600" : timeLeft < 180 ? "text-amber-600" : "text-foreground";

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between p-3 bg-card rounded-xl border">
        <div>
          <p className="text-xs text-muted-foreground">{selectedTest.title}</p>
          <p className="text-sm font-medium">Q {currentIdx + 1} / {questions.length}</p>
        </div>
        <div className={cn("flex items-center gap-1.5 font-mono text-lg font-bold", timerColor)}>
          <Clock className="w-4 h-4" />
          {formatTime(timeLeft)}
        </div>
        <Button variant="outline" size="sm" onClick={endTest} data-testid="button-submit-test">Submit</Button>
      </div>

      <Progress value={(Object.keys(answers).length / questions.length) * 100} className="h-1" />

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Badge variant="outline" className="text-xs">{current.subject}</Badge>
            <button onClick={() => setFlagged(f => { const nf = new Set(f); nf.has(currentIdx) ? nf.delete(currentIdx) : nf.add(currentIdx); return nf; })}
              className={cn("text-xs px-2 py-0.5 rounded border transition-colors", flagged.has(currentIdx) ? "bg-amber-100 text-amber-800 border-amber-300" : "text-muted-foreground border-border")}>
              {flagged.has(currentIdx) ? "⚑ Flagged" : "⚐ Flag"}
            </button>
          </div>
          <p className="text-base font-medium text-foreground leading-relaxed mb-5">{current.question}</p>
          <div className="space-y-2.5">
            {current.options.map((opt, idx) => (
              <button key={idx} onClick={() => setAnswers(a => ({ ...a, [currentIdx]: idx }))}
                data-testid={`mock-option-${idx}`}
                className={cn("w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all",
                  answers[currentIdx] === idx ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/40"
                )}>
                <span className={cn("w-6 h-6 rounded-full border flex items-center justify-center text-xs font-bold shrink-0",
                  answers[currentIdx] === idx ? "border-primary text-primary" : "border-muted-foreground text-muted-foreground")}>
                  {String.fromCharCode(65 + idx)}
                </span>
                <span className="text-sm">{opt}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => setCurrentIdx(i => Math.max(0, i - 1))} disabled={currentIdx === 0} data-testid="button-prev-q">Previous</Button>
        <div className="flex gap-1 flex-wrap max-w-xs justify-center">
          {questions.map((_, i) => (
            <button key={i} onClick={() => setCurrentIdx(i)}
              data-testid={`q-nav-${i}`}
              className={cn("w-7 h-7 rounded text-xs font-medium transition-colors",
                i === currentIdx ? "bg-primary text-primary-foreground" :
                answers[i] !== undefined ? "bg-green-500/20 text-green-700 border border-green-300" :
                "bg-muted text-muted-foreground hover:bg-muted/70"
              )}>
              {i + 1}
            </button>
          ))}
        </div>
        {currentIdx + 1 < questions.length
          ? <Button onClick={() => setCurrentIdx(i => i + 1)} data-testid="button-next-q">Next</Button>
          : <Button onClick={endTest} data-testid="button-finish-test">Finish</Button>
        }
      </div>
    </div>
  );
}
