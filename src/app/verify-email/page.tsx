'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { authService } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function VerifyPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(token ? 'loading' : 'waiting');
  const [message, setMessage] = useState(token ? 'Verifying your email...' : 'Please enter a verification token');
  const [manualToken, setManualToken] = useState('');

  // Function to verify token
  const verifyToken = async (tokenToVerify: string) => {
    if (!tokenToVerify) return;
    
    setStatus('loading');
    setMessage('Verifying your email...');
    
    try {
      console.log('Verifying token:', tokenToVerify);
      const response = await authService.verifyEmail(tokenToVerify);
      console.log('Verification response:', response);
      setStatus('success');
      setMessage('Your email has been verified! You can now login.');
    } catch (error: any) {
      console.error('Verification error:', error);
      setStatus('error');
      setMessage(error.response?.data?.message || 'Error verifying email. Please try again.');
    }
  };

  // Handle manual token entry
  const handleManualVerify = () => {
    if (manualToken) {
      verifyToken(manualToken);
    }
  };

  // Auto-verify on page load if token is in URL
  useEffect(() => {
    if (token) {
      verifyToken(token);
    }
  }, [token]);

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Email Verification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <div className={status === 'success' ? 'text-green-600' : status === 'error' ? 'text-red-600' : 'text-blue-600'}>
            {message}
          </div>
          
          {status === 'loading' && (
            <div className="mt-4 flex justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
            </div>
          )}
          
          {(status === 'waiting' || status === 'error') && (
            <div className="mt-4">
              <p className="mb-2 text-sm">Enter your verification token:</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={manualToken}
                  onChange={(e) => setManualToken(e.target.value)}
                  className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
                  placeholder="Paste token here"
                />
                <Button onClick={handleManualVerify} disabled={!manualToken}>
                  Verify
                </Button>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                You can find your token in the confirmation email or in the server console.
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
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