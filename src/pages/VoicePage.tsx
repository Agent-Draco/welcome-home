import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Mic, Plus, Users, Volume2, MicOff, Loader2, PhoneOff } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useVoiceRooms } from "@/hooks/useVoiceRooms";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function VoicePage() {
  const { rooms, participants, currentRoom, isMuted, loading, createRoom, joinRoom, leaveRoom, toggleMute } = useVoiceRooms();
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [roomName, setRoomName] = useState('');

  const handleCreateRoom = async () => {
    if (!roomName.trim()) {
      toast({ title: 'Please enter a room name', variant: 'destructive' });
      return;
    }
    const { error } = await createRoom(roomName);
    if (error) {
      toast({ title: 'Failed to create room', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Room created!' });
      setIsCreateOpen(false);
      setRoomName('');
    }
  };

  const handleJoinRoom = async (roomId: string) => {
    if (currentRoom === roomId) return;
    if (currentRoom) await leaveRoom();
    const { error } = await joinRoom(roomId);
    if (error) {
      toast({ title: 'Failed to join room', description: error.message, variant: 'destructive' });
    }
  };

  const handleLeaveRoom = async () => {
    await leaveRoom();
    toast({ title: 'Left voice room' });
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
      <div className="absolute top-20 left-20 w-96 h-96 bg-[hsl(var(--tertiary))] opacity-20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 right-20 w-80 h-80 bg-[hsl(var(--primary))] opacity-10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white opacity-20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 p-6">
        <div className="glass-card rounded-3xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--primary))]/80 text-[hsl(var(--primary-foreground))] shadow-lg">
                <Mic className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Voice Rooms</h1>
                <p className="text-sm text-muted-foreground">Drop in and chat with friends</p>
              </div>
            </div>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-full shadow-glow-primary">
                  <Plus className="mr-2 h-4 w-4" /> Create Room
                </Button>
              </DialogTrigger>
              <DialogContent className="glass-card border-white/40">
                <DialogHeader><DialogTitle>Create Voice Room</DialogTitle></DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Room Name</Label>
                    <Input value={roomName} onChange={(e) => setRoomName(e.target.value)} placeholder="Chill Vibes" className="glass border-white/40" />
                  </div>
                </div>
                <DialogFooter><Button onClick={handleCreateRoom} className="rounded-full">Create</Button></DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 px-6 pb-6 relative z-10">
        <div className="mx-auto max-w-4xl space-y-4">
          {currentRoom && (
            <div className="glass-card rounded-2xl border-primary/30 p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground animate-pulse-soft">
                    <Volume2 className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Currently in</p>
                    <h3 className="font-semibold text-foreground">{rooms.find(r => r.id === currentRoom)?.name || 'Voice Room'}</h3>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant={isMuted ? "destructive" : "secondary"} size="icon" onClick={toggleMute} className="rounded-full">
                    {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                  </Button>
                  <Button variant="destructive" size="icon" onClick={handleLeaveRoom} className="rounded-full">
                    <PhoneOff className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {rooms.length === 0 ? (
            <div className="glass-card rounded-3xl p-16 text-center">
              <div className="flex flex-col items-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-[hsl(var(--tertiary))]/20 mb-6">
                  <Mic className="h-10 w-10 text-[hsl(var(--tertiary))]" />
                </div>
                <h3 className="text-xl font-bold text-foreground">No voice rooms yet</h3>
                <p className="mt-2 text-muted-foreground">Create a room to start chatting!</p>
              </div>
            </div>
          ) : (
            rooms.map((room) => {
              const roomParticipants = participants[room.id] || [];
              const isInRoom = currentRoom === room.id;
              const isLive = roomParticipants.length > 0;

              return (
                <div key={room.id} className={cn(
                  "glass-card rounded-2xl cursor-pointer overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group",
                  isInRoom && "border-primary/30"
                )}>
                  <div className="p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "flex h-12 w-12 items-center justify-center rounded-xl shadow-sm",
                          isLive ? "bg-primary text-primary-foreground animate-pulse-soft" : "bg-white/30 dark:bg-white/10 text-muted-foreground"
                        )}>
                          {isLive ? <Volume2 className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-foreground">{room.name}</h3>
                            {isLive && <Badge className="bg-[hsl(var(--success))] text-[hsl(var(--success-foreground))]">Live</Badge>}
                          </div>
                          <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                            <Users className="h-4 w-4" /> {roomParticipants.length} in room
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {roomParticipants.length > 0 && (
                          <div className="flex -space-x-2">
                            {roomParticipants.slice(0, 3).map((p) => (
                              <Avatar key={p.id} className="h-8 w-8 border-2 border-background">
                                {p.profiles?.avatar_url && <AvatarImage src={p.profiles.avatar_url} />}
                                <AvatarFallback className="text-xs font-semibold bg-primary text-primary-foreground">
                                  {getInitials(p.profiles?.display_name || p.profiles?.username)}
                                </AvatarFallback>
                              </Avatar>
                            ))}
                          </div>
                        )}
                        <Button
                          variant={isInRoom ? "secondary" : isLive ? "default" : "secondary"}
                          size="sm"
                          className="rounded-full"
                          onClick={() => handleJoinRoom(room.id)}
                          disabled={isInRoom}
                        >
                          {isInRoom ? "In Room" : isLive ? "Join" : "Start"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
