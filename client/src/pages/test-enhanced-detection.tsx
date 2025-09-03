import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { apiRequest } from '@/lib/queryClient';
import { Loader2, Search, AlertCircle, CheckCircle2, TrendingUp } from 'lucide-react';

interface EnhancedDetectionResult {
  isRecurring: boolean;
  merchant: {
    merchantId: string;
    merchantName: string;
    category: string;
    transactionType: string;
    frequency: string;
    confidence: 'high' | 'medium' | 'low';
    matchType: 'exact' | 'fuzzy' | 'pattern' | 'keyword';
    score: number;
  } | null;
  pattern: {
    isRecurring: boolean;
    frequency: string;
    confidence: number;
    daysBetween: number[];
    amountVariation: number;
    consistencyScore: number;
  } | null;
  finalConfidence: number;
  recommendations: string[];
}

export default function TestEnhancedDetection() {
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0]
  });

  const enhancedDetectionMutation = useMutation({
    mutationFn: (data: { description: string; amount: number; date: string }) =>
      apiRequest('/api/enhanced-recurring-detection', 'POST', data),
  });

  const merchantMatchMutation = useMutation({
    mutationFn: (data: { description: string; amount: number }) =>
      apiRequest('/api/match-merchant', 'POST', data),
  });

  const handleTestDetection = () => {
    if (!formData.description || !formData.amount) return;
    
    enhancedDetectionMutation.mutate({
      description: formData.description,
      amount: parseFloat(formData.amount),
      date: formData.date
    });
  };

  const handleTestMerchantMatch = () => {
    if (!formData.description || !formData.amount) return;
    
    merchantMatchMutation.mutate({
      description: formData.description,
      amount: parseFloat(formData.amount)
    });
  };

  const getConfidenceColor = (confidence: string | number) => {
    const value = typeof confidence === 'string' ? 
      (confidence === 'high' ? 0.9 : confidence === 'medium' ? 0.6 : 0.3) : 
      confidence;
    
    if (value >= 0.8) return 'bg-green-500';
    if (value >= 0.6) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const detectionResult = enhancedDetectionMutation.data as EnhancedDetectionResult | undefined;
  const merchantResult = merchantMatchMutation.data as { merchantMatch: any } | undefined;

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Enhanced Recurring Detection Test</h1>
        <p className="text-muted-foreground">
          Test the new two-step detection algorithm with merchant matching and pattern analysis
        </p>
      </div>

      {/* Input Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Transaction Input
          </CardTitle>
          <CardDescription>
            Enter transaction details to test the enhanced detection algorithm
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="description">Transaction Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="e.g., NETFLIX.COM or KROGER #1234"
                data-testid="input-description"
              />
            </div>
            <div>
              <Label htmlFor="amount">Amount ($)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="15.99"
                data-testid="input-amount"
              />
            </div>
            <div>
              <Label htmlFor="date">Transaction Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                data-testid="input-date"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={handleTestDetection}
              disabled={enhancedDetectionMutation.isPending || !formData.description || !formData.amount}
              data-testid="button-test-detection"
            >
              {enhancedDetectionMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Full Detection Test
            </Button>
            <Button 
              variant="outline"
              onClick={handleTestMerchantMatch}
              disabled={merchantMatchMutation.isPending || !formData.description || !formData.amount}
              data-testid="button-test-merchant"
            >
              {merchantMatchMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Merchant Match Only
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Detection Results */}
      {detectionResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {detectionResult.isRecurring ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-yellow-500" />
              )}
              Enhanced Detection Results
            </CardTitle>
            <CardDescription>
              Two-step analysis: Merchant matching + Pattern verification
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Overall Result */}
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <h3 className="font-semibold">Recurring Transaction Detected</h3>
                <p className="text-sm text-muted-foreground">
                  Final Confidence: {(detectionResult.finalConfidence * 100).toFixed(1)}%
                </p>
              </div>
              <Badge variant={detectionResult.isRecurring ? "default" : "secondary"}>
                {detectionResult.isRecurring ? "RECURRING" : "NOT RECURRING"}
              </Badge>
            </div>

            {/* Step A: Merchant Match */}
            {detectionResult.merchant && (
              <div className="space-y-3">
                <h4 className="font-semibold text-lg">Step A: Merchant Match</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Merchant</Label>
                    <p className="font-medium">{detectionResult.merchant.merchantName}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Category</Label>
                    <p className="font-medium">{detectionResult.merchant.category}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Match Type</Label>
                    <Badge variant="outline">{detectionResult.merchant.matchType}</Badge>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Match Score</Label>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${getConfidenceColor(detectionResult.merchant.score)}`} />
                      <span className="font-medium">{(detectionResult.merchant.score * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Expected Frequency</Label>
                    <p className="font-medium capitalize">{detectionResult.merchant.frequency}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Transaction Type</Label>
                    <p className="font-medium capitalize">{detectionResult.merchant.transactionType}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Step B: Pattern Analysis */}
            {detectionResult.pattern && (
              <div className="space-y-3">
                <h4 className="font-semibold text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Step B: Pattern Analysis
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Pattern Confidence</Label>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${getConfidenceColor(detectionResult.pattern.confidence)}`} />
                      <span className="font-medium">{(detectionResult.pattern.confidence * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Detected Frequency</Label>
                    <p className="font-medium capitalize">{detectionResult.pattern.frequency}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Amount Variation</Label>
                    <p className="font-medium">{(detectionResult.pattern.amountVariation * 100).toFixed(1)}%</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Consistency Score</Label>
                    <p className="font-medium">{(detectionResult.pattern.consistencyScore * 100).toFixed(1)}%</p>
                  </div>
                </div>
                {detectionResult.pattern.daysBetween.length > 0 && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Days Between Transactions</Label>
                    <p className="font-medium">{detectionResult.pattern.daysBetween.join(', ')} days</p>
                  </div>
                )}
              </div>
            )}

            {/* Recommendations */}
            {detectionResult.recommendations && detectionResult.recommendations.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold">Recommendations</h4>
                <ul className="space-y-1">
                  {detectionResult.recommendations.map((rec, index) => (
                    <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Merchant Match Only Results */}
      {merchantResult?.merchantMatch && !detectionResult && (
        <Card>
          <CardHeader>
            <CardTitle>Merchant Match Results</CardTitle>
            <CardDescription>Step A only: Transaction to merchant mapping</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Merchant</Label>
                <p className="font-medium">{merchantResult.merchantMatch.merchantName}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Category</Label>
                <p className="font-medium">{merchantResult.merchantMatch.category}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Match Type</Label>
                <Badge variant="outline">{merchantResult.merchantMatch.matchType}</Badge>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Match Score</Label>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${getConfidenceColor(merchantResult.merchantMatch.score)}`} />
                  <span className="font-medium">{(merchantResult.merchantMatch.score * 100).toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sample Test Cases */}
      <Card>
        <CardHeader>
          <CardTitle>Sample Test Cases</CardTitle>
          <CardDescription>Try these examples to test different scenarios</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { desc: "NETFLIX.COM", amount: "15.99", label: "Streaming Service" },
              { desc: "AMAZON PRIME", amount: "12.99", label: "E-commerce Subscription" },
              { desc: "KROGER #1234", amount: "87.42", label: "Grocery Store" },
              { desc: "STARBUCKS", amount: "5.25", label: "Coffee Shop" },
              { desc: "MICROSOFT*OFFICE365", amount: "9.99", label: "Software Subscription" },
              { desc: "UNKNOWN MERCHANT XYZ", amount: "25.00", label: "Unknown Merchant" }
            ].map((example, index) => (
              <Button
                key={index}
                variant="outline"
                className="justify-start h-auto p-3"
                onClick={() => setFormData({
                  description: example.desc,
                  amount: example.amount,
                  date: formData.date
                })}
                data-testid={`button-example-${index}`}
              >
                <div className="text-left">
                  <div className="font-medium">{example.desc}</div>
                  <div className="text-sm text-muted-foreground">${example.amount} - {example.label}</div>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}