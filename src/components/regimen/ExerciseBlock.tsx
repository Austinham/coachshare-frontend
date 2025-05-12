import React, { useState, useRef } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { GripVertical, Trash, Copy, Video, Image, Link, Upload, X, Play, ExternalLink, Plus } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';

export interface ExerciseBlockProps {
  id: string;
  index: number;
  name: string;
  sets: number;
  isReps: boolean;
  reps: number;
  duration: string;
  restInterval: string;
  notes: string;
  mediaLinks: string[];
  onUpdate: (id: string, data: Partial<Omit<ExerciseBlockProps, 'id' | 'index' | 'onUpdate' | 'onDelete' | 'onDuplicate'>>) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  isDragging?: boolean;
}

type MediaType = 'image' | 'video' | 'link';

const ExerciseBlock: React.FC<ExerciseBlockProps> = ({
  id,
  index,
  name,
  sets,
  isReps,
  reps,
  duration,
  restInterval,
  notes,
  mediaLinks,
  onUpdate,
  onDelete,
  onDuplicate,
  isDragging
}) => {
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState<MediaType>('link');
  const [previewMedia, setPreviewMedia] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Determine the media type based on the URL
  const getMediaType = (url: string): MediaType => {
    const lowerUrl = url.toLowerCase();
    if (url.startsWith('image:') || lowerUrl.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/)) {
      return 'image';
    } else if (url.startsWith('video:') || lowerUrl.match(/\.(mp4|mov|avi|wmv|flv|webm)$/) || 
               lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be') ||
               lowerUrl.includes('vimeo.com')) {
      return 'video';
    }
    return 'link';
  };

  // Add a media link to this exercise
  const handleMediaAdd = (url: string, type: MediaType = 'link') => {
    // Basic validation
    if (!url.trim()) return;
    
    // Add proper prefix for type identification if it's not already a URL
    if (!url.startsWith('http') && !url.startsWith('blob:') && !url.startsWith('image:') && !url.startsWith('video:') && !url.startsWith('link:')) {
      if (type === 'image') {
        url = `image:${url}`;
      } else if (type === 'video') {
        url = `video:${url}`;
      } else {
        url = `link:${url}`;
      }
    }
    
    onUpdate(id, { mediaLinks: [...mediaLinks, url] });
    setMediaUrl('');
  };

  // Remove a media link
  const handleMediaRemove = (index: number) => {
    const newLinks = [...mediaLinks];
    newLinks.splice(index, 1);
    onUpdate(id, { mediaLinks: newLinks });
  };

  // Handle file upload
  const handleFileUpload = (file: File) => {
    // In a real app, you would upload to a server and get back a URL
    // For demo purposes, we'll create a local object URL
    try {
      const mediaType = file.type.startsWith('image/') ? 'image' : 'video';
      const url = URL.createObjectURL(file);
      
      // Add the URL to the media links
      handleMediaAdd(url, mediaType);
      
      toast({
        title: "File added",
        description: `${mediaType.charAt(0).toUpperCase() + mediaType.slice(1)} has been added to the exercise.`,
      });
    } catch (error) {
      console.error("Error uploading file:", error);
      toast({
        title: "Upload failed",
        description: "There was a problem uploading your file. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Get preview for a media URL
  const getMediaPreview = (url: string) => {
    const type = getMediaType(url);
    
    if (type === 'image') {
      return url.startsWith('image:') ? url.substring(6) : url;
    }
    
    if (type === 'video') {
      // Extract YouTube video ID
      if (url.includes('youtube.com') || url.includes('youtu.be')) {
        let videoId = '';
        if (url.includes('youtube.com/watch?v=')) {
          videoId = url.split('v=')[1]?.split('&')[0] || '';
        } else if (url.includes('youtu.be/')) {
          videoId = url.split('youtu.be/')[1]?.split('?')[0] || '';
        }
        if (videoId) {
          return `https://img.youtube.com/vi/${videoId}/0.jpg`;
        }
      }
      
      // For other videos, return the URL itself (will show Play icon in UI)
      return url.startsWith('video:') ? url.substring(6) : url;
    }
    
    return null;
  };

  return (
    <Card className={`mb-4 ${isDragging ? 'opacity-50' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <GripVertical className="mr-2 cursor-move text-gray-400" size={20} />
            <span className="font-medium">Exercise {index + 1}</span>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDuplicate(id)}
              title="Duplicate"
            >
              <Copy size={18} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(id)}
              className="text-red-500 hover:text-red-700"
              title="Delete"
            >
              <Trash size={18} />
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor={`name-${id}`}>Exercise Name*</Label>
            <Input
              id={`name-${id}`}
              value={name}
              onChange={(e) => onUpdate(id, { name: e.target.value })}
              placeholder="e.g., Barbell Squat"
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor={`sets-${id}`}>Sets*</Label>
              <Input
                id={`sets-${id}`}
                type="number"
                min="1"
                value={sets}
                onChange={(e) => onUpdate(id, { sets: parseInt(e.target.value) || 0 })}
                className="mt-1"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor={`type-toggle-${id}`}>
                  {isReps ? 'Reps' : 'Duration'}*
                </Label>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">Duration</span>
                  <Switch
                    id={`type-toggle-${id}`}
                    checked={isReps}
                    onCheckedChange={(checked) => onUpdate(id, { isReps: checked })}
                  />
                  <span className="text-sm text-gray-500">Reps</span>
                </div>
              </div>

              {isReps ? (
                <Input
                  id={`reps-${id}`}
                  type="number"
                  min="1"
                  value={reps}
                  onChange={(e) => onUpdate(id, { reps: parseInt(e.target.value) || 0 })}
                  className="mt-1"
                />
              ) : (
                <Input
                  id={`duration-${id}`}
                  value={duration}
                  onChange={(e) => onUpdate(id, { duration: e.target.value })}
                  placeholder="e.g., 00:30"
                  className="mt-1"
                />
              )}
            </div>
          </div>

          <div>
            <Label htmlFor={`rest-${id}`}>Rest Interval</Label>
            <Input
              id={`rest-${id}`}
              value={restInterval}
              onChange={(e) => onUpdate(id, { restInterval: e.target.value })}
              placeholder="e.g., 00:45"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor={`notes-${id}`}>Notes</Label>
            <Textarea
              id={`notes-${id}`}
              value={notes}
              onChange={(e) => onUpdate(id, { notes: e.target.value })}
              placeholder="Add instructions or details..."
              className="mt-1"
            />
          </div>

          {/* Media Section */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <Label>Media</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="flex items-center">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Media
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <Tabs defaultValue="url">
                    <TabsList className="w-full">
                      <TabsTrigger value="url" className="flex-1"><Link className="h-4 w-4 mr-2" /> URL</TabsTrigger>
                      <TabsTrigger value="upload" className="flex-1"><Upload className="h-4 w-4 mr-2" /> Upload</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="url" className="mt-2">
                      <div className="space-y-2">
                        <Label htmlFor={`media-url-${id}`}>Media URL</Label>
                        <div className="space-y-2">
                          <div className="flex space-x-2">
                            <Input
                              id={`media-url-${id}`}
                              value={mediaUrl}
                              onChange={(e) => setMediaUrl(e.target.value)}
                              placeholder="https://example.com/media.mp4"
                              className="flex-1"
                            />
                          </div>
                          <div className="flex space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="flex-1 flex justify-center items-center"
                              onClick={() => handleMediaAdd(mediaUrl, 'image')}
                            >
                              <Image className="h-4 w-4 mr-2" />
                              Image
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="flex-1 flex justify-center items-center"
                              onClick={() => handleMediaAdd(mediaUrl, 'video')}
                            >
                              <Video className="h-4 w-4 mr-2" />
                              Video
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="flex-1 flex justify-center items-center"
                              onClick={() => handleMediaAdd(mediaUrl, 'link')}
                            >
                              <Link className="h-4 w-4 mr-2" />
                              Link
                            </Button>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="upload" className="mt-2">
                      <div className="space-y-4">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*,video/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleFileUpload(file);
                            }
                          }}
                        />
                        <div 
                          className="border-2 border-dashed rounded-md p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Upload className="h-8 w-8 text-gray-400 mb-2" />
                          <p className="text-sm text-gray-500">Click to upload or drag and drop</p>
                          <p className="text-xs text-gray-400 mt-1">Images and videos</p>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </PopoverContent>
              </Popover>
            </div>

            {mediaLinks.length > 0 && (
              <div className="grid grid-cols-4 gap-2 mt-2">
                {mediaLinks.map((link, i) => {
                  const type = getMediaType(link);
                  const thumbnailUrl = getMediaPreview(link);
                  
                  return (
                    <div 
                      key={i} 
                      className="group relative border rounded-md overflow-hidden"
                      style={{ height: '70px' }}
                    >
                      {type === 'image' && thumbnailUrl ? (
                        <img 
                          src={thumbnailUrl}
                          alt={`Media ${i+1}`} 
                          className="w-full h-full object-cover"
                        />
                      ) : type === 'video' && thumbnailUrl ? (
                        <div className="relative w-full h-full bg-gray-100 flex items-center justify-center">
                          {thumbnailUrl.startsWith('http') ? (
                            <img src={thumbnailUrl} alt="Video thumbnail" className="w-full h-full object-cover" />
                          ) : null}
                          <Play className="absolute h-8 w-8 text-white drop-shadow-md" />
                        </div>
                      ) : (
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                          {type === 'video' ? (
                            <Video className="h-8 w-8 text-gray-400" />
                          ) : type === 'image' ? (
                            <Image className="h-8 w-8 text-gray-400" />
                          ) : (
                            <Link className="h-8 w-8 text-gray-400" />
                          )}
                        </div>
                      )}
                      
                      {/* Overlay with action buttons */}
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                        {/* View button */}
                        <DialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 bg-white rounded-full p-1"
                            onClick={() => setPreviewMedia(link)}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        
                        {/* Delete button */}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 bg-white rounded-full p-1 ml-1"
                          onClick={() => handleMediaRemove(i)}
                        >
                          <X className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            
            {/* Media Preview Dialog */}
            <Dialog>
              <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Media Preview</DialogTitle>
                </DialogHeader>
                {previewMedia && (
                  <div className="flex justify-center items-center">
                    {getMediaType(previewMedia) === 'image' ? (
                      <img 
                        src={previewMedia.startsWith('image:') ? previewMedia.substring(6) : previewMedia} 
                        alt="Exercise preview" 
                        className="max-w-full max-h-[60vh] object-contain"
                      />
                    ) : getMediaType(previewMedia) === 'video' ? (
                      <video 
                        src={previewMedia.startsWith('video:') ? previewMedia.substring(6) : previewMedia}
                        controls
                        className="max-w-full max-h-[60vh]"
                      />
                    ) : (
                      <div className="p-4 text-center">
                        <Link className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                        <p>
                          <a 
                            href={previewMedia.startsWith('link:') ? previewMedia.substring(5) : previewMedia} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            Open Link
                          </a>
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExerciseBlock;
