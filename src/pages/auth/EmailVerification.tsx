import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { CheckCircle, XCircle, RefreshCw } from 'lucide-react';

const EmailVerification: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { verifyEmail, isLoading } = useAuth();
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'success' | 'error'>('pending');

  useEffect(() => {
    if (!token) {
      setVerificationStatus('error');
      return;
    }

    const verifyToken = async () => {
      try {
        await verifyEmail(token);
        setVerificationStatus('success');
      } catch (error) {
        console.error('Email verification failed:', error);
        setVerificationStatus('error');
      }
    };

    verifyToken();
  }, [token, verifyEmail]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="absolute top-8 left-8">
        <h1 className="text-2xl font-bold text-coach-primary">CoachShare</h1>
      </div>
      
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center">
              {isLoading ? (
                <RefreshCw className="h-8 w-8 text-coach-primary animate-spin" />
              ) : verificationStatus === 'success' ? (
                <CheckCircle className="h-8 w-8 text-green-500" />
              ) : (
                <XCircle className="h-8 w-8 text-red-500" />
              )}
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            {isLoading ? 'Verifying Email' : verificationStatus === 'success' ? 'Email Verified' : 'Verification Failed'}
          </CardTitle>
          <CardDescription className="text-center">
            {isLoading 
              ? 'Please wait while we verify your email...' 
              : verificationStatus === 'success' 
                ? 'Your email has been successfully verified.' 
                : 'We were unable to verify your email.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <div className="border rounded-lg p-4 bg-gray-50">
            <p className="text-sm text-gray-600">
              {isLoading 
                ? 'This should only take a moment.' 
                : verificationStatus === 'success' 
                  ? 'You can now log in to your account.' 
                  : 'The verification link may be expired or invalid. Please try requesting a new verification email.'}
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col">
          {!isLoading && (
            <Button 
              className="w-full mb-4"
              onClick={() => navigate('/auth/login')}
              variant={verificationStatus === 'success' ? 'default' : 'outline'}
            >
              {verificationStatus === 'success' ? 'Continue to Login' : 'Back to Login'}
            </Button>
          )}
          
          {verificationStatus === 'error' && (
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => navigate('/verify-email')}
            >
              Request New Verification Link
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default EmailVerification; 