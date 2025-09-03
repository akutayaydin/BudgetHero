import { useQuery } from "@tanstack/react-query";
import { SubscriptionBannerMobile } from "./subscription-banner-mobile";
import { SubscriptionBannerDesktop } from "./subscription-banner-desktop";

interface SubscriptionStatus {
  subscriptionPlan: string;
  subscriptionStatus: string;
  isTrialActive: boolean;
  trialEndsAt?: string;
  isSubscriptionActive: boolean;
  subscriptionEndsAt?: string;
}

interface User {
  id: string;
  firstName?: string;
  username: string;
}

export function SubscriptionBanner() {
  // Get user data
  const { data: user } = useQuery<User>({
    queryKey: ['/api/auth/user'],
  });

  // Get subscription status
  const { data: subscriptionStatus } = useQuery<SubscriptionStatus>({
    queryKey: ['/api/subscription/status'],
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  // Don't show banner if user has active subscription
  if (!subscriptionStatus?.isTrialActive ||
      subscriptionStatus?.subscriptionStatus === 'active') {
    return null;
  }

  return (
    <>
      <SubscriptionBannerMobile 
        subscriptionStatus={{
          subscriptionPlan: subscriptionStatus.subscriptionPlan,
          trialEndsAt: subscriptionStatus.trialEndsAt || null
        }}
        user={user || null}
      />
      <SubscriptionBannerDesktop 
        subscriptionStatus={{
          subscriptionPlan: subscriptionStatus.subscriptionPlan,
          trialEndsAt: subscriptionStatus.trialEndsAt || null
        }}
        user={user || null}
      />
    </>
  );
}