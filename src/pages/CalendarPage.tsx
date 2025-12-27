import { useState } from "react";
import { EventCard } from "@/components/calendar/EventCard";
import { Calendar as CalendarIcon, Plus, Moon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { differenceInDays, isFuture } from "date-fns";
import { useSleepovers } from "@/hooks/useSleepovers";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

export default function CalendarPage() {
  const { sleepovers, loading, createSleepover } = useSleepovers();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [eventDate, setEventDate] = useState('');

  const upcomingSleepovers = sleepovers.filter(
    (s) => isFuture(new Date(s.event_date))
  );
  
  const nextSleepover = upcomingSleepovers.sort(
    (a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
  )[0];

  const daysUntil = nextSleepover
    ? differenceInDays(new Date(nextSleepover.event_date), new Date())
    : null;

  const handleCreate = async () => {
    if (!title.trim() || !eventDate) {
      toast({ title: 'Please fill in title and date', variant: 'destructive' });
      return;
    }

    const { error } = await createSleepover({
      title,
      description: description || null,
      location: location || null,
      event_date: eventDate,
    });

    if (error) {
      toast({ title: 'Failed to create sleepover', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Sleepover created!' });
      setIsOpen(false);
      setTitle('');
      setDescription('');
      setLocation('');
      setEventDate('');
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
      {/* Decorative blurred shapes */}
      <div className="absolute top-20 left-20 w-96 h-96 bg-[hsl(var(--tertiary))] opacity-20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 right-20 w-80 h-80 bg-[hsl(var(--primary))] opacity-10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white opacity-20 rounded-full blur-3xl pointer-events-none" />
      
      <div className="relative z-10 p-6">
        <div className="glass-card rounded-3xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--primary))]/80 text-[hsl(var(--primary-foreground))] shadow-lg">
                <CalendarIcon className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Calendar</h1>
                <p className="text-sm text-muted-foreground">Plan sleepovers and hangouts</p>
              </div>
            </div>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-full bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary))]/80 text-[hsl(var(--primary-foreground))] hover:opacity-90 shadow-lg">
                  <Plus className="mr-2 h-4 w-4" />
                  New Sleepover
                </Button>
              </DialogTrigger>
              <DialogContent className="glass-card border-white/40">
                <DialogHeader>
                  <DialogTitle>Plan a Sleepover</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Epic Movie Marathon"
                      className="glass border-white/40"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      className="glass border-white/40"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Location</Label>
                    <Input
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Alex's House"
                      className="glass border-white/40"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="What's the plan?"
                      className="glass border-white/40"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleCreate} className="rounded-full">Create Sleepover</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 px-6 pb-6 relative z-10">
        <div className="mx-auto max-w-4xl space-y-8">
          {/* Countdown Section */}
          {nextSleepover && daysUntil !== null && (
            <div className="glass-card rounded-3xl p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--primary))]/80 shadow-lg">
                    <Moon className="h-8 w-8 text-[hsl(var(--primary-foreground))]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Next Sleepover
                    </p>
                    <h2 className="text-xl font-bold text-foreground">
                      {nextSleepover.title}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {nextSleepover.location || 'TBD'}
                    </p>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-5xl font-bold text-primary animate-float">
                    {daysUntil}
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">
                    days to go!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Events List */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Upcoming Sleepovers</h3>
            {sleepovers.length === 0 ? (
              <div className="glass-card rounded-3xl p-16 text-center">
                <div className="flex flex-col items-center">
                  <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-[hsl(var(--tertiary))]/20 mb-6">
                    <CalendarIcon className="h-10 w-10 text-[hsl(var(--tertiary))]" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground">No sleepovers planned yet</h3>
                  <p className="mt-2 text-muted-foreground max-w-sm">Create one!</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {sleepovers.map((sleepover) => (
                  <EventCard 
                    key={sleepover.id} 
                    event={{
                      id: sleepover.id,
                      title: sleepover.title,
                      date: new Date(sleepover.event_date),
                      type: 'sleepover',
                      attendees: [],
                      location: sleepover.location || 'TBD',
                    }} 
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}