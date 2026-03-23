import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, ArrowLeft, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { usePrivateMessages } from "@/hooks/usePrivateMessages";
import { useProfiles } from "@/hooks/useProfiles";
import { useAuth } from "@/hooks/useAuth";
import { ChatInput } from "@/components/chat/ChatInput";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { useAdmin } from "@/hooks/useAdmin";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function MessagesPage() {
  const { recipientId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin } = useAdmin();
  const { messages, conversations, loading, sendMessage } = usePrivateMessages(recipientId);
  const { profiles } = useProfiles();

  const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleSend = async (content: string, attachments?: { url: string; type: 'image' | 'file'; name: string }[]) => {
    if (!recipientId) return;
    let messageContent = content.trim();
    if (attachments?.length) {
      const attachmentText = attachments.map(a =>
        a.type === 'image' ? `[image:${a.url}]` : `[file:${a.name}:${a.url}]`
      ).join(' ');
      messageContent = messageContent ? `${messageContent} ${attachmentText}` : attachmentText;
    }
    if (messageContent) {
      await sendMessage(recipientId, messageContent);
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
          <div className="mx-auto max-w-3xl space-y-4">
            {messages.map((msg) => (
              <ChatMessage
                key={msg.id}
                message={{
                  id: msg.id,
                  content: msg.content,
                  sender: {
                    id: msg.sender_id,
                    name: msg.sender?.display_name || msg.sender?.username || 'Unknown',
                    initials: getInitials(msg.sender?.display_name || msg.sender?.username),
                    color: 'bg-primary text-primary-foreground',
                    avatar_url: msg.sender?.avatar_url || undefined,
                  },
                  timestamp: new Date(msg.created_at),
                  isOwn: msg.sender_id === user?.id,
                  isPinned: false,
                }}
                canDelete={msg.sender_id === user?.id || isAdmin}
                onDelete={async () => {}}
              />
            ))}
          </div>
        </ScrollArea>

        <div className="relative z-10 px-6 pb-6">
          <div className="mx-auto max-w-3xl">
            <ChatInput onSend={handleSend} placeholder="Type a message..." />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col glass-bg relative overflow-hidden">
      <div className="absolute top-20 left-20 w-96 h-96 bg-[hsl(var(--tertiary))] opacity-20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 right-20 w-80 h-80 bg-[hsl(var(--primary))] opacity-10 rounded-full blur-3xl pointer-events-none" />

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
          {conversations.length > 0 && (
            <>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Recent</h3>
              {conversations.map(conv => (
                <Card key={conv.partnerId} className="glass-card border-white/40 cursor-pointer hover:bg-white/50 dark:hover:bg-white/10 transition-all duration-300" onClick={() => navigate(`/messages/${conv.partnerId}`)}>
                  <CardContent className="p-4 flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={conv.partnerAvatar || undefined} />
                      <AvatarFallback className="bg-primary text-primary-foreground">{getInitials(conv.partnerName)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground">{conv.partnerName}</p>
                      <p className="text-sm text-muted-foreground truncate">{conv.lastMessage}</p>
                    </div>
                    {conv.unreadCount > 0 && (
                      <Badge className="bg-primary text-primary-foreground">{conv.unreadCount}</Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </>
          )}

          <h3 className="text-sm font-medium text-muted-foreground mb-4 pt-4">Start a conversation</h3>
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
