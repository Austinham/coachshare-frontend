import React from 'react';
import { Star, Award, History, UserPlus } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export interface CoachProps {
  _id: string;
  firstName: string;
  lastName: string;
  specialties?: string[];
  bio?: string;
  experience?: string;
  rating?: number;
  reviews?: number;
  avatarUrl?: string;
  createdAt?: string;
  qualifications?: string[];
}

interface CoachCardProps {
  coach: CoachProps;
  onConnect: (coachId: string) => void;
  isLoading?: boolean;
}

const CoachCard: React.FC<CoachCardProps> = ({ coach, onConnect, isLoading = false }) => {
  const { _id, firstName, lastName, specialties, bio, experience, rating, reviews, avatarUrl } = coach;

  const handleConnect = () => {
    onConnect(_id);
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={avatarUrl} alt={`${firstName} ${lastName}`} />
              <AvatarFallback>{getInitials(firstName, lastName)}</AvatarFallback>
            </Avatar>
            
            <div>
              <h3 className="text-lg font-semibold">{firstName} {lastName}</h3>
              {rating && (
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-medium">{rating}</span>
                  <span className="text-xs text-gray-500">({reviews || 0} reviews)</span>
                </div>
              )}
            </div>
          </div>
          
          {experience && (
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              <History className="mr-1 h-3 w-3" />
              {experience}
            </Badge>
          )}
        </div>
        
        {specialties && specialties.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {specialties.map((specialty, index) => (
              <Badge key={index} variant="secondary" className="bg-gray-100">
                {specialty}
              </Badge>
            ))}
          </div>
        )}
        
        {bio && (
          <div className="text-sm text-gray-600 mb-4 line-clamp-2">{bio}</div>
        )}
        
        <div className="flex items-center gap-2 mb-2">
          <Award className="h-4 w-4 text-blue-600" />
          <span className="text-sm">Certified Coach</span>
        </div>
      </CardContent>
      
      <CardFooter className="border-t pt-4">
        <Button 
          className="w-full bg-blue-600 hover:bg-blue-700"
          onClick={handleConnect}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <span className="h-4 w-4 animate-spin mr-2" />
              Connecting...
            </>
          ) : (
            <>
              <UserPlus className="mr-2 h-4 w-4" />
              Connect with Coach
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default CoachCard; 