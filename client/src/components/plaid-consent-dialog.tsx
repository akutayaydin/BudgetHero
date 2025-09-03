import { useState } from "react";
import { Link } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Lock, Eye, UserCheck, FileText, AlertCircle } from "lucide-react";

interface PlaidConsentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConsent: () => void;
  onCancel: () => void;
}

export function PlaidConsentDialog({ 
  open, 
  onOpenChange, 
  onConsent, 
  onCancel 
}: PlaidConsentDialogProps) {
  const [hasConsented, setHasConsented] = useState(false);

  const handleConsent = () => {
    if (hasConsented) {
      onConsent();
      onOpenChange(false);
    }
  };

  const handleCancel = () => {
    setHasConsented(false);
    onCancel();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-plaid-consent">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg">
              <Shield className="h-6 w-6 text-white" />
            </div>
            Connect Your Financial Account
          </DialogTitle>
          <DialogDescription className="text-base mt-2">
            Before connecting your bank account, please review and agree to how we'll handle your financial data.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Main Consent Text */}
          <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <UserCheck className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    <strong>By continuing, you agree to connect your financial account(s) through Plaid.</strong>
                  </p>
                </div>
                
                <div className="flex items-start gap-3">
                  <Eye className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    BudgetHero will securely access your account balances, transactions, and other financial data 
                    to provide personalized budgeting tools.
                  </p>
                </div>
                
                <div className="flex items-start gap-3">
                  <Lock className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    Your data is encrypted and never shared with third parties without your permission.
                  </p>
                </div>
                
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    You can disconnect your account at any time through your settings.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* What We Collect */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 dark:text-white">What data we collect:</h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-purple-600 rounded-full mt-2 flex-shrink-0"></span>
                Account balances and transaction history
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-purple-600 rounded-full mt-2 flex-shrink-0"></span>
                Account names, types, and basic information
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-purple-600 rounded-full mt-2 flex-shrink-0"></span>
                Merchant names and transaction categories
              </li>
            </ul>
          </div>

          {/* How We Use It */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 dark:text-white">How we use your data:</h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-green-600 rounded-full mt-2 flex-shrink-0"></span>
                Create personalized budgets and spending insights
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-green-600 rounded-full mt-2 flex-shrink-0"></span>
                Automatically categorize transactions
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-green-600 rounded-full mt-2 flex-shrink-0"></span>
                Track financial health and provide recommendations
              </li>
            </ul>
          </div>

          {/* Privacy Policy Link */}
          <div className="flex items-center gap-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <FileText className="h-5 w-5 text-purple-600" />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              For complete details, read our{" "}
              <a 
                href="/privacy" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 underline"
                data-testid="link-privacy-policy-consent"
              >
                Privacy Policy
              </a>
            </span>
          </div>

          {/* Consent Checkbox */}
          <div className="flex items-start space-x-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <Checkbox
              id="consent"
              checked={hasConsented}
              onCheckedChange={(checked) => setHasConsented(checked === true)}
              className="mt-0.5"
              data-testid="checkbox-consent"
            />
            <div className="grid gap-1.5 leading-none">
              <label
                htmlFor="consent"
                className="text-sm font-medium text-gray-900 dark:text-white cursor-pointer"
              >
                I understand and agree to the data collection and processing described above
              </label>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                You must agree to continue with account connection
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-3">
          <Button 
            variant="outline" 
            onClick={handleCancel}
            data-testid="button-cancel-consent"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleConsent}
            disabled={!hasConsented}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            data-testid="button-agree-consent"
          >
            Agree & Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}