import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Star, StarOff, Share2 } from "lucide-react";
import { format, parseISO } from 'date-fns';
import ShareRegimenDialog from '@/components/ShareRegimenDialog';

interface RegimenCardProps {
  regimen: {
    id: string;
    name: string;
    description: string;
    category: string;
    startDate?: string;
    endDate?: string;
    updatedAt?: string;
    createdAt?: string;
    level?: string;
    sport?: string;
    athletes?: number;
    exercises?: number;
    favorite?: boolean;
  };
  onRegimenClick?: (id: string) => void;
}

export const getCategoryColor = (category: string): string => {
  switch (category?.toLowerCase()) {
    case 'strength':
      return 'bg-red-100 text-red-800 hover:bg-red-100';
    case 'conditioning':
      return 'bg-blue-100 text-blue-800 hover:bg-blue-100';
    case 'mobility':
      return 'bg-green-100 text-green-800 hover:bg-green-100';
    case 'recovery':
      return 'bg-purple-100 text-purple-800 hover:bg-purple-100';
    case 'sport specific':
      return 'bg-amber-100 text-amber-800 hover:bg-amber-100';
    default:
      return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
  }
};

export const getDisplayCategory = (category: string): string => {
  if (!category) return 'General';
  
  // Convert first letter to uppercase
  return category.charAt(0).toUpperCase() + category.slice(1);
};

const RegimenCard: React.FC<RegimenCardProps> = ({ regimen, onRegimenClick }) => {
  const navigate = useNavigate();
  
  // Check if a regimen has been recently updated
  const isRecent = (updatedAt: string | undefined, createdAt: string | undefined) => {
    if (!updatedAt || !createdAt) return false;
    
    try {
      const date = parseISO(updatedAt);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      const createdDate = parseISO(createdAt);
      const hasBeenModified = date.getTime() !== createdDate.getTime();
      
      return diffDays <= 7 && hasBeenModified;
    } catch (error) {
      console.error('Error parsing date:', error);
      return false;
    }
  };

  // Handle card click
  const handleClick = () => {
    if (onRegimenClick) {
      onRegimenClick(regimen.id);
    } else {
      navigate(`/app/regimens/create?id=${regimen.id}`);
    }
  };

  return (
    <div 
      className={`regimen-card regimen-card-${regimen.category?.toLowerCase()} relative cursor-pointer p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200`}
      onClick={handleClick}
    >
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-semibold text-lg">{regimen.name}</h3>
        <Badge className={getCategoryColor(regimen.category)}>
          {getDisplayCategory(regimen.category)}
        </Badge>
      </div>
      
      <p className="text-gray-600 text-sm mb-4 line-clamp-2">{regimen.description}</p>
      
      <div className="flex flex-wrap gap-2 mb-4">
        {regimen.sport ? (
          regimen.sport.split(',').map((tag, index) => (
            <Badge key={index} variant="outline">{tag.trim()}</Badge>
          ))
        ) : (
          <Badge variant="outline">{regimen.sport || 'General'}</Badge>
        )}
        <Badge variant="outline">{regimen.level || 'Beginner'}</Badge>
      </div>
      
      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
        <div className="flex items-center">
          <CalendarIcon size={14} className="mr-1" />
          <span>
            {isRecent(regimen.updatedAt, regimen.createdAt) && (
              <Badge variant="outline" className="mr-1 bg-green-50 text-green-700 text-xs py-0 px-1.5 border-green-200">Recent</Badge>
            )}
            Last updated: {regimen.updatedAt ? 
              format(parseISO(regimen.updatedAt), 'MMM d, yyyy') : 
              'N/A'}
          </span>
        </div>
      </div>
      
      <div className="flex gap-2 justify-end">
        <ShareRegimenDialog 
          regimenId={regimen.id} 
          regimenName={regimen.name} 
        />
        <Button 
          variant="default" 
          size="sm" 
          className="bg-coach-primary hover:bg-coach-primary/90"
          onClick={(e) => {
            e.stopPropagation(); // Prevent card click event
            navigate(`/app/regimens/create?id=${regimen.id}`);
          }}
        >
          View
        </Button>
      </div>
    </div>
  );
};

export default RegimenCard; 