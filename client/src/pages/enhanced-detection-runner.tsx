import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, Clock, AlertCircle, Zap } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface DetectionResult {
  transactionId: string;
  description: string;
  detectedMerchant: string;
  detectedCategory: string;
  confidence: number;
  updated: boolean;
}

interface BatchResult {
  success: boolean;
  totalTransactions: number;
  detectedRecurring: number;
  updatedTransactions: number;
  results: DetectionResult[];
}

export default function EnhancedDetectionRunner() {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<BatchResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runEnhancedDetection = async () => {
    setIsRunning(true);
    setError(null);
    setResult(null);

    try {
      console.log('Starting enhanced detection batch process...');
      
      const response = await apiRequest('/api/transactions/enhanced-detection-batch', 'POST');

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const batchResult: BatchResult = await response.json();
      setResult(batchResult);
      
      console.log('Enhanced detection completed:', batchResult);
    } catch (err) {
      console.error('Enhanced detection error:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Enhanced Recurring Detection</h1>
        <p className="text-muted-foreground">
          Run the enhanced two-step detection algorithm on all your existing transactions to identify and categorize recurring payments automatically.
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            Enhanced Detection Algorithm
          </CardTitle>
          <CardDescription>
            This powerful algorithm uses fuzzy matching, pattern recognition, and historical analysis to detect recurring transactions with high accuracy.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Step A: Transaction Matching</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Normalized text comparison</li>
                  <li>• Fuzzy matching (Levenshtein distance)</li>
                  <li>• Pattern recognition with regex</li>
                  <li>• Keyword analysis</li>
                </ul>
              </div>
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Step B: Pattern Verification</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Time-based recurrence analysis</li>
                  <li>• Amount consistency checking</li>
                  <li>• Confidence scoring</li>
                  <li>• Smart recommendations</li>
                </ul>
              </div>
            </div>

            <Button 
              onClick={runEnhancedDetection} 
              disabled={isRunning}
              className="w-full"
              data-testid="button-run-detection"
            >
              {isRunning ? (
                <>
                  <Clock className="mr-2 h-4 w-4 animate-spin" />
                  Running Detection...
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  Run Enhanced Detection on All Transactions
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert className="mb-6" variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription data-testid="text-error">
            Error: {error}
          </AlertDescription>
        </Alert>
      )}

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Detection Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold" data-testid="text-total-transactions">
                  {result.totalTransactions}
                </div>
                <div className="text-sm text-muted-foreground">Total Transactions</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-blue-600" data-testid="text-detected-recurring">
                  {result.detectedRecurring}
                </div>
                <div className="text-sm text-muted-foreground">Recurring Detected</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-green-600" data-testid="text-updated-transactions">
                  {result.updatedTransactions}
                </div>
                <div className="text-sm text-muted-foreground">Transactions Updated</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-purple-600" data-testid="text-success-rate">
                  {result.totalTransactions > 0 ? 
                    Math.round((result.detectedRecurring / result.totalTransactions) * 100) : 0}%
                </div>
                <div className="text-sm text-muted-foreground">Detection Rate</div>
              </div>
            </div>

            {result.results && result.results.length > 0 && (
              <div>
                <h3 className="font-semibold mb-4">Detection Details (Sample)</h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {result.results.map((detection, index) => (
                    <div 
                      key={detection.transactionId} 
                      className="flex items-center justify-between p-3 border rounded-lg"
                      data-testid={`detection-result-${index}`}
                    >
                      <div className="flex-1">
                        <div className="font-medium text-sm">
                          {detection.description}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Detected: {detection.detectedMerchant} → {detection.detectedCategory}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" data-testid={`confidence-${index}`}>
                          {(detection.confidence * 100).toFixed(1)}%
                        </Badge>
                        {detection.updated ? (
                          <Badge className="bg-green-100 text-green-800" data-testid={`status-updated-${index}`}>
                            Updated
                          </Badge>
                        ) : (
                          <Badge variant="secondary" data-testid={`status-detected-${index}`}>
                            Detected
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Alert className="mt-4">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Enhanced detection completed successfully! Transactions with high confidence scores have been automatically updated with improved merchant and category information.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}
    </div>
  );
}