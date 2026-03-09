import { useState } from "react";
import { Users2, Plus, Hash, Send, Settings, UserPlus, Trash2, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGroups, useGroupChannels, useChannelMessages } from "@/hooks/useGroups";
import { useProfiles } from "@/hooks/useProfiles";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { ChatInput } from "@/components/chat/ChatInput";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export default function GroupsPage() {
  const { user } = useAuth();
  const { isAdmin } = useAdmin();
  const { groups, loading, createGroup, addMember } = useGroups();
  const { profiles } = useProfiles();
  const { toast } = useToast();

  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isCreateChannelOpen, setIsCreateChannelOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [newChannelName, setNewChannelName] = useState('');
  const [selectedMember, setSelectedMember] = useState('');

  const { channels, members, createChannel } = useGroupChannels(selectedGroupId);
  const { messages, sendMessage, deleteMessage } = useChannelMessages(selectedChannelId);

  const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;
    const { error } = await createGroup(newGroupName, newGroupDesc);
    if (error) {
      toast({ title: 'Failed to create group', variant: 'destructive' });
    } else {
      toast({ title: 'Group created!' });
      setIsCreateGroupOpen(false);
      setNewGroupName('');
      setNewGroupDesc('');
    }
  };

  const handleCreateChannel = async () => {
    if (!newChannelName.trim()) return;
    const { error } = await createChannel(newChannelName);
    if (error) {
      toast({ title: 'Failed to create channel', variant: 'destructive' });
    } else {
      toast({ title: 'Channel created!' });
      setIsCreateChannelOpen(false);
      setNewChannelName('');
    }
  };

  const handleAddMember = async () => {
    if (!selectedMember || !selectedGroupId) return;
    const { error } = await addMember(selectedGroupId, selectedMember);
    if (error) {
      toast({ title: 'Failed to add member', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Member added!' });
      setIsAddMemberOpen(false);
      setSelectedMember('');
    }
  };

  const handleSend = async (content: string, attachments?: { url: string; type: 'image' | 'file'; name: string }[]) => {
    await sendMessage(content, attachments);
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

  const memberIds = members.map(m => m.user_id);
  const nonMembers = profiles.filter(p => !memberIds.includes(p.id) && p.id !== user?.id);

  return (
    <div className="flex h-screen glass-bg relative overflow-hidden">
      {/* Decorative blurred shapes */}
      <div className="absolute top-20 left-20 w-96 h-96 bg-[hsl(var(--tertiary))] opacity-20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 right-20 w-80 h-80 bg-[hsl(var(--primary))] opacity-10 rounded-full blur-3xl pointer-events-none" />

      {/* Groups sidebar */}
      <div className="w-64 border-r border-white/30 flex flex-col relative z-10">
        <div className="p-4 border-b border-white/30">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-bold text-foreground flex items-center gap-2">
              <Users2 className="h-5 w-5" /> Groups
            </h2>
            <Dialog open={isCreateGroupOpen} onOpenChange={setIsCreateGroupOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8"><Plus className="h-4 w-4" /></Button>
              </DialogTrigger>
              <DialogContent className="glass-card border-white/40">
                <DialogHeader><DialogTitle>Create Group</DialogTitle></DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input value={newGroupName} onChange={e => setNewGroupName(e.target.value)} placeholder="Squad name" className="glass border-white/40" />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input value={newGroupDesc} onChange={e => setNewGroupDesc(e.target.value)} placeholder="What's this group for?" className="glass border-white/40" />
                  </div>
                </div>
                <DialogFooter><Button onClick={handleCreateGroup} className="rounded-full">Create</Button></DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {groups.map(group => (
              <button
                key={group.id}
                onClick={() => { setSelectedGroupId(group.id); setSelectedChannelId(null); }}
                className={cn(
                  "w-full flex items-center gap-3 rounded-xl px-3 py-3 text-left transition-all",
                  selectedGroupId === group.id ? "glass-card" : "hover:bg-white/20"
                )}
              >
                <Avatar className="h-9 w-9">
                  {group.avatar_url && <AvatarImage src={group.avatar_url} />}
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                    {getInitials(group.name)}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium text-sm truncate text-foreground">{group.name}</span>
              </button>
            ))}
            {groups.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">No groups yet</p>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Channels sidebar */}
      {selectedGroupId && (
        <div className="w-56 border-r border-white/30 flex flex-col relative z-10">
          <div className="p-4 border-b border-white/30">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm text-foreground">Channels</h3>
              <div className="flex gap-1">
                <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7"><UserPlus className="h-3.5 w-3.5" /></Button>
                  </DialogTrigger>
                  <DialogContent className="glass-card border-white/40">
                    <DialogHeader><DialogTitle>Add Member</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-4">
                      <Select value={selectedMember} onValueChange={setSelectedMember}>
                        <SelectTrigger className="glass border-white/40"><SelectValue placeholder="Select user" /></SelectTrigger>
                        <SelectContent>
                          {nonMembers.map(p => (
                            <SelectItem key={p.id} value={p.id}>{p.display_name || p.username}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <DialogFooter><Button onClick={handleAddMember} className="rounded-full">Add</Button></DialogFooter>
                  </DialogContent>
                </Dialog>
                <Dialog open={isCreateChannelOpen} onOpenChange={setIsCreateChannelOpen}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7"><Plus className="h-3.5 w-3.5" /></Button>
                  </DialogTrigger>
                  <DialogContent className="glass-card border-white/40">
                    <DialogHeader><DialogTitle>Create Channel</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-4">
                      <Label>Channel Name</Label>
                      <Input value={newChannelName} onChange={e => setNewChannelName(e.target.value)} placeholder="random" className="glass border-white/40" />
                    </div>
                    <DialogFooter><Button onClick={handleCreateChannel} className="rounded-full">Create</Button></DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {channels.map(ch => (
                <button
                  key={ch.id}
                  onClick={() => setSelectedChannelId(ch.id)}
                  className={cn(
                    "w-full flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-all",
                    selectedChannelId === ch.id ? "glass-card font-semibold" : "hover:bg-white/20 text-muted-foreground"
                  )}
                >
                  <Hash className="h-4 w-4 shrink-0" />
                  <span className="truncate">{ch.name}</span>
                </button>
              ))}
            </div>
            <div className="p-3 border-t border-white/20">
              <p className="text-xs font-medium text-muted-foreground mb-2">Members ({members.length})</p>
              {members.map(m => (
                <div key={m.id} className="flex items-center gap-2 py-1">
                  <Avatar className="h-6 w-6">
                    {m.profiles?.avatar_url && <AvatarImage src={m.profiles.avatar_url} />}
                    <AvatarFallback className="text-[10px] bg-primary text-primary-foreground">
                      {getInitials(m.profiles?.display_name || m.profiles?.username)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-foreground truncate">{m.profiles?.display_name || m.profiles?.username}</span>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Chat area */}
      <div className="flex-1 flex flex-col relative z-10">
        {selectedChannelId ? (
          <>
            <div className="p-4 border-b border-white/30">
              <div className="glass-card rounded-2xl px-5 py-3">
                <div className="flex items-center gap-3">
                  <Hash className="h-5 w-5 text-primary" />
                  <h2 className="font-bold text-foreground">
                    {channels.find(c => c.id === selectedChannelId)?.name}
                  </h2>
                </div>
              </div>
            </div>
            <ScrollArea className="flex-1 px-6 py-4">
              <div className="max-w-3xl mx-auto space-y-4">
                {messages.length === 0 ? (
                  <div className="glass-card rounded-3xl p-12 text-center">
                    <Hash className="h-12 w-12 text-muted-foreground/30 mx-auto" />
                    <p className="mt-4 text-muted-foreground">No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  messages.map(msg => (
                    <ChatMessage
                      key={msg.id}
                      message={{
                        id: msg.id,
                        content: msg.content,
                        sender: {
                          id: msg.sender_id,
                          name: msg.profiles?.display_name || msg.profiles?.username || 'Unknown',
                          initials: getInitials(msg.profiles?.display_name || msg.profiles?.username),
                          color: 'bg-primary text-primary-foreground',
                          avatar_url: msg.profiles?.avatar_url || undefined,
                        },
                        timestamp: new Date(msg.created_at),
                        isOwn: msg.sender_id === user?.id,
                        isPinned: !!msg.pinned_at,
                      }}
                      canDelete={msg.sender_id === user?.id || isAdmin}
                      onDelete={() => deleteMessage(msg.id)}
                    />
                  ))
                )}
              </div>
            </ScrollArea>
            <div className="max-w-3xl mx-auto w-full px-6 pb-4">
              <ChatInput onSend={handleSend} placeholder={`Message #${channels.find(c => c.id === selectedChannelId)?.name || 'channel'}...`} />
            </div>
          </>
        ) : selectedGroupId ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="glass-card rounded-3xl p-12 text-center">
              <Hash className="h-16 w-16 text-muted-foreground/30 mx-auto" />
              <h3 className="mt-4 text-lg font-bold text-foreground">Select a channel</h3>
              <p className="mt-1 text-muted-foreground">Pick a channel to start chatting</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="glass-card rounded-3xl p-12 text-center">
              <Users2 className="h-16 w-16 text-muted-foreground/30 mx-auto" />
              <h3 className="mt-4 text-lg font-bold text-foreground">Welcome to Groups</h3>
              <p className="mt-1 text-muted-foreground">Select or create a group to get started</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
