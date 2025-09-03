import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Crown, CreditCard, Calendar, AlertTriangle, RefreshCw, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";

interface SubscriptionStatus {
  subscriptionPlan: string;
  subscriptionStatus: string;
  isTrialActive: boolean;
  trialEndsAt: string | null;
  isSubscriptionActive: boolean;
  subscriptionEndsAt: string | null;
  hasStripeSubscription: boolean;
}

export function BillingStatus() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch subscription status
  const { data: status, isLoading } = useQuery<SubscriptionStatus>({
    queryKey: ['/api/subscription/status'],
  });

  // Cancel subscription mutation
  const cancelSubscription = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/subscription/cancel", {});
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/subscription/status'] });
      toast({
        title: "Subscription Cancelled",
        description: data.message,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel subscription",
        variant: "destructive",
      });
    },
  });

  // Reactivate subscription mutation
  const reactivateSubscription = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/subscription/reactivate", {});
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/subscription/status'] });
      toast({
        title: "Subscription Reactivated",
        description: data.message,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reactivate subscription",
        variant: "destructive",
      });
    },
  });

  const handleCancel = () => {
    if (confirm("Are you sure you want to cancel your subscription? You'll still have access until the end of your billing period.")) {
      cancelSubscription.mutate();
    }
  };

  const handleReactivate = () => {
    reactivateSubscription.mutate();
  };

  const getStatusBadge = () => {
    if (!status) return null;
    
    if (status.isTrialActive) {
      return <Badge variant="secondary"><Crown className="w-3 h-3 mr-1" />Free Trial</Badge>;
    }
    
    if (status.subscriptionStatus === 'active' && status.isSubscriptionActive) {
      return <Badge variant="default"><CheckCircle className="w-3 h-3 mr-1" />Active</Badge>;
    }
    
    if (status.subscriptionStatus === 'cancel_at_period_end') {
      return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Cancelling</Badge>;
    }
    
    if (status.subscriptionPlan === 'free') {
      return <Badge variant="outline">Free Plan</Badge>;
    }
    
    return <Badge variant="secondary">Inactive</Badge>;
  };

  const getStatusDescription = () => {
    if (!status) return '';
    
    if (status.isTrialActive && status.trialEndsAt) {
      const trialEnd = new Date(status.trialEndsAt);
      const daysLeft = Math.ceil((trialEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      return `Your free trial ends in ${daysLeft} days on ${format(trialEnd, 'MMMM d, yyyy')}`;
    }
    
    if (status.subscriptionStatus === 'cancel_at_period_end' && status.subscriptionEndsAt) {
      const subscriptionEnd = new Date(status.subscriptionEndsAt);
      return `Your subscription will end on ${format(subscriptionEnd, 'MMMM d, yyyy')}`;
    }
    
    if (status.isSubscriptionActive && status.subscriptionEndsAt) {
      const nextBilling = new Date(status.subscriptionEndsAt);
      return `Next billing date: ${format(nextBilling, 'MMMM d, yyyy')}`;
    }
    
    if (status.subscriptionPlan === 'free') {
      return 'You are currently on the free plan with basic features';
    }
    
    return 'Your subscription is not active';
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/4"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const showUpgradeAlert = status?.subscriptionPlan === 'free' || !status?.isSubscriptionActive;
  const showTrialAlert = status?.isTrialActive && status?.trialEndsAt;
  const showCancellationAlert = status?.subscriptionStatus === 'cancel_at_period_end';

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Subscription Status
              </CardTitle>
              <CardDescription className="mt-2">
                {getStatusDescription()}
              </CardDescription>
            </div>
            {getStatusBadge()}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Current Plan</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                {status?.subscriptionPlan || 'Free'}
              </p>
            </div>
            {status?.subscriptionPlan === 'pro' && (
              <Crown className="w-5 h-5 text-yellow-500" />
            )}
          </div>

          <Separator />

          {/* Action Buttons */}
          <div className="flex gap-2">
            {status?.subscriptionStatus === 'cancel_at_period_end' ? (
              <Button
                onClick={handleReactivate}
                disabled={reactivateSubscription.isPending}
                className="flex items-center gap-2"
              >
                {reactivateSubscription.isPending ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                Reactivate Subscription
              </Button>
            ) : status?.hasStripeSubscription ? (
              <Button
                variant="destructive"
                onClick={handleCancel}
                disabled={cancelSubscription.isPending}
                className="flex items-center gap-2"
              >
                {cancelSubscription.isPending ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
                Cancel Subscription
              </Button>
            ) : null}

            {(status?.subscriptionPlan === 'free' || !status?.isSubscriptionActive) && (
              <Button asChild>
                <a href="/subscription/plans">
                  <Crown className="w-4 h-4 mr-2" />
                  Upgrade to Pro
                </a>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
      {showTrialAlert && status?.trialEndsAt && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Your free trial ends in {Math.ceil((new Date(status.trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days. 
            <a href="/subscription/plans" className="ml-1 text-blue-600 dark:text-blue-400 hover:underline">
              Upgrade now to continue using Pro features
            </a>
          </AlertDescription>
        </Alert>
      )}

      {showCancellationAlert && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            Your subscription is set to cancel at the end of the billing period. You'll still have access to Pro features until then.
          </AlertDescription>
        </Alert>
      )}

      {showUpgradeAlert && (
        <Alert>
          <Crown className="h-4 w-4" />
          <AlertDescription>
            Upgrade to Pro to unlock unlimited bank accounts, 2-year history, AI categorization, and more advanced features.
            <a href="/subscription/plans" className="ml-1 text-blue-600 dark:text-blue-400 hover:underline">
              View plans
            </a>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}