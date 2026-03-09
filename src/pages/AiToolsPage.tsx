import { useState } from "react";
import { Wrench, Plus, ExternalLink, Trash2, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useAiTools } from "@/hooks/useAiTools";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { useToast } from "@/hooks/use-toast";

export default function AiToolsPage() {
  const { tools, loading, addTool, deleteTool } = useAiTools();
  const { user } = useAuth();
  const { isAdmin } = useAdmin();
  const { toast } = useToast();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');

  const handleAdd = async () => {
    if (!name.trim()) {
      toast({ title: 'Please enter a tool name', variant: 'destructive' });
      return;
    }
    const { error } = await addTool(name, url, description, category);
    if (error) {
      toast({ title: 'Failed to add tool', variant: 'destructive' });
    } else {
      toast({ title: 'Tool added!' });
      setIsAddOpen(false);
      setName(''); setUrl(''); setDescription(''); setCategory('');
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await deleteTool(id);
    if (error) toast({ title: 'Failed to delete', variant: 'destructive' });
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
                <Wrench className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">AI Tools</h1>
                <p className="text-sm text-muted-foreground">Community-curated AI tool bookmarks</p>
              </div>
            </div>
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-full shadow-glow-primary">
                  <Plus className="mr-2 h-4 w-4" /> Add Tool
                </Button>
              </DialogTrigger>
              <DialogContent className="glass-card border-white/40">
                <DialogHeader><DialogTitle>Add AI Tool</DialogTitle></DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input value={name} onChange={e => setName(e.target.value)} placeholder="ChatGPT" className="glass border-white/40" />
                  </div>
                  <div className="space-y-2">
                    <Label>URL</Label>
                    <Input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://chat.openai.com" className="glass border-white/40" />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="What does this tool do?" className="glass border-white/40" />
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Input value={category} onChange={e => setCategory(e.target.value)} placeholder="chatbot, image, coding..." className="glass border-white/40" />
                  </div>
                </div>
                <DialogFooter><Button onClick={handleAdd} className="rounded-full">Add Tool</Button></DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 px-6 pb-6 relative z-10">
        <div className="mx-auto max-w-4xl">
          {tools.length === 0 ? (
            <div className="glass-card rounded-3xl p-16 text-center">
              <Wrench className="h-16 w-16 text-muted-foreground/30 mx-auto" />
              <h3 className="mt-4 text-xl font-bold text-foreground">No AI tools yet</h3>
              <p className="mt-2 text-muted-foreground">Be the first to share an AI tool!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tools.map(tool => (
                <Card key={tool.id} className="glass-card border-white/40 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-foreground">{tool.name}</h3>
                          {tool.category && (
                            <Badge className="glass-subtle text-foreground border-0 text-xs">{tool.category}</Badge>
                          )}
                        </div>
                        {tool.description && (
                          <p className="text-sm text-muted-foreground mb-2">{tool.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Added by {tool.profiles?.display_name || tool.profiles?.username || 'Unknown'}
                        </p>
                      </div>
                      <div className="flex gap-1 ml-2">
                        {tool.url && (
                          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                            <a href={tool.url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                        {(tool.added_by === user?.id || isAdmin) && (
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(tool.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
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
