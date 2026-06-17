import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useUser, SignIn } from "@clerk/react";

import Layout from "@/components/layout/Layout";
import Dashboard from "@/pages/Dashboard";
import Practice from "@/pages/Practice";
import MockTest from "@/pages/MockTest";
import Vocabulary from "@/pages/Vocabulary";
import Flashcards from "@/pages/Flashcards";
import Notes from "@/pages/Notes";
import CurrentAffairs from "@/pages/CurrentAffairs";
import ProgressPage from "@/pages/Progress";
import StudyCalendar from "@/pages/StudyCalendar";
import About from "@/pages/About";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/practice" component={Practice} />
        <Route path="/mock-test" component={MockTest} />
        <Route path="/vocabulary" component={Vocabulary} />
        <Route path="/flashcards" component={Flashcards} />
        <Route path="/notes" component={Notes} />
        <Route path="/current-affairs" component={CurrentAffairs} />
        <Route path="/progress" component={ProgressPage} />
        <Route path="/calendar" component={StudyCalendar} />
        <Route path="/about" component={About} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function AppContent() {
  const { isSignedIn, isLoaded } = useUser();

  // 1. Wait for Clerk to load up state
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen w-full bg-slate-950 text-slate-400 font-medium">
        Loading UPSC Buddy Security...
      </div>
    );
  }

  // 2. Force login screen if user is not authenticated
  if (!isSignedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen w-full bg-slate-950">
        <SignIn routing="hash" />
      </div>
    );
  }

  // 3. User is fully authenticated, unlock the platform safely!
  return (
    <WouterRouter base={import.meta.env?.BASE_URL?.replace(/\/$/, "") || ""}>
      <Router />
    </WouterRouter>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppContent />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;