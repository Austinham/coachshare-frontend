'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { authService } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function VerifyPage() {
  const params = useParams();
  const token = params.token as string;
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email...');

  // Function to manually verify token
  const verifyToken = async () => {
    setStatus('loading');
    setMessage('Verifying your email...');
    
    try {
      console.log('Verifying token:', token);
      const response = await authService.verifyEmail(token);
      console.log('Verification response:', response);
      setStatus('success');
      setMessage('Your email has been verified! You can now login.');
    } catch (error: any) {
      console.error('Verification error:', error);
      setStatus('error');
      setMessage(error.response?.data?.message || 'Error verifying email. Please try again.');
    }
  };

  // Auto-verify on page load
  useEffect(() => {
    if (token) {
      verifyToken();
    }
  }, [token]);

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Email Verification</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <div className={status === 'success' ? 'text-green-600' : status === 'error' ? 'text-red-600' : 'text-blue-600'}>
            {message}
          </div>
          {status === 'loading' && (
            <div className="mt-4 flex justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          {status === 'error' && (
            <Button onClick={verifyToken}>
              Try Again
            </Button>
          )}
          {status === 'success' && (
            <Button asChild>
              <a href="/login">Go to Login</a>
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
} 