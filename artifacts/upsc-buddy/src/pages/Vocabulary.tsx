import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookMarked, Search, Volume2, ChevronDown, ChevronUp } from "lucide-react";
import { mockVocabulary, subjects } from "@/lib/mockData";
import { cn } from "@/lib/utils";

export default function Vocabulary() {
  const [search, setSearch] = useState("");
  const [filterSubject, setFilterSubject] = useState("all");
  const [expanded, setExpanded] = useState<number | null>(null);

  const filtered = mockVocabulary.filter(v => {
    const matchSearch = v.word.toLowerCase().includes(search.toLowerCase()) || v.meaning.toLowerCase().includes(search.toLowerCase());
    const matchSubject = filterSubject === "all" || v.subject === filterSubject;
    return matchSearch && matchSubject;
  });

  const difficultyColor = {
    easy: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
    medium: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
    hard: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <BookMarked className="w-6 h-6 text-primary" /> Vocabulary Builder
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Master UPSC-relevant terms and concepts</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search words..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
            data-testid="input-vocabulary-search"
          />
        </div>
        <Select value={filterSubject} onValueChange={setFilterSubject}>
          <SelectTrigger className="w-full sm:w-44" data-testid="select-vocab-subject">
            <SelectValue placeholder="All Subjects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Subjects</SelectItem>
            {subjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-3">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">No words found matching your search.</div>
        )}
        {filtered.map(item => (
          <Card key={item.id} className={cn("transition-all", expanded === item.id && "border-primary/40")} data-testid={`vocab-card-${item.id}`}>
            <CardContent className="p-0">
              <button
                className="w-full flex items-center justify-between p-4 text-left"
                onClick={() => setExpanded(expanded === item.id ? null : item.id)}
                data-testid={`button-vocab-expand-${item.id}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                    <span className="text-primary font-bold text-sm">{item.word[0]}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{item.word}</p>
                    <p className="text-xs text-muted-foreground">{item.subject}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={cn("text-xs", difficultyColor[item.difficulty])}>{item.difficulty}</Badge>
                  {expanded === item.id ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </div>
              </button>

              {expanded === item.id && (
                <div className="px-4 pb-4 space-y-3 border-t">
                  <div className="pt-3">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Definition</p>
                    <p className="text-sm text-foreground leading-relaxed">{item.meaning}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Example</p>
                    <p className="text-sm text-foreground italic bg-muted rounded-lg p-2.5">"{item.example}"</p>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button size="sm" variant="outline" className="text-xs gap-1" data-testid={`button-vocab-listen-${item.id}`}>
                      <Volume2 className="w-3 h-3" /> Pronounce
                    </Button>
                    <Button size="sm" variant="outline" className="text-xs" data-testid={`button-vocab-save-${item.id}`}>
                      + Add to Flashcards
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-4 text-center">
          <p className="text-sm text-muted-foreground">
            📖 Showing {filtered.length} of {mockVocabulary.length} words · More vocabulary will be added via API integration
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
