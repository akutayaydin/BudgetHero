import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { 
  Zap, 
  Trophy, 
  Target,
  ArrowLeft,
  ArrowRight,
  Star,
  CheckCircle,
  XCircle,
  Sparkles,
  ThumbsUp,
  Clock,
  Flame
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
    reasoning?: string;
  }>;
  meta: {
    confidence: number;
    needsReview: boolean;
    source: string;
  };
}

interface AdminCategory {
  id: string;
  name: string;
  icon?: string;
  color?: string;
}

interface GameStats {
  streak: number;
  score: number;
  categorized: number;
  remaining: number;
  accuracy: number;
}

export function CategorizationGame({ onComplete }: { onComplete?: () => void }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [gameStats, setGameStats] = useState<GameStats>({
    streak: 0,
    score: 0,
    categorized: 0,
    remaining: 0,
    accuracy: 100
  });
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showFeedback, setShowFeedback] = useState<string | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get transactions needing review (uncategorized)
  const { data: reviewTransactions = [], isLoading, refetch } = useQuery<ReviewTransaction[]>({
    queryKey: ["/api/transactions/review"],
    enabled: gameStarted,
  });

  // Get admin categories for selection
  const { data: adminCategories = [] } = useQuery<AdminCategory[]>({
    queryKey: ["/api/admin/categories"],
  });

  // Apply category mutation
  const applyMutation = useMutation({
    mutationFn: async (data: {
      transactionId: string;
      adminCategoryId: string;
      subcategoryName?: string;
    }) => {
      const response = await fetch("/api/transactions/apply-category-fix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to apply category");
      return response.json();
    },
    onSuccess: () => {
      // Update stats
      setGameStats(prev => ({
        ...prev,
        categorized: prev.categorized + 1,
        remaining: prev.remaining - 1,
        streak: prev.streak + 1,
        score: prev.score + (10 * (prev.streak + 1)) // Bonus for streak
      }));
      
      setShowFeedback('success');
      setTimeout(() => {
        setShowFeedback(null);
        if (currentIndex < reviewTransactions.length - 1) {
          setCurrentIndex(currentIndex + 1);
        } else {
          handleGameComplete();
        }
      }, 800);
    },
    onError: () => {
      setGameStats(prev => ({ ...prev, streak: 0 }));
      setShowFeedback('error');
      setTimeout(() => setShowFeedback(null), 1000);
    },
  });

  // Initialize game stats
  useEffect(() => {
    if (reviewTransactions.length > 0 && gameStarted) {
      setGameStats(prev => ({
        ...prev,
        remaining: reviewTransactions.length,
        categorized: 0
      }));
    }
  }, [reviewTransactions, gameStarted]);

  const startGame = () => {
    setGameStarted(true);
    setStartTime(new Date());
    setCurrentIndex(0);
    refetch();
  };

  const handleGameComplete = () => {
    const timeTaken = startTime ? Math.floor((Date.now() - startTime.getTime()) / 1000) : 0;
    setGameCompleted(true);
    
    toast({
      title: "🎉 Categorization Complete!",
      description: `Categorized ${gameStats.categorized} transactions in ${timeTaken}s with a ${gameStats.streak} streak!`,
    });
    
    queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
    onComplete?.();
  };

  const handleCategorySelect = (categoryId: string) => {
    if (!currentTransaction || applyMutation.isPending) return;
    
    applyMutation.mutate({
      transactionId: currentTransaction.transaction.id,
      adminCategoryId: categoryId,
    });
  };

  const handleSkip = () => {
    setGameStats(prev => ({ ...prev, streak: 0 }));
    if (currentIndex < reviewTransactions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      handleGameComplete();
    }
  };

  if (isLoading && gameStarted) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Sparkles className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p>Loading transactions...</p>
        </div>
      </div>
    );
  }

  const currentTransaction = reviewTransactions[currentIndex];
  const progress = reviewTransactions.length > 0 ? ((currentIndex + 1) / reviewTransactions.length) * 100 : 0;

  // Game start screen
  if (!gameStarted) {
    return (
      <Card className="max-w-lg mx-auto">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Target className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl">Transaction Categorizer</CardTitle>
          <p className="text-muted-foreground">
            Help improve your spending insights by quickly categorizing uncategorized transactions
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Zap className="w-6 h-6 mx-auto mb-2 text-blue-600" />
              <p className="font-semibold">Quick & Fun</p>
              <p className="text-sm text-muted-foreground">Swipe-based gameplay</p>
            </div>
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <Trophy className="w-6 h-6 mx-auto mb-2 text-green-600" />
              <p className="font-semibold">Earn Streaks</p>
              <p className="text-sm text-muted-foreground">Build combos for bonus points</p>
            </div>
          </div>
          
          <div className="text-center">
            <p className="text-lg font-semibold mb-2">
              {reviewTransactions.length} transactions need categorization
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Estimated time: {Math.ceil(reviewTransactions.length / 3)} minutes
            </p>
          </div>
          
          <Button onClick={startGame} className="w-full" size="lg">
            <Sparkles className="w-4 h-4 mr-2" />
            Start Categorizing
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Game completion screen
  if (gameCompleted) {
    const timeTaken = startTime ? Math.floor((Date.now() - startTime.getTime()) / 1000) : 0;
    
    return (
      <Card className="max-w-lg mx-auto">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl">Mission Complete!</CardTitle>
          <p className="text-muted-foreground">
            All transactions have been categorized
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <CheckCircle className="w-5 h-5 mx-auto mb-1 text-blue-600" />
              <p className="font-semibold">{gameStats.categorized}</p>
              <p className="text-xs text-muted-foreground">Categorized</p>
            </div>
            <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <Flame className="w-5 h-5 mx-auto mb-1 text-orange-600" />
              <p className="font-semibold">{gameStats.streak}</p>
              <p className="text-xs text-muted-foreground">Best Streak</p>
            </div>
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <Clock className="w-5 h-5 mx-auto mb-1 text-green-600" />
              <p className="font-semibold">{timeTaken}s</p>
              <p className="text-xs text-muted-foreground">Time</p>
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {gameStats.score} points
            </div>
            <p className="text-sm text-muted-foreground">
              Great job! Your spending insights are now more accurate.
            </p>
          </div>
          
          <Button onClick={() => window.location.reload()} className="w-full" variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Main game interface
  if (!currentTransaction) {
    return (
      <Card className="max-w-lg mx-auto">
        <CardContent className="text-center p-8">
          <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-600" />
          <p>No transactions need categorization!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-4">
      {/* Game Stats Header */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Flame className={`w-4 h-4 ${gameStats.streak > 0 ? 'text-orange-500' : 'text-gray-400'}`} />
              <span className="font-semibold">{gameStats.streak} streak</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-500" />
              <span className="font-semibold">{gameStats.score} pts</span>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
            <span>{gameStats.categorized} categorized</span>
            <span>{gameStats.remaining} remaining</span>
          </div>
          <Progress value={progress} className="h-2" />
        </CardContent>
      </Card>

      {/* Transaction Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentTransaction.transaction.id}
          initial={{ x: 300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -300, opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="relative overflow-hidden">
            {/* Feedback Overlay */}
            <AnimatePresence>
              {showFeedback && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={`absolute inset-0 flex items-center justify-center z-10 ${
                    showFeedback === 'success' 
                      ? 'bg-green-500/90 text-white' 
                      : 'bg-red-500/90 text-white'
                  }`}
                >
                  {showFeedback === 'success' ? (
                    <div className="text-center">
                      <CheckCircle className="w-12 h-12 mx-auto mb-2" />
                      <p className="font-semibold">Perfect!</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <XCircle className="w-12 h-12 mx-auto mb-2" />
                      <p className="font-semibold">Try again</p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">
                    {currentTransaction.transaction.description}
                  </CardTitle>
                  {currentTransaction.transaction.merchant && (
                    <p className="text-sm text-muted-foreground">
                      {currentTransaction.transaction.merchant}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">
                    {parseFloat(currentTransaction.transaction.amount) > 0 ? '+' : '-'}${Math.abs(parseFloat(currentTransaction.transaction.amount))}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(currentTransaction.transaction.date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Quick Category Suggestions */}
              {currentTransaction.suggestedCategories.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">AI Suggestions:</p>
                  <div className="grid grid-cols-1 gap-2">
                    {currentTransaction.suggestedCategories.slice(0, 2).map((suggestion) => (
                      <Button
                        key={suggestion.adminCategoryId}
                        variant="outline"
                        className="justify-between h-auto p-3"
                        onClick={() => handleCategorySelect(suggestion.adminCategoryId)}
                        disabled={applyMutation.isPending}
                      >
                        <div className="text-left">
                          <p className="font-medium">{suggestion.adminCategoryName}</p>
                          {suggestion.reasoning && (
                            <p className="text-xs text-muted-foreground">{suggestion.reasoning}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">
                            {Math.round(suggestion.confidence * 100)}%
                          </Badge>
                          <ThumbsUp className="w-4 h-4" />
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Popular Categories */}
              <div>
                <p className="text-sm font-medium mb-2">Popular Categories:</p>
                <div className="grid grid-cols-2 gap-2">
                  {adminCategories.filter(cat =>
                    ['Auto & Transport', 'Shopping', 'Food & Drink', 'Bills & Utilities', 'Software & Tech', 'Refunds & Compensation'].includes(cat.name)
                  ).map((category) => (
                    <Button
                      key={category.id}
                      variant="ghost"
                      className="h-auto p-2 text-left"
                      onClick={() => handleCategorySelect(category.id)}
                      disabled={applyMutation.isPending}
                    >
                      <span className="truncate">{category.name}</span>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={handleSkip}
                  disabled={applyMutation.isPending}
                  className="flex-1"
                >
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Skip
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}