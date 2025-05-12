import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
  CalendarDays, 
  List, 
  Plus, 
  Trash, 
  Loader2,
  RefreshCw
} from 'lucide-react';

const localizer = momentLocalizer(moment);
const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://coachshare-api.vercel.app/api'
  : 'http://localhost:8000/api';

export const Schedule: React.FC = () => {
  const { toast } = useToast();
  const [view, setView] = useState('calendar');
  const [events, setEvents] = useState([]);
  const [athletes, setAthletes] = useState([]);
  const [regimens, setRegimens] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isResetting, setIsResetting] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    start: new Date(),
    end: new Date(new Date().setHours(new Date().getHours() + 1)),
    eventType: 'session',
    location: '',
    athleteId: '',
    regimenId: '',
    notes: '',
    id: ''
  });

  const fetchScheduleData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Add timestamp to prevent caching
      const timestamp = Date.now();
      
      // Fetch data from real API endpoints
      const [eventsRes, athletesRes, regimensRes] = await Promise.all([
        fetch(`${API_BASE_URL}/events?t=${timestamp}`),
        fetch(`${API_BASE_URL}/athletes?t=${timestamp}`).catch(() => ({ ok: true, json: () => Promise.resolve([]) })),
        fetch(`${API_BASE_URL}/regimens?t=${timestamp}`)
      ]);
      
      if (!eventsRes.ok || !regimensRes.ok) {
        throw new Error('Failed to fetch data');
      }
      
      const eventsData = await eventsRes.json();
      const athletesData = await (athletesRes.ok ? athletesRes.json() : []);
      const regimensData = await regimensRes.json();
      
      // Format events with proper date objects
      const formattedEvents = eventsData.map(event => ({
        ...event,
        start: new Date(event.start_time || event.start),
        end: new Date(event.end_time || event.end),
      }));
      
      setEvents(formattedEvents);
      setAthletes(athletesData);
      setRegimens(regimensData);
    } catch (error) {
      console.error('Error fetching schedule data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load schedule data',
        variant: 'destructive',
      });
      
      // Set empty arrays in case of error
      setEvents([]);
      setAthletes([]);
      setRegimens([]);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);
  
  // Reset all schedule events
  const resetSchedule = async () => {
    if (!confirm('Are you sure you want to clear the entire schedule? This cannot be undone.')) {
      return;
    }
    
    try {
      setIsResetting(true);
      
      const response = await fetch(`${API_BASE_URL}/events/reset`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to reset schedule');
      }
      
      toast({
        title: 'Schedule Reset',
        description: 'All schedule events have been removed',
      });
      
      // Refresh the schedule data
      await fetchScheduleData();
    } catch (error) {
      console.error('Error resetting schedule:', error);
      toast({
        title: 'Error',
        description: 'Failed to reset schedule',
        variant: 'destructive',
      });
    } finally {
      setIsResetting(false);
    }
  };

  // Cleanup orphaned events (references to deleted programs)
  const cleanupOrphanedEvents = async () => {
    try {
      setIsResetting(true);
      
      const response = await fetch(`${API_BASE_URL}/events/cleanup-orphaned`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to clean up orphaned events');
      }
      
      const result = await response.json();
      
      toast({
        title: 'Cleanup Complete',
        description: result.message,
      });
      
      // Refresh the schedule data
      await fetchScheduleData();
    } catch (error) {
      console.error('Error cleaning up events:', error);
      toast({
        title: 'Error',
        description: 'Failed to clean up schedule',
        variant: 'destructive',
      });
    } finally {
      setIsResetting(false);
    }
  };
  
  // Initial data fetch
  useEffect(() => {
    fetchScheduleData();
  }, [fetchScheduleData]);
  
  const handleEventSelect = (event) => {
    setSelectedEvent(event);
    setNewEvent({
      id: event.id,
      title: event.title,
      start: new Date(event.start),
      end: new Date(event.end),
      eventType: event.eventType || event.event_type || 'session',
      location: event.location || '',
      athleteId: event.athleteId || event.athlete_id || '',
      regimenId: event.regimenId || event.regimen_id || '',
      notes: event.notes || ''
    });
    setIsEventDialogOpen(true);
  };
  
  const handleSlotSelect = (slotInfo) => {
    setSelectedEvent(null);
    setNewEvent({
      title: '',
      start: new Date(slotInfo.start),
      end: new Date(slotInfo.end),
      eventType: 'session',
      location: '',
      athleteId: '',
      regimenId: '',
      notes: '',
      id: ''
    });
    setIsEventDialogOpen(true);
  };
  
  const handleSaveEvent = async () => {
    try {
      // Basic validation
      if (!newEvent.title) {
        toast({
          title: 'Error',
          description: 'Please enter a title for the event',
          variant: 'destructive',
        });
        return;
      }
      
      const eventData = {
        title: newEvent.title,
        start_time: newEvent.start.toISOString(),
        end_time: newEvent.end.toISOString(),
        event_type: newEvent.eventType,
        location: newEvent.location,
        athlete_id: newEvent.athleteId || null,
        regimen_id: newEvent.regimenId || null,
        notes: newEvent.notes
      };
      
      // Update or create event
      const url = selectedEvent ? `${API_BASE_URL}/events/${selectedEvent.id}` : `${API_BASE_URL}/events`;
      const method = selectedEvent ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save event');
      }
      
      toast({
        title: selectedEvent ? 'Event Updated' : 'Event Created',
        description: `Successfully ${selectedEvent ? 'updated' : 'created'} the event`,
      });
      
      setIsEventDialogOpen(false);
      fetchScheduleData();
    } catch (error) {
      console.error('Error saving event:', error);
      toast({
        title: 'Error',
        description: 'Failed to save event',
        variant: 'destructive',
      });
    }
  };
  
  const handleDeleteEvent = async () => {
    if (!selectedEvent || !selectedEvent.id) return;
    
    if (!confirm('Are you sure you want to delete this event?')) {
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/events/${selectedEvent.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete event');
      }
      
      toast({
        title: 'Event Deleted',
        description: 'The event has been removed from the schedule',
      });
      
      setIsEventDialogOpen(false);
      fetchScheduleData();
    } catch (error) {
      console.error('Error deleting event:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete event',
        variant: 'destructive',
      });
    }
  };
  
  const eventStyleGetter = (event) => {
    let backgroundColor = '#3498db'; // Default blue
    
    // Color by event type
    switch (event.eventType || event.event_type) {
      case 'session':
        backgroundColor = '#3498db';
        break;
      case 'meeting':
        backgroundColor = '#9b59b6';
        break;
      case 'assessment':
        backgroundColor = '#2ecc71';
        break;
      default:
        backgroundColor = '#3498db';
    }
    
    return {
      style: {
        backgroundColor,
        borderRadius: '4px',
        color: 'white',
        border: 'none',
        display: 'block'
      }
    };
  };
  
  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Schedule</h1>
          <p className="text-gray-500 mt-1">
            View and manage your training sessions and appointments
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex flex-wrap items-center gap-3">
          <Button 
            variant="outline"
            size="sm"
            onClick={() => fetchScheduleData()}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button 
            variant="outline"
            size="sm"
            onClick={cleanupOrphanedEvents}
            disabled={isResetting}
          >
            {isResetting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Clean Orphaned
          </Button>
          
          <Button 
            variant="destructive"
            size="sm"
            onClick={resetSchedule}
            disabled={isResetting}
          >
            {isResetting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Trash className="h-4 w-4 mr-2" />
            )}
            Reset Schedule
          </Button>
          
          <Button onClick={() => {
            setSelectedEvent(null);
            setNewEvent({
              title: '',
              start: new Date(),
              end: new Date(new Date().setHours(new Date().getHours() + 1)),
              eventType: 'session',
              location: '',
              athleteId: '',
              regimenId: '',
              notes: '',
              id: ''
            });
            setIsEventDialogOpen(true);
          }}>
            <Plus className="mr-2 h-4 w-4" />
            New Event
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="calendar" value={view} onValueChange={setView} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="calendar">
            <CalendarDays className="h-4 w-4 mr-2" />
            Calendar
          </TabsTrigger>
          <TabsTrigger value="agenda">
            <List className="h-4 w-4 mr-2" />
            Agenda
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="calendar" className="mt-0">
          <Card>
            <CardContent className="p-0 sm:p-6">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400 mb-4" />
                  <p className="text-gray-500">Loading schedule...</p>
                </div>
              ) : events.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <CalendarDays className="h-12 w-12 text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-600">No events found</h3>
                  <p className="text-gray-500 mt-1 mb-4">Your schedule is empty</p>
                  <Button onClick={() => {
                    setSelectedEvent(null);
                    setNewEvent({
                      title: '',
                      start: new Date(),
                      end: new Date(new Date().setHours(new Date().getHours() + 1)),
                      eventType: 'session',
                      location: '',
                      athleteId: '',
                      regimenId: '',
                      notes: '',
                      id: ''
                    });
                    setIsEventDialogOpen(true);
                  }}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add First Event
                  </Button>
                </div>
              ) : (
                <div className="h-[600px]">
                  <Calendar
                    localizer={localizer}
                    events={events}
                    startAccessor="start"
                    endAccessor="end"
                    style={{ height: '100%' }}
                    views={['month', 'week', 'day']}
                    onSelectEvent={handleEventSelect}
                    onSelectSlot={handleSlotSelect}
                    selectable
                    eventPropGetter={eventStyleGetter}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="agenda" className="mt-0">
          <Card>
            <CardContent className="p-6">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400 mb-4" />
                  <p className="text-gray-500">Loading schedule...</p>
                </div>
              ) : events.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <List className="h-12 w-12 text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-600">No events found</h3>
                  <p className="text-gray-500 mt-1">Your schedule is empty</p>
                </div>
              ) : (
                <div>
                  {/* Group events by day and sort by date */}
                  {Object.entries(
                    events.reduce((acc, event) => {
                      const day = moment(event.start).startOf('day').format('YYYY-MM-DD');
                      if (!acc[day]) acc[day] = [];
                      acc[day].push(event);
                      return acc;
                    }, {})
                  )
                    .sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime())
                    .map(([date, dayEvents]) => (
                      <div key={date} className="mb-6">
                        <h3 className="font-medium text-gray-800 mb-3">
                          {moment(date).format('dddd, MMMM D, YYYY')}
                        </h3>
                        <div className="space-y-3">
                          {(dayEvents as any[])
                            .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
                            .map((event) => (
                              <div 
                                key={event.id} 
                                className="p-3 bg-white rounded-md border border-gray-200 hover:border-blue-300 cursor-pointer transition-colors"
                                onClick={() => handleEventSelect(event)}
                              >
                                <div className="flex items-start justify-between">
                                  <div>
                                    <h4 className="font-medium text-gray-800">{event.title}</h4>
                                    <p className="text-sm text-gray-500">
                                      {moment(event.start).format('h:mm A')} - {moment(event.end).format('h:mm A')}
                                    </p>
                                  </div>
                                  <div className={`
                                    px-2 py-1 rounded-full text-xs font-medium
                                    ${(event.eventType || event.event_type) === 'session' ? 'bg-blue-100 text-blue-800' : ''}
                                    ${(event.eventType || event.event_type) === 'meeting' ? 'bg-purple-100 text-purple-800' : ''}
                                    ${(event.eventType || event.event_type) === 'assessment' ? 'bg-green-100 text-green-800' : ''}
                                  `}>
                                    {event.eventType || event.event_type || 'session'}
                                  </div>
                                </div>
                                {event.location && (
                                  <p className="text-sm text-gray-500 mt-1">
                                    📍 {event.location}
                                  </p>
                                )}
                                {(event.athleteId || event.athlete_id) && (
                                  <p className="text-sm text-gray-500 mt-1">
                                    👤 {athletes.find(a => a.id === (event.athleteId || event.athlete_id))?.name || 'Athlete'}
                                  </p>
                                )}
                                {(event.regimenId || event.regimen_id) && (
                                  <p className="text-sm text-gray-500 mt-1">
                                    📋 {regimens.find(r => r.id === (event.regimenId || event.regimen_id))?.name || 'Training Program'}
                                  </p>
                                )}
                              </div>
                            ))}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Event Dialog */}
      <Dialog open={isEventDialogOpen} onOpenChange={setIsEventDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {selectedEvent ? 'Edit Event' : 'Create New Event'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={newEvent.title}
                onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                placeholder="Enter event title"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="start">Start Time</Label>
                <Input
                  id="start"
                  type="datetime-local"
                  value={moment(newEvent.start).format('YYYY-MM-DDTHH:mm')}
                  onChange={(e) => setNewEvent({
                    ...newEvent, 
                    start: new Date(e.target.value)
                  })}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="end">End Time</Label>
                <Input
                  id="end"
                  type="datetime-local"
                  value={moment(newEvent.end).format('YYYY-MM-DDTHH:mm')}
                  onChange={(e) => setNewEvent({
                    ...newEvent, 
                    end: new Date(e.target.value)
                  })}
                />
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="eventType">Event Type</Label>
              <Select
                value={newEvent.eventType}
                onValueChange={(value) => setNewEvent({...newEvent, eventType: value})}
              >
                <SelectTrigger id="eventType">
                  <SelectValue placeholder="Select event type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="session">Training Session</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="assessment">Assessment</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={newEvent.location}
                onChange={(e) => setNewEvent({...newEvent, location: e.target.value})}
                placeholder="Enter location"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="athlete">Athlete</Label>
              <Select
                value={newEvent.athleteId}
                onValueChange={(value) => setNewEvent({...newEvent, athleteId: value})}
              >
                <SelectTrigger id="athlete">
                  <SelectValue placeholder="Select athlete" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {athletes.map((athlete) => (
                    <SelectItem key={athlete.id} value={athlete.id}>
                      {athlete.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="program">Training Program</Label>
              <Select
                value={newEvent.regimenId}
                onValueChange={(value) => setNewEvent({...newEvent, regimenId: value})}
              >
                <SelectTrigger id="program">
                  <SelectValue placeholder="Select training program" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {regimens.map((regimen) => (
                    <SelectItem key={regimen.id} value={regimen.id}>
                      {regimen.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={newEvent.notes}
                onChange={(e) => setNewEvent({...newEvent, notes: e.target.value})}
                placeholder="Add any notes or details"
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter className="flex justify-between">
            {selectedEvent && (
              <Button variant="destructive" onClick={handleDeleteEvent}>
                Delete Event
              </Button>
            )}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsEventDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveEvent}>
                {selectedEvent ? 'Update' : 'Create'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}; 