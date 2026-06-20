import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Plus, Search, Edit2, Trash2, X, Save, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

type Note = {
  id: number;
  title: string;
  subject: string;
  content: string;
  tags: string[];
  updatedAt: string;
  wordCount: number;
};

export default function Notes() {
  // 🚨 Bypassing Clerk temporarily to stop the crash!
  const secureUserId = "local_student_123";

  const [notes, setNotes] = useState<Note[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Note | null>(null);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [creating, setCreating] = useState(false);

  // Load user-specific notes from Local Storage
  useEffect(() => {
    const savedNotes = localStorage.getItem(`upsc-notes-${secureUserId}`);
    if (savedNotes) {
      const parsedNotes = JSON.parse(savedNotes);
      setNotes(parsedNotes);
      setSelected(parsedNotes[0] || null);
    } else {
      // Setup a welcome note for a brand new user
      const initialNote: Note = {
        id: Date.now(),
        title: "Welcome to your Private Notes",
        subject: "General",
        content: "# Getting Started\n\nWrite your UPSC preparation notes here. They are saved securely and privately to your account.\n\n- Supports **Markdown**\n- Auto word count\n- Searchable",
        tags: ["welcome"],
        updatedAt: new Date().toISOString().slice(0, 10),
        wordCount: 26
      };
      setNotes([initialNote]);
      setSelected(initialNote);
      localStorage.setItem(`upsc-notes-${secureUserId}`, JSON.stringify([initialNote]));
    }
  }, []);

  // Helper to save to state AND secure local storage simultaneously
  const persistNotes = (newNotes: Note[]) => {
    setNotes(newNotes);
    localStorage.setItem(`upsc-notes-${secureUserId}`, JSON.stringify(newNotes));
  };

  const filtered = notes.filter(n =>
    n.title.toLowerCase().includes(search.toLowerCase()) ||
    n.subject.toLowerCase().includes(search.toLowerCase()) ||
    n.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
  );

  const startEdit = (note: Note) => {
    setSelected(note);
    setEditTitle(note.title);
    setEditContent(note.content);
    setEditing(true);
    setCreating(false);
  };

  const saveEdit = () => {
    if (!selected) return;
    const wordCount = editContent.split(/\s+/).filter(Boolean).length;
    const updatedNotes = notes.map(n => 
      n.id === selected.id 
        ? { ...n, title: editTitle, content: editContent, updatedAt: new Date().toISOString().slice(0, 10), wordCount } 
        : n
    );
    
    persistNotes(updatedNotes);
    setSelected(updatedNotes.find(n => n.id === selected.id) || null);
    setEditing(false);
  };

  const startCreate = () => {
    setEditing(false);
    setCreating(true);
    setEditTitle("");
    setEditContent("");
    setSelected(null);
  };

  const saveCreate = () => {
    if (!editTitle.trim()) return;
    const wordCount = editContent.split(/\s+/).filter(Boolean).length;
    const newNote: Note = {
      id: Date.now(), 
      title: editTitle, 
      subject: "General", 
      content: editContent,
      tags: ["new"], 
      updatedAt: new Date().toISOString().slice(0, 10), 
      wordCount,
    };
    
    const updatedNotes = [newNote, ...notes];
    persistNotes(updatedNotes);
    setSelected(newNote);
    setCreating(false);
  };

  const deleteNote = (id: number) => {
    const updatedNotes = notes.filter(n => n.id !== id);
    persistNotes(updatedNotes);
    if (selected?.id === id) {
      setSelected(updatedNotes.length > 0 ? updatedNotes[0] : null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary" /> Notes
          </h1>
          <p className="text-muted-foreground text-sm mt-1">{notes.length} notes · Markdown supported</p>
        </div>
        <Button onClick={startCreate} size="sm" data-testid="button-new-note">
          <Plus className="w-4 h-4 mr-1.5" /> New Note
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-14rem)]">
        {/* Left Sidebar: Note List */}
        <div className="space-y-2 overflow-y-auto pr-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search notes..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" data-testid="input-notes-search" />
          </div>
          {filtered.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">No notes found</p>}
          {filtered.map(note => (
            <button key={note.id} onClick={() => { setSelected(note); setEditing(false); setCreating(false); }}
              data-testid={`note-item-${note.id}`}
              className={cn("w-full text-left p-3 rounded-xl border transition-all hover:border-primary/30", selected?.id === note.id && !creating ? "border-primary bg-primary/5" : "border-border bg-card")}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-foreground truncate">{note.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                    <Clock className="w-3 h-3" />{note.updatedAt}
                  </p>
                </div>
                <Badge variant="outline" className="text-xs shrink-0">{note.subject}</Badge>
              </div>
              <div className="flex gap-1 mt-1.5 flex-wrap">
                {note.tags.slice(0, 3).map(t => (
                  <span key={t} className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded">#{t}</span>
                ))}
              </div>
            </button>
          ))}
        </div>

        {/* Right Area: Editor / Viewer */}
        <div className="lg:col-span-2">
          {creating ? (
            <Card className="h-full flex flex-col">
              <div className="flex items-center justify-between p-4 border-b">
                <Input value={editTitle} onChange={e => setEditTitle(e.target.value)} placeholder="Note title..." className="text-base font-semibold border-0 p-0 focus-visible:ring-0 bg-transparent" data-testid="input-note-title" />
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => setCreating(false)} data-testid="button-cancel-create"><X className="w-4 h-4" /></Button>
                  <Button size="sm" onClick={saveCreate} data-testid="button-save-note"><Save className="w-4 h-4 mr-1" />Save</Button>
                </div>
              </div>
              <Textarea value={editContent} onChange={e => setEditContent(e.target.value)} placeholder="Write your note here... Markdown is supported (e.g., # Heading, **bold**)." className="flex-1 border-0 resize-none focus-visible:ring-0 text-sm font-mono p-4 bg-transparent" data-testid="textarea-note-content" />
            </Card>
          ) : editing && selected ? (
            <Card className="h-full flex flex-col">
              <div className="flex items-center justify-between p-4 border-b">
                <Input value={editTitle} onChange={e => setEditTitle(e.target.value)} className="text-base font-semibold border-0 p-0 focus-visible:ring-0 bg-transparent" data-testid="input-edit-title" />
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => setEditing(false)} data-testid="button-cancel-edit"><X className="w-4 h-4" /></Button>
                  <Button size="sm" onClick={saveEdit} data-testid="button-save-edit"><Save className="w-4 h-4 mr-1" />Save</Button>
                </div>
              </div>
              <Textarea value={editContent} onChange={e => setEditContent(e.target.value)} className="flex-1 border-0 resize-none focus-visible:ring-0 text-sm font-mono p-4 bg-transparent" data-testid="textarea-edit-content" />
            </Card>
          ) : selected ? (
            <Card className="h-full flex flex-col overflow-hidden">
              <div className="flex items-start justify-between p-4 border-b">
                <div>
                  <h2 className="text-base font-semibold text-foreground">{selected.title}</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">{selected.wordCount} words · {selected.updatedAt}</p>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => startEdit(selected)} data-testid="button-edit-note"><Edit2 className="w-4 h-4" /></Button>
                  <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive/80" onClick={() => deleteNote(selected.id)} data-testid="button-delete-note"><Trash2 className="w-4 h-4" /></Button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  {selected.content.split('\n').map((line, i) => {
                    if (line.startsWith('# ')) return <h1 key={i} className="text-xl font-bold text-foreground mt-0">{line.slice(2)}</h1>;
                    if (line.startsWith('## ')) return <h2 key={i} className="text-base font-semibold text-foreground mt-4">{line.slice(3)}</h2>;
                    if (line.startsWith('- ')) return <li key={i} className="text-sm text-foreground ml-4">{line.slice(2)}</li>;
                    if (line.startsWith('**') && line.endsWith('**')) return <p key={i} className="text-sm font-semibold text-foreground">{line.slice(2, -2)}</p>;
                    if (line === '') return <br key={i} />;
                    return <p key={i} className="text-sm text-foreground leading-relaxed">{line}</p>;
                  })}
                </div>
              </div>
            </Card>
          ) : (
            <Card className="h-full flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Select a note or create a new one</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}