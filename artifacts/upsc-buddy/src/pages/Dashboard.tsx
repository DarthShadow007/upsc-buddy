import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Link } from "wouter";
import { useUser, UserButton } from "@clerk/react";
import { useQuery } from "@tanstack/react-query";
import {
  BookOpen, ClipboardList, Layers, Newspaper,
  TrendingUp, Flame, Target, Clock, Star, ChevronRight, Loader2
} from "lucide-react";
import { mockCurrentAffairs } from "@/lib/mockData";

export default function Dashboard() {
  const { user, isLoaded: isUserLoaded } = useUser();

  const { data, isLoading } = useQuery({
    queryKey: ["dashboardStats", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const response = await fetch(`/api/progress/dashboard/${user.id}`);
      if (!response.ok) throw new Error("Failed to fetch database progress");
      return response.json();
    },
    enabled: !!user?.id,
    refetchInterval: 30000, // refresh every 30 seconds automatically
  });

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long", year: "numeric", month: "long", day: "numeric"
  });

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "Good morning";
    if (hour >= 12 && hour < 17) return "Good afternoon";
    if (hour >= 17 && hour < 22) return "Good evening";
    return "Up late studying";
  };

  const stats = data?.progress || {
    questionsAttempted: 0,
    accuracy: 0.0,
    studyHours: 0,
    currentStreak: 0,
    longestStreak: 0,
  };

  const subjectPerformance = data?.subjects?.length > 0
    ? data.subjects
    : [
        { subjectName: "Polity", accuracy: 0, attemptedQs: 0 },
        { subjectName: "History", accuracy: 0, attemptedQs: 0 },
        { subjectName: "Geography", accuracy: 0, attemptedQs: 0 },
        { subjectName: "Economy", accuracy: 0, attemptedQs: 0 },
        { subjectName: "Science & Tech", accuracy: 0, attemptedQs: 0 },
        { subjectName: "Environment", accuracy: 0, attemptedQs: 0 },
        { subjectName: "Art & Culture", accuracy: 0, attemptedQs: 0 },
        { subjectName: "CSAT", accuracy: 0, attemptedQs: 0 },
      ];

  // Dynamic targets from DB — fallback to all false for new users
  const targets: { task: string; done: boolean; progress: number; total: number }[] =
    data?.targets ?? [
      { task: "Attempt 30 questions", done: false, progress: 0, total: 30 },
      { task: "Review 10 flashcards", done: false, progress: 0, total: 10 },
      { task: "Read current affairs", done: false, progress: 0, total: 1 },
      { task: "Complete mock test", done: false, progress: 0, total: 1 },
    ];

 const quickStats = [
  {
    label: "Questions Done",
    value: stats.questionsAttempted,
    icon: BookOpen,
    color: "text-primary",
    bg: "bg-primary/10"
  },
  {
    label: "Accuracy",
    value: `${Math.round(stats.accuracy)}%`,
    icon: Target,
    color: "text-green-600",
    bg: "bg-green-50 dark:bg-green-950"
  },
  {
    label: "Study Time",
    value: stats.studyHours < 60
      ? `${stats.studyHours}m`
      : `${(stats.studyHours / 60).toFixed(1)}h`,
    icon: Clock,
    color: "text-amber-600",
    bg: "bg-amber-50 dark:bg-amber-950"
  },
  {
    label: "Day Streak",
    value: stats.currentStreak,
    icon: Flame,
    color: "text-orange-600",
    bg: "bg-orange-50 dark:bg-orange-950"
  },
];

  const quickLinks = [
    { path: "/practice", label: "Practice Now", icon: BookOpen, desc: "200+ MCQs across all subjects" },
    { path: "/mock-test", label: "Take Mock Test", icon: ClipboardList, desc: "Full-length UPSC-style tests" },
    { path: "/flashcards", label: "Review Flashcards", icon: Layers, desc: "Spaced repetition system" },
    { path: "/current-affairs", label: "Current Affairs", icon: Newspaper, desc: "Stay updated daily" },
  ];

  if (!isUserLoaded || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[500px] w-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // How many targets completed today
  const completedTargets = targets.filter((t) => t.done).length;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {getGreeting()}! <span className="text-primary">{user?.firstName || "Aspirant"}</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {today} — Keep going, your IAS dream is within reach.
          </p>
        </div>
        <div className="p-1 rounded-full bg-background border shadow-sm flex-shrink-0">
          <UserButton appearance={{ elements: { avatarBox: "w-10 h-10" } }} />
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {quickStats.map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label}>
            <CardContent className="p-4">
              <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-3`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <p className="text-2xl font-bold text-foreground">{value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Subject Performance */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Subject-wise Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {subjectPerformance.map((subj: any) => (
              <div key={subj.subjectName}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-foreground">{subj.subjectName}</span>
                  <span className="text-muted-foreground">
                    {subj.attemptedQs > 0
                      ? `${Math.round(subj.accuracy)}% (${subj.attemptedQs} Qs)`
                      : "Not started"}
                  </span>
                </div>
                <Progress value={subj.accuracy} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-4">

          {/* Today's Targets — fully dynamic */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-500" />
                  Today's Targets
                </span>
                <span className="text-xs font-normal text-muted-foreground">
                  {completedTargets}/{targets.length} done
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {targets.map(({ task, done, progress, total }) => (
                <div key={task} className="space-y-1">
                  <div className="flex items-center gap-2 text-sm">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      done ? "bg-green-500 border-green-500" : "border-muted-foreground"
                    }`}>
                      {done && (
                        <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <span className={done ? "line-through text-muted-foreground" : "text-foreground"}>
                      {task}
                    </span>
                    {/* Show count for numeric targets */}
                    {total > 1 && !done && (
                      <span className="ml-auto text-xs text-muted-foreground shrink-0">
                        {progress}/{total}
                      </span>
                    )}
                  </div>
                  {/* Progress bar for numeric targets */}
                  {total > 1 && (
                    <Progress
                      value={(progress / total) * 100}
                      className="h-1 ml-6"
                    />
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Streak */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">🔥 Streak</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <p className="text-4xl font-bold text-orange-500">{stats.currentStreak}</p>
                <p className="text-sm text-muted-foreground">day streak</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Best: {stats.longestStreak} {stats.longestStreak === 1 ? "day" : "days"}
                </p>
                {stats.currentStreak >= 7 && (
                  <Badge className="mt-2 bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300 text-xs">
                    🏆 Week warrior!
                  </Badge>
                )}
                {stats.currentStreak >= 30 && (
                  <Badge className="mt-2 bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 text-xs">
                    👑 30-day legend!
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Access */}
      <div>
        <h2 className="text-base font-semibold text-foreground mb-3">Quick Access</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {quickLinks.map(({ path, label, icon: Icon, desc }) => (
            <Link key={path} href={path}>
              <Card className="cursor-pointer hover:shadow-md hover:border-primary/30 transition-all group">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center mb-3">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <p className="font-semibold text-sm text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Current Affairs */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Newspaper className="w-4 h-4 text-primary" />
              Latest Current Affairs
            </CardTitle>
            <Link href="/current-affairs">
              <Button variant="ghost" size="sm" className="text-xs">View all</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {mockCurrentAffairs.slice(0, 3).map((item) => (
            <div key={item.id} className="flex items-start gap-3 pb-3 border-b last:border-0 last:pb-0">
              <Badge variant="outline" className="text-xs shrink-0 mt-0.5">{item.category}</Badge>
              <div>
                <p className="text-sm font-medium text-foreground leading-snug">{item.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{item.date}</p>
              </div>
              {item.isImportant && <Star className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}