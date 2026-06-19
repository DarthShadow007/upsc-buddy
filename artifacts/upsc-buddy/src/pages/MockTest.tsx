import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Clock, CheckCircle, Trophy, RotateCcw,
  BookOpen, Loader2, Camera, CameraOff, Flag, ChevronRight,
  ChevronLeft, AlertTriangle, Eye, Shield, Trash2, RefreshCw
} from "lucide-react";
import { useUser } from "@clerk/react";
import { cn } from "@/lib/utils";

type Mode = "home" | "setup" | "generating" | "running" | "result";
type PaperType = "GS1" | "CSAT";

interface MockQuestion {
  id: string;
  subject: string;
  difficulty: string;
  questionType: string;
  question: string;
  options: any; 
  correctAnswer: number;
  explanation: string;
}

interface ProctoringIncident {
  type: string;
  time: number;
  message: string;
}

interface ResultData {
  score: number;
  maxScore: number;
  attempted: number;
  skipped: number;
  accuracy: number;
  rankEstimate: string;
  subjectBreakdown: { subject: string; correct: number; total: number; accuracy: number }[];
  incidents: number;
}

const PAPER_INFO = {
  GS1: {
    title: "GS Paper I",
    questions: 100,
    duration: 120,
    desc: "History, Geography, Polity, Economy, Environment, Science & Art",
  },
  CSAT: {
    title: "CSAT Paper II",
    questions: 80,
    duration: 120,
    desc: "Comprehension, Logical Reasoning, Maths & Data Interpretation",
  },
};

export default function MockTest() {
  const { user } = useUser();
  const [mode, setMode] = useState<Mode>("home");
  const [paperType, setPaperType] = useState<PaperType>("GS1");
  const [mockTestId, setMockTestId] = useState<string>("");
  const [questions, setQuestions] = useState<MockQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number | null>>({});
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [timeLeft, setTimeLeft] = useState(0);
  const [webcamActive, setWebcamActive] = useState(false);
  const [incidents, setIncidents] = useState<ProctoringIncident[]>([]);
  const [warnings, setWarnings] = useState(0);
  const [showWarning, setShowWarning] = useState<string | null>(null);
  const [resultData, setResultData] = useState<ResultData | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  
  const [genProgress, setGenProgress] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const warningCountRef = useRef(0);
  const submitRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (mode === "home" && user?.id) {
      fetch(`/api/mocktest/history/${user.id}`)
        .then((r) => r.json())
        .then(setHistory)
        .catch(() => {});
    }
  }, [mode, user?.id]);

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setWebcamActive(true);
    } catch {
      setWebcamActive(false);
    }
  };

  const stopWebcam = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    setWebcamActive(false);
  };

  const handleSubmit = async (autoSubmit = false) => {
    if (submitting) return;
    setSubmitting(true);
    stopWebcam();
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
    } catch {}
    try {
      const secondsPerQuestion = paperType === "GS1" ? 72 : 90;
      const maxTime = questions.length * secondsPerQuestion;

      const res = await fetch("/api/mocktest/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mockTestId,
          clerkId: user?.id,
          answers,
          timeTaken: maxTime - timeLeft,
          incidents,
        }),
      });
      const data = await res.json();
      setResultData(data);
      setMode("result");
    } catch {
      alert("Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    submitRef.current = () => handleSubmit(true);
  });

  useEffect(() => {
    if (mode !== "running") return;
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(interval);
          submitRef.current?.();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [mode]);

  useEffect(() => {
    if (mode !== "running") return;
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        addIncident("tab_switch", "⚠️ Tab switch detected! Stay focused on the exam.");
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [mode]);

  useEffect(() => {
    if (mode !== "running") return;
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        addIncident("fullscreen_exit", "⚠️ Fullscreen exited! Please return to fullscreen.");
      }
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, [mode]);

  const addIncident = useCallback((type: string, message: string) => {
    const incident = { type, time: Date.now(), message };
    setIncidents((prev) => [...prev, incident]);
    warningCountRef.current += 1;
    setWarnings(warningCountRef.current);
    setShowWarning(message);
    setTimeout(() => setShowWarning(null), 4000);
    if (warningCountRef.current >= 3) {
      setTimeout(() => submitRef.current?.(), 2000);
    }
  }, []);

  const generateTest = async (type: PaperType) => {
    setPaperType(type);
    setMode("generating");
    setGenProgress(0);

    // Sync progress bar to the new 6-second backend throttle
    const expectedTimeMs = type === "GS1" ? 120000 : 160000; 
    const updateIntervalMs = 100; 
    const increment = 100 / (expectedTimeMs / updateIntervalMs);

    const progInterval = setInterval(() => {
      setGenProgress(prev => {
        if (prev >= 98) return 98; 
        return prev + increment;
      });
    }, updateIntervalMs);

    try {
      const res = await fetch("/api/mocktest/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clerkId: user?.id, paperType: type }),
      });
      
      clearInterval(progInterval);
      setGenProgress(100);

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMockTestId(data.mockTestId);
      setQuestions(data.questions);
      setAnswers({});
      setFlagged(new Set());
      setIncidents([]);
      setWarnings(0);
      warningCountRef.current = 0;

      const secondsPerQuestion = type === "GS1" ? 72 : 90;
      setTimeLeft(data.questions.length * secondsPerQuestion);
      
      setTimeout(() => setMode("setup"), 500);
    } catch {
      clearInterval(progInterval);
      alert("Failed to generate test. Please try again.");
      setMode("home");
    }
  };

  const reattemptTest = async (testId: string, type: PaperType) => {
    setPaperType(type);
    setMode("generating");
    setGenProgress(0);

    const progInterval = setInterval(() => {
      setGenProgress(prev => (prev >= 90 ? 90 : prev + 15));
    }, 100);

    try {
      const res = await fetch(`/api/mocktest/${testId}`);
      clearInterval(progInterval);
      setGenProgress(100);
      
      if (!res.ok) throw new Error("Failed to load test");
      const data = await res.json();
      setMockTestId(data.id);
      setQuestions(data.questions);
      setAnswers({});
      setFlagged(new Set());
      setIncidents([]);
      setWarnings(0);
      warningCountRef.current = 0;

      const secondsPerQuestion = type === "GS1" ? 72 : 90;
      setTimeLeft(data.questions.length * secondsPerQuestion);

      setTimeout(() => setMode("setup"), 300);
    } catch (e) {
      clearInterval(progInterval);
      alert("Could not load past test. Please try again.");
      setMode("home");
    }
  };

  const deleteTest = async (testId: string) => {
    if (!confirm("Are you sure you want to permanently delete this test?")) return;
    try {
      const res = await fetch(`/api/mocktest/${testId}`, { method: "DELETE" });
      if (res.ok) {
        setHistory((prev) => prev.filter((t) => t.id !== testId));
      } else {
        throw new Error("Deletion failed");
      }
    } catch (e) {
      alert("Failed to delete test.");
    }
  };

  const startExam = async () => {
    await startWebcam();
    try {
      await document.documentElement.requestFullscreen();
    } catch {}
    setCurrentIdx(0);
    setMode("running");
  };

  const formatTime = (s: number) =>
    `${Math.floor(s / 3600).toString().padStart(2, "0")}:${Math.floor((s % 3600) / 60)
      .toString()
      .padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  const timerColor =
    timeLeft < 300 ? "text-red-500" : timeLeft < 900 ? "text-amber-500" : "text-green-400";

  if (mode === "home")
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary" /> Mock Tests
          </h1>
          <p className="text-muted-foreground mt-2">
            AI-proctored UPSC-level exams. Every test is unique — no question repeats.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {(["GS1", "CSAT"] as PaperType[]).map((type) => {
            const info = PAPER_INFO[type];
            return (
              <Card key={type} className="border-2 hover:border-primary/50 transition-all">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className={cn(
                        "p-3 rounded-xl",
                        type === "GS1" ? "bg-blue-500/10" : "bg-purple-500/10"
                      )}
                    >
                      <BookOpen
                        className={cn(
                          "w-6 h-6",
                          type === "GS1" ? "text-blue-500" : "text-purple-500"
                        )}
                      />
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {info.questions} Qs • {info.duration} mins
                    </Badge>
                  </div>
                  <h2 className="text-xl font-bold text-foreground mb-2">{info.title}</h2>
                  <p className="text-sm text-muted-foreground mb-6">{info.desc}</p>
                  <div className="space-y-2 mb-6 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                      <span>+2 correct, −0.67 wrong (UPSC negative marking)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Eye className="w-3.5 h-3.5 text-amber-500" />
                      <span>AI webcam proctoring active</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                      <span>3 violations = auto-submit</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-3.5 h-3.5 text-primary" />
                      <span>
                        {type === "GS1"
                          ? "MCQ + Statement + Assertion-Reason + Match + Chronological"
                          : "Comprehension + Logical + Maths + Data Interpretation"}
                      </span>
                    </div>
                  </div>
                  <Button
                    onClick={() => generateTest(type)}
                    className="w-full"
                    variant={type === "GS1" ? "default" : "outline"}
                  >
                    Generate New {info.title} →
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {history.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-3">Past Mock Tests</h2>
            <div className="space-y-2">
              {history.slice(0, 10).map((t) => (
                <div
                  key={t.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border bg-card gap-4"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium">{t.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(t.createdAt).toLocaleDateString("en-IN")} • {t.attempted}/{t.totalQuestions} attempted
                    </p>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-4">
                    <div className="text-right">
                      <p className="text-sm font-bold text-primary">
                        {t.score?.toFixed(1)} / {t.totalQuestions * 2}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 border-l pl-4 border-border">
                      <Button variant="outline" size="sm" onClick={() => reattemptTest(t.id, t.paperType as PaperType)}>
                        <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Retry
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => deleteTest(t.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );

  if (mode === "generating")
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-6">
        <Loader2 className="w-16 h-16 text-primary animate-spin" />
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground">Loading Your Mock Test</h2>
          <p className="text-muted-foreground mt-2">
            Preparing your {PAPER_INFO[paperType].title} with {PAPER_INFO[paperType].questions} questions...
          </p>
          <p className="text-sm text-muted-foreground mt-1">Please wait a moment. This will take up to {paperType === "GS1" ? 120 : 160} seconds to generate safely.</p>
        </div>
        <div className="w-64 space-y-2">
          <Progress className="h-2" value={genProgress} />
          <p className="text-xs text-center text-muted-foreground">{Math.round(genProgress)}%</p>
        </div>
      </div>
    );

  if (mode === "setup")
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card className="border-2 border-primary/30">
          <CardHeader className="bg-primary/5 rounded-t-xl">
            <CardTitle className="text-center text-xl">
              📋 Exam Instructions — {PAPER_INFO[paperType].title}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-3 gap-4 text-center mb-4">
              <div className="bg-muted rounded-lg p-3">
                <p className="text-2xl font-bold text-primary">{questions.length}</p>
                <p className="text-xs text-muted-foreground">Questions</p>
              </div>
              <div className="bg-muted rounded-lg p-3">
                <p className="text-2xl font-bold text-primary">
                  {Math.round((questions.length * (paperType === "GS1" ? 72 : 90)) / 60)}
                </p>
                <p className="text-xs text-muted-foreground">Minutes</p>
              </div>
              <div className="bg-muted rounded-lg p-3">
                <p className="text-2xl font-bold text-primary">{questions.length * 2}</p>
                <p className="text-xs text-muted-foreground">Max Marks</p>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              {[
                "Each correct answer carries +2 marks. Each wrong answer carries −0.67 marks.",
                "Questions not attempted carry 0 marks. Attempt wisely.",
                "Do NOT switch browser tabs — it will be flagged as a violation.",
                "Do NOT exit fullscreen mode during the exam.",
                "Keep your face clearly visible in the webcam at all times.",
                "3 violations will result in automatic test submission.",
                "You may flag questions for review and return to them before submitting.",
                "The timer cannot be paused once the exam starts.",
              ].map((rule, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center shrink-0 mt-0.5 font-bold">
                    {i + 1}
                  </span>
                  <p className="text-foreground">{rule}</p>
                </div>
              ))}
            </div>

            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mt-4">
              <div className="flex items-center gap-2 mb-2">
                <Camera className="w-4 h-4 text-amber-600" />
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                  Webcam Required
                </p>
              </div>
              <p className="text-xs text-amber-700 dark:text-amber-400">
                AI proctoring monitors your face throughout the exam. Allow camera access when prompted.
              </p>
            </div>

            <Button onClick={startExam} className="w-full mt-4" size="lg">
              <Shield className="w-4 h-4 mr-2" />I Understand — Start Exam
            </Button>
            <Button variant="ghost" onClick={() => setMode("home")} className="w-full">
              Cancel
            </Button>
          </CardContent>
        </Card>
      </div>
    );

  if (mode === "result" && resultData)
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center py-6">
          <Trophy className="w-16 h-16 text-amber-500 mx-auto mb-3" />
          <h1 className="text-2xl font-bold text-foreground">Test Submitted!</h1>
          <p className="text-muted-foreground mt-1">
            Estimated Rank: <span className="font-bold text-primary">{resultData.rankEstimate}</span>
          </p>
        </div>

        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="text-center">
              <p className="text-5xl font-bold text-primary">{resultData.score}</p>
              <p className="text-muted-foreground">/ {resultData.maxScore} marks</p>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-green-50 dark:bg-green-950 rounded-lg p-3">
                <p className="text-xl font-bold text-green-600">{resultData.attempted}</p>
                <p className="text-xs text-muted-foreground">Attempted</p>
              </div>
              <div className="bg-red-50 dark:bg-red-950 rounded-lg p-3">
                <p className="text-xl font-bold text-red-600">{resultData.skipped}</p>
                <p className="text-xs text-muted-foreground">Skipped</p>
              </div>
              <div className="bg-amber-50 dark:bg-amber-950 rounded-lg p-3">
                <p className="text-xl font-bold text-amber-600">{resultData.incidents}</p>
                <p className="text-xs text-muted-foreground">Violations</p>
              </div>
            </div>

            {resultData.subjectBreakdown.length > 0 && (
              <div className="space-y-2 pt-2 border-t">
                <p className="text-sm font-semibold">Subject-wise Performance</p>
                {resultData.subjectBreakdown.map((s) => (
                  <div key={s.subject}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-foreground">{s.subject}</span>
                      <span className="text-muted-foreground">
                        {s.correct}/{s.total} ({s.accuracy}%)
                      </span>
                    </div>
                    <Progress value={s.accuracy} className="h-1.5" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Button onClick={() => setMode("home")} className="w-full">
          <RotateCcw className="w-4 h-4 mr-2" /> Back to Mock Tests
        </Button>
      </div>
    );

  const current = questions[currentIdx];
  if (!current) return null;

  const safeOptions: string[] = current
    ? (Array.isArray(current.options) ? current.options : Object.values(current.options || {}))
    : [];

  const answeredCount = Object.keys(answers).filter(
    (k) => answers[k] !== null && answers[k] !== undefined
  ).length;

  return (
    <div className="max-w-5xl mx-auto space-y-4 relative">
      {showWarning && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-red-600 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span className="font-semibold">{showWarning}</span>
          <span className="bg-red-800 px-2 py-0.5 rounded text-xs shrink-0">{warnings}/3</span>
        </div>
      )}

      <div className="flex items-center justify-between p-3 bg-card rounded-xl border sticky top-0 z-40">
        <div>
          <p className="text-xs text-muted-foreground font-medium">{PAPER_INFO[paperType].title}</p>
          <p className="text-sm font-bold">
            Q {currentIdx + 1} / {questions.length}
          </p>
        </div>

        <div className={cn("flex items-center gap-2 font-mono text-xl font-bold", timerColor)}>
          <Clock className="w-5 h-5" />
          {formatTime(timeLeft)}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-16 h-12 rounded-lg overflow-hidden bg-slate-900 border border-slate-700">
            {webcamActive ? (
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex items-center justify-center w-full h-full">
                <CameraOff className="w-4 h-4 text-slate-500" />
              </div>
            )}
          </div>

          {warnings > 0 && (
            <div className="flex items-center gap-1 bg-red-100 dark:bg-red-950 px-2 py-1 rounded-lg">
              <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
              <span className="text-xs font-bold text-red-600">{warnings}/3</span>
            </div>
          )}

          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              if (confirm("Submit test now? This cannot be undone.")) handleSubmit();
            }}
            disabled={submitting}
          >
            {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Submit"}
          </Button>
        </div>
      </div>

      <Progress value={(answeredCount / questions.length) * 100} className="h-1" />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3 space-y-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <Badge variant="outline" className="text-xs">{current.subject}</Badge>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs capitalize",
                    current.difficulty === "hard"
                      ? "border-red-300 text-red-600"
                      : current.difficulty === "medium"
                      ? "border-amber-300 text-amber-600"
                      : "border-green-300 text-green-600"
                  )}
                >
                  {current.difficulty}
                </Badge>
                <Badge variant="outline" className="text-xs capitalize">
                  {current.questionType?.replace(/_/g, " ")}
                </Badge>
                <button
                  onClick={() => {
                    setFlagged((f) => {
                      const nf = new Set(f);
                      nf.has(current.id) ? nf.delete(current.id) : nf.add(current.id);
                      return nf;
                    });
                  }}
                  className={cn(
                    "ml-auto text-xs px-2 py-0.5 rounded border transition-colors flex items-center gap-1",
                    flagged.has(current.id)
                      ? "bg-amber-100 text-amber-700 border-amber-300"
                      : "text-muted-foreground border-border"
                  )}
                >
                  <Flag className="w-3 h-3" />
                  {flagged.has(current.id) ? "Flagged" : "Flag"}
                </button>
              </div>

              <p className="text-base font-medium text-foreground leading-relaxed mb-6 whitespace-pre-wrap">
                {current.question}
              </p>

              <div className="space-y-2.5">
                {safeOptions.map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => setAnswers((a) => ({ ...a, [current.id]: idx }))}
                    className={cn(
                      "w-full flex items-center gap-3 p-3.5 rounded-lg border-2 text-left transition-all",
                      answers[current.id] === idx
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/40 hover:bg-primary/5"
                    )}
                  >
                    <span
                      className={cn(
                        "w-7 h-7 rounded-full border-2 flex items-center justify-center text-sm font-bold shrink-0",
                        answers[current.id] === idx
                          ? "border-primary text-primary"
                          : "border-muted-foreground text-muted-foreground"
                      )}
                    >
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="text-sm text-foreground">{opt}</span>
                  </button>
                ))}
              </div>

              {answers[current.id] !== undefined && answers[current.id] !== null && (
                <button
                  onClick={() =>
                    setAnswers((a) => {
                      const n = { ...a };
                      delete n[current.id];
                      return n;
                    })
                  }
                  className="mt-3 text-xs text-muted-foreground hover:text-red-500 transition-colors"
                >
                  Clear answer
                </button>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
              disabled={currentIdx === 0}
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Previous
            </Button>
            {currentIdx + 1 < questions.length ? (
              <Button onClick={() => setCurrentIdx((i) => i + 1)}>
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={() => handleSubmit()} disabled={submitting}>
                {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Finish & Submit
              </Button>
            )}
          </div>
        </div>

        <div className="lg:col-span-1">
          <Card className="sticky top-20">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-xs text-muted-foreground">Question Palette</CardTitle>
              <div className="flex gap-3 flex-wrap text-xs mt-1">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-sm bg-green-500 inline-block" /> Answered
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-sm bg-amber-400 inline-block" /> Flagged
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-sm bg-muted inline-block border" /> Not visited
                </span>
              </div>
            </CardHeader>
            <CardContent className="px-3 pb-4">
              <div className="grid grid-cols-5 gap-1">
                {questions.map((q, i) => (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIdx(i)}
                    className={cn(
                      "w-8 h-8 rounded text-xs font-bold transition-all",
                      i === currentIdx ? "ring-2 ring-primary ring-offset-1" : "",
                      flagged.has(q.id)
                        ? "bg-amber-400 text-amber-900"
                        : answers[q.id] !== undefined && answers[q.id] !== null
                        ? "bg-green-500 text-white"
                        : "bg-muted text-muted-foreground hover:bg-muted/70"
                    )}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              <div className="mt-4 pt-3 border-t space-y-1 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>Answered:</span>
                  <span className="font-bold text-green-600">{answeredCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Not answered:</span>
                  <span className="font-bold text-red-500">
                    {questions.length - answeredCount}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Flagged:</span>
                  <span className="font-bold text-amber-500">{flagged.size}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}