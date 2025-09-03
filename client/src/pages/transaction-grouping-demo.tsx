import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { EnhancedRecurringReview } from "@/components/enhanced-recurring-review";
import { Search, ArrowRight } from "lucide-react";

function TransactionGroupingDemo() {
  const [selectedMerchant, setSelectedMerchant] = useState<string>("");
  const [showReview, setShowReview] = useState(false);

  // Common merchants that users might have mixed transaction types
  const commonMerchants = [
    { name: "Amazon", description: "Prime subscriptions + purchases" },
    { name: "Apple", description: "App Store + subscriptions" },
    { name: "Google", description: "Storage + app purchases" },
    { name: "Microsoft", description: "Office 365 + purchases" },
    { name: "Spotify", description: "Premium + gift cards" },
    { name: "Netflix", description: "Subscriptions + gift cards" }
  ];

  const handleMerchantSelect = (merchantName: string) => {
    setSelectedMerchant(merchantName);
    setShowReview(true);
  };

  const handleCustomMerchant = () => {
    if (selectedMerchant.trim()) {
      setShowReview(true);
    }
  };

  const handleComplete = () => {
    setShowReview(false);
    setSelectedMerchant("");
  };

  const handleCancel = () => {
    setShowReview(false);
  };

  if (showReview && selectedMerchant) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="text-center">
            <Button 
              variant="outline" 
              onClick={handleCancel}
              className="mb-4"
              data-testid="button-back-to-demo"
            >
              ← Back to Demo
            </Button>
          </div>
          
          <EnhancedRecurringReview
            isOpen={true}
            onClose={handleComplete}
            merchantName={selectedMerchant}
            transactionId="demo-transaction"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-gray-900">
            Manual Recurring Selection Demo
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Experience our new manual selection approach that gives you complete control over 
            which transactions are marked as recurring, solving the Amazon Prime mixed transaction problem.
          </p>
        </div>

        {/* Problem Description */}
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">The Problem We Solved</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-700">
              Previously, when users had transactions from merchants like Amazon, the system would group 
              ALL transactions together - both recurring Prime subscriptions ($14.99/month) and one-time 
              purchases (varying amounts) - forcing users to make one decision for everything.
            </p>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-semibold text-red-800 mb-2">Example Amazon Transactions (Old System):</h4>
              <div className="space-y-1 text-sm text-red-700">
                <div>• Jul 27: Amazon Prime - $14.99 (recurring subscription)</div>
                <div>• Jun 27: Amazon Prime - $14.99 (recurring subscription)</div>
                <div>• Apr 14: Amazon Prime - $16.28 (one-time purchase)</div>
                <div>• Apr 14: Amazon Prime Refund - +$8.14 (refund)</div>
                <div>• Mar 3: Amazon Prime - $16.28 (one-time purchase)</div>
              </div>
              <p className="text-red-600 font-medium mt-3">
                ❌ All grouped together - user must decide for ALL at once
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Solution Description */}
        <Card>
          <CardHeader>
            <CardTitle className="text-green-600">Our Manual Selection Solution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-700">
              Instead of automatic grouping, our new system gives you complete control. When reviewing 
              transactions, you can manually select which ones are truly recurring and apply smart rules 
              for future transactions.
            </p>
            
            <div className="grid grid-cols-1 md:grid-2 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-800 mb-2">✅ Manual Selection</h4>
                <p className="text-sm text-green-700">
                  Choose exactly which transactions are recurring with checkboxes and "Select All" options
                </p>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-2">🎯 Smart Rules</h4>
                <p className="text-sm text-blue-700">
                  Your selections automatically create rules for future transactions from the same merchant
                </p>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-600 font-medium">
                ✅ Users can now make separate decisions for each group!
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Try Demo Section */}
        <Card>
          <CardHeader>
            <CardTitle>Try the Demo</CardTitle>
            <p className="text-gray-600">
              Select a merchant below to see how transactions are intelligently grouped, 
              or enter a custom merchant name.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Preset Merchants */}
            <div>
              <Label className="text-base font-medium mb-3 block">Popular Merchants</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {commonMerchants.map((merchant) => (
                  <Button
                    key={merchant.name}
                    variant="outline"
                    className="justify-between h-auto p-4"
                    onClick={() => handleMerchantSelect(merchant.name)}
                    data-testid={`button-demo-merchant-${merchant.name.toLowerCase()}`}
                  >
                    <div className="text-left">
                      <div className="font-medium">{merchant.name}</div>
                      <div className="text-sm text-gray-500">{merchant.description}</div>
                    </div>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                ))}
              </div>
            </div>

            {/* Custom Merchant */}
            <div className="border-t pt-6">
              <Label htmlFor="custom-merchant" className="text-base font-medium mb-3 block">
                Or Enter Custom Merchant
              </Label>
              <div className="flex space-x-3">
                <Input
                  id="custom-merchant"
                  placeholder="Enter merchant name (e.g., Starbucks, Uber)"
                  value={selectedMerchant}
                  onChange={(e) => setSelectedMerchant(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleCustomMerchant()}
                  data-testid="input-custom-merchant"
                />
                <Button 
                  onClick={handleCustomMerchant}
                  disabled={!selectedMerchant.trim()}
                  data-testid="button-analyze-custom-merchant"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Analyze
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <Card>
          <CardHeader>
            <CardTitle>Key Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900">Pattern Analysis</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Amount consistency detection</li>
                  <li>• Timing interval analysis</li>
                  <li>• Subscription keyword recognition</li>
                  <li>• Frequency pattern matching</li>
                </ul>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900">User Experience</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Separate decisions per group</li>
                  <li>• Smart suggestions provided</li>
                  <li>• Visual pattern indicators</li>
                  <li>• Bulk application options</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default TransactionGroupingDemo;