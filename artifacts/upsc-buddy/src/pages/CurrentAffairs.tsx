import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Newspaper, Loader2, RefreshCw } from "lucide-react";

const selectionList = [
  "All", "Governance & Polity", "Economy & Budget", "International Relations", 
  "Science & Technology", "Environment", "Defense & Security", 
  "President's Secretariat", "NITI Aayog", "Ministry of Finance", 
  "Ministry of Home Affairs", "Ministry of Defence", "Ministry of Education", 
  "Ministry of Health", "Ministry of Agriculture", "Sports News"
];

export default function CurrentAffairs() {
  const [selection, setSelection] = useState("All");
  const [liveAffairs, setLiveAffairs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFetch = async () => {
    setLoading(true);
    setProgress(30);
    try {
      const res = await fetch(`http://localhost:5000/api/ca/fetch-news?topic=${encodeURIComponent(selection)}`, { method: "POST" });
      setProgress(70);
      const data = await res.json();
      setLiveAffairs(data.articles || []);
    } catch (err) {
      alert("Failed to fetch analysis.");
    } finally {
      setProgress(100);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 p-8 max-w-5xl mx-auto">
      {/* Header Section */}
      <div className="flex justify-between items-center border-b border-slate-700 pb-6">
        <h1 className="text-3xl font-bold flex items-center gap-3 text-white">
          <Newspaper className="text-primary w-8 h-8" /> UPSC Intelligence Suite
        </h1>
        <div className="flex gap-4">
          <select 
            value={selection} 
            onChange={(e) => setSelection(e.target.value)} 
            className="bg-[#0f172a] text-white p-2 px-4 rounded-md border border-slate-600 text-sm font-medium focus:ring-1 focus:ring-primary"
          >
            {selectionList.map(item => <option key={item} value={item}>{item}</option>)}
          </select>
          <Button onClick={handleFetch} disabled={loading} className="bg-primary hover:bg-primary/90 text-white font-bold">
            {loading ? <Loader2 className="animate-spin mr-2" /> : <RefreshCw className="mr-2" />} Fetch Daily Analysis
          </Button>
        </div>
      </div>
      
      {loading && <Progress value={progress} className="h-2 w-full bg-slate-800" />}

      {/* Newspaper Articles Container */}
      <div className="space-y-12">
        {liveAffairs.map((item, idx) => (
          <article key={item.id} className="bg-[#0f172a] p-8 rounded-lg shadow-lg border border-slate-800">
            {/* Headline */}
            <h2 className="text-4xl font-extrabold text-white mb-6 leading-tight tracking-tight">
              {item.title}
            </h2>
            
            {item.imageUrl && (
              <img src={item.imageUrl} className="rounded-md mb-8 w-full object-cover shadow-2xl" />
            )}

            {/* Body Content - Pretty Printed */}
            <div className="font-serif text-[18px] text-slate-200 leading-relaxed max-w-3xl space-y-6">
              {item.summary.split(/(?=### )/g).map((block: string, i: number) => {
                const lines = block.split('\n').filter(l => l.trim() !== '');
                return (
                  <div key={i} className="mb-4">
                    {lines.map((line, j) => {
                      // Subheadings
                      if (line.startsWith('###')) {
                        return <h3 key={j} className="text-2xl font-bold text-primary mb-4 mt-8 border-b border-slate-700 pb-2">{line.replace('###', '').trim()}</h3>;
                      }
                      
                      // Lede (First paragraph logic)
                      const isLede = i === 0 && j === 0;
                      return (
                        <p key={j} className={`mb-4 ${isLede ? 'italic text-xl text-slate-300' : ''}`}>
                          {line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-bold">$1</strong>')
                             .split(/(<strong.*?<\/strong>)/g).map((part, k) => 
                               part.includes('<strong') ? 
                               <span key={k} dangerouslySetInnerHTML={{ __html: part }} /> : part
                             )}
                        </p>
                      );
                    })}
                  </div>
                );
              })}
            </div>
            
            <a href={item.sourceUrl} target="_blank" className="inline-block mt-8 text-sm text-primary font-bold hover:underline">
              Read Original Source →
            </a>
          </article>
        ))}
      </div>
    </div>
  );
}