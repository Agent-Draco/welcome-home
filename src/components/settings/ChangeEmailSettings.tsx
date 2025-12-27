import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Mail, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export function ChangeEmailSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleChangeEmail = async () => {
    if (!newEmail.trim()) {
      toast({
        title: 'Email required',
        description: 'Please enter a new email address.',
        variant: 'destructive',
      });
      return;
    }

    if (newEmail === user?.email) {
      toast({
        title: 'Same email',
        description: 'The new email is the same as your current email.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        email: newEmail,
      }, {
        emailRedirectTo: `${window.location.origin}/settings`,
      });

      if (error) throw error;

      setEmailSent(true);
      toast({
        title: 'Verification email sent!',
        description: 'Please check both your old and new email inboxes to confirm the change.',
      });
    } catch (error: any) {
      toast({
        title: 'Failed to change email',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setNewEmail('');
    setEmailSent(false);
  };

  return (
    <div className="flex items-center justify-between rounded-lg border p-4">
      <div>
        <p className="font-medium">Email</p>
        <p className="text-sm text-muted-foreground">{user?.email}</p>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline">
            <Mail className="mr-2 h-4 w-4" />
            Change Email
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change Email Address</DialogTitle>
            <DialogDescription>
              {emailSent
                ? 'Verification emails have been sent to both addresses.'
                : 'Enter your new email address. You will need to verify both your old and new email.'}
            </DialogDescription>
          </DialogHeader>

          {emailSent ? (
            <div className="flex flex-col items-center gap-4 py-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
                <Check className="h-8 w-8 text-green-500" />
              </div>
              <div className="text-center">
                <p className="font-medium">Check your inbox</p>
                <p className="text-sm text-muted-foreground">
                  Click the link in both emails to complete the change.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Current Email</Label>
                <Input value={user?.email || ''} disabled className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-email">New Email</Label>
                <Input
                  id="new-email"
                  type="email"
                  placeholder="your.new@email.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
              {emailSent ? 'Close' : 'Cancel'}
            </Button>
            {!emailSent && (
              <Button onClick={handleChangeEmail} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send Verification
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
