import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress"; // <-- Added
import { Newspaper, Search, Star, BookOpen, Check, Loader2, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

const categories = ["All", "Science & Technology", "International Relations", "Governance", "Economy", "Environment"];

const categoryColors: Record<string, string> = {
  "Science & Technology": "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  "International Relations": "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300",
  "Governance": "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  "Economy": "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  "Environment": "bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300",
};

export default function CurrentAffairs() {
  const [affairs, setAffairs] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false); // <-- Track generation status
  const [progress, setProgress] = useState(0); // <-- Track progress

  const { data, isLoading } = useQuery({
    queryKey: ["currentAffairs"],
    queryFn: async () => {
      const res = await fetch("http://localhost:5000/api/ca/list");
      return res.json();
    }
  });

  useEffect(() => {
    if (data) setAffairs(data);
  }, [data]);

  // <-- Logic for the smooth progress bar
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isGenerating) {
      setProgress(0);
      interval = setInterval(() => {
        setProgress((prev) => (prev >= 95 ? 95 : prev + 1.5));
      }, 500);
    } else {
      setProgress(100);
      const timeout = setTimeout(() => setProgress(0), 1000);
      return () => clearTimeout(timeout);
    }
    return () => clearInterval(interval);
  }, [isGenerating]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsGenerating(true);
    try {
      const formData = new FormData();
      formData.append("pdf", file);

      const res = await fetch("http://localhost:5000/api/ca/upload-ca", {
        method: "POST",
        body: formData,
      });
      
      const data = await res.json();
      if (data.success) {
        alert("Quiz generated successfully!");
        console.log("Quiz:", data.quiz);
      } else {
        alert("Error: " + data.error);
      }
    } catch (error) {
      alert("Backend connection failed.");
    } finally {
      setIsGenerating(false);
    }
  };

  const filtered = affairs.filter(item => {
    const matchSearch = item.title?.toLowerCase().includes(search.toLowerCase());
    const matchCat = activeCategory === "All" || item.category === activeCategory;
    return matchSearch && matchCat;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Newspaper className="w-6 h-6 text-primary" /> Current Affairs
          </h1>
        </div>
        
        {/* Upload Button + Progress Bar */}
        <div className="flex flex-col gap-2">
            <input type="file" accept="application/pdf" onChange={handleFileUpload} className="hidden" id="pdf-upload" />
            <label htmlFor="pdf-upload" className={cn("cursor-pointer bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2", isGenerating && "opacity-50 pointer-events-none")}>
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} Upload PDF
            </label>
            {isGenerating && <Progress value={progress} className="h-1.5 w-full" />}
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search current affairs..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item: any) => (
            <Card key={item.id} className="transition-all">
              <CardContent className="p-4">
                <h3 className="font-semibold text-sm">{item.title}</h3>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}