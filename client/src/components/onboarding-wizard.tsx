import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Circle, ArrowRight, ArrowLeft, Sparkles, Upload, Building2, Target, BarChart3, Zap, Shield } from "lucide-react";
import { PlaidLink } from "@/components/PlaidLink";
import FileUploadZone from "@/components/file-upload-zone";
import { BudgetWizard } from "./budget-wizard";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  completed: boolean;
  optional?: boolean;
}

interface OnboardingWizardProps {
  onComplete: () => void;
  onSkip?: () => void;
}

export function OnboardingWizard({ onComplete, onSkip }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [budgetCreatedInSession, setBudgetCreatedInSession] = useState(false);
  const queryClient = useQueryClient();

  // Fetch user's current data to determine completed steps
  const { data: accounts = [] } = useQuery<any[]>({
    queryKey: ["/api/accounts"],
    enabled: true
  });

  const { data: transactions = [] } = useQuery<any[]>({
    queryKey: ["/api/transactions"],
    enabled: true
  });

  const { data: budgets = [] } = useQuery<any[]>({
    queryKey: ["/api/budgets"],
    enabled: true
  });

  // Mark onboarding as completed
  const completeOnboardingMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/user/onboarding-complete"),
    onSuccess: () => {
      console.log('Onboarding completed successfully');
      // Force cache refresh and update
      queryClient.setQueryData(["/api/auth/user"], (oldData: any) => ({
        ...oldData,
        onboardingCompleted: true,
        onboardingSkipped: false
      }));
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      // Close the wizard
      onComplete();
    },
    onError: (error) => {
      console.error('Failed to complete onboarding:', error);
      // Still close wizard and redirect even if backend fails
      onComplete();
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 100);
    }
  });

  // Mark onboarding as skipped (Limited Mode)
  const skipOnboardingMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/user/onboarding-skip"),
    onSuccess: () => {
      console.log('Onboarding skipped - entering Limited Mode');
      // Force cache refresh and update
      queryClient.setQueryData(["/api/auth/user"], (oldData: any) => ({
        ...oldData,
        onboardingSkipped: true,
        onboardingCompleted: false
      }));
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      // Close the wizard
      if (onSkip) onSkip();
    },
    onError: (error) => {
      console.error('Failed to skip onboarding:', error);
      // Still enter limited mode even if backend fails
      if (onSkip) onSkip();
    }
  });

  const steps: OnboardingStep[] = [
    {
      id: "welcome",
      title: "Welcome to BudgetHero!",
      description: "Let's get your personal finance management set up in just a few steps.",
      icon: Sparkles,
      completed: true
    },
    {
      id: "connect-accounts",
      title: "Connect Your Bank Accounts",
      description: "Securely link your bank accounts for automatic transaction import.",
      icon: Building2,
      completed: accounts.length > 0,
      optional: true
    },
    {
      id: "upload-data",
      title: "Upload Transaction Data",
      description: "Import your existing financial data from CSV files.",
      icon: Upload,
      completed: transactions.length > 0,
      optional: true
    },
    {
      id: "smart-categorize",
      title: "Categorize Your Transactions",
      description: "Let our AI automatically organize your spending into categories.",
      icon: Zap,
      completed: transactions.some(t => t.category && t.category !== 'Other'),
      optional: true
    },
    {
      id: "create-budget",
      title: "Set Up Your Budget",
      description: "Create spending limits to track your financial goals.",
      icon: Target,
      completed: budgets.length > 0,
      optional: true
    },
    {
      id: "explore-dashboard",
      title: "Explore Your Dashboard",
      description: "See your financial insights and start making informed decisions.",
      icon: BarChart3,
      completed: false
    }
  ];

  // Update completed steps based on data
  useEffect(() => {
    const newCompletedSteps = new Set<string>();
    steps.forEach(step => {
      if (step.completed) {
        newCompletedSteps.add(step.id);
      }
    });
    setCompletedSteps(newCompletedSteps);
  }, [accounts.length, transactions.length, budgets.length]);

  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;
  const canProceed = () => {
    const stepId = currentStepData.id;
    
    switch (stepId) {
      case "welcome":
        return true;
      case "connect-accounts":
        return accounts.length > 0 || currentStepData.optional;
      case "upload-data":
        return transactions.length > 0 || currentStepData.optional;
      case "smart-categorize":
        return true; // Can always categorize (or skip)
      case "create-budget":
        return true; // Budget wizard handles its own completion
      case "explore-dashboard":
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Complete Setup button - mark onboarding as complete and redirect
      completeOnboardingMutation.mutate();
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 500);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    // Skip Setup button - enter Limited Mode
    skipOnboardingMutation.mutate();
  };

  const renderStepContent = () => {
    switch (currentStepData.id) {
      case "welcome":
        return (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Take Control of Your Finances</h2>
              <p className="text-gray-600 max-w-md mx-auto">
                BudgetHero helps you understand your spending, set budgets, and achieve your financial goals.
                This quick setup will get you started in minutes.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <Building2 className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-900">Connect Banks</p>
                <p className="text-xs text-gray-600">Automatic imports</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <Zap className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-900">AI Categories</p>
                <p className="text-xs text-gray-600">Smart organization</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <Target className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-900">Track Goals</p>
                <p className="text-xs text-gray-600">Budget insights</p>
              </div>
            </div>
          </div>
        );

      case "connect-accounts":
        return (
          <div className="space-y-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">🏦 Connect Your Bank Account</h3>
              <p className="text-gray-600 max-w-lg mx-auto mb-6">
                <strong>⚡ Quick Setup:</strong> Securely link your bank account to automatically import transactions and keep your financial data current. 
                This saves hours of manual data entry and gives you real-time insights.
              </p>
              
              {/* Benefits Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto mb-8">
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="text-green-600 text-2xl mb-2">⚡</div>
                  <p className="text-sm font-medium text-gray-900">Automatic Sync</p>
                  <p className="text-xs text-gray-600">Real-time updates</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="text-blue-600 text-2xl mb-2">🔒</div>
                  <p className="text-sm font-medium text-gray-900">Bank-Level Security</p>
                  <p className="text-xs text-gray-600">256-bit encryption</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <div className="text-purple-600 text-2xl mb-2">📊</div>
                  <p className="text-sm font-medium text-gray-900">Smart Insights</p>
                  <p className="text-xs text-gray-600">AI-powered analysis</p>
                </div>
              </div>
            </div>
            
            {accounts.length > 0 ? (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 text-center max-w-md mx-auto">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h4 className="font-semibold text-green-900 mb-2">Perfect! {accounts.length} Account{accounts.length > 1 ? 's' : ''} Connected</h4>
                <p className="text-green-700 text-sm">Your bank account is linked and transactions will sync automatically.</p>
                <div className="mt-4 pt-4 border-t border-green-200">
                  <PlaidLink
                    onSuccess={() => {
                      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
                      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
                    }}
                    buttonText="Connect Another Account"
                    variant="outline"
                  />
                </div>
              </div>
            ) : (
              <div className="max-w-lg mx-auto space-y-6">
                <div className="text-center">
                  <PlaidLink
                    onSuccess={() => {
                      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
                      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
                    }}
                    buttonText="Connect Your Bank Account"
                  />
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                  <h4 className="font-medium text-blue-900 mb-3 flex items-center">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-2 flex-shrink-0">
                      <span className="text-blue-600 text-sm">🔒</span>
                    </div>
                    Your data is completely secure
                  </h4>
                  <ul className="text-sm text-blue-800 space-y-2">
                    <li className="flex items-start">
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <span>Bank-level 256-bit encryption protects your information</span>
                    </li>
                    <li className="flex items-start">
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <span>We never store your bank login credentials</span>
                    </li>
                    <li className="flex items-start">
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <span>Read-only access - we can't move or access your money</span>
                    </li>
                    <li className="flex items-start">
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <span>Used by millions and trusted by major financial institutions</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="font-medium text-gray-900 mb-2">What happens next:</h4>
                  <div className="text-sm text-gray-700 space-y-1">
                    <div className="flex items-center">
                      <span className="font-medium text-blue-600 mr-2">1.</span>
                      <span>Choose your bank from 12,000+ supported institutions</span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-medium text-blue-600 mr-2">2.</span>
                      <span>Log in securely through your bank's official login</span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-medium text-blue-600 mr-2">3.</span>
                      <span>Your recent transactions will import automatically</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case "upload-data":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Upload className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Upload Your Transaction Data</h3>
              <p className="text-gray-600 mb-6">
                Upload CSV files from your bank or existing financial software to get a complete picture.
              </p>
            </div>
            
            {transactions.length > 0 ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
                <h4 className="font-semibold text-green-900 mb-2">Perfect! You have {transactions.length} transactions</h4>
                <p className="text-green-700 text-sm">Your financial data is ready for analysis.</p>
              </div>
            ) : (
              <div className="max-w-lg mx-auto">
                <FileUploadZone />
                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-bold text-sm">💡</span>
                      </div>
                    </div>
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-blue-900">How to get your transaction data:</h4>
                      <div className="mt-2 text-xs text-blue-700">
                        <ul className="list-disc list-inside space-y-1">
                          <li>Download CSV from your bank's website or mobile app</li>
                          <li>Export from apps like Mint, YNAB, or Personal Capital</li>
                          <li>Use bank statements in CSV or Excel format</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case "smart-categorize":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Zap className="w-16 h-16 text-yellow-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Smart Transaction Categorization</h3>
              <p className="text-gray-600 mb-6">
                Our AI will automatically categorize your transactions to help you understand your spending patterns.
              </p>
            </div>
            
            {transactions.length === 0 ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                <Circle className="w-12 h-12 text-yellow-600 mx-auto mb-3" />
                <h4 className="font-semibold text-yellow-900 mb-2">No transactions found</h4>
                <p className="text-yellow-700 text-sm">Connect accounts or upload data first to use smart categorization.</p>
              </div>
            ) : transactions.some(t => t.category && t.category !== 'Other') ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
                <h4 className="font-semibold text-green-900 mb-2">Transactions Categorized!</h4>
                <p className="text-green-700 text-sm">Your spending is organized and ready for insights.</p>
              </div>
            ) : (
              <div className="text-center">
                <Button
                  onClick={() => {
                    // Trigger smart categorization
                    apiRequest("POST", "/api/transactions/recategorize")
                      .then(() => {
                        queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
                      });
                  }}
                  className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-6 py-3"
                >
                  <Zap className="w-5 h-5 mr-2" />
                  Smart Categorize My Transactions
                </Button>
                <p className="text-sm text-gray-500 mt-3">
                  This will automatically categorize transactions like "Dining", "Transport", "Groceries", etc.
                </p>
              </div>
            )}
          </div>
        );

      case "create-budget":
        return budgetCreatedInSession ? (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Budget Created Successfully!</h3>
              <p className="text-gray-600 mb-6">
                Your personalized budget is ready and will help you track spending and achieve your financial goals.
              </p>
            </div>
            
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 text-center max-w-md mx-auto">
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
              <h4 className="font-semibold text-green-900 mb-2">Perfect! Budget Categories Set Up</h4>
              <p className="text-green-700 text-sm">Your spending plan is personalized for your household and goals.</p>
            </div>
          </div>
        ) : budgets.length > 0 ? (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Budget Already Set Up</h3>
              <p className="text-gray-600 mb-6">
                You already have {budgets.length} budget categories configured. You can create a new budget or proceed to the next step.
              </p>
            </div>
            
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-6 text-center max-w-md mx-auto">
              <Target className="w-12 h-12 text-blue-600 mx-auto mb-3" />
              <h4 className="font-semibold text-blue-900 mb-2">Existing Budget Found</h4>
              <p className="text-blue-700 text-sm">Your current budget has {budgets.length} categories already set up.</p>
              <div className="mt-4">
                <BudgetWizard 
                  onComplete={(generatedBudgets) => {
                    // Create budgets via API
                    Promise.all(
                      generatedBudgets.map(budget =>
                        apiRequest("POST", "/api/budgets", budget)
                      )
                    ).then(() => {
                      queryClient.invalidateQueries({ queryKey: ["/api/budgets"] });
                      setBudgetCreatedInSession(true);
                      // Don't move to next step automatically, let user proceed when ready
                    });
                  }}
                />
              </div>
            </div>
          </div>
        ) : (
          <BudgetWizard 
            onComplete={(generatedBudgets) => {
              // Create budgets via API
              Promise.all(
                generatedBudgets.map(budget =>
                  apiRequest("POST", "/api/budgets", budget)
                )
              ).then(() => {
                queryClient.invalidateQueries({ queryKey: ["/api/budgets"] });
                setBudgetCreatedInSession(true);
                // Move to next step after successful creation
                setCurrentStep(currentStep + 1);
              });
            }}
          />
        );

      case "explore-dashboard":
        return (
          <div className="space-y-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Congratulations! You're All Set!</h3>
              <p className="text-lg text-gray-600 mb-6 max-w-md mx-auto">
                Your BudgetHero is ready to help you take control of your finances. Let's explore what you can do next.
              </p>
            </div>
            
            <div className="space-y-4 max-w-md mx-auto">
              <Button 
                onClick={() => {
                  // Mark onboarding complete and redirect to dashboard
                  completeOnboardingMutation.mutate();
                  // Force immediate redirect
                  setTimeout(() => {
                    window.location.href = '/dashboard';
                  }, 500);
                }}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-4 text-lg font-semibold shadow-lg"
              >
                <BarChart3 className="w-6 h-6 mr-3" />
                View My Financial Dashboard
              </Button>
              
              <Button 
                onClick={() => window.location.href = '/transactions'}
                variant="outline"
                className="w-full py-4 text-lg border-2 hover:bg-gray-50"
              >
                <Upload className="w-6 h-6 mr-3" />
                Manage My Transactions
              </Button>
              
              <Button 
                onClick={() => window.location.href = '/budgets'}
                variant="outline"
                className="w-full py-4 text-lg border-2 hover:bg-gray-50"
              >
                <Target className="w-6 h-6 mr-3" />
                Set Up Budgets & Goals
              </Button>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 max-w-lg mx-auto">
              <h4 className="font-semibold text-gray-900 mb-3 text-center">What happens next:</h4>
              <div className="space-y-3 text-sm">
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                    <span className="text-blue-600 font-bold text-xs">1</span>
                  </div>
                  <span className="text-gray-700">Your transactions will automatically categorize as you use the app</span>
                </div>
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                    <span className="text-purple-600 font-bold text-xs">2</span>
                  </div>
                  <span className="text-gray-700">Connected accounts will sync new transactions automatically</span>
                </div>
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                    <span className="text-green-600 font-bold text-xs">3</span>
                  </div>
                  <span className="text-gray-700">You'll get insights and alerts to help you reach your financial goals</span>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="text-center">
          <div className="flex items-center justify-between mb-4">
            <Badge variant="secondary" className="text-xs">
              Step {currentStep + 1} of {steps.length}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              className="text-gray-500 hover:text-gray-700"
            >
              Skip Setup
            </Button>
          </div>
          <Progress value={progress} className="w-full mb-4" />
          <CardTitle className="text-2xl">{currentStepData.title}</CardTitle>
          <CardDescription className="text-base">
            {currentStepData.description}
            {currentStepData.optional && (
              <Badge variant="outline" className="ml-2 text-xs">Optional</Badge>
            )}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {renderStepContent()}
          
          {/* Navigation */}
          <div className="flex items-center justify-between pt-6 border-t">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="flex items-center"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>
            
            <div className="flex space-x-2">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index <= currentStep ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
            
            <Button
              onClick={handleNext}
              disabled={!canProceed() && !currentStepData.optional && currentStep !== steps.length - 1}
              className="flex items-center"
            >
              {currentStep === steps.length - 1 ? 'Complete Setup' : 'Next'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}