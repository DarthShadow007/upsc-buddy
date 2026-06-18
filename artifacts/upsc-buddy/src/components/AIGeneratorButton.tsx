import { useState } from "react";
import { Button } from "./ui/button"; // Assuming you have shadcn UI button
import { RefreshCw, Sparkles } from "lucide-react";
// If you don't have a toast library installed yet, you can replace this with a standard alert() for now
import { useToast } from "@/hooks/use-toast"; 

export default function AIGeneratorButton({ 
  specificSubject, 
  specificDifficulty 
}: { 
  specificSubject?: string,
  specificDifficulty?: string
}) {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async () => {
    setIsGenerating(true);
    
    // Build a dynamic description for the notification
    let desc = `Generating new UPSC questions`;
    if (specificSubject) desc += ` for ${specificSubject}`;
    if (specificDifficulty) desc += ` at ${specificDifficulty} level`;
    
    // Show an initial notification so they know it started
    toast({
      title: "AI is thinking... 🧠",
      description: `${desc}. This takes about 15-30 seconds.`,
    });

    try {
      // Build the payload with both subject and difficulty if they exist
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
    <Button 
      onClick={handleGenerate} 
      disabled={isGenerating}
      className="bg-indigo-600 hover:bg-indigo-700 text-white"
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
  );
}