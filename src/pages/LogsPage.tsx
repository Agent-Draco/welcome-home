import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Moon, Calendar, Users, Sparkles, Plus, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLogs } from "@/hooks/useLogs";
import { useSleepovers } from "@/hooks/useSleepovers";
import { useAdmin } from "@/hooks/useAdmin";
import { useToast } from "@/hooks/use-toast";

export default function LogsPage() {
  const { logs, loading, createLog } = useLogs();
  const { sleepovers } = useSleepovers();
  const { isAdmin } = useAdmin();
  const { toast } = useToast();
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedSleepover, setSelectedSleepover] = useState('');
  const [notes, setNotes] = useState('');
  const [highlightsText, setHighlightsText] = useState('');

  const handleAddLog = async () => {
    if (!selectedSleepover) {
      toast({ title: 'Please select a sleepover', variant: 'destructive' });
      return;
    }
    const highlights = highlightsText.split('\n').filter(h => h.trim());
    const { error } = await createLog(selectedSleepover, notes, highlights);
    if (error) {
      toast({ title: 'Failed to create log', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Log created!' });
      setIsAddOpen(false);
      setSelectedSleepover('');
      setNotes('');
      setHighlightsText('');
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center glass-bg">
        <div className="glass-card rounded-3xl p-8">
          <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--tertiary))]" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col glass-bg relative overflow-hidden">
      <div className="absolute top-20 left-20 w-96 h-96 bg-[hsl(var(--tertiary))] opacity-20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 right-20 w-80 h-80 bg-[hsl(var(--primary))] opacity-10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white opacity-20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 p-6">
        <div className="glass-card rounded-3xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--primary))]/80 text-[hsl(var(--primary-foreground))] shadow-lg">
                <Moon className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Sleepover Logs</h1>
                <p className="text-sm text-muted-foreground">Memories from past sleepovers</p>
              </div>
            </div>
            {isAdmin && (
              <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogTrigger asChild>
                  <Button className="rounded-full shadow-glow-primary">
                    <Plus className="mr-2 h-4 w-4" /> Add Log
                  </Button>
                </DialogTrigger>
                <DialogContent className="glass-card border-white/40">
                  <DialogHeader><DialogTitle>Add Sleepover Log</DialogTitle></DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Sleepover</Label>
                      <Select value={selectedSleepover} onValueChange={setSelectedSleepover}>
                        <SelectTrigger className="glass border-white/40"><SelectValue placeholder="Select sleepover" /></SelectTrigger>
                        <SelectContent>
                          {sleepovers.map((s) => (
                            <SelectItem key={s.id} value={s.id}>{s.title} ({new Date(s.event_date).toLocaleDateString()})</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Highlights (one per line)</Label>
                      <Textarea value={highlightsText} onChange={(e) => setHighlightsText(e.target.value)} placeholder="Watched 4 movies&#10;Epic pillow fight" rows={4} className="glass border-white/40" />
                    </div>
                    <div className="space-y-2">
                      <Label>Notes</Label>
                      <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any additional notes..." className="glass border-white/40" />
                    </div>
                  </div>
                  <DialogFooter><Button onClick={handleAddLog} className="rounded-full">Add Log</Button></DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 px-6 pb-6 relative z-10">
        <div className="mx-auto max-w-4xl space-y-6">
          {logs.length === 0 ? (
            <div className="glass-card rounded-3xl p-16 text-center">
              <div className="flex flex-col items-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-[hsl(var(--tertiary))]/20 mb-6">
                  <Moon className="h-10 w-10 text-[hsl(var(--tertiary))]" />
                </div>
                <h3 className="text-xl font-bold text-foreground">No logs yet</h3>
                <p className="mt-2 text-muted-foreground">
                  {isAdmin ? 'Create your first sleepover log!' : 'No sleepover logs have been created yet.'}
                </p>
              </div>
            </div>
          ) : (
            logs.map((log) => (
              <Card key={log.id} className="glass-card border-white/40 overflow-hidden">
                <CardHeader className="bg-white/10 dark:bg-white/5 pb-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl font-bold text-foreground">
                        {log.sleepover?.title || 'Sleepover Log'}
                      </CardTitle>
                      <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {log.sleepover?.event_date ? format(new Date(log.sleepover.event_date), "MMMM d, yyyy") : 'Unknown date'}
                        </span>
                        {log.sleepover?.location && (
                          <span className="flex items-center gap-1"><Users className="h-4 w-4" />{log.sleepover.location}</span>
                        )}
                      </div>
                    </div>
                    <Badge className="glass-subtle text-foreground border-0">
                      <Moon className="mr-1 h-3 w-3" /> Sleepover
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-4">
                    {log.highlights && log.highlights.length > 0 && (
                      <div>
                        <h4 className="mb-2 flex items-center gap-1 text-sm font-medium text-muted-foreground">
                          <Sparkles className="h-4 w-4" /> Highlights
                        </h4>
                        <ul className="space-y-1">
                          {log.highlights.map((highlight, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-foreground">
                              <span className="text-primary">•</span>{highlight}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {log.notes && (
                      <div className="rounded-xl bg-white/20 dark:bg-white/5 p-3">
                        <p className="text-sm italic text-muted-foreground">"{log.notes}"</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
