'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { authService } from '@/lib/api';

const loginSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login, loading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isVerificationError, setIsVerificationError] = useState(false);
  const [resendingVerification, setResendingVerification] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const router = useRouter();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(data: LoginFormValues) {
    setError(null);
    setIsVerificationError(false);
    try {
      await login(data.email, data.password);
      // Redirect handled in auth context based on user role
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Login failed. Please try again.';
      setError(errorMessage);
      
      // Check if it's a verification error
      if (errorMessage.includes('verify your email')) {
        setIsVerificationError(true);
      }
    }
  }

  const handleResendVerification = async () => {
    const email = form.getValues().email;
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setResendingVerification(true);
    try {
      await authService.resendVerification(email);
      setVerificationSent(true);
      setIsVerificationError(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to resend verification email');
    } finally {
      setResendingVerification(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
          <CardDescription>Sign in to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="you@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              {isVerificationError && (
                <div className="text-sm text-blue-600 mt-2">
                  <Button 
                    variant="link" 
                    className="p-0 h-auto font-normal" 
                    onClick={handleResendVerification}
                    disabled={resendingVerification || verificationSent}
                  >
                    {resendingVerification ? (
                      <>
                        <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                        Sending verification email...
                      </>
                    ) : verificationSent ? (
                      'Verification email sent! Check your inbox.'
                    ) : (
                      'Resend verification email'
                    )}
                  </Button>
                  <p className="mt-1 text-xs text-gray-500">
                    (Check server console for verification token in development mode)
                  </p>
                </div>
              )}
              
              {verificationSent && (
                <Alert className="bg-green-50 border-green-200 text-green-800">
                  <AlertDescription>
                    Verification email sent! Check your inbox or the server console in development mode.
                  </AlertDescription>
                </Alert>
              )}
              
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Sign In
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <div className="text-sm text-center">
            <Link href="/forgot-password" className="text-blue-600 hover:text-blue-800">
              Forgot your password?
            </Link>
          </div>
          <div className="text-sm text-center">
            Don't have an account?{' '}
            <Link href="/register" className="text-blue-600 hover:text-blue-800">
              Sign up
            </Link>
          </div>
          <div className="text-sm text-center">
            <Link href="/auth/verification" className="text-gray-500 hover:text-gray-700">
              Need help with verification?
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
} 