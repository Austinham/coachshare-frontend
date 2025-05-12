'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { InfoIcon } from 'lucide-react';
import Link from 'next/link';

export default function VerificationInfoPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Email Verification</CardTitle>
          <CardDescription>Development Mode Instructions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start space-x-3 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <InfoIcon className="h-6 w-6 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-800">How Verification Works</h3>
              <p className="text-sm text-blue-700 mt-1">
                In development mode, verification emails aren't actually sent. Instead:
              </p>
              <ol className="list-decimal list-inside text-sm text-blue-700 mt-2 space-y-1">
                <li>When you register, the backend logs the verification token in the server console</li>
                <li>The token is also included in the API response</li>
                <li>You can verify your account using the verification URL shown in the server logs</li>
              </ol>
            </div>
          </div>

          <div className="mt-4">
            <h3 className="font-medium mb-2">Where to find your verification token:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Check the server console (terminal where you ran <code className="bg-gray-100 p-1 rounded">npm run dev</code> for the backend)</li>
              <li>Look for logs with <code className="bg-gray-100 p-1 rounded">VERIFICATION TOKEN</code></li>
              <li>Copy the token and use it in the verification URL:</li>
              <code className="block bg-gray-100 p-2 rounded mt-2 text-xs overflow-x-auto">
                http://localhost:8083/auth/verify-email/[YOUR_TOKEN]
              </code>
            </ol>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mt-6">
            <h3 className="font-medium text-yellow-800">Already registered?</h3>
            <p className="text-sm text-yellow-700 mt-1">
              If you've already registered but need to resend verification:
            </p>
            <ol className="list-decimal list-inside text-sm text-yellow-700 mt-2">
              <li>Go to login page</li>
              <li>Try to login (it will fail if unverified)</li>
              <li>Click "Resend verification email"</li>
              <li>Check server console for the new token</li>
            </ol>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <Button asChild className="w-full">
            <Link href="/register">Register a New Account</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/login">Go to Login</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 