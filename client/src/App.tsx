import { Switch, Route } from "wouter";
import { useEffect, useState } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { useAuth } from "@/hooks/useAuth";
import { useOnboarding } from "@/hooks/useOnboarding";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Privacy from "@/pages/privacy";
import Home from "@/pages/home";
import Upload from "@/pages/upload";
import Dashboard from "@/pages/dashboard";
import Transactions from "@/pages/transactions";
import Budgets from "@/pages/budgets";
import Bills from "@/pages/bills-simple";
import RecurringPage from "@/pages/recurring";
import Goals from "@/pages/goals";
import Reports from "@/pages/reports";
import Settings from "@/pages/settings";
import AccountSettings from "@/pages/account-settings";
import HealthPage from "@/pages/health";
import SpendingPage from "@/pages/spending";
import EarningsPage from "@/pages/earnings";
import SpendingCategoriesPage from "@/pages/spending-categories";
import { AccountsPage } from "@/pages/accounts";
import AssetsLiabilities from "@/pages/assets-liabilities";
import WealthManagement from "@/pages/wealth-management";
import ConnectBank from "@/pages/connect-bank";
import SubscriptionPlans from "@/pages/subscription-plans";
import SubscriptionSuccess from "@/pages/subscription-success";
import Billing from "@/pages/billing";

import Sidebar from "@/components/sidebar";
import MobileTopNav from "@/components/mobile-top-nav";
import { OnboardingWizard } from "@/components/onboarding-wizard";
import { SetupReminderBanner } from "@/components/setup-reminder-banner";

import AdminPanel from "@/pages/admin";
import AuthPage from "@/pages/auth-page";
import ResetPasswordPage from "@/pages/reset-password-page";
import { lazy, Suspense } from "react";

const AdminCategories = lazy(() => import("@/pages/admin-categories"));
const UserCategoryPreferences = lazy(() => import("@/pages/user-category-preferences"));
const AdminRecurringMerchants = lazy(() => import("@/pages/admin-recurring-merchants"));
const TestEnhancedDetection = lazy(() => import("@/pages/test-enhanced-detection"));
const EnhancedDetectionRunner = lazy(() => import("@/pages/enhanced-detection-runner"));
const RulesAutomationPage = lazy(() => import("@/pages/rules-automation-page"));
const TransactionGroupingDemo = lazy(() => import("@/pages/transaction-grouping-demo"));

function Router() {
  const { isAuthenticated, isLoading } = useAuth();
  const { shouldShowOnboarding, isInLimitedMode, isLoading: onboardingLoading } = useOnboarding();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);

  // Normal cache management
  useEffect(() => {
    if (isAuthenticated) {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    }
  }, [isAuthenticated]);

  if (isLoading || onboardingLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/auth" component={AuthPage} />
        <Route path="/reset-password" component={ResetPasswordPage} />
        <Route path="/privacy" component={Privacy} />
        <Route component={Landing} />
      </Switch>
    );
  }

  return (
    <div className="flex h-screen bg-background transition-colors duration-300">
      <Sidebar isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen} />
      <div className="flex-1 flex flex-col md:ml-0 ml-0">
        <MobileTopNav onMenuClick={() => setIsMobileMenuOpen(true)} />
        
        {/* Setup Reminder Banner for Limited Mode */}
        {isInLimitedMode && (
          <SetupReminderBanner onFinishSetup={() => setShowOnboardingModal(true)} />
        )}
        
        <div className="flex-1 overflow-auto bg-background">
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/upload" component={Upload} />
            <Route path="/dashboard" component={Dashboard} />
            <Route path="/accounts" component={AccountsPage} />
            <Route path="/assets-liabilities" component={AssetsLiabilities} />
            <Route path="/wealth-management" component={WealthManagement} />
            <Route path="/connect-bank" component={ConnectBank} />
            <Route path="/transactions" component={Transactions} />
            <Route path="/spending" component={SpendingPage} />
            <Route path="/earnings" component={EarningsPage} />
            <Route path="/spending-categories" component={SpendingCategoriesPage} />
            <Route path="/budgets" component={Budgets} />
            <Route path="/bills" component={Bills} />
            <Route path="/recurring" component={RecurringPage} />

            <Route path="/rules-automation">
              <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
                <RulesAutomationPage />
              </Suspense>
            </Route>
            <Route path="/goals" component={Goals} />
            <Route path="/reports" component={Reports} />
            <Route path="/health" component={HealthPage} />
            <Route path="/settings" component={Settings} />
            <Route path="/profile" component={AccountSettings} />
            <Route path="/subscription/plans" component={SubscriptionPlans} />
            <Route path="/subscription/success" component={SubscriptionSuccess} />
            <Route path="/billing" component={Billing} />
            <Route path="/admin" component={AdminPanel} />
            <Route path="/admin/categories">
              <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
                <AdminCategories />
              </Suspense>
            </Route>
            <Route path="/admin/recurring-merchants">
              <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
                <AdminRecurringMerchants />
              </Suspense>
            </Route>
            <Route path="/test-detection">
              <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
                <TestEnhancedDetection />
              </Suspense>
            </Route>
            <Route path="/enhanced-detection">
              <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
                <EnhancedDetectionRunner />
              </Suspense>
            </Route>
            <Route path="/categories">
              <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
                <UserCategoryPreferences />
              </Suspense>
            </Route>
            <Route path="/demo/transaction-grouping">
              <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
                <TransactionGroupingDemo />
              </Suspense>
            </Route>
            <Route path="/privacy" component={Privacy} />
            <Route component={NotFound} />
          </Switch>
        </div>
      </div>
      

      
      {/* Onboarding Wizard - Show for first time or when manually triggered */}
      {(shouldShowOnboarding || showOnboardingModal) && (
        <OnboardingWizard
          onComplete={() => {
            setShowOnboardingModal(false);
            // Force immediate cache update and refresh
            queryClient.setQueryData(["/api/auth/user"], (oldData: any) => ({
              ...oldData,
              onboardingCompleted: true,
              onboardingSkipped: false
            }));
            queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
          }}
          onSkip={() => {
            setShowOnboardingModal(false);
            // Mark as skipped (Limited Mode)
            queryClient.setQueryData(["/api/auth/user"], (oldData: any) => ({
              ...oldData,
              onboardingSkipped: true
            }));
            queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
          }}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
