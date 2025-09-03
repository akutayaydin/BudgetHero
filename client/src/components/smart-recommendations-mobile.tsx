import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Lightbulb, PiggyBank } from "lucide-react";

export function SmartRecommendationsMobile() {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  return (
    <Card className="block md:hidden mb-4 bg-green-50 dark:bg-green-950/30 border-l-4 border-l-green-500">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <Badge variant="secondary" className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
            <Lightbulb className="w-3 h-3 mr-1" />
            SMART RECOMMENDATION
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsDismissed(true)}
            className="text-gray-500 hover:text-gray-700 p-1"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>

        <div className="flex gap-3 items-start">
          <div className="w-10 h-10 bg-green-100 dark:bg-green-950/50 rounded-lg flex items-center justify-center flex-shrink-0">
            <PiggyBank className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          
          <div className="flex-1 space-y-2">
            <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
              Hey! We detected you could save approximately $1,067 in the next 12 months
            </h4>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Start saving automatically with Goals
            </p>
            <Button size="sm" className="w-full text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-white border hover:bg-gray-50">
              Start Saving With Goals
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}