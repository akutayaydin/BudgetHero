import { BillingStatus } from "@/components/billing-status";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CreditCard, FileText, Shield, HelpCircle } from "lucide-react";

export default function Billing() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Billing & Subscription
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage your subscription, billing information, and payment methods
          </p>
        </div>

        <Separator />

        {/* Subscription Status */}
        <BillingStatus />

        <Separator />

        {/* Billing Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Billing Information
            </CardTitle>
            <CardDescription>
              Your billing and payment information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <p className="font-medium mb-1">Payment Method</p>
                <p className="text-sm text-muted-foreground">
                  Managed through Stripe Checkout
                </p>
              </div>
              <div>
                <p className="font-medium mb-1">Billing Cycle</p>
                <p className="text-sm text-muted-foreground">
                  Monthly billing
                </p>
              </div>
            </div>
            
            <div className="pt-4">
              <Button variant="outline" className="flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Update Payment Method
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                Payment methods are managed securely through Stripe
              </p>
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Invoice History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Invoice History
            </CardTitle>
            <CardDescription>
              Download your invoices and billing statements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                No invoices available yet
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Invoices will appear here after your first billing cycle
              </p>
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Security & Privacy */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Security & Privacy
            </CardTitle>
            <CardDescription>
              Your payment data is protected
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div className="flex items-start gap-3">
                <Shield className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">PCI DSS Compliant</p>
                  <p className="text-gray-600 dark:text-gray-400">
                    All payments processed securely through Stripe
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Shield className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">256-bit SSL Encryption</p>
                  <p className="text-gray-600 dark:text-gray-400">
                    Your data is encrypted in transit and at rest
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Shield className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">No Card Storage</p>
                  <p className="text-gray-600 dark:text-gray-400">
                    We never store your payment card information
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Shield className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Fraud Protection</p>
                  <p className="text-gray-600 dark:text-gray-400">
                    Advanced fraud detection and prevention
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Support */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5" />
              Need Help?
            </CardTitle>
            <CardDescription>
              Get support with your subscription or billing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <Button variant="outline" className="justify-start h-auto p-4">
                <div className="text-left">
                  <p className="font-medium">Billing Support</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Get help with payments and invoices
                  </p>
                </div>
              </Button>
              <Button variant="outline" className="justify-start h-auto p-4">
                <div className="text-left">
                  <p className="font-medium">Account Questions</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Questions about features and usage
                  </p>
                </div>
              </Button>
            </div>
            <div className="text-center pt-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Email us at{' '}
                <a 
                  href="mailto:support@yourfinanceapp.com" 
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  support@yourfinanceapp.com
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}