import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { BookMarked, Search, RefreshCw, BrainCircuit, Volume2, CheckCircle2, Plus, Trash2, RotateCcw } from "lucide-react";

export default function Vocabulary() {
  const [words, setWords] = useState<any[]>([]);
  const [hiddenIds, setHiddenIds] = useState<string[]>([]); // Words marked read or flashcard
  const [quizzedWords, setQuizzedWords] = useState<string[]>([]); // To prevent repeats
  const [quizHistory, setQuizHistory] = useState<any[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<any[] | null>(null);
  
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  // Load from local storage on mount
  useEffect(() => {
    const w = localStorage.getItem("vocab-words");
    const h = localStorage.getItem("vocab-hidden");
    const q = localStorage.getItem("vocab-quizzed");
    const qh = localStorage.getItem("vocab-history");
    if (w) setWords(JSON.parse(w));
    if (h) setHiddenIds(JSON.parse(h));
    if (q) setQuizzedWords(JSON.parse(q));
    if (qh) setQuizHistory(JSON.parse(qh));
  }, []);

  // Save state helpers
  const saveWords = (newWords: any[]) => { setWords(newWords); localStorage.setItem("vocab-words", JSON.stringify(newWords)); };
  const saveHidden = (newHidden: string[]) => { setHiddenIds(newHidden); localStorage.setItem("vocab-hidden", JSON.stringify(newHidden)); };

  // --- ACTIONS ---
  const handleAction = async (actionFn: () => Promise<void>) => {
    setLoading(true); setProgress(30);
    try { await actionFn(); setProgress(100); } 
    catch (e) { alert("Action failed."); }
    setTimeout(() => { setLoading(false); setProgress(0); }, 500);
  };

  const handleSearch = () => handleAction(async () => {
    if (!search) return;
    const res = await fetch(`https://upsc-buddy-1.onrender.com/api/vocab/search-word`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ word: search }) });
    const data = await res.json();
    saveWords([data, ...words]);
    setSearch("");
  });

  const generateBatch = () => handleAction(async () => {
    const res = await fetch(`https://upsc-buddy-1.onrender.com/api/vocab/generate-batch`, { method: "POST" });
    const data = await res.json();
    saveWords([...data, ...words]);
  });

  const startUniversalQuiz = () => handleAction(async () => {
    // Pick up to 5 words that haven't been quizzed and aren't hidden
    const availableWords = words.filter(w => !hiddenIds.includes(w.id) && !quizzedWords.includes(w.word)).slice(0, 5);
    if (availableWords.length === 0) return alert("Generate more words first! No un-quizzed words left.");
    
    const res = await fetch(`https://upsc-buddy-1.onrender.com/api/vocab/generate-mocktest`, { 
      method: "POST", headers: { "Content-Type": "application/json" }, 
      body: JSON.stringify({ words: availableWords.map(w => w.word) }) 
    });
    const quizData = await res.json();
    setActiveQuiz(quizData);
    
    // Mark these words as quizzed to prevent future repeats
    const newQuizzed = [...quizzedWords, ...availableWords.map(w => w.word)];
    setQuizzedWords(newQuizzed);
    localStorage.setItem("vocab-quizzed", JSON.stringify(newQuizzed));
  });

  const finishQuiz = () => {
    const newHistory = [{ date: new Date().toLocaleDateString(), data: activeQuiz }, ...quizHistory];
    setQuizHistory(newHistory);
    localStorage.setItem("vocab-history", JSON.stringify(newHistory));
    setActiveQuiz(null);
  };

  const deleteQuiz = (index: number) => {
    const newHistory = quizHistory.filter((_, i) => i !== index);
    setQuizHistory(newHistory);
    localStorage.setItem("vocab-history", JSON.stringify(newHistory));
  };

  const markHidden = (id: string, isFlashcard: boolean = false) => {
    saveHidden([...hiddenIds, id]);
    if (isFlashcard) {
      const cardWord = words.find(w => w.id === id);
      const existingCards = JSON.parse(localStorage.getItem("flashcards") || "[]");
      localStorage.setItem("flashcards", JSON.stringify([...existingCards, cardWord]));
    }
  };

  const visibleWords = words.filter(w => !hiddenIds.includes(w.id));

  // --- UI RENDERING ---
  return (
    <div className="space-y-6 p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3"><BookMarked className="text-primary" /> Vocabulary Builder</h1>
      </div>

      {/* Action Bar */}
      <div className="bg-[#0f172a] p-4 rounded-xl border border-slate-700 space-y-4">
        <div className="flex gap-2">
          <Input placeholder="Search or add a new word..." value={search} onChange={(e) => setSearch(e.target.value)} className="bg-slate-900 border-slate-600" />
          <Button onClick={handleSearch} disabled={loading}><Search className="w-4 h-4" /></Button>
        </div>
        <div className="flex gap-4">
          <Button onClick={startUniversalQuiz} disabled={loading} className="w-full bg-primary hover:bg-primary/90 text-white font-bold"><BrainCircuit className="w-5 h-5 mr-2" /> Start Universal Mock Test</Button>
          <Button onClick={generateBatch} disabled={loading} variant="outline" className="w-full"><RefreshCw className="w-5 h-5 mr-2" /> Generate 10 New Words</Button>
        </div>
        {loading && <Progress value={progress} className="h-2 w-full bg-slate-800" />}
      </div>

      {/* Active Quiz View */}
      {activeQuiz && (
        <div className="bg-[#1e293b] p-6 rounded-xl border border-primary shadow-2xl">
          <h2 className="text-2xl font-bold text-white mb-6">Mock Test Active</h2>
          {activeQuiz.map((q: any, i: number) => (
            <div key={i} className="mb-6 bg-slate-900 p-4 rounded-lg">
              <p className="text-lg text-slate-200 font-medium mb-3">Q{i + 1}: {q.question}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {q.options.map((opt: string, j: number) => (
                  <Button key={j} variant="outline" className="justify-start h-auto py-3 text-left whitespace-normal" onClick={() => alert(opt === q.correct ? "Correct!" : `Incorrect. Answer is: ${q.correct}`)}>
                    {opt}
                  </Button>
                ))}
              </div>
            </div>
          ))}
          <Button onClick={finishQuiz} className="w-full mt-4">Finish & Save Quiz</Button>
        </div>
      )}

      {/* Main Content Split: Word List & Quiz History */}
      {!activeQuiz && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Words */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-bold text-white border-b border-slate-700 pb-2">Your Vocabulary ({visibleWords.length})</h2>
            {visibleWords.map((item) => (
              <div key={item.id} className="bg-[#0f172a] p-5 rounded-lg border border-slate-700 shadow-md">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold text-white">{item.word}</h3>
                    <p className="text-slate-400 mt-1 italic">"{item.example}"</p>
                    <p className="text-slate-300 mt-2">{item.meaning}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => window.speechSynthesis.speak(new SpeechSynthesisUtterance(item.word))}><Volume2 className="w-4 h-4" /></Button>
                  </div>
                </div>
                <div className="mt-4 flex gap-3 border-t border-slate-800 pt-4">
                  <Button variant="outline" size="sm" onClick={() => markHidden(item.id, false)}><CheckCircle2 className="w-4 h-4 mr-2 text-green-500" /> Mark Read</Button>
                  <Button variant="outline" size="sm" onClick={() => markHidden(item.id, true)}><Plus className="w-4 h-4 mr-2 text-blue-500" /> Send to Flashcards</Button>
                </div>
              </div>
            ))}
          </div>

          {/* Right Column: Quiz History */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white border-b border-slate-700 pb-2">Past Mock Tests</h2>
            {quizHistory.length === 0 ? (
              <p className="text-slate-500 text-sm">No tests taken yet.</p>
            ) : (
              quizHistory.map((quiz, idx) => (
                <div key={idx} className="bg-[#0f172a] p-4 rounded-lg border border-slate-700">
                  <p className="text-white font-medium mb-3">Test: {quiz.date}</p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary" onClick={() => setActiveQuiz(quiz.data)}><RotateCcw className="w-4 h-4 mr-2" /> Retry</Button>
                    <Button size="sm" variant="destructive" onClick={() => deleteQuiz(idx)}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}