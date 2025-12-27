import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Plus, Heart, Calendar, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useTraditions } from "@/hooks/useTraditions";
import { useToast } from "@/hooks/use-toast";

export default function TraditionsPage() {
  const { traditions, loading, createTradition } = useTraditions();
  const { toast } = useToast();
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleAddTradition = async () => {
    if (!name.trim()) {
      toast({ title: 'Please enter a name', variant: 'destructive' });
      return;
    }
    const { error } = await createTradition(name, description);
    if (error) {
      toast({ title: 'Failed to create tradition', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Tradition created!' });
      setIsAddOpen(false);
      setName('');
      setDescription('');
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
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[hsl(var(--secondary))] to-[hsl(var(--secondary))]/80 text-[hsl(var(--secondary-foreground))] shadow-lg">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Traditions</h1>
                <p className="text-sm text-muted-foreground">The things that make us us</p>
              </div>
            </div>
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-full bg-gradient-to-r from-[hsl(var(--secondary))] to-[hsl(var(--secondary))]/80 text-[hsl(var(--secondary-foreground))] hover:opacity-90 shadow-lg">
                  <Plus className="mr-2 h-4 w-4" />
                  New Tradition
                </Button>
              </DialogTrigger>
              <DialogContent className="glass-card border-white/40">
                <DialogHeader>
                  <DialogTitle>Create New Tradition</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Midnight Snack Run" className="glass border-white/40" />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What makes this tradition special?" className="glass border-white/40" />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleAddTradition} className="rounded-full">Create</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 px-6 pb-6 relative z-10">
        <div className="mx-auto max-w-4xl">
          {traditions.length === 0 ? (
            <div className="glass-card rounded-3xl p-16 text-center">
              <div className="flex flex-col items-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-[hsl(var(--tertiary))]/20 mb-6">
                  <Sparkles className="h-10 w-10 text-[hsl(var(--tertiary))]" />
                </div>
                <h3 className="text-xl font-bold text-foreground">No traditions yet</h3>
                <p className="mt-2 text-muted-foreground max-w-sm">Start a new tradition for your group!</p>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {traditions.map((tradition, idx) => (
                <Card key={tradition.id} className="glass-card border-white/40 group overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-1" style={{ animationDelay: `${idx * 100}ms` }}>
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary/20 text-secondary shadow-sm transition-transform group-hover:scale-110">
                        <Sparkles className="h-6 w-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-card-foreground">{tradition.name}</h3>
                        {tradition.description && <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{tradition.description}</p>}
                        <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Heart className="h-3 w-3" />{tradition.creator?.display_name || tradition.creator?.username || 'Unknown'}</span>
                          <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{format(new Date(tradition.created_at), "MMM yyyy")}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}