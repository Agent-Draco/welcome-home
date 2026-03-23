import { useState, useRef, useEffect } from "react";
import { Bot, Send, Loader2, ToggleLeft, ToggleRight } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface ChatMsg {
  role: 'user' | 'assistant';
  content: string;
}

export default function AiChatPage() {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<'shiku' | 'coldstone'>('shiku');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMsg = { role: 'user', content: input.trim() };
    const allMessages = [...messages, userMsg];
    setMessages(allMessages);
    setInput('');
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: { messages: allMessages, mode },
      });

      if (error) throw error;

      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch (err: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
    }

    setIsLoading(false);
  };

  const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="flex h-screen flex-col glass-bg relative overflow-hidden">
      <div className="absolute top-20 left-20 w-96 h-96 bg-[hsl(var(--tertiary))] opacity-20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 right-20 w-80 h-80 bg-[hsl(var(--primary))] opacity-10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white opacity-20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 p-6">
        <div className="glass-card rounded-3xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--tertiary))] text-white shadow-lg">
                <Bot className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">
                  {mode === 'shiku' ? 'Lieutenant Boswell' : 'ColdStone'}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {mode === 'shiku' ? 'Group-aware AI assistant' : 'General-purpose AI assistant'}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => { setMode(m => m === 'shiku' ? 'coldstone' : 'shiku'); setMessages([]); }}
              className="glass rounded-full border-white/40"
            >
              {mode === 'shiku' ? <ToggleLeft className="mr-2 h-4 w-4" /> : <ToggleRight className="mr-2 h-4 w-4" />}
              Switch to {mode === 'shiku' ? 'ColdStone' : 'Lt. Boswell'}
            </Button>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 px-6 relative z-10">
        <div className="mx-auto max-w-3xl space-y-4 pb-4">
          {messages.length === 0 && (
            <div className="glass-card rounded-3xl p-12 text-center">
              <Bot className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-foreground">
                {mode === 'shiku' ? 'Hey! I\'m Shiku-san 🎌' : 'Hello! I\'m ColdStone 🪨'}
              </h3>
              <p className="mt-2 text-muted-foreground max-w-sm mx-auto">
                {mode === 'shiku'
                  ? 'I know about your groups and chats. Ask me anything about your community!'
                  : 'I\'m a general-purpose AI. Ask me anything!'}
              </p>
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={cn("flex gap-3", msg.role === 'user' ? "flex-row-reverse" : "flex-row")}>
              <Avatar className="h-9 w-9 shrink-0">
                <AvatarFallback className={cn(
                  "text-sm font-bold",
                  msg.role === 'user' ? "bg-primary text-primary-foreground" : "bg-[hsl(var(--tertiary))] text-white"
                )}>
                  {msg.role === 'user' ? getInitials(profile?.display_name) : (mode === 'shiku' ? '式' : '🪨')}
                </AvatarFallback>
              </Avatar>
              <div className={cn("max-w-[75%]", msg.role === 'user' && "text-right")}>
                <div className={cn(
                  "rounded-2xl px-4 py-2.5 shadow-sm",
                  msg.role === 'user'
                    ? "bg-primary text-primary-foreground rounded-tr-sm"
                    : "glass-card rounded-tl-sm"
                )}>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-[hsl(var(--tertiary))] text-white text-sm font-bold">
                  {mode === 'shiku' ? '式' : '🪨'}
                </AvatarFallback>
              </Avatar>
              <div className="glass-card rounded-2xl rounded-tl-sm px-4 py-3">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      <div className="mx-auto w-full max-w-3xl relative z-10 pb-6 px-6">
        <div className="glass-card rounded-2xl p-3">
          <div className="flex items-center gap-2">
            <Input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder={mode === 'shiku' ? 'Ask Shiku-san...' : 'Ask ColdStone...'}
              className="flex-1 rounded-full border-white/40 bg-white/20 px-4"
              disabled={isLoading}
            />
            <Button onClick={handleSend} disabled={!input.trim() || isLoading} className="rounded-full shadow-glow-primary">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
