import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ListChecks, Plus, ChevronRight, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useProcesses } from "@/hooks/useProcesses";
import { useToast } from "@/hooks/use-toast";

export default function ProcessesPage() {
  const { processes, loading, createProcess } = useProcesses();
  const { toast } = useToast();
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [name, setName] = useState('');
  const [stepsText, setStepsText] = useState('');

  const handleAddProcess = async () => {
    if (!name.trim()) {
      toast({ title: 'Please enter a name', variant: 'destructive' });
      return;
    }

    const steps = stepsText.split('\n').filter(s => s.trim());
    if (steps.length === 0) {
      toast({ title: 'Please add at least one step', variant: 'destructive' });
      return;
    }

    const { error } = await createProcess(name, steps);

    if (error) {
      toast({ title: 'Failed to create process', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Process created!' });
      setIsAddOpen(false);
      setName('');
      setStepsText('');
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
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[hsl(var(--tertiary))] to-[hsl(var(--tertiary))]/80 text-[hsl(var(--tertiary-foreground))] shadow-lg">
                <ListChecks className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Processes</h1>
                <p className="text-sm text-muted-foreground">How we do things around here</p>
              </div>
            </div>
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-full shadow-glow-primary">
                  <Plus className="mr-2 h-4 w-4" />
                  New Process
                </Button>
              </DialogTrigger>
              <DialogContent className="glass-card border-white/40">
                <DialogHeader>
                  <DialogTitle>Create New Process</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Sleepover Planning Process" className="glass border-white/40" />
                  </div>
                  <div className="space-y-2">
                    <Label>Steps (one per line)</Label>
                    <Textarea value={stepsText} onChange={(e) => setStepsText(e.target.value)} placeholder="Propose a date in Total Chat&#10;Vote on the date&#10;Host confirms location" rows={6} className="glass border-white/40" />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleAddProcess} className="rounded-full">Create</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 px-6 pb-6 relative z-10">
        <div className="mx-auto max-w-4xl space-y-6">
          {processes.length === 0 ? (
            <div className="glass-card rounded-3xl p-16 text-center">
              <div className="flex flex-col items-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-[hsl(var(--tertiary))]/20 mb-6">
                  <ListChecks className="h-10 w-10 text-[hsl(var(--tertiary))]" />
                </div>
                <h3 className="text-xl font-bold text-foreground">No processes yet</h3>
                <p className="mt-2 text-muted-foreground">Create a process to document how things work!</p>
              </div>
            </div>
          ) : (
            processes.map((process) => (
              <Card key={process.id} className="glass-card border-white/40 overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-xl font-bold text-foreground">{process.name}</CardTitle>
                    <Badge className="glass-subtle text-foreground border-0">{process.steps.length} steps</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Created by {process.creator?.display_name || process.creator?.username || 'Unknown'}
                  </p>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-2">
                    {process.steps.map((step, idx) => (
                      <li key={idx} className="flex items-start gap-3 rounded-lg bg-white/20 dark:bg-white/5 p-3 transition-colors hover:bg-white/30 dark:hover:bg-white/10">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{idx + 1}</span>
                        <span className="text-sm text-foreground">{step}</span>
                        <ChevronRight className="ml-auto h-4 w-4 shrink-0 text-muted-foreground" />
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
