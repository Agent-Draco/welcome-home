import { MemberCard } from "@/components/members/MemberCard";
import { Users, Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useProfiles } from "@/hooks/useProfiles";

export default function MembersPage() {
  const [search, setSearch] = useState("");
  const { profiles, onlineProfiles, loading } = useProfiles();

  const filteredMembers = profiles.filter((profile) =>
    (profile.display_name || profile.username || '').toLowerCase().includes(search.toLowerCase())
  );

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
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[hsl(var(--secondary))] to-[hsl(var(--secondary))]/80 text-[hsl(var(--secondary-foreground))] shadow-lg">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Members</h1>
                <p className="text-sm text-muted-foreground">{profiles.length} Driftaculars • {onlineProfiles.length} online</p>
              </div>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search members..."
                className="pl-9 rounded-full glass border-white/40"
              />
            </div>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 px-6 pb-6 relative z-10">
        <div className="mx-auto max-w-4xl">
          {filteredMembers.length === 0 ? (
            <div className="glass-card rounded-3xl p-16 text-center">
              <div className="flex flex-col items-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-[hsl(var(--tertiary))]/20 mb-6">
                  <Users className="h-10 w-10 text-[hsl(var(--tertiary))]" />
                </div>
                <h3 className="text-xl font-bold text-foreground">
                  {profiles.length === 0 ? 'No members yet' : 'No members found'}
                </h3>
                <p className="mt-2 text-muted-foreground max-w-sm">
                  {profiles.length === 0 ? 'Be the first to join!' : 'Try a different search term.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredMembers.map((profile) => (
                <MemberCard 
                  key={profile.id} 
                  member={{
                    id: profile.id,
                    name: profile.display_name || profile.username || 'Unknown',
                    initials: (profile.display_name || profile.username || '?').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
                    color: 'bg-primary text-primary-foreground',
                    status: profile.status,
                    bio: profile.bio || '',
                    joinedDate: new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
                    avatar_url: profile.avatar_url || undefined,
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}