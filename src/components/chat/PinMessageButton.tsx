import { Pin, PinOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface PinMessageButtonProps {
  messageId: string;
  isPinned: boolean;
  onPinChange?: () => void;
}

export function PinMessageButton({ messageId, isPinned, onPinChange }: PinMessageButtonProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const handleTogglePin = async () => {
    if (!user) return;

    const { error } = await supabase
      .from('messages')
      .update({
        pinned_at: isPinned ? null : new Date().toISOString(),
        pinned_by: isPinned ? null : user.id,
      })
      .eq('id', messageId);

    if (error) {
      toast({ title: 'Failed to update pin', variant: 'destructive' });
    } else {
      toast({ title: isPinned ? 'Message unpinned' : 'Message pinned!' });
      onPinChange?.();
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
      onClick={handleTogglePin}
      title={isPinned ? 'Unpin message' : 'Pin message'}
    >
      {isPinned ? (
        <PinOff className="h-4 w-4 text-primary" />
      ) : (
        <Pin className="h-4 w-4" />
      )}
    </Button>
  );
}
