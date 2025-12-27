import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Loader2, Shield, ShieldCheck, ShieldOff, Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export function TwoFactorSettings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isEnabled, setIsEnabled] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [disabling, setDisabling] = useState(false);
  
  // Enrollment state
  const [showEnrollDialog, setShowEnrollDialog] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [factorId, setFactorId] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [copied, setCopied] = useState(false);
  
  // Disable dialog state
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [disableCode, setDisableCode] = useState('');

  useEffect(() => {
    checkMFAStatus();
  }, []);

  const checkMFAStatus = async () => {
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;
      
      const totp = data.totp.find(f => f.status === 'verified');
      setIsEnabled(!!totp);
      if (totp) {
        setFactorId(totp.id);
      }
    } catch (error: any) {
      console.error('Error checking MFA status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    setEnrolling(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'Authenticator App',
      });
      
      if (error) throw error;
      
      setQrCode(data.totp.qr_code);
      setSecret(data.totp.secret);
      setFactorId(data.id);
      setShowEnrollDialog(true);
    } catch (error: any) {
      toast({
        title: 'Failed to start 2FA setup',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setEnrolling(false);
    }
  };

  const handleVerifyAndEnable = async () => {
    if (verificationCode.length !== 6) {
      toast({
        title: 'Invalid code',
        description: 'Please enter a 6-digit code.',
        variant: 'destructive',
      });
      return;
    }

    setVerifying(true);
    try {
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId,
      });
      
      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code: verificationCode,
      });

      if (verifyError) throw verifyError;

      setIsEnabled(true);
      setShowEnrollDialog(false);
      setVerificationCode('');
      toast({
        title: '2FA Enabled!',
        description: 'Two-factor authentication is now active on your account.',
      });
    } catch (error: any) {
      toast({
        title: 'Verification failed',
        description: error.message || 'Invalid code. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleDisable = async () => {
    if (disableCode.length !== 6) {
      toast({
        title: 'Invalid code',
        description: 'Please enter a 6-digit code to confirm.',
        variant: 'destructive',
      });
      return;
    }

    setDisabling(true);
    try {
      // First verify the code
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId,
      });
      
      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code: disableCode,
      });

      if (verifyError) throw verifyError;

      // Then unenroll
      const { error: unenrollError } = await supabase.auth.mfa.unenroll({
        factorId,
      });

      if (unenrollError) throw unenrollError;

      setIsEnabled(false);
      setShowDisableDialog(false);
      setDisableCode('');
      setFactorId('');
      toast({
        title: '2FA Disabled',
        description: 'Two-factor authentication has been removed from your account.',
      });
    } catch (error: any) {
      toast({
        title: 'Failed to disable 2FA',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setDisabling(false);
    }
  };

  const handleCopySecret = async () => {
    await navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggle = (checked: boolean) => {
    if (checked) {
      handleEnroll();
    } else {
      setShowDisableDialog(true);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <CardTitle>Two-Factor Authentication</CardTitle>
            </div>
            {isEnabled ? (
              <Badge variant="default" className="bg-green-500/10 text-green-500 border-green-500/20">
                <ShieldCheck className="mr-1 h-3 w-3" />
                Enabled
              </Badge>
            ) : (
              <Badge variant="secondary">
                <ShieldOff className="mr-1 h-3 w-3" />
                Disabled
              </Badge>
            )}
          </div>
          <CardDescription>
            Add an extra layer of security to your account using an authenticator app
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-1">
              <p className="font-medium">Authenticator App</p>
              <p className="text-sm text-muted-foreground">
                {isEnabled
                  ? 'Your account is protected with 2FA'
                  : 'Use apps like Google Authenticator or Authy'}
              </p>
            </div>
            <Switch
              checked={isEnabled}
              onCheckedChange={handleToggle}
              disabled={enrolling}
            />
          </div>
        </CardContent>
      </Card>

      {/* Enrollment Dialog */}
      <Dialog open={showEnrollDialog} onOpenChange={setShowEnrollDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Set Up Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              Scan the QR code with your authenticator app or enter the secret key manually
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {qrCode && (
              <div className="flex justify-center rounded-lg bg-white p-4">
                <img src={qrCode} alt="2FA QR Code" className="h-48 w-48" />
              </div>
            )}
            
            <div className="space-y-2">
              <Label>Secret Key (Manual Entry)</Label>
              <div className="flex gap-2">
                <Input
                  value={secret}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopySecret}
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="verification-code">Verification Code</Label>
              <Input
                id="verification-code"
                placeholder="Enter 6-digit code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                className="text-center text-lg tracking-widest"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEnrollDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleVerifyAndEnable} disabled={verifying}>
              {verifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enable 2FA
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Disable Dialog */}
      <Dialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Disable Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              Enter your authenticator code to confirm disabling 2FA
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-2">
            <Label htmlFor="disable-code">Verification Code</Label>
            <Input
              id="disable-code"
              placeholder="Enter 6-digit code"
              value={disableCode}
              onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              maxLength={6}
              className="text-center text-lg tracking-widest"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDisableDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDisable} disabled={disabling}>
              {disabling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Disable 2FA
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
