import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { PlaidLink } from "@/components/PlaidLink";
import { useToast } from "@/hooks/use-toast";

import { SubscriptionBanner } from "@/components/subscription-banner";
import { DashboardGraphs } from "@/components/dashboard-graphs";
import { AccountsSection } from "@/components/accounts-section";
import { SavingsInvestmentsSection } from "@/components/savings-investments-section";
import { CompleteSetupSection } from "@/components/complete-setup-section";
import { UpcomingBillsWidget } from "@/components/upcoming-bills-widget";
import { RecentTransactionsSection } from "@/components/recent-transactions-section";
import { BudgetSection } from "@/components/budget-section";
import { SmartRecommendations } from "@/components/smart-recommendations";
import FinancialTipsSidebar from "@/components/financial-tips-sidebar";
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

        {/* === Two independent columns (no sticky, no sidebar scroll) === */}
        <div className="xl:flex xl:items-start xl:gap-6">
          {/* LEFT column: graphs + recent transactions (won't move when Accounts expands) */}
          <div className="flex-1 min-w-0 space-y-6">
            <DashboardGraphs />
            <RecentTransactionsSection />
          </div>

          {/* RIGHT column: accounts + other right-side widgets */}
          <div className="w-full xl:w-[380px] shrink-0 mt-6 xl:mt-0 space-y-6">
            <AccountsSection />

            {/* Example: Category Review / any other right-side card */}
            <Card>
              <CardContent className="p-6">
                <div className="text-sm text-muted-foreground mb-3">
                  <UpcomingBillsWidget />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Rest of the page */}
        <SavingsInvestmentsSection />
        <CompleteSetupSection />

        <BudgetSection />
        <SmartRecommendations />

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

      <FinancialTipsSidebar />
    </>
  );
}
