import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Building2, Mail, Lock, AlertCircle, KeyRound } from 'lucide-react';
import { isValidEmail, isValidOTP } from '@/utils/validation';

export default function Login() {
  const navigate = useNavigate();
  const { login, verifyOTP } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [requiresOTP, setRequiresOTP] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate email
    if (!isValidEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (!password) {
      setError('Please enter your password');
      return;
    }

    setIsLoading(true);

    const result = await login(email, password);

    if (result.success) {
      if (result.requiresOTP) {
        setRequiresOTP(true);
      } else {
        navigate('/dashboard');
      }
    } else {
      setError(result.error || 'Login failed');
    }

    setIsLoading(false);
  };

  const handleOTPVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isValidOTP(otp)) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setIsLoading(true);

    const result = await verifyOTP(otp);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error || 'OTP verification failed');
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 vw-gradient items-center justify-center p-12">
        <div className="max-w-md text-center">
          <Building2 className="h-20 w-20 text-white mx-auto mb-8" />
          <h1 className="text-4xl font-bold text-white mb-4">
            Dealer PCC Portal
          </h1>
          <p className="text-lg text-white/80">
            Volkswagen India's comprehensive platform for Product Concern Capture 
            submission and tracking.
          </p>
          <div className="mt-12 grid grid-cols-2 gap-6 text-white/90">
            <div className="text-center">
              <p className="text-3xl font-bold">500+</p>
              <p className="text-sm">Dealers</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold">10K+</p>
              <p className="text-sm">Submissions</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 text-center">
            <Building2 className="h-12 w-12 text-primary mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground">Dealer PCC Portal</h1>
          </div>

          <div className="card-form">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-foreground">
                {requiresOTP ? 'Verify OTP' : 'Sign In'}
              </h2>
              <p className="text-muted-foreground mt-1">
                {requiresOTP 
                  ? 'Enter the 6-digit code sent to your email'
                  : 'Enter your credentials to access the portal'}
              </p>
            </div>

            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {!requiresOTP ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleOTPVerification} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="otp">One-Time Password</Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="otp"
                      type="text"
                      placeholder="Enter 6-digit OTP"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="pl-10 text-center text-lg tracking-widest"
                      disabled={isLoading}
                      maxLength={6}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    For prototype: Enter any 6 digits (e.g., 123456)
                  </p>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Verifying...' : 'Verify OTP'}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    setRequiresOTP(false);
                    setOtp('');
                    setError('');
                  }}
                >
                  Back to Login
                </Button>
              </form>
            )}

            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-center text-sm text-muted-foreground">
                Don't have an account?{' '}
                <Link to="/request-access" className="text-primary hover:underline font-medium">
                  Request Access
                </Link>
              </p>
            </div>
          </div>

          {/* Demo Credentials */}
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <p className="text-sm font-medium text-foreground mb-2">Demo Credentials:</p>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p><strong>Super Admin:</strong> superadmin@vw.in / admin123</p>
              <p><strong>Admin:</strong> admin@vw.in / admin123</p>
              <p><strong>Dealer:</strong> mt@premiummotors.in / dealer123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
