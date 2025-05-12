import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { authService } from '../../lib/api';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const VerifyEmail: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email...');
  const [manualToken, setManualToken] = useState('');

  // Get token from URL
  const getTokenFromUrl = () => {
    const searchParams = new URLSearchParams(location.search);
    return searchParams.get('token');
  };

  // Function to verify token
  const verifyToken = async (tokenToVerify: string) => {
    if (!tokenToVerify) {
      setStatus('error');
      setMessage('No verification token provided. Please check your email or enter your token below.');
      return;
    }
    
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
  const handleManualVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualToken) {
      verifyToken(manualToken);
    }
  };

  // Auto-verify on page load if token is in URL
  useEffect(() => {
    const token = getTokenFromUrl();
    if (token) {
      verifyToken(token);
    } else {
      setStatus('error');
      setMessage('No verification token provided. Please check your email or enter your token below.');
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Email Verification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className={`text-center p-4 rounded-md ${
            status === 'success' ? 'bg-green-50 text-green-700' : 
            status === 'error' ? 'bg-red-50 text-red-700' : 
            'bg-blue-50 text-blue-700'
          }`}>
            {message}
          </div>
          
          {status === 'loading' && (
            <div className="flex justify-center p-4">
              <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
          )}
          
          {(status === 'error') && (
            <form onSubmit={handleManualVerify} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="token">Verification Token</Label>
                <Input 
                  id="token" 
                  placeholder="Enter your verification token"
                  value={manualToken}
                  onChange={(e) => setManualToken(e.target.value)}
                  required
                />
                <p className="text-xs text-gray-500">
                  You can find your token in the confirmation email or in the server console logs.
                </p>
              </div>
              <Button type="submit" className="w-full">Verify Email</Button>
            </form>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          {status === 'success' && (
            <Button onClick={() => navigate('/login')} className="w-full">
              Go to Login
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default VerifyEmail; 