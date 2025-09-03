import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Crown, Check, Sparkles, Zap, Shield, Target, 
  TrendingUp, Clock, Heart, Users, ArrowRight 
} from "lucide-react";
import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Load Stripe
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

interface User {
  id: string;
  firstName?: string;
  username: string;
  subscriptionStatus: string;
  subscriptionPlan: string;
  trialEndsAt?: string;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: string;
  trialDays: number;
  features: string[];
  stripePriceId: string;
  isActive: boolean;
}

const CheckoutForm = ({ planId, isTrialAvailable }: { planId: string; isTrialAvailable: boolean }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!stripe || !elements) {
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/dashboard?upgrade=success`,
        },
      });

      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Payment Successful",
          description: isTrialAvailable ? "Your trial has started!" : "Welcome to Premium!",
        });
      }
    } catch (error: any) {
      toast({
        title: "Payment Error",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    }

    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <Button 
        type="submit" 
        disabled={!stripe || isLoading}
        className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
        data-testid="button-confirm-payment"
      >
        {isLoading ? "Processing..." : isTrialAvailable ? "Start Free Trial" : "Upgrade Now"}
      </Button>
    </form>
  );
};

export default function SubscriptionPlans() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user data
  const { data: user } = useQuery<User>({
    queryKey: ['/api/auth/user'],
  });

  // Fetch subscription plans
  const { data: plans = [] } = useQuery<SubscriptionPlan[]>({
    queryKey: ['/api/subscription/plans'],
  });

  // Start trial mutation
  const startTrialMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/subscription/start-trial"),
    onSuccess: () => {
      toast({
        title: "Trial Started!",
        description: "Your 7-day premium trial has begun. Enjoy all the features!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      queryClient.invalidateQueries({ queryKey: ['/api/subscription/status'] });
      window.location.href = "/dashboard";
    },
    onError: (error: any) => {
      toast({
        title: "Trial Start Failed",
        description: error.message || "Failed to start trial",
        variant: "destructive",
      });
    }
  });

  // Create payment intent mutation
  const createPaymentMutation = useMutation({
    mutationFn: async (planId: string) => {
      const response = await apiRequest("POST", "/api/create-payment-intent", { planId });
      const data = await response.json();
      return data;
    },
    onSuccess: (data) => {
      setClientSecret(data.clientSecret);
    },
    onError: (error: any) => {
      toast({
        title: "Payment Setup Failed",
        description: error.message || "Failed to setup payment",
        variant: "destructive",
      });
    }
  });

  const handlePlanSelect = async (plan: SubscriptionPlan) => {
    setSelectedPlan(plan.id);

    // If user is eligible for trial and this is a pro plan
    if (plan.name.toLowerCase() === 'pro' && plan.trialDays > 0 && 
        (!user?.trialEndsAt || user.subscriptionStatus === 'free')) {
      // Start trial directly
      startTrialMutation.mutate();
    } else {
      // Create payment intent for immediate payment
      createPaymentMutation.mutate(plan.id);
    }
  };

  const isTrialAvailable = (plan: SubscriptionPlan) => {
    return plan.trialDays > 0 && 
           (!user?.trialEndsAt || user.subscriptionStatus === 'free') &&
           plan.name.toLowerCase() === 'pro';
  };

  const currentUserPlan = user?.subscriptionPlan || 'free';
  const isTrialing = user?.subscriptionStatus === 'trialing';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <Crown className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Level Up Your Money
            </h1>
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Transform your financial future with BudgetHero's premium features. 
            {isTrialing ? " You're currently on a trial!" : " Start your free trial today!"}
          </p>
        </div>

        {/* Trial Status Banner */}
        {isTrialing && user?.trialEndsAt && (
          <Card className="mb-8 border-blue-200 dark:border-blue-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Sparkles className="w-8 h-8 text-blue-500" />
                <div>
                  <h3 className="font-semibold text-lg">You're on a Premium Trial!</h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Trial ends: {new Date(user.trialEndsAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Plans Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Free Plan */}
          <Card className={`relative ${currentUserPlan === 'free' && !isTrialing ? 'ring-2 ring-blue-300 dark:ring-blue-600' : ''}`}>
            <CardHeader className="text-center pb-2">
              <div className="w-16 h-16 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl">Free</CardTitle>
              <div className="text-3xl font-bold">$0<span className="text-lg font-normal text-gray-500">/month</span></div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                {[
                  "Basic transaction tracking",
                  "Simple budgeting tools", 
                  "1 bank account connection",
                  "30-day transaction history",
                  "Basic categorization"
                ].map((feature, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-500" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              <Button 
                variant="outline" 
                className="w-full"
                disabled={currentUserPlan === 'free' && !isTrialing}
                data-testid="button-current-plan"
              >
                {currentUserPlan === 'free' && !isTrialing ? "Current Plan" : "Downgrade"}
              </Button>
            </CardContent>
          </Card>

          {/* Pro Plans */}
          {plans.filter(plan => plan.isActive).map((plan) => {
            const isCurrentPlan = currentUserPlan === plan.name.toLowerCase();
            const trialAvailable = isTrialAvailable(plan);
            
            return (
              <Card 
                key={plan.id} 
                className={`relative ${isCurrentPlan ? 'ring-2 ring-purple-400 dark:ring-purple-600' : ''} ${plan.name.toLowerCase() === 'pro' ? 'border-purple-300 dark:border-purple-600' : ''}`}
              >
                {plan.name.toLowerCase() === 'pro' && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-1">
                      <Sparkles className="w-3 h-3 mr-1" />
                      Most Popular
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center pb-2">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Crown className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <div className="text-3xl font-bold">
                    ${plan.price}
                    <span className="text-lg font-normal text-gray-500">/{plan.interval}</span>
                  </div>
                  {trialAvailable && (
                    <Badge variant="secondary" className="mt-2">
                      <Heart className="w-3 h-3 mr-1" />
                      {plan.trialDays}-day free trial
                    </Badge>
                  )}
                </CardHeader>

                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-3">
                        <Check className="w-5 h-5 text-green-500" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button 
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
                    onClick={() => handlePlanSelect(plan)}
                    disabled={isCurrentPlan || startTrialMutation.isPending || createPaymentMutation.isPending}
                    data-testid={`button-select-${plan.name.toLowerCase()}`}
                  >
                    {isCurrentPlan ? "Current Plan" : 
                     trialAvailable ? (
                       <>
                         <Zap className="w-4 h-4 mr-2" />
                         Start Free Trial
                       </>
                     ) : (
                       <>
                         <ArrowRight className="w-4 h-4 mr-2" />
                         Upgrade Now
                       </>
                     )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Payment Form */}
        {clientSecret && selectedPlan && (
          <div className="max-w-md mx-auto mt-12">
            <Card>
              <CardHeader>
                <CardTitle>Complete Your Upgrade</CardTitle>
              </CardHeader>
              <CardContent>
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                  <CheckoutForm 
                    planId={selectedPlan} 
                    isTrialAvailable={false}
                  />
                </Elements>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Features Comparison */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-center mb-8">Why Upgrade to Premium?</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <TrendingUp className="w-12 h-12 text-blue-500 mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">Advanced Analytics</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Get AI-powered insights, spending trends, and predictive analytics to optimize your financial decisions.
              </p>
            </div>
            <div className="text-center">
              <Users className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">Unlimited Accounts</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Connect all your bank accounts, credit cards, and investment accounts in one place for complete visibility.
              </p>
            </div>
            <div className="text-center">
              <Target className="w-12 h-12 text-purple-500 mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">Smart Goals</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Set and track financial goals with gamified challenges and automated savings recommendations.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}