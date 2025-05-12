'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const token = searchParams.get('token');
  
  const { verifyEmail, resendVerification, loading } = useAuth();
  const [verificationStatus, setVerificationStatus] = useState<'waiting' | 'verifying' | 'success' | 'failed'>('waiting');
  const [error, setError] = useState<string | null>(null);
  const [resendStatus, setResendStatus] = useState<'idle' | 'loading' | 'success' | 'failed'>('idle');

  useEffect(() => {
    // If there's a token in the URL, verify it
    if (token) {
      verifyToken();
    }
  }, [token]);

  const verifyToken = async () => {
    setVerificationStatus('verifying');
    try {
      await verifyEmail(token);
      setVerificationStatus('success');
    } catch (err: any) {
      setVerificationStatus('failed');
      setError(err.message || 'Verification failed. Please try again.');
    }
  };

  const handleResendVerification = async () => {
    if (!email) return;
    
    setResendStatus('loading');
    try {
      await resendVerification(email);
      setResendStatus('success');
    } catch (err: any) {
      setResendStatus('failed');
      setError(err.message || 'Failed to resend verification email. Please try again.');
    }
  };

  // If verifying a token
  if (token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Email Verification</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-4">
            {verificationStatus === 'verifying' && (
              <>
                <Loader2 className="h-16 w-16 text-blue-500 animate-spin" />
                <p className="text-center">Verifying your email...</p>
              </>
            )}
            
            {verificationStatus === 'success' && (
              <>
                <CheckCircle className="h-16 w-16 text-green-500" />
                <p className="text-center">Your email has been verified!</p>
                <p className="text-center text-gray-500">You can now log in to your account.</p>
              </>
            )}
            
            {verificationStatus === 'failed' && (
              <>
                <AlertCircle className="h-16 w-16 text-red-500" />
                <p className="text-center">Verification failed</p>
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              </>
            )}
          </CardContent>
          <CardFooter className="flex justify-center">
            {verificationStatus === 'success' && (
              <Button asChild>
                <a href="/login">Go to Login</a>
              </Button>
            )}
            {verificationStatus === 'failed' && (
              <Button variant="outline" asChild>
                <a href="/auth/verify-email">Try Again</a>
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Waiting for verification (after registration)
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Verify Your Email</CardTitle>
          <CardDescription>
            We sent a verification link to {email || 'your email'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-6 pt-6">
          <Mail className="h-16 w-16 text-blue-500" />
          <div className="text-center">
            <p className="mb-2">Please check your inbox and click the verification link to complete your registration.</p>
            <p className="text-sm text-gray-500">If you don't see the email, check your spam folder or request a new verification email.</p>
          </div>
          
          {resendStatus === 'success' && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>Verification email sent successfully!</AlertDescription>
            </Alert>
          )}
          
          {resendStatus === 'failed' && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <Button 
            onClick={handleResendVerification} 
            variant="outline" 
            className="w-full"
            disabled={!email || resendStatus === 'loading'}
          >
            {resendStatus === 'loading' ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              "Resend Verification Email"
            )}
          </Button>
          <div className="text-center text-sm">
            <a href="/login" className="text-blue-500 hover:text-blue-700">
              Back to Login
            </a>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
} 