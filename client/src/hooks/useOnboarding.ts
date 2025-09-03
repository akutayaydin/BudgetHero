import { useQuery } from "@tanstack/react-query";

interface User {
  id: string;
  email: string;
  onboardingCompleted?: boolean;
  onboardingSkipped?: boolean;
}

export function useOnboarding() {
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/auth/user"],
  });

  return {
    shouldShowOnboarding: user && !user.onboardingCompleted && !user.onboardingSkipped,
    isInLimitedMode: user && !user.onboardingCompleted && user.onboardingSkipped,
    isLoading
  };
}