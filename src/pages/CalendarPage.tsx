import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
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
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      <PageHeader
        title="Calendar"
        subtitle="Plan sleepovers and hangouts"
        icon={<CalendarIcon className="h-6 w-6" />}
        action={
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-full shadow-glow-primary">
                <Plus className="mr-2 h-4 w-4" />
                New Sleepover
              </Button>
            </DialogTrigger>
            <DialogContent>
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
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Alex's House"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What's the plan?"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreate}>Create Sleepover</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <ScrollArea className="flex-1 p-6">
        <div className="mx-auto max-w-4xl space-y-8">
          {/* Countdown Section */}
          {nextSleepover && daysUntil !== null && (
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-glow-primary">
                    <Moon className="h-8 w-8 text-primary-foreground" />
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
              <div className="py-8 text-center text-muted-foreground">
                No sleepovers planned yet. Create one!
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
