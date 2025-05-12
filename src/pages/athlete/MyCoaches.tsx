import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyCoach, getCoachHistory, getMyCoaches, CoachProps } from '@/services/coachService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, Calendar, Clock, Loader2, RefreshCw, MessageCircle, Award, History, UserPlus } from 'lucide-react';
import { format } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

interface CoachWithMetadata extends CoachProps {
  active: boolean;
  startDate: string;
}

const MyCoaches: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [currentCoaches, setCurrentCoaches] = useState<CoachProps[]>([]);
  const [historicalCoaches, setHistoricalCoaches] = useState<CoachProps[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchCoaches = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch all coaches using the new endpoint
      const coaches = await getMyCoaches();
      console.log('All coaches fetched:', coaches);
      
      if (coaches.length > 0) {
        // Current coaches are all coaches
        setCurrentCoaches(coaches);
      } else {
        // Fall back to old method if new endpoint returns no coaches
        console.log('No coaches found with new endpoint, falling back to legacy method');
        const coach = await getMyCoach();
        setCurrentCoaches(coach ? [coach] : []);
      }
      
      // Fetch coach history (keep as is for now)
      const history = await getCoachHistory();
      
      // Transform the data to match our interface
      const transformedHistory = history.map(coach => ({
        ...coach,
        active: false,
        startDate: coach.createdAt || new Date().toISOString()
      }));
      
      setHistoricalCoaches(transformedHistory);
    } catch (err) {
      console.error('Error fetching coaches:', err);
      setError('Failed to load coach information. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoaches();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <p className="text-destructive">{error}</p>
        <Button onClick={() => fetchCoaches()}>Try Again</Button>
      </div>
    );
  }

  if (currentCoaches.length === 0 && historicalCoaches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <UserPlus className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-2xl font-semibold">No Coaches Yet</h2>
          <p className="text-muted-foreground max-w-md">
            You haven't been assigned a coach yet. Find a coach to help you achieve your fitness goals.
          </p>
          <Button onClick={() => navigate('/find-coach')} className="mt-4">
            <UserPlus className="mr-2 h-4 w-4" />
            Find a Coach
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">My Coaches</h1>
          <p className="text-muted-foreground mt-1">Manage your coaching relationships</p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => fetchCoaches()} 
          disabled={loading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="current" className="space-y-6">
        <TabsList className="grid w-full md:w-auto grid-cols-2">
          <TabsTrigger value="current" className="flex items-center gap-2">
            <Star className="h-4 w-4" />
            Current Coaches
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Coach History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="space-y-6">
          {currentCoaches.length > 0 ? (
            <div className="grid gap-6">
              {currentCoaches.map((coach) => (
                <Card key={coach._id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16">
                          <AvatarImage src={coach.avatarUrl} />
                          <AvatarFallback>
                            {coach.firstName?.[0]}{coach.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-2xl">
                            {coach.firstName} {coach.lastName}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-2 mt-1">
                            <Award className="h-4 w-4" />
                            Certified Coach
                          </CardDescription>
                        </div>
                      </div>
                      <Badge variant="default" className="h-fit">
                        <Star className="h-4 w-4 mr-1" />
                        Active Coach
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="space-y-4">
                        <div>
                          <h3 className="font-semibold mb-2 flex items-center gap-2">
                            <Award className="h-4 w-4" />
                            Specialties
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {coach.specialties?.map((specialty, index) => (
                              <Badge key={index} variant="secondary">
                                {specialty}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <h3 className="font-semibold mb-2 flex items-center gap-2">
                            <History className="h-4 w-4" />
                            Experience
                          </h3>
                          <p className="text-muted-foreground">{coach.experience}</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <h3 className="font-semibold mb-2">Bio</h3>
                          <p className="text-muted-foreground">{coach.bio}</p>
                        </div>

                        <div>
                          <h3 className="font-semibold mb-2 flex items-center gap-2">
                            <Award className="h-4 w-4" />
                            Qualifications
                          </h3>
                          <div className="space-y-2">
                            {coach.qualifications?.map((qualification, index) => (
                              <div key={index} className="flex items-center gap-2 text-sm">
                                <Badge variant="outline" className="bg-primary/5">
                                  {qualification.title}
                                </Badge>
                                {qualification.institution && (
                                  <span className="text-muted-foreground">
                                    • {qualification.institution}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <Separator className="my-6" />

                    <div className="flex flex-col sm:flex-row gap-4">
                      <Button className="flex-1" onClick={() => navigate('/app/messages')}>
                        <MessageCircle className="mr-2 h-4 w-4" />
                        Message Coach
                      </Button>
                      <Button variant="outline" className="flex-1" onClick={() => navigate('/app/athlete/progress')}>
                        <History className="mr-2 h-4 w-4" />
                        View Progress
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <UserPlus className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold mb-2">No Current Coaches</h2>
              <p className="text-muted-foreground mb-4">Find a coach to help you achieve your fitness goals</p>
              <Button onClick={() => navigate('/find-coach')}>
                <UserPlus className="mr-2 h-4 w-4" />
                Find a Coach
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          {historicalCoaches.length > 0 ? (
            <div className="grid gap-6">
              {historicalCoaches.map((coach) => (
                <Card key={coach._id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={coach.avatarUrl} />
                          <AvatarFallback>
                            {coach.firstName?.[0]}{coach.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle>{coach.firstName} {coach.lastName}</CardTitle>
                          <CardDescription className="flex items-center gap-2 mt-1">
                            <Calendar className="h-4 w-4" />
                            {format(new Date(coach.startDate), 'MMM yyyy')} - Present
                          </CardDescription>
                        </div>
                      </div>
                      <Badge variant="outline">Previous Coach</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="space-y-4">
                        <div>
                          <h3 className="font-semibold mb-2 flex items-center gap-2">
                            <Award className="h-4 w-4" />
                            Specialties
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {coach.specialties?.map((specialty, index) => (
                              <Badge key={index} variant="secondary">
                                {specialty}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <h3 className="font-semibold mb-2 flex items-center gap-2">
                            <History className="h-4 w-4" />
                            Experience
                          </h3>
                          <p className="text-muted-foreground">{coach.experience}</p>
                        </div>
                      </div>

                      <div>
                        <h3 className="font-semibold mb-2">Bio</h3>
                        <p className="text-muted-foreground">{coach.bio}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <History className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold mb-2">No Coach History</h2>
              <p className="text-muted-foreground">You haven't worked with any coaches yet</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MyCoaches; 