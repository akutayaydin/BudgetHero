import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { PlaidLink } from "@/components/PlaidLink";
import { useToast } from "@/hooks/use-toast";

import { SubscriptionBanner } from "@/components/subscription-banner";
import { DashboardGraphs } from "@/components/dashboard-graphs";
import { CompleteSetupSection } from "@/components/complete-setup-section";
import OverviewDashboard from "@/components/overview-dashboard";

export default function Dashboard() {
  const { toast } = useToast();

  // Fetch accounts to check if user has any connected
  const { data: accounts = [] } = useQuery<any[]>({
    queryKey: ["/api/accounts"],
  });

  return (
    <>
      <div className="p-4 sm:p-6 space-y-6 bg-background min-h-full">
        <SubscriptionBanner />
        <OverviewDashboard />

        <DashboardGraphs />
        <CompleteSetupSection />

        {accounts.length === 0 && (
          <Card className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border border-green-200 dark:border-green-700">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-center sm:text-left">
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    🏦 Connect Your Bank Account
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    Link your bank accounts to automatically import transactions
                    and get real-time insights into your spending patterns.
                  </p>
                </div>
                <PlaidLink
                  buttonText="Connect Bank Account"
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold px-6 py-3 shadow-lg whitespace-nowrap"
                  size="default"
                  onSuccess={() => {
                    toast({
                      title: "🎉 Bank Account Connected!",
                      description:
                        "Your transactions are being imported automatically",
                    });
                  }}
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>

    </>
  );
}
