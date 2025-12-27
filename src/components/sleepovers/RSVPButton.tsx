import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, X, Clock, Loader2 } from "lucide-react";
import { useSleepovers } from "@/hooks/useSleepovers";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface RSVPButtonProps {
  sleepoverId: string;
  currentStatus?: 'confirmed' | 'declined' | 'pending';
  onStatusChange?: (status: 'confirmed' | 'declined' | 'pending') => void;
}

export function RSVPButton({ sleepoverId, currentStatus, onStatusChange }: RSVPButtonProps) {
  const { updateRsvp } = useSleepovers();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(currentStatus || 'pending');

  const handleRSVP = async (newStatus: 'confirmed' | 'declined') => {
    if (!user) return;
    
    setLoading(true);
    const { error } = await updateRsvp(sleepoverId, newStatus);
    setLoading(false);

    if (error) {
      toast({ title: 'Failed to update RSVP', variant: 'destructive' });
    } else {
      setStatus(newStatus);
      onStatusChange?.(newStatus);
      toast({ 
        title: newStatus === 'confirmed' ? "You're in!" : "Maybe next time!",
        description: newStatus === 'confirmed' ? "See you at the sleepover!" : "We'll miss you!"
      });
    }
  };

  if (loading) {
    return <Loader2 className="h-4 w-4 animate-spin" />;
  }

  if (status === 'confirmed') {
    return (
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-1 text-sm font-medium text-[hsl(var(--success))]">
          <Check className="h-4 w-4" />
          Going
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleRSVP('declined')}
          className="text-muted-foreground hover:text-destructive"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  if (status === 'declined') {
    return (
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-1 text-sm font-medium text-muted-foreground">
          <X className="h-4 w-4" />
          Not going
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleRSVP('confirmed')}
          className="text-muted-foreground hover:text-[hsl(var(--success))]"
        >
          <Check className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleRSVP('confirmed')}
        className="border-[hsl(var(--success))]/50 text-[hsl(var(--success))] hover:bg-[hsl(var(--success))]/10"
      >
        <Check className="mr-1 h-4 w-4" />
        Going
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleRSVP('declined')}
        className="border-destructive/50 text-destructive hover:bg-destructive/10"
      >
        <X className="mr-1 h-4 w-4" />
        Can't make it
      </Button>
    </div>
  );
}
