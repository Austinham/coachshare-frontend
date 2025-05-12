import React from 'react';
import { Shield } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface DataIsolationAlertProps {
  className?: string;
  compact?: boolean;
}

/**
 * A reusable component that displays a message about data isolation,
 * explaining to coaches that they only see data from their own athletes.
 */
const DataIsolationAlert: React.FC<DataIsolationAlertProps> = ({ 
  className = 'mb-8',
  compact = false
}) => {
  return (
    <Alert className={className}>
      <Shield className="h-4 w-4" />
      <AlertTitle>Data Security</AlertTitle>
      <AlertDescription>
        {compact 
          ? "You only see data from your own athletes." 
          : "For privacy and security, you'll only see workout data from your own athletes. No data from other coaches' athletes will be visible."}
      </AlertDescription>
    </Alert>
  );
};

export default DataIsolationAlert; 