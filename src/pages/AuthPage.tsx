import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, Mail, Phone } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { SocialAuthButtons } from '@/components/auth/SocialAuthButtons';
import { PhoneAuthForm } from '@/components/auth/PhoneAuthForm';
import logo from '@/assets/logo.png';

type AuthView = 'main' | 'forgot-password' | 'check-email' | 'phone-auth';

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [view, setView] = useState<AuthView>('main');
  const [emailSentTo, setEmailSentTo] = useState('');
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
  }, []);

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const { error } = await signIn(email, password);
    
    if (error) {
      let message = error.message;
      if (message.includes('Email not confirmed')) {
        message = 'Please verify your email before signing in. Check your inbox.';
      }
      toast({
        title: 'Sign in failed',
        description: message,
        variant: 'destructive',
      });
    } else {
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }
      
      toast({
        title: 'Welcome back!',
        description: 'Successfully signed in.',
      });
      navigate('/');
    }
    
    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim()) {
      toast({
        title: 'Username required',
        description: 'Please enter a username.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsLoading(true);
    
    const { error } = await signUp(email, password, username);
    
    if (error) {
      let message = error.message;
      if (message.includes('already registered')) {
        message = 'This email is already registered. Please sign in instead.';
      }
      toast({
        title: 'Sign up failed',
        description: message,
        variant: 'destructive',
      });
      setIsLoading(false);
    } else {
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }
      
      setEmailSentTo(email);
      setView('check-email');
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast({
        title: 'Email required',
        description: 'Please enter your email address.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsLoading(true);
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth?reset=true`,
    });
    
    if (error) {
      toast({
        title: 'Failed to send reset email',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      setEmailSentTo(email);
      setView('check-email');
    }
    
    setIsLoading(false);
  };

  const handleResendVerification = async () => {
    if (!emailSentTo) return;
    
    setIsLoading(true);
    
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: emailSentTo,
    });
    
    if (error) {
      toast({
        title: 'Failed to resend',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Email sent!',
        description: 'Check your inbox for the verification link.',
      });
    }
    
    setIsLoading(false);
  };

  if (view === 'check-email') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/10 via-secondary/5 to-background p-4">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute -right-20 top-20 h-48 w-48 rounded-full bg-secondary/20 blur-3xl" />
        </div>
        
        <Card className="relative w-full max-w-md border-border/50 shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Mail className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">Check your email</CardTitle>
            <CardDescription>
              We've sent a verification link to <strong>{emailSentTo}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-sm text-muted-foreground">
              Click the link in your email to verify your account and continue.
            </p>
            <div className="flex flex-col gap-2">
              <Button variant="outline" onClick={handleResendVerification} disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Resend email
              </Button>
              <Button variant="ghost" onClick={() => { setView('main'); setEmailSentTo(''); }}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to sign in
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (view === 'forgot-password') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/10 via-secondary/5 to-background p-4">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute -right-20 top-20 h-48 w-48 rounded-full bg-secondary/20 blur-3xl" />
        </div>
        
        <Card className="relative w-full max-w-md border-border/50 shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center">
              <img src={logo} alt="Driftaculars" className="h-20 w-20 rounded-full object-cover shadow-lg" />
            </div>
            <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
            <CardDescription>Enter your email to receive a reset link</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email">Email</Label>
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Send Reset Link
              </Button>
              <Button type="button" variant="ghost" className="w-full" onClick={() => setView('main')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to sign in
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (view === 'phone-auth') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/10 via-secondary/5 to-background p-4">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute -right-20 top-20 h-48 w-48 rounded-full bg-secondary/20 blur-3xl" />
        </div>
        
        <Card className="relative w-full max-w-md border-border/50 shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center">
              <img src={logo} alt="Driftaculars" className="h-20 w-20 rounded-full object-cover shadow-lg" />
            </div>
            <CardTitle className="text-2xl font-bold">Phone Sign In</CardTitle>
            <CardDescription>Sign in or sign up with your phone number</CardDescription>
          </CardHeader>
          <CardContent>
            <PhoneAuthForm onBack={() => setView('main')} />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/10 via-secondary/5 to-background p-4">
      <div className="absolute inset-0 opacity-30">
        <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -right-20 top-20 h-48 w-48 rounded-full bg-secondary/20 blur-3xl" />
        <div className="absolute bottom-20 left-1/2 h-56 w-56 rounded-full bg-[hsl(var(--tertiary))]/20 blur-3xl" />
      </div>
      
      <Card className="relative w-full max-w-md border-border/50 shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center">
            <img src={logo} alt="Driftaculars" className="h-20 w-20 rounded-full object-cover shadow-lg" />
          </div>
          <CardTitle className="text-2xl font-bold">The Driftaculars</CardTitle>
          <CardDescription>Your crew's home base for epic sleepovers</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="remember-signin" 
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked === true)}
                    />
                    <Label htmlFor="remember-signin" className="text-sm text-muted-foreground cursor-pointer">
                      Remember me
                    </Label>
                  </div>
                  <Button 
                    type="button" 
                    variant="link" 
                    className="h-auto p-0 text-sm"
                    onClick={() => setView('forgot-password')}
                  >
                    Forgot password?
                  </Button>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Sign In
                </Button>
                
                <SocialAuthButtons />
                
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => setView('phone-auth')}
                >
                  <Phone className="mr-2 h-4 w-4" />
                  Sign in with Phone
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-username">Username</Label>
                  <Input
                    id="signup-username"
                    type="text"
                    placeholder="Your display name"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="remember-signup" 
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked === true)}
                  />
                  <Label htmlFor="remember-signup" className="text-sm text-muted-foreground cursor-pointer">
                    Remember me
                  </Label>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Create Account
                </Button>
                
                <SocialAuthButtons />
                
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => setView('phone-auth')}
                >
                  <Phone className="mr-2 h-4 w-4" />
                  Sign up with Phone
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
