import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from "recharts";
import { TrendingUp, Target, Flame, Trophy, Clock, BookOpen } from "lucide-react";
import { mockProgress } from "@/lib/mockData";

export default function ProgressPage() {
  const { overall, subjectWise, weeklyActivity, monthlyTrend } = mockProgress;

  const radarData = subjectWise.map(s => ({ subject: s.subject.slice(0, 4), A: s.accuracy }));

  const stats = [
    { label: "Questions Done", value: overall.questionsAttempted, icon: BookOpen, color: "text-primary", bg: "bg-primary/10" },
    { label: "Overall Accuracy", value: `${overall.accuracy}%`, icon: Target, color: "text-green-600", bg: "bg-green-50 dark:bg-green-950" },
    { label: "Study Hours", value: `${overall.studyHours}h`, icon: Clock, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950" },
    { label: "Current Streak", value: `${overall.currentStreak}d`, icon: Flame, color: "text-orange-600", bg: "bg-orange-50 dark:bg-orange-950" },
    { label: "Tests Completed", value: overall.testsCompleted, icon: Trophy, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-950" },
    { label: "Rank", value: `#${overall.rank}`, icon: TrendingUp, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-primary" /> Progress Tracker
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Track your UPSC preparation journey</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label} data-testid={`progress-stat-${label.toLowerCase().replace(/\s+/g, "-")}`}>
            <CardContent className="p-4">
              <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center mb-2`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <p className="text-xl font-bold text-foreground">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Weekly Questions & Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={weeklyActivity} barSize={20}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Bar dataKey="questions" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Questions" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Accuracy Trend (6 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis domain={[50, 80]} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} formatter={(v) => [`${v}%`, "Accuracy"]} />
                <Line type="monotone" dataKey="accuracy" stroke="hsl(var(--secondary))" strokeWidth={2.5} dot={{ fill: "hsl(var(--secondary))", r: 4 }} name="Accuracy" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Subject-wise Accuracy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {subjectWise.map(({ subject, accuracy, attempted, correct }) => (
              <div key={subject} data-testid={`subject-progress-${subject.toLowerCase()}`}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-foreground">{subject}</span>
                  <span className="text-muted-foreground text-xs">{correct}/{attempted} · {accuracy}%</span>
                </div>
                <Progress value={accuracy} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Subject Coverage Radar</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <PolarRadiusAxis domain={[0, 100]} tick={false} />
                <Radar name="Accuracy" dataKey="A" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.25} />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Achievements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { emoji: "🔥", label: "10-Day Streak", earned: true },
              { emoji: "💯", label: "100 Questions", earned: true },
              { emoji: "⚡", label: "Speed Demon", earned: true },
              { emoji: "🎯", label: "75% Accuracy", earned: false },
              { emoji: "📚", label: "50 Flashcards", earned: false },
              { emoji: "🏆", label: "Mock Test Pro", earned: false },
              { emoji: "⭐", label: "Notes Master", earned: false },
              { emoji: "🌟", label: "Top 1000", earned: false },
            ].map(({ emoji, label, earned }) => (
              <div key={label} className={cn("flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center",
                earned ? "border-amber-300 bg-amber-50 dark:bg-amber-950/30" : "border-border bg-muted/50 opacity-50"
              )} data-testid={`achievement-${label.toLowerCase().replace(/\s+/g, "-")}`}>
                <span className="text-2xl">{emoji}</span>
                <p className="text-xs font-medium text-foreground">{label}</p>
                {earned && <Badge className="text-xs bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">Earned</Badge>}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
