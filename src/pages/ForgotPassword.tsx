import React, { useState } from 'react';
import { 
  TextInput, 
  Button, 
  Title, 
  Text, 
  Paper, 
  Container, 
  Group, 
  Alert 
} from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
// Import the specific function from the service
import { authService } from '../services/api';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    // Basic email validation
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address.');
      setLoading(false);
      return;
    }

    try {
      console.log(`Submitting forgot password request for: ${email}`);
      // Call the actual API service function
      await authService.forgotPassword({ email });
      
      // Display a generic success message
      setSuccessMessage(
        'If an account with that email address exists, a password reset link has been sent (or logged to server console in development).'
      );
      setEmail(''); // Clear the input field on success
    } catch (err: any) { // Catch any error type
      console.error('Forgot Password error:', err);
      // Error message handling (error is already toasted in service, but set local state too)
      let errorMessage = 'An unexpected error occurred. Please try again.';
      if (err.response && err.response.data && err.response.data.message) {
        errorMessage = err.response.data.message;
      } else if (err.message && !err.response) { // Handle network errors etc.
          errorMessage = err.message;
      } 
      // Avoid setting generic error if specific one was toasted by service
      if (!errorMessage.includes("reset request")) { 
          setError(errorMessage); 
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size={420} my={40}>
      <Title ta="center">
        Forgot Your Password?
      </Title>
      <Text c="dimmed" size="sm" ta="center" mt={5}>
        Enter your email address below and we'll send you a link to reset your password.
      </Text>

      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        <form onSubmit={handleSubmit}>
          {error && (
            <Alert 
              icon={<IconAlertCircle size="1rem" />} 
              title="Error" 
              color="red" 
              withCloseButton 
              onClose={() => setError(null)}
              mb="md"
            >
              {error}
            </Alert>
          )}

          {successMessage && (
            <Alert 
              title="Request Sent" 
              color="green" 
              withCloseButton 
              onClose={() => setSuccessMessage(null)}
              mb="md"
            >
              {successMessage}
            </Alert>
          )}

          <TextInput
            label="Email"
            placeholder="you@example.com"
            required
            value={email}
            onChange={(event) => setEmail(event.currentTarget.value)}
            error={!!error} // Indicate error on the input as well
            disabled={loading || !!successMessage} // Disable if loading or success
            mb="md"
          />

          <Group justify="center" mt="lg">
            <Button type="submit" loading={loading} disabled={!!successMessage}>
              Send Reset Link
            </Button>
          </Group>
        </form>
      </Paper>
    </Container>
  );
}

export default ForgotPassword; 