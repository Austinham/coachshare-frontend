import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Share2, Mail, Copy, Check, Link } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';

interface ShareRegimenDialogProps {
  regimenId: string;
  regimenName: string;
}

const ShareRegimenDialog: React.FC<ShareRegimenDialogProps> = ({ regimenId, regimenName }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [copied, setCopied] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [permission, setPermission] = useState<'view' | 'edit'>('view');
  const [isSharing, setIsSharing] = useState(false);

  // Share link that can be copied
  const shareLink = `${window.location.origin}/shared/regimen/${regimenId}`;

  // Handle copy to clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Link Copied",
      description: "Share link copied to clipboard",
    });
  };

  // Handle sharing via email
  const handleEmailShare = async () => {
    if (!email) return;
    
    try {
      setIsSharing(true);
      // Here you would make an API call to your backend to share the program
      await fetch('/api/share-regimen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          regimenId,
          email,
          permission,
        }),
      });
      
      toast({
        title: "Program Shared",
        description: `Invitation sent to ${email}`,
      });
      
      setEmail('');
    } catch (error) {
      console.error('Error sharing program:', error);
      toast({
        title: "Sharing Failed",
        description: "Could not share program. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSharing(false);
    }
  };

  // Handle toggling public status
  const handlePublicToggle = async () => {
    try {
      const newPublicStatus = !isPublic;
      setIsPublic(newPublicStatus);
      
      // Make API call to update public status
      await fetch(`/api/regimens/${regimenId}/public`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublic: newPublicStatus }),
      });
      
      toast({
        title: newPublicStatus ? "Program Made Public" : "Program Made Private",
        description: newPublicStatus 
          ? "Anyone with the link can now view this program" 
          : "Only you can view this program now",
      });
    } catch (error) {
      console.error('Error updating public status:', error);
      setIsPublic(!isPublic); // Revert on error
      toast({
        title: "Update Failed",
        description: "Could not update program visibility",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="flex items-center gap-1"
        onClick={() => setIsOpen(true)}
      >
        <Share2 className="h-4 w-4" />
        <span className="hidden sm:inline">Share</span>
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share Training Program</DialogTitle>
            <DialogDescription>
              Share "{regimenName}" with coaches, athletes, or colleagues
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="link" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="link">Share Link</TabsTrigger>
              <TabsTrigger value="email">Email Invite</TabsTrigger>
            </TabsList>
            
            <TabsContent value="link" className="mt-4 space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="public" 
                  checked={isPublic}
                  onCheckedChange={handlePublicToggle}
                />
                <div className="grid gap-1.5">
                  <Label htmlFor="public" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Make program public
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Anyone with the link can view this program
                  </p>
                </div>
              </div>

              <div className="flex flex-col space-y-2">
                <Label htmlFor="shareLink" className="text-sm">Share Link</Label>
                <div className="flex items-center">
                  <div className="relative flex-1">
                    <Link className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
                    <Input
                      id="shareLink"
                      value={shareLink}
                      readOnly
                      className="pl-8 pr-16 text-sm"
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      className="absolute right-0 top-0 h-full px-3 py-0"
                      onClick={handleCopy}
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                      <span className="sr-only">Copy</span>
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex flex-col space-y-2">
                <Label className="text-sm">Status</Label>
                <div className="flex items-center">
                  <Badge variant={isPublic ? "success" : "secondary"} className="text-xs">
                    {isPublic ? "Public" : "Private"}
                  </Badge>
                  <span className="ml-2 text-sm text-muted-foreground">
                    {isPublic 
                      ? "Anyone with the link can view" 
                      : "Only you can access this program"}
                  </span>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="email" className="mt-4 space-y-4">
              <div className="flex flex-col space-y-2">
                <Label htmlFor="email" className="text-sm">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
                  <Input
                    id="email"
                    type="email"
                    placeholder="colleague@example.com"
                    className="pl-8"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Label className="text-sm mr-2">Permission:</Label>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="view"
                    name="permission"
                    value="view"
                    checked={permission === 'view'}
                    onChange={() => setPermission('view')}
                    className="accent-coach-primary"
                  />
                  <Label htmlFor="view" className="text-sm cursor-pointer">Can view</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="edit"
                    name="permission"
                    value="edit"
                    checked={permission === 'edit'}
                    onChange={() => setPermission('edit')}
                    className="accent-coach-primary"
                  />
                  <Label htmlFor="edit" className="text-sm cursor-pointer">Can edit</Label>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm text-blue-700">
                <p>The recipient will receive an email with a link to access this program</p>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="sm:justify-start">
            <Button
              type="button"
              variant="default"
              onClick={handleEmailShare}
              disabled={isSharing || (email === '')}
              className="w-full"
            >
              {isSharing ? (
                <>Loading...</>
              ) : (
                <>Share</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ShareRegimenDialog; 