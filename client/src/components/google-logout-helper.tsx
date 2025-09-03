import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink, AlertCircle, CheckCircle } from "lucide-react";

interface GoogleLogoutHelperProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GoogleLogoutHelper({ open, onOpenChange }: GoogleLogoutHelperProps) {
  const [step, setStep] = useState(1);

  const handleGoogleLogout = () => {
    // Open Google logout in new tab
    window.open('https://accounts.google.com/logout', '_blank');
    setStep(2);
  };

  const handleReturnToLogin = () => {
    onOpenChange(false);
    setStep(1);
    // Use the force account selection endpoint after Google logout
    window.location.href = "/api/login-force-select";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <ExternalLink className="h-5 w-5" />
            <span>Google Account Switch</span>
          </DialogTitle>
          <DialogDescription>
            Since you're using Gmail/Google, you need to sign out from Google first to switch accounts.
          </DialogDescription>
        </DialogHeader>
        
        {step === 1 && (
          <div className="space-y-4">
            <div className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-700">
                <p className="font-medium mb-1">Why this happens:</p>
                <p>Google remembers your login even after we clear our app's cookies. This is normal OAuth behavior for security.</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Step 1: Sign out from Google</h3>
              <Button
                onClick={handleGoogleLogout}
                className="w-full"
                variant="outline"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Open Google Sign Out
              </Button>
              <p className="text-xs text-gray-500">
                This will open Google's logout page in a new tab. Sign out from all accounts you don't want to use.
              </p>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-start space-x-3 p-4 bg-green-50 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div className="text-sm text-green-700">
                <p className="font-medium mb-1">Step 2: Return here</p>
                <p>After signing out from Google, click below to sign in with your different account.</p>
              </div>
            </div>
            
            <Button
              onClick={handleReturnToLogin}
              className="w-full"
            >
              Sign In with Different Account
            </Button>
            
            <p className="text-xs text-gray-500 text-center">
              Google will now ask you to choose which account to use.
            </p>
          </div>
        )}
        
        <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
          <p className="text-sm text-yellow-700">
            <strong>Alternative:</strong> Use incognito/private browser mode for the most reliable account switching.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}