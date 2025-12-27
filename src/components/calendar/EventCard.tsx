import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, Moon } from "lucide-react";
import { format, differenceInDays, isFuture } from "date-fns";
import { RSVPButton } from "@/components/sleepovers/RSVPButton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSleepovers, RSVP } from "@/hooks/useSleepovers";
import { useAuth } from "@/hooks/useAuth";

interface EventCardProps {
  event: {
    id: string;
    title: string;
    date: Date;
    endDate?: Date;
    type: "sleepover" | "hangout" | "other";
    attendees: string[];
    location?: string;
  };
  onClick?: () => void;
}

const typeConfig = {
  sleepover: { icon: Moon, color: "bg-primary text-primary-foreground", label: "Sleepover" },
  hangout: { icon: Users, color: "bg-secondary text-secondary-foreground", label: "Hangout" },
  other: { icon: Calendar, color: "bg-accent text-accent-foreground", label: "Event" },
};

export function EventCard({ event, onClick }: EventCardProps) {
  const { getRsvps } = useSleepovers();
  const { user } = useAuth();
  const config = typeConfig[event.type];
  const Icon = config.icon;
  const daysUntil = differenceInDays(event.date, new Date());
  const isUpcoming = isFuture(event.date);
  
  const [rsvps, setRsvps] = useState<RSVP[]>([]);
  const [myRsvpStatus, setMyRsvpStatus] = useState<'confirmed' | 'declined' | 'pending'>('pending');

  useEffect(() => {
    if (event.type === 'sleepover') {
      getRsvps(event.id).then((data) => {
        setRsvps(data);
        const myRsvp = data.find(r => r.user_id === user?.id);
        if (myRsvp) {
          setMyRsvpStatus(myRsvp.status);
        }
      });
    }
  }, [event.id, event.type, user?.id]);

  const confirmedRsvps = rsvps.filter(r => r.status === 'confirmed');

  const getInitials = (name: string | null | undefined) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <Card
      className="group overflow-hidden border-border bg-card shadow-sm transition-all duration-200 hover:shadow-md"
    >
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${config.color} shadow-sm`}>
            <Icon className="h-6 w-6" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-card-foreground truncate">{event.title}</h3>
              <Badge variant="outline" className="text-xs">
                {config.label}
              </Badge>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {format(event.date, "MMM d, yyyy")}
              </span>
              {confirmedRsvps.length > 0 && (
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {confirmedRsvps.length} going
                </span>
              )}
            </div>

            {event.location && (
              <p className="mt-1 text-sm text-muted-foreground">📍 {event.location}</p>
            )}

            {/* Confirmed attendees */}
            {confirmedRsvps.length > 0 && (
              <div className="mt-3 flex items-center gap-1">
                <div className="flex -space-x-2">
                  {confirmedRsvps.slice(0, 5).map((rsvp) => (
                    <Avatar key={rsvp.id} className="h-6 w-6 border-2 border-card">
                      {rsvp.profiles?.avatar_url && (
                        <AvatarImage src={rsvp.profiles.avatar_url} />
                      )}
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        {getInitials(rsvp.profiles?.display_name)}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                </div>
                {confirmedRsvps.length > 5 && (
                  <span className="text-xs text-muted-foreground ml-1">
                    +{confirmedRsvps.length - 5} more
                  </span>
                )}
              </div>
            )}

            {/* RSVP Button for upcoming sleepovers */}
            {isUpcoming && event.type === 'sleepover' && (
              <div className="mt-3">
                <RSVPButton 
                  sleepoverId={event.id} 
                  currentStatus={myRsvpStatus}
                  onStatusChange={(status) => {
                    setMyRsvpStatus(status);
                    // Refresh RSVPs
                    getRsvps(event.id).then(setRsvps);
                  }}
                />
              </div>
            )}
          </div>

          {isUpcoming && event.type === "sleepover" && (
            <div className="flex flex-col items-center rounded-xl bg-primary/10 px-4 py-2">
              <span className="text-2xl font-bold text-primary">{daysUntil}</span>
              <span className="text-xs text-muted-foreground">days</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
