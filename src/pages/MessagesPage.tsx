import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, ArrowLeft, Send, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { usePrivateMessages } from "@/hooks/usePrivateMessages";
import { useProfiles } from "@/hooks/useProfiles";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function MessagesPage() {
  const { recipientId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { messages, conversations, loading, sendMessage } = usePrivateMessages(recipientId);
  const { profiles } = useProfiles();
  const [newMessage, setNewMessage] = useState('');

  const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !recipientId) return;
    await sendMessage(recipientId, newMessage);
    setNewMessage('');
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

  if (recipientId) {
    const partner = profiles.find(p => p.id === recipientId);
    return (
      <div className="flex h-screen flex-col glass-bg relative overflow-hidden">
        <div className="absolute top-20 left-20 w-96 h-96 bg-[hsl(var(--tertiary))] opacity-20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-[hsl(var(--primary))] opacity-10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 p-6">
          <div className="glass-card rounded-3xl px-6 py-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/messages')} className="rounded-full">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <Avatar className="h-10 w-10">
                {partner?.avatar_url && <AvatarImage src={partner.avatar_url} />}
                <AvatarFallback className="bg-primary text-primary-foreground text-sm font-bold">
                  {getInitials(partner?.display_name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-lg font-bold text-foreground">{partner?.display_name || partner?.username || 'Private Chat'}</h1>
                <p className="text-xs text-muted-foreground">Direct message</p>
              </div>
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1 px-6 relative z-10">
          <div className="mx-auto max-w-2xl space-y-4">
            {messages.map((msg) => {
              const isOwn = msg.sender_id === user?.id;
              return (
                <div key={msg.id} className={cn("flex gap-3", isOwn ? "flex-row-reverse" : "flex-row")}>
                  <Avatar className="h-8 w-8">
                    {msg.sender?.avatar_url && <AvatarImage src={msg.sender.avatar_url} />}
                    <AvatarFallback className="text-xs bg-primary text-primary-foreground">{getInitials(msg.sender?.display_name)}</AvatarFallback>
                  </Avatar>
                  <div className={cn("max-w-[70%]", isOwn && "text-right")}>
                    <div className={cn("rounded-2xl px-4 py-2 shadow-sm", isOwn ? "bg-primary text-primary-foreground" : "glass-card")}>
                      <p className="text-sm">{msg.content}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{format(new Date(msg.created_at), "h:mm a")}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        <div className="relative z-10 p-6">
          <div className="mx-auto max-w-2xl glass-card rounded-2xl p-3">
            <div className="flex gap-2">
              <Input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type a message..." onKeyDown={(e) => e.key === 'Enter' && handleSend()} className="flex-1 rounded-full border-white/40 bg-white/20" />
              <Button onClick={handleSend} className="rounded-full shadow-glow-primary"><Send className="h-4 w-4" /></Button>
            </div>
          </div>
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
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[hsl(var(--secondary))] to-[hsl(var(--secondary))]/80 text-[hsl(var(--secondary-foreground))] shadow-lg">
              <Mail className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Private Messages</h1>
              <p className="text-sm text-muted-foreground">Your conversations</p>
            </div>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 px-6 pb-6 relative z-10">
        <div className="mx-auto max-w-2xl space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">Start a conversation</h3>
          {profiles.filter(p => p.id !== user?.id).map((profile) => (
            <Card key={profile.id} className="glass-card border-white/40 cursor-pointer hover:bg-white/50 dark:hover:bg-white/10 transition-all duration-300" onClick={() => navigate(`/messages/${profile.id}`)}>
              <CardContent className="p-4 flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={profile.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary text-primary-foreground">{getInitials(profile.display_name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1"><p className="font-medium text-foreground">{profile.display_name || profile.username}</p></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
