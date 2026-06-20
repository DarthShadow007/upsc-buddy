import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, ChevronLeft, ChevronRight, Plus, Clock, BookOpen, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Event = { id: number; date: string; title: string; type: "study" | "test" | "revision"; duration: number };

const typeColors = {
  study: "bg-primary/20 text-primary border-primary/30",
  test: "bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300",
  revision: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300",
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export default function StudyCalendar() {
  const secureUserId = "local_student_123";

  const today = new Date();
  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState<"study" | "test" | "revision">("study");

  useEffect(() => {
    const savedEvents = localStorage.getItem(`upsc-events-${secureUserId}`);
    if (savedEvents) {
      setEvents(JSON.parse(savedEvents));
    }
  }, []);

  const persistEvents = (newEvents: Event[]) => {
    setEvents(newEvents);
    localStorage.setItem(`upsc-events-${secureUserId}`, JSON.stringify(newEvents));
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const cells: { date: string | null; day: number; isCurrentMonth: boolean }[] = [];
  
  for (let i = firstDay - 1; i >= 0; i--) cells.push({ date: null, day: daysInPrevMonth - i, isCurrentMonth: false });
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    cells.push({ date: dateStr, day: d, isCurrentMonth: true });
  }
  
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) cells.push({ date: null, day: d, isCurrentMonth: false });

  const getEventsForDate = (date: string) => events.filter(e => e.date === date);
  const selectedEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  const addEvent = () => {
    if (!newTitle.trim() || !selectedDate) return;
    const newEvents = [...events, { id: Date.now(), date: selectedDate, title: newTitle, type: newType, duration: 1 }];
    persistEvents(newEvents);
    setNewTitle("");
    setAdding(false);
  };

  const deleteEvent = (id: number) => {
    persistEvents(events.filter(e => e.id !== id));
  };

  const totalHours = events.reduce((acc, e) => acc + e.duration, 0);
  const studyDays = new Set(events.map(e => e.date)).size;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Calendar className="w-6 h-6 text-primary" /> Study Calendar
          </h1>
          <p className="text-muted-foreground text-sm mt-1">{studyDays} study days · {totalHours}h planned</p>
        </div>
        <div className="flex gap-3 text-xs">
          {Object.entries(typeColors).map(([type, cls]) => (
            <div key={type} className={cn("px-2 py-1 rounded border capitalize text-xs", cls)}>{type}</div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{MONTHS[month]} {year}</CardTitle>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => setCurrentDate(new Date(year, month - 1))} data-testid="button-prev-month">
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setCurrentDate(new Date(year, month + 1))} data-testid="button-next-month">
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-0.5">
                {DAYS.map(d => (
                  <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">{d}</div>
                ))}
                {cells.map(({ date, day, isCurrentMonth }, i) => {
                  const dateEvents = date ? getEventsForDate(date) : [];
                  const isToday = date === today.toISOString().slice(0, 10);
                  const isSelected = date === selectedDate;
                  return (
                    <button key={i} onClick={() => date && setSelectedDate(date === selectedDate ? null : date)}
                      data-testid={date ? `cal-day-${date}` : undefined}
                      className={cn("relative min-h-14 p-1 rounded-lg border text-left transition-all",
                        !isCurrentMonth && "opacity-30",
                        isSelected ? "border-primary bg-primary/5" : "border-transparent hover:bg-muted",
                        isToday && "font-bold"
                      )}>
                      <span className={cn("text-xs flex items-center justify-center w-5 h-5 rounded-full",
                        isToday ? "bg-primary text-primary-foreground" : "text-foreground"
                      )}>{day}</span>
                      <div className="mt-0.5 space-y-0.5">
                        {dateEvents.slice(0, 2).map(e => (
                          <div key={e.id} className={cn("text-xs px-1 py-0.5 rounded truncate border", typeColors[e.type])}>{e.title.split(" ").slice(0, 2).join(" ")}</div>
                        ))}
                        {dateEvents.length > 2 && <div className="text-xs text-muted-foreground">+{dateEvents.length - 2}</div>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {selectedDate ? (
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">
                    {new Date(selectedDate).toLocaleDateString("en-IN", { weekday: "long", month: "short", day: "numeric" })}
                  </CardTitle>
                  <Button size="sm" variant="ghost" onClick={() => setAdding(!adding)} data-testid="button-add-event">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {adding && (
                  <div className="space-y-2 p-2 bg-slate-900 rounded-lg mb-2 border border-slate-700">
                    <Input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Event title..." className="h-8 text-sm" data-testid="input-event-title" />
                    <div className="flex gap-1">
                      {(["study", "test", "revision"] as const).map(t => (
                        <button key={t} onClick={() => setNewType(t)}
                          className={cn("px-2 py-1 rounded text-xs border capitalize transition-colors", newType === t ? typeColors[t] : "border-border text-muted-foreground")}>
                          {t}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-1 pt-2">
                      <Button size="sm" onClick={addEvent} className="flex-1 h-7 text-xs" data-testid="button-save-event">Save</Button>
                      <Button size="sm" variant="outline" onClick={() => setAdding(false)} className="h-7 text-xs">Cancel</Button>
                    </div>
                  </div>
                )}
                {selectedEvents.length === 0 && !adding && (
                  <p className="text-sm text-muted-foreground text-center py-4">No events. Add one!</p>
                )}
                {selectedEvents.map(e => (
                  <div key={e.id} className={cn("flex items-start gap-2 p-2.5 rounded-lg border", typeColors[e.type])} data-testid={`event-item-${e.id}`}>
                    <BookOpen className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{e.title}</p>
                      <p className="text-xs opacity-70 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />{e.duration}h
                      </p>
                    </div>
                    <button onClick={() => deleteEvent(e.id)} data-testid={`button-delete-event-${e.id}`}><X className="w-3.5 h-3.5 opacity-50 hover:opacity-100" /></button>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : (
            <Card className="flex items-center justify-center min-h-32">
              <p className="text-sm text-muted-foreground text-center px-4">Click on a date to view or add study events</p>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Upcoming Events</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {events.sort((a, b) => a.date.localeCompare(b.date)).slice(0, 4).map(e => (
                <div key={e.id} className="flex items-center gap-2 text-xs" data-testid={`upcoming-event-${e.id}`}>
                  <div className={cn("w-2 h-2 rounded-full shrink-0", e.type === "study" ? "bg-primary" : e.type === "test" ? "bg-red-500" : "bg-amber-500")} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{e.title}</p>
                    <p className="text-muted-foreground">{e.date} · {e.duration}h</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}