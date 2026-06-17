import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Newspaper, Search, Star, BookOpen, Filter, Check } from "lucide-react";
import { mockCurrentAffairs } from "@/lib/mockData";
import { cn } from "@/lib/utils";

const categories = ["All", "Science & Technology", "International Relations", "Governance", "Economy", "Environment"];

const categoryColors: Record<string, string> = {
  "Science & Technology": "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  "International Relations": "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300",
  "Governance": "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  "Economy": "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  "Environment": "bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300",
};

export default function CurrentAffairs() {
  const [affairs, setAffairs] = useState(mockCurrentAffairs);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [expanded, setExpanded] = useState<number | null>(null);

  const filtered = affairs.filter(item => {
    const matchSearch = item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.summary.toLowerCase().includes(search.toLowerCase()) ||
      item.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));
    const matchCat = activeCategory === "All" || item.category === activeCategory;
    return matchSearch && matchCat;
  });

  const markRead = (id: number) => setAffairs(as => as.map(a => a.id === id ? { ...a, isRead: true } : a));
  const toggleImportant = (id: number) => setAffairs(as => as.map(a => a.id === id ? { ...a, isImportant: !a.isImportant } : a));

  const unread = affairs.filter(a => !a.isRead).length;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Newspaper className="w-6 h-6 text-primary" /> Current Affairs
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {unread > 0 && <span className="text-amber-600 font-medium">{unread} unread · </span>}
            {affairs.length} total articles
          </p>
        </div>
        <Badge className="bg-primary/10 text-primary border-primary/20">Jan 2024</Badge>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search current affairs..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" data-testid="input-ca-search" />
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {categories.map(cat => (
          <button key={cat} onClick={() => setActiveCategory(cat)}
            data-testid={`filter-cat-${cat.toLowerCase().replace(/\s+/g, "-")}`}
            className={cn("px-3 py-1.5 rounded-full text-xs font-medium transition-all border",
              activeCategory === cat ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/40"
            )}>
            {cat}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">No articles found.</div>
        )}
        {filtered.map(item => (
          <Card key={item.id}
            className={cn("transition-all", !item.isRead && "border-l-4 border-l-primary", expanded === item.id && "shadow-md")}
            data-testid={`ca-card-${item.id}`}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <Badge className={cn("text-xs", categoryColors[item.category] || "bg-muted text-muted-foreground")}>
                      {item.category}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{item.date}</span>
                    {!item.isRead && <Badge className="text-xs bg-primary/10 text-primary border-primary/20">New</Badge>}
                  </div>
                  <h3 className={cn("font-semibold text-sm leading-snug", item.isRead ? "text-muted-foreground" : "text-foreground")}>{item.title}</h3>

                  {expanded === item.id && (
                    <p className="text-sm text-foreground mt-2 leading-relaxed" data-testid={`ca-summary-${item.id}`}>{item.summary}</p>
                  )}

                  <div className="flex gap-1 mt-2 flex-wrap">
                    {item.tags.map(tag => (
                      <span key={tag} className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded">#{tag}</span>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 shrink-0">
                  <button onClick={() => toggleImportant(item.id)} data-testid={`button-star-${item.id}`}
                    className={cn("p-1.5 rounded-lg transition-colors", item.isImportant ? "text-amber-500 bg-amber-50 dark:bg-amber-950" : "text-muted-foreground hover:text-amber-500")}>
                    <Star className={cn("w-4 h-4", item.isImportant && "fill-current")} />
                  </button>
                </div>
              </div>

              <div className="flex gap-2 mt-3 pt-2 border-t">
                <button onClick={() => setExpanded(expanded === item.id ? null : item.id)}
                  data-testid={`button-expand-ca-${item.id}`}
                  className="text-xs text-primary hover:underline flex items-center gap-1">
                  <BookOpen className="w-3 h-3" />
                  {expanded === item.id ? "Show less" : "Read more"}
                </button>
                {!item.isRead && (
                  <button onClick={() => markRead(item.id)} data-testid={`button-mark-read-${item.id}`}
                    className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 ml-auto">
                    <Check className="w-3 h-3" /> Mark read
                  </button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-muted/50">
        <CardContent className="p-4 text-center">
          <p className="text-sm text-muted-foreground">
            📰 Daily current affairs will be fetched from the API when integrated. Articles above are sample data.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
