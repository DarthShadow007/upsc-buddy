import { useState, useEffect } from "react";
import { Button } from "./ui/button"; 
import { Progress } from "@/components/ui/progress"; // 👈 Imported Progress Component
import { RefreshCw, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast"; 

export default function AIGeneratorButton({ 
  specificSubject, 
  specificDifficulty 
}: { 
  specificSubject?: string,
  specificDifficulty?: string
}) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0); // 👈 Progress State
  const { toast } = useToast();

  // 👈 Effect to smoothly animate the progress bar while generating
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isGenerating) {
      setProgress(0);
      interval = setInterval(() => {
        // Creeps up towards 95% while waiting for the API to respond
        setProgress((prev) => (prev >= 95 ? 95 : prev + 1.5));
      }, 1000);
    } else {
      // Snaps to 100% then resets when generation completes or fails
      setProgress(100);
      const timeout = setTimeout(() => setProgress(0), 1000);
      return () => clearTimeout(timeout);
    }
    return () => clearInterval(interval);
  }, [isGenerating]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    
    let desc = `Generating new UPSC questions`;
    if (specificSubject) desc += ` for ${specificSubject}`;
    if (specificDifficulty) desc += ` at ${specificDifficulty} level`;
    
    toast({
      title: "AI is thinking... 🧠",
      description: `${desc}. This will take a moment.`,
    });

    try {
      const payload: any = {};
      if (specificSubject) payload.subject = specificSubject;
      if (specificDifficulty) payload.difficulty = specificDifficulty;

      const response = await fetch("/api/admin/generate-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "✨ Success!",
          description: `Gemini generated ${data.totalAdded} fresh questions. You're ready to practice!`,
        });
      } else {
        throw new Error("Backend failed to return success");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate questions. Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="w-full space-y-3">
      <Button 
        onClick={handleGenerate} 
        disabled={isGenerating}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
      >
        {isGenerating ? (
          <>
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Sparkles className="mr-2 h-4 w-4" />
            {specificSubject ? `Generate ${specificDifficulty ? specificDifficulty + ' ' : ''}${specificSubject} Questions` : "Generate Fresh Questions Bank"}
          </>
        )}
      </Button>

      {/* 👈 Render Progress Bar when active or finishing */}
      {(isGenerating || progress > 0) && (
        <Progress value={progress} className="h-2 w-full transition-all duration-500" />
      )}
    </div>
  );
}