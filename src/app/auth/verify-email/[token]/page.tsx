'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function VerifyTokenPage() {
  const params = useParams();
  const token = params.token as string;
  
  const { verifyEmail } = useAuth();
  const [verificationStatus, setVerificationStatus] = useState<'verifying' | 'success' | 'failed'>('verifying');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Verify the token automatically when the page loads
    if (token) {
      verifyToken();
    }
  }, [token]);

  const verifyToken = async () => {
    try {
      await verifyEmail(token);
      setVerificationStatus('success');
    } catch (err: any) {
      setVerificationStatus('failed');
      setError(err.message || 'Verification failed. Please try again.');
    }
  };

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
            <Button variant="outline" onClick={verifyToken}>
              Try Again
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
} 