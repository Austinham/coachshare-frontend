import React from 'react';
import { Card, CardContent } from '@/components/ui/card'; // Assuming Card components are used
import { LucideIcon } from 'lucide-react'; // Import LucideIcon type

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode; // Expecting JSX element like <Dumbbell ... />
  bgColor: string; // Background color class for the icon container (e.g., 'bg-blue-50')
  // Add description and trend later if needed
  description?: string;
  trend?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, bgColor }) => {
  return (
    <Card className="border-none shadow-md">
      <CardContent className="p-4 flex justify-between items-center">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-full ${bgColor}`}> 
          {/* Render the icon passed as a prop */} 
          {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement, { className: 'h-6 w-6' }) : null}
        </div>
      </CardContent>
    </Card>
  );
};

export default StatCard; 