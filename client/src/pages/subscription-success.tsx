import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Loader2, Crown, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function SubscriptionSuccess() {
  const [, navigate] = useLocation();
  const [isVerifying, setIsVerifying] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'success' | 'error'>('pending');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get session ID from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const sessionId = urlParams.get('session_id');

  // Verify checkout session
  const verifyCheckout = useMutation({
    mutationFn: async (sessionId: string) => {
      const response = await apiRequest("POST", "/api/subscription/verify", { sessionId });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        setVerificationStatus('success');
        // Invalidate subscription status to refetch updated data
        queryClient.invalidateQueries({ queryKey: ['/api/subscription/status'] });
        
        toast({
          title: "Welcome to Pro!",
          description: "Your subscription has been activated successfully.",
        });
      } else {
        setVerificationStatus('error');
        toast({
          title: "Verification Failed",
          description: "There was an issue verifying your payment. Please contact support.",
          variant: "destructive",
        });
      }
    },
    onError: () => {
      setVerificationStatus('error');
      toast({
        title: "Error",
        description: "Failed to verify your subscription. Please contact support.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsVerifying(false);
    },
  });

  useEffect(() => {
    if (sessionId) {
      verifyCheckout.mutate(sessionId);
    } else {
      setVerificationStatus('error');
      setIsVerifying(false);
      toast({
        title: "Invalid Session",
        description: "No session ID found. Please try subscribing again.",
        variant: "destructive",
      });
    }
  }, [sessionId]);

  const handleGetStarted = () => {
    navigate('/dashboard');
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Verifying Payment</h2>
            <p className="text-gray-600 dark:text-gray-400 text-center">
              Please wait while we confirm your subscription...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (verificationStatus === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="flex flex-col items-center justify-center p-8 text-center">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2 text-red-600 dark:text-red-400">
              Payment Verification Failed
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              We couldn't verify your payment. Please contact support or try again.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <Button variant="outline" className="flex-1" asChild>
                <Link href="/subscription/plans">Try Again</Link>
              </Button>
              <Button className="flex-1" asChild>
                <Link href="/dashboard">Go to Dashboard</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-12 flex items-center justify-center">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center pb-8">
            <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-6">
              <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
            </div>
            <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white mb-4">
              <Crown className="w-3 h-3 mr-1" />
              Pro Member
            </Badge>
            <CardTitle className="text-3xl font-bold mb-4">
              Welcome to Pro! 🎉
            </CardTitle>
            <CardDescription className="text-lg">
              Your subscription has been activated successfully. You now have access to all Pro features.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Pro Features Unlocked */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-6">
              <h3 className="font-semibold text-lg mb-4 flex items-center">
                <Crown className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
                Pro Features Unlocked
              </h3>
              <ul className="grid sm:grid-cols-2 gap-2 text-sm">
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                  Unlimited bank accounts
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                  2-year transaction history
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                  Smart AI categorization
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                  Advanced budgets & goals
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                  Real-time insights
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                  Custom reports
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                  Investment tracking
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                  Priority support
                </li>
              </ul>
            </div>

            {/* Next Steps */}
            <div className="text-center">
              <h3 className="font-semibold text-lg mb-4">Ready to Get Started?</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Explore your enhanced dashboard and start getting deeper insights into your financial data.
              </p>
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                onClick={handleGetStarted}
              >
                Go to Dashboard
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>

            {/* Support */}
            <div className="text-center pt-6 border-t">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Need help getting started? 
                <a href="mailto:support@yourapp.com" className="text-blue-600 dark:text-blue-400 ml-1 hover:underline">
                  Contact our support team
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}