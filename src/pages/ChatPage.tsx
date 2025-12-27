import { useEffect, useRef } from "react";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { ChatInput } from "@/components/chat/ChatInput";
import { MessageCircle, Users, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRealtimeChat } from "@/hooks/useRealtimeChat";
import { useProfiles } from "@/hooks/useProfiles";
import { useAuth } from "@/hooks/useAuth";

export default function ChatPage() {
  const { messages, loading, sendMessage, refreshMessages } = useRealtimeChat();
  const { onlineProfiles } = useProfiles();
  const { user } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = async (content: string, attachments?: { url: string; type: 'image' | 'file'; name: string }[]) => {
    await sendMessage(content, attachments);
  };

  const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
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
                <MessageCircle className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Total Chat</h1>
                <p className="text-sm text-muted-foreground">The main hangout for all Driftaculars</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {onlineProfiles.slice(0, 4).map((profile) => (
                  <Avatar key={profile.id} className="h-8 w-8 border-2 border-background">
                    {profile.avatar_url ? (
                      <AvatarImage src={profile.avatar_url} alt={profile.display_name || ''} />
                    ) : null}
                    <AvatarFallback className="text-xs font-semibold bg-primary text-primary-foreground">
                      {getInitials(profile.display_name)}
                    </AvatarFallback>
                  </Avatar>
                ))}
              </div>
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                {onlineProfiles.length} online
              </span>
            </div>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 px-6 relative z-10">
        <div className="mx-auto max-w-3xl space-y-4">
          {messages.length === 0 ? (
            <div className="glass-card rounded-3xl p-16 text-center">
              <div className="flex flex-col items-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-[hsl(var(--tertiary))]/20 mb-6">
                  <MessageCircle className="h-10 w-10 text-[hsl(var(--tertiary))]" />
                </div>
                <h3 className="text-xl font-bold text-foreground">No messages yet</h3>
                <p className="mt-2 text-muted-foreground max-w-sm">Be the first to say something!</p>
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <ChatMessage 
                key={message.id} 
                message={{
                  id: message.id,
                  content: message.content,
                  sender: {
                    id: message.sender_id,
                    name: message.profiles?.display_name || message.profiles?.username || 'Unknown',
                    initials: getInitials(message.profiles?.display_name || message.profiles?.username),
                    color: 'bg-primary text-primary-foreground',
                    avatar_url: message.profiles?.avatar_url || undefined,
                  },
                  timestamp: new Date(message.created_at),
                  isOwn: message.sender_id === user?.id,
                  isPinned: !!message.pinned_at,
                }}
                onPinChange={refreshMessages}
              />
            ))
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      <div className="mx-auto w-full max-w-3xl relative z-10 pb-6 px-6">
        <ChatInput onSend={handleSend} placeholder="Send a message to everyone..." />
      </div>
    </div>
  );
}