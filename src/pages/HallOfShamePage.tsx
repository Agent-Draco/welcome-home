import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skull, Plus, ChevronDown, ChevronRight, Loader2, Folder, FolderOpen } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useHallEntries } from "@/hooks/useHallEntries";
import { useSleepovers } from "@/hooks/useSleepovers";
import { useProfiles } from "@/hooks/useProfiles";
import { useAdmin } from "@/hooks/useAdmin";
import { useToast } from "@/hooks/use-toast";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export default function HallOfShamePage() {
  const { entries, entriesByYear, achievements, loading, createAchievement, createEntry } = useHallEntries('shame');
  const { sleepovers } = useSleepovers();
  const { profiles } = useProfiles();
  const { isAdmin } = useAdmin();
  const { toast } = useToast();
  
  const [expandedYears, setExpandedYears] = useState<Set<number>>(new Set());
  const [expandedSleepovers, setExpandedSleepovers] = useState<Set<string>>(new Set());
  const [isAddEntryOpen, setIsAddEntryOpen] = useState(false);
  const [isAddAchievementOpen, setIsAddAchievementOpen] = useState(false);
  const [selectedSleepover, setSelectedSleepover] = useState('');
  const [selectedAchievement, setSelectedAchievement] = useState('');
  const [selectedWinner, setSelectedWinner] = useState('');
  const [entryDescription, setEntryDescription] = useState('');
  const [newAchievementName, setNewAchievementName] = useState('');
  const [newAchievementDesc, setNewAchievementDesc] = useState('');
  const [newAchievementIcon, setNewAchievementIcon] = useState('💀');

  const toggleYear = (year: number) => {
    const n = new Set(expandedYears);
    n.has(year) ? n.delete(year) : n.add(year);
    setExpandedYears(n);
  };

  const toggleSleepover = (id: string) => {
    const n = new Set(expandedSleepovers);
    n.has(id) ? n.delete(id) : n.add(id);
    setExpandedSleepovers(n);
  };

  const handleAddEntry = async () => {
    if (!selectedSleepover || !selectedAchievement || !selectedWinner) {
      toast({ title: 'Please fill all required fields', variant: 'destructive' });
      return;
    }
    const { error } = await createEntry({ sleepover_id: selectedSleepover, achievement_id: selectedAchievement, winner_id: selectedWinner, description: entryDescription || undefined });
    if (error) {
      toast({ title: 'Failed to add entry', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Entry added!' });
      setIsAddEntryOpen(false);
      setSelectedSleepover(''); setSelectedAchievement(''); setSelectedWinner(''); setEntryDescription('');
    }
  };

  const handleAddAchievement = async () => {
    if (!newAchievementName.trim()) {
      toast({ title: 'Please enter an achievement name', variant: 'destructive' });
      return;
    }
    const { error } = await createAchievement({ name: newAchievementName, description: newAchievementDesc || null, icon: newAchievementIcon, type: 'shame' });
    if (error) {
      toast({ title: 'Failed to create achievement', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Achievement created!' });
      setIsAddAchievementOpen(false);
      setNewAchievementName(''); setNewAchievementDesc(''); setNewAchievementIcon('💀');
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const years = Object.keys(entriesByYear).map(Number).sort((a, b) => b - a);

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
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-destructive to-destructive/80 text-destructive-foreground shadow-lg">
                <Skull className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Hall of Shame</h1>
                <p className="text-sm text-muted-foreground">Gloriously embarrassing moments</p>
              </div>
            </div>
            {isAdmin && (
              <div className="flex gap-3">
                <Dialog open={isAddAchievementOpen} onOpenChange={setIsAddAchievementOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="glass rounded-full border-white/40 hover:bg-white/30">
                      <Plus className="mr-2 h-4 w-4" /> New Achievement
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="glass-card border-white/40">
                    <DialogHeader><DialogTitle>Create Shame Achievement</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Icon</Label>
                        <Input value={newAchievementIcon} onChange={(e) => setNewAchievementIcon(e.target.value)} className="w-20 text-center text-2xl glass border-white/40" />
                      </div>
                      <div className="space-y-2">
                        <Label>Name</Label>
                        <Input value={newAchievementName} onChange={(e) => setNewAchievementName(e.target.value)} placeholder="Snack Monster" className="glass border-white/40" />
                      </div>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea value={newAchievementDesc} onChange={(e) => setNewAchievementDesc(e.target.value)} placeholder="For eating all the snacks" className="glass border-white/40" />
                      </div>
                    </div>
                    <DialogFooter><Button onClick={handleAddAchievement} className="rounded-full">Create</Button></DialogFooter>
                  </DialogContent>
                </Dialog>
                <Dialog open={isAddEntryOpen} onOpenChange={setIsAddEntryOpen}>
                  <DialogTrigger asChild>
                    <Button variant="destructive" className="rounded-full shadow-sm">
                      <Plus className="mr-2 h-4 w-4" /> Add Entry
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="glass-card border-white/40">
                    <DialogHeader><DialogTitle>Add Hall of Shame Entry</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Sleepover</Label>
                        <Select value={selectedSleepover} onValueChange={setSelectedSleepover}>
                          <SelectTrigger className="glass border-white/40"><SelectValue placeholder="Select sleepover" /></SelectTrigger>
                          <SelectContent>{sleepovers.map((s) => (<SelectItem key={s.id} value={s.id}>{s.title} ({new Date(s.event_date).toLocaleDateString()})</SelectItem>))}</SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Achievement</Label>
                        <Select value={selectedAchievement} onValueChange={setSelectedAchievement}>
                          <SelectTrigger className="glass border-white/40"><SelectValue placeholder="Select achievement" /></SelectTrigger>
                          <SelectContent>{achievements.map((a) => (<SelectItem key={a.id} value={a.id}>{a.icon} {a.name}</SelectItem>))}</SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Winner</Label>
                        <Select value={selectedWinner} onValueChange={setSelectedWinner}>
                          <SelectTrigger className="glass border-white/40"><SelectValue placeholder="Select winner" /></SelectTrigger>
                          <SelectContent>{profiles.map((p) => (<SelectItem key={p.id} value={p.id}>{p.display_name || p.username}</SelectItem>))}</SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Description (optional)</Label>
                        <Textarea value={entryDescription} onChange={(e) => setEntryDescription(e.target.value)} placeholder="What made this embarrassing?" className="glass border-white/40" />
                      </div>
                    </div>
                    <DialogFooter><Button onClick={handleAddEntry} className="rounded-full">Add Entry</Button></DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 px-6 pb-6 relative z-10">
        <div className="mx-auto max-w-3xl space-y-4">
          {entries.length === 0 ? (
            <div className="glass-card rounded-3xl p-16 text-center">
              <div className="flex flex-col items-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-destructive/20 mb-6">
                  <Skull className="h-10 w-10 text-destructive" />
                </div>
                <h3 className="text-xl font-bold text-foreground">No shame entries yet</h3>
                <p className="mt-2 text-muted-foreground">Everyone's been too well-behaved... for now!</p>
              </div>
            </div>
          ) : (
            years.map((year) => (
              <Collapsible key={year} open={expandedYears.has(year)} onOpenChange={() => toggleYear(year)}>
                <CollapsibleTrigger asChild>
                  <div className="glass-card rounded-2xl cursor-pointer hover:bg-white/50 dark:hover:bg-white/10 transition-all duration-300 group">
                    <div className="p-5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/20">
                            {expandedYears.has(year) ? <FolderOpen className="h-5 w-5 text-destructive" /> : <Folder className="h-5 w-5 text-destructive" />}
                          </div>
                          <span className="text-lg font-bold text-foreground">{year}</span>
                          <Badge className="glass-subtle text-foreground border-0">{Object.keys(entriesByYear[year]).length} sleepovers</Badge>
                        </div>
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/30 dark:bg-white/10">
                          {expandedYears.has(year) ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                        </div>
                      </div>
                    </div>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent className="pl-6 space-y-3 mt-3">
                  {Object.entries(entriesByYear[year]).map(([sleepoverId, { sleepover, entries: sleepoverEntries }]) => (
                    <Collapsible key={sleepoverId} open={expandedSleepovers.has(sleepoverId)} onOpenChange={() => toggleSleepover(sleepoverId)}>
                      <CollapsibleTrigger asChild>
                        <div className="glass-subtle rounded-xl cursor-pointer hover:bg-white/40 dark:hover:bg-white/10 transition-all duration-300">
                          <div className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/20">
                                  {expandedSleepovers.has(sleepoverId) ? <FolderOpen className="h-4 w-4 text-destructive" /> : <Folder className="h-4 w-4 text-destructive" />}
                                </div>
                                <span className="font-semibold text-foreground">{sleepover?.title || 'Unknown Sleepover'}</span>
                                <Badge variant="outline" className="text-xs border-white/40 bg-white/20">{sleepoverEntries.length} entries</Badge>
                              </div>
                              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/30 dark:bg-white/10">
                                {expandedSleepovers.has(sleepoverId) ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                              </div>
                            </div>
                          </div>
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="pl-6 space-y-2 mt-2">
                        {sleepoverEntries.map((entry) => (
                          <div key={entry.id} className="glass-card rounded-xl border-destructive/20 bg-destructive/5 p-4">
                            <div className="flex items-center gap-4">
                              <span className="text-2xl">{entry.achievements?.icon || '💀'}</span>
                              <div className="flex-1">
                                <span className="font-semibold text-foreground">{entry.achievements?.name || 'Achievement'}</span>
                                {entry.description && <p className="text-sm text-muted-foreground mt-1">{entry.description}</p>}
                              </div>
                              <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                  {entry.winner?.avatar_url && <AvatarImage src={entry.winner.avatar_url} />}
                                  <AvatarFallback className="bg-destructive text-destructive-foreground text-xs">{getInitials(entry.winner?.display_name)}</AvatarFallback>
                                </Avatar>
                                <span className="text-sm font-medium text-foreground">{entry.winner?.display_name || 'Unknown'}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </CollapsibleContent>
                    </Collapsible>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
