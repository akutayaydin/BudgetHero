import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { X, Settings } from "lucide-react";
import { useState } from "react";

interface SetupReminderBannerProps {
  onFinishSetup: () => void;
}

export function SetupReminderBanner({ onFinishSetup }: SetupReminderBannerProps) {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <Card className="border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 mx-4 mt-4 mb-2">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center">
              <Settings className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold">Complete Your Setup</h3>
              <p className="text-sm text-muted-foreground">
                Finish setup to see all your spending and budgets
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              onClick={onFinishSetup}
              className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white gap-2"
            >
              <Settings className="w-4 h-4" />
              Finish Setup
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsVisible(false)}
              className="h-8 w-8 p-0 text-muted-foreground hover:bg-blue-100 dark:hover:bg-blue-800"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}