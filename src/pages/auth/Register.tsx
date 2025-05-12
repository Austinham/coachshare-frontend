import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const { register, isLoading } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'coach' | 'athlete'>('coach');
  const [isExistingUser, setIsExistingUser] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const userData = {
        firstName,
        lastName,
        email,
        password,
        role
      };
      const response = await register(userData);
      
      // Check if this is an existing user and if response is not void
      if (response && response.isExistingUser) {
        setIsExistingUser(true);
        toast({
          title: "Account exists",
          description: "A new verification email has been sent to your email address.",
          variant: "default",
        });
      } else {
        toast({
          title: "Registration successful",
          description: "Please check your email to verify your account.",
          variant: "default",
        });
        navigate('/login');
      }
    } catch (error: any) {
      if (error.response?.data?.message === 'User with that email already exists and is verified') {
        toast({
          title: "Account exists",
          description: "This email is already registered and verified. Please login instead.",
          variant: "destructive",
        });
        navigate('/login');
      } else {
        toast({
          title: "Registration failed",
          description: error.response?.data?.message || "An error occurred during registration.",
          variant: "destructive",
        });
      }
    }
  };

  const handleResendVerification = async () => {
    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter your email address first.",
        variant: "destructive",
      });
      return;
    }

    setIsResending(true);
    try {
      const response = await fetch('http://localhost:8000/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Verification email sent",
          description: "A new verification email has been sent to your email address.",
          variant: "default",
        });
      } else {
        let errorMessage = 'Failed to resend verification email';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error('Resend verification error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to resend verification email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="absolute top-8 left-8">
        <h1 className="text-2xl font-bold text-coach-primary">CoachShare</h1>
      </div>
      
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Create an account</CardTitle>
          <CardDescription className="text-center">
            Enter your information to create an account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isExistingUser ? (
            <div className="text-center space-y-4">
              <p className="text-gray-600">
                An account with this email already exists but is not verified.
                A new verification email has been sent.
              </p>
              <Button
                onClick={handleResendVerification}
                disabled={isResending}
                className="w-full bg-coach-primary hover:bg-coach-primary/90"
              >
                {isResending ? 'Sending...' : 'Resend Verification Email'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsExistingUser(false)}
                className="w-full"
              >
                Back to Registration
              </Button>
            </div>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First name</Label>
                  <Input 
                    id="firstName" 
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last name</Label>
                  <Input 
                    id="lastName" 
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="coach@example.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input 
                  id="password" 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label>Account Type</Label>
                <RadioGroup 
                  value={role}
                  onValueChange={(value) => setRole(value as 'coach' | 'athlete')}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="coach" id="coach" />
                    <Label htmlFor="coach" className="font-normal cursor-pointer">I'm a Coach</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="athlete" id="athlete" />
                    <Label htmlFor="athlete" className="font-normal cursor-pointer">I'm an Athlete</Label>
                  </div>
                </RadioGroup>
                {role === 'athlete' && (
                  <p className="text-sm text-blue-600">
                    Registering as an athlete. You'll have access to athlete-specific features.
                  </p>
                )}
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-coach-primary hover:bg-coach-primary/90"
                disabled={isLoading}
              >
                {isLoading ? 'Creating account...' : 'Create account'}
              </Button>
            </form>
          )}
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500">Or continue with</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" type="button">Google</Button>
            <Button variant="outline" type="button">Apple</Button>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col">
          <div className="text-center text-sm text-gray-500 mt-2">
            Already have an account?{' '}
            <Link to="/login" className="text-coach-primary hover:underline">
              Sign in
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Register;
