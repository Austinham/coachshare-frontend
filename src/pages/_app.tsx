import { AppProps } from 'next/app';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/context/AuthContext';
import '@/styles/globals.css';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <Toaster position="top-right" />
      <Component {...pageProps} />
    </AuthProvider>
  );
}

export default MyApp; 