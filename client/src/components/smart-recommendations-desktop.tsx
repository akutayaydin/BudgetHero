import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Lightbulb, TrendingDown, CreditCard, PiggyBank } from "lucide-react";

interface Recommendation {
  id: string;
  type: 'savings' | 'investment' | 'credit' | 'bill';
  title: string;
  description: string;
  amount?: string;
  icon: any;
  color: string;
  bgColor: string;
  buttonText: string;
}

const recommendations: Recommendation[] = [
  {
    id: "1",
    type: "savings",
    title: "Hey! We detected you could save approximately $1,067 in the next 12 months when using Goals.",
    description: "Start saving automatically with our smart Goals feature and reach your financial targets faster",
    icon: PiggyBank,
    color: "text-green-700",
    bgColor: "bg-green-50 dark:bg-green-950/30",
    buttonText: "Start Saving With Goals"
  },
  {
    id: "2", 
    type: "investment",
    title: "Start investing with as little as $1/day",
    description: "Harness the power of investing on any budget. Build wealth through diversified portfolios.",
    icon: TrendingDown,
    color: "text-blue-700",
    bgColor: "bg-blue-50 dark:bg-blue-950/30", 
    buttonText: "Learn More"
  },
  {
    id: "3",
    type: "credit",
    title: "Choosing a credit card just got easier",
    description: "Take a quick quiz to see which ones fit your lifestyle and spending patterns perfectly.",
    icon: CreditCard,
    color: "text-purple-700",
    bgColor: "bg-purple-50 dark:bg-purple-950/30",
    buttonText: "Get Started"
  }
];

export function SmartRecommendationsDesktop() {
  const [dismissedRecommendations, setDismissedRecommendations] = useState<string[]>([]);

  const dismissRecommendation = (id: string) => {
    setDismissedRecommendations(prev => [...prev, id]);
  };

  const visibleRecommendations = recommendations.filter(
    rec => !dismissedRecommendations.includes(rec.id)
  );

  if (visibleRecommendations.length === 0) {
    return null;
  }

  return (
    <div className="hidden md:block space-y-4 mb-6">
      {visibleRecommendations.map((recommendation) => {
        const IconComponent = recommendation.icon;
        
        return (
          <Card key={recommendation.id} className={`${recommendation.bgColor} border-l-4 border-l-current ${recommendation.color}`}>
            <CardContent className="p-6 relative">
              <div className="flex items-center justify-between mb-3">
                <Badge variant="secondary" className="text-xs font-medium uppercase tracking-wide">
                  <Lightbulb className="w-3 h-3 mr-1" />
                  SMART RECOMMENDATION
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => dismissRecommendation(recommendation.id)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <span className="text-xs mr-1">Dismiss</span>
                  <X className="w-3 h-3" />
                </Button>
              </div>

              <div className="flex gap-6 items-start">
                <div className={`w-16 h-16 ${recommendation.bgColor} rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <IconComponent className={`w-8 h-8 ${recommendation.color}`} />
                </div>
                
                <div className="flex-1 space-y-4">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {recommendation.title}
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400">
                      {recommendation.description}
                    </p>
                  </div>

                  <Button 
                    size="lg"
                    className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                    variant="outline"
                  >
                    {recommendation.buttonText}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}