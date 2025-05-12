'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">CoachShare</CardTitle>
          <CardDescription>Connect athletes and coaches for better results</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center text-sm text-gray-500 mb-4">
            Welcome to CoachShare! Please choose an option below:
          </div>
          <div className="space-y-2">
            <Button asChild className="w-full">
              <Link href="/register">Create an Account</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center border-t pt-4">
          <div className="text-xs text-gray-500">
            Need help with verification? <Link href="/verify-email" className="text-blue-500 hover:underline">Click here</Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
} 