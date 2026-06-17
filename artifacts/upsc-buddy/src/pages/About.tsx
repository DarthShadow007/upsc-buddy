import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GraduationCap, Code2, Mail, Github, Linkedin, Heart, BookOpen, Target, Users } from "lucide-react";

const features = [
  { icon: BookOpen, title: "500+ Practice Questions", desc: "Curated MCQs across History, Polity, Geography, Economy, Science, and more — all with detailed explanations." },
  { icon: Target, title: "AI Mock Tests", desc: "Full-length UPSC Prelims simulations with AI proctoring using face-api.js for exam-like conditions." },
  { icon: GraduationCap, title: "Smart Flashcards", desc: "Spaced Repetition System (SRS) to maximize retention of key facts, dates, and concepts." },
  { icon: Users, title: "Progress Analytics", desc: "Detailed insights into your subject-wise performance, accuracy trends, and study streaks." },
];

const techStack = ["React", "TypeScript", "Node.js", "PostgreSQL", "Drizzle ORM", "Clerk Auth", "Tailwind CSS", "Express.js", "face-api.js", "Recharts"];

export default function About() {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="text-center space-y-4 py-6">
        <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center mx-auto shadow-lg">
          <GraduationCap className="w-10 h-10 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">UPSC Buddy</h1>
          <p className="text-muted-foreground mt-2 max-w-md mx-auto">
            Your intelligent companion for cracking the UPSC Civil Services Examination — built with passion for India's future civil servants.
          </p>
        </div>
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {["Free", "Open Source", "Made in India 🇮🇳"].map(t => (
            <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Heart className="w-5 h-5 text-red-500" /> Key Features
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {features.map(({ icon: Icon, title, desc }) => (
            <Card key={title} className="hover:shadow-md transition-shadow" data-testid={`feature-card-${title.toLowerCase().replace(/\s+/g, "-")}`}>
              <CardContent className="p-5">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center mb-3">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-1 text-sm">{title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-primary to-primary/70 p-6 text-primary-foreground">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
              <Code2 className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide opacity-70 mb-0.5">Built by</p>
              <h2 className="text-xl font-bold">Mohd Bashar</h2>
              <p className="text-sm opacity-80">Full-Stack Developer & UPSC Aspirant Support</p>
            </div>
          </div>
        </div>
        <CardContent className="p-5 space-y-4">
          <p className="text-sm text-foreground leading-relaxed">
            Hi! I'm Mohd Bashar, a full-stack developer who built UPSC Buddy to help fellow aspirants prepare more effectively for the Civil Services Examination. 
            Having seen the challenges of UPSC preparation firsthand, I wanted to create a comprehensive, free, and intelligent platform that combines modern technology with proven study techniques.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            UPSC Buddy features AI-powered mock tests with proctoring, spaced repetition flashcards, detailed analytics, current affairs integration, and much more — all designed to help you achieve your IAS dream.
          </p>
          <div className="flex gap-3 flex-wrap pt-1">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs" data-testid="button-contact-email">
              <Mail className="w-3.5 h-3.5" /> Contact
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs" data-testid="button-github">
              <Github className="w-3.5 h-3.5" /> GitHub
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs" data-testid="button-linkedin">
              <Linkedin className="w-3.5 h-3.5" /> LinkedIn
            </Button>
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">Tech Stack</h2>
        <div className="flex flex-wrap gap-2">
          {techStack.map(t => (
            <Badge key={t} variant="secondary" className="text-xs" data-testid={`tech-badge-${t.toLowerCase()}`}>{t}</Badge>
          ))}
        </div>
      </div>

      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-5 text-center">
          <p className="text-sm text-foreground font-medium mb-1">🎯 Exam Dates to Remember</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
            {[
              { exam: "UPSC Prelims 2027", date: "June 2027" },
              { exam: "UPSC Mains 2027", date: "Sep 2027" },
              { exam: "UPSC Interview", date: "Jan–Apr 2027" },
            ].map(({ exam, date }) => (
              <div key={exam} className="bg-card rounded-lg p-2.5 border" data-testid={`exam-date-${exam.toLowerCase().replace(/\s+/g, "-")}`}>
                <p className="text-xs font-semibold text-foreground">{exam}</p>
                <p className="text-xs text-primary mt-0.5">{date}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="text-center py-4">
        <p className="text-sm text-muted-foreground">
          Made with <Heart className="w-3.5 h-3.5 inline text-red-500" /> for UPSC aspirants across India
        </p>
        <p className="text-xs text-muted-foreground mt-1">v1.0.0 · © 2026 Mohd Bashar · All rights reserved</p>
      </div>
    </div>
  );
}
