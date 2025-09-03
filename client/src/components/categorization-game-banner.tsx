import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { Target, Sparkles, ArrowRight, Trophy, Clock } from 'lucide-react';

interface ReviewTransaction {
  transaction: {
    id: string;
    description: string;
    merchant?: string;
    amount: string;
    date: string;
  };
  suggestedCategories: Array<{
    adminCategoryId: string;
    adminCategoryName: string;
    confidence: number;
  }>;
}

export function CategorizationGameBanner({ onStartGame }: { onStartGame: () => void }) {
  const { data: reviewTransactions = [], isLoading, error } = useQuery<ReviewTransaction[]>({
    queryKey: ["/api/transactions/review"],
    staleTime: 0, // Always fetch fresh data
    refetchOnWindowFocus: true,
    retry: 3
  });

  // Log for debugging
  if (error) {
    console.log("Review transactions query error:", error);
  }
  if (reviewTransactions) {
    console.log("Review transactions data:", reviewTransactions.length, reviewTransactions);
  }

  const uncategorizedCount = reviewTransactions.length;

  // Don't show banner if no uncategorized transactions
  if (isLoading || uncategorizedCount === 0) {
    return null;
  }

  const estimatedTime = Math.ceil(uncategorizedCount / 3); // ~3 transactions per minute

  return (
    <Card className="border-l-4 border-l-purple-500 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
              <Target className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold">Improve Your Insights</h3>
              <p className="text-sm text-muted-foreground">
                {uncategorizedCount} transactions need categorization
              </p>
            </div>
            <Badge variant="secondary" className="gap-1 ml-2">
              <Sparkles className="w-3 h-3" />
              ~{estimatedTime} min
            </Badge>
          </div>
          
          <Button onClick={onStartGame} className="gap-2">
            <Target className="w-4 h-4" />
            Start Game
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}