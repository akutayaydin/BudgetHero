import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Zap, Home, CreditCard, Smartphone } from "lucide-react";
import { formatCurrency } from "@/lib/financial-utils";
import { getClearbitLogoUrl, getMerchantInitials } from "@/lib/merchant-logo";

interface Subscription {
  id: string;
  name: string;
  amount?: number;
  frequency: string;
  category: string;
  isTrial?: boolean;
  trialEndsAt?: string;
  merchantLogo?: string;
  nextDueDate?: string;
}

interface BillUtility {
  id: string;
  name: string;
  amount: number;
  frequency: string;
  category: string;
  merchantLogo?: string;
  nextDueDate?: string;
}

interface RecurringListProps {
  subscriptions: Subscription[];
  billsAndUtilities: BillUtility[];
  manualSubscriptions: Subscription[];
}

export default function RecurringList({ subscriptions, billsAndUtilities, manualSubscriptions }: RecurringListProps) {
  const getSubscriptionIcon = (name: string, category: string) => {
    const lowerName = name.toLowerCase();
    const lowerCategory = category.toLowerCase();
    
    if (lowerName.includes('netflix') || lowerName.includes('hulu') || lowerName.includes('disney') || 
        lowerName.includes('prime video') || lowerCategory.includes('streaming')) {
      return '🎬';
    }
    if (lowerName.includes('spotify') || lowerName.includes('apple music') || lowerName.includes('music')) {
      return '🎵';
    }
    if (lowerCategory.includes('software') || lowerCategory.includes('subscription')) {
      return '💻';
    }
    return '📱';
  };

  const getBillIcon = (name: string, category: string) => {
    const lowerName = name.toLowerCase();
    const lowerCategory = category.toLowerCase();
    
    if (lowerCategory.includes('utilities') || lowerName.includes('electric') || lowerName.includes('gas')) {
      return <Zap className="h-5 w-5" />;
    }
    if (lowerCategory.includes('rent') || lowerCategory.includes('mortgage')) {
      return <Home className="h-5 w-5" />;
    }
    if (lowerCategory.includes('credit') || lowerCategory.includes('loan')) {
      return <CreditCard className="h-5 w-5" />;
    }
    return <Smartphone className="h-5 w-5" />;
  };

  const totalSubscriptionCost = subscriptions.reduce((total, sub) => 
    total + (typeof sub.amount === 'number' ? sub.amount : 0), 0
  );

  const totalBillsCost = billsAndUtilities.reduce((total, bill) => total + bill.amount, 0);

  return (
    <div className="space-y-6">
      {/* Subscriptions Section */}
      <Card className="border-purple-200 dark:border-purple-700 shadow-lg hover:shadow-xl transition-shadow">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-t-lg">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-bold flex items-center gap-3">
              <div className="w-3 h-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full shadow-sm"></div>
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                {subscriptions.length} Subscriptions
              </span>
            </CardTitle>
            <div className="text-right">
              <div className="font-bold text-purple-700 dark:text-purple-300">
                {formatCurrency(totalSubscriptionCost)}
              </div>
              <div className="text-xs text-purple-600 dark:text-purple-400">per month</div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 max-h-80 overflow-y-auto" data-testid="content-subscriptions-list">
          {subscriptions.map((subscription) => (
            <div key={subscription.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
                  {subscription.merchantLogo || getClearbitLogoUrl(subscription.name) ? (
                    <img 
                      src={subscription.merchantLogo || getClearbitLogoUrl(subscription.name)} 
                      alt={`${subscription.name} logo`}
                      className="w-8 h-8 object-contain"
                      onError={(e) => {
                        // Fallback to initials on error
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const fallback = target.nextElementSibling as HTMLElement;
                        if (fallback) {
                          fallback.style.display = 'flex';
                          fallback.textContent = getMerchantInitials(subscription.name);
                        }
                      }}
                    />
                  ) : null}
                  <div className={`text-xs font-bold text-gray-600 dark:text-gray-300 ${subscription.merchantLogo || getClearbitLogoUrl(subscription.name) ? 'hidden' : 'flex'} items-center justify-center w-full h-full`}>
                    {getMerchantInitials(subscription.name)}
                  </div>
                </div>
                <div>
                  <div className="font-medium flex items-center gap-2">
                    {subscription.name}
                    {subscription.isTrial && (
                      <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                        Trial
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <div className="capitalize">{subscription.frequency}</div>
                    {subscription.nextDueDate && (
                      <div className="text-xs text-blue-600 dark:text-blue-400">
                        Due: {new Date(subscription.nextDueDate).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric'
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="font-bold">
                    {subscription.amount ? formatCurrency(subscription.amount) : 'Free'}
                  </div>
                  {subscription.isTrial && subscription.trialEndsAt && (
                    <div className="text-xs text-orange-600 dark:text-orange-400">
                      Trial ends {new Date(subscription.trialEndsAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          
          {subscriptions.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <div className="text-4xl mb-2">📱</div>
              <div>No subscriptions found</div>
              <div className="text-sm">Add your subscriptions to track spending</div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bills & Utilities Section */}
      <Card className="border-blue-200 dark:border-blue-700 shadow-lg hover:shadow-xl transition-shadow">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-t-lg">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-bold flex items-center gap-3">
              <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full shadow-sm"></div>
              <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                {billsAndUtilities.length} Bills & Utilities
              </span>
            </CardTitle>
            <div className="text-right">
              <div className="font-bold text-blue-700 dark:text-blue-300">
                {formatCurrency(totalBillsCost)}
              </div>
              <div className="text-xs text-blue-600 dark:text-blue-400">per month</div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 max-h-80 overflow-y-auto" data-testid="content-bills-list">
          {billsAndUtilities.map((bill) => (
            <div key={bill.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center overflow-hidden">
                  {bill.merchantLogo || getClearbitLogoUrl(bill.name) ? (
                    <img 
                      src={bill.merchantLogo || getClearbitLogoUrl(bill.name)} 
                      alt={`${bill.name} logo`}
                      className="w-8 h-8 object-contain"
                      onError={(e) => {
                        // Fallback to initials on error
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const fallback = target.nextElementSibling as HTMLElement;
                        if (fallback) {
                          fallback.style.display = 'flex';
                          fallback.textContent = getMerchantInitials(bill.name);
                        }
                      }}
                    />
                  ) : null}
                  <div className={`text-xs font-bold text-blue-600 dark:text-blue-300 ${bill.merchantLogo || getClearbitLogoUrl(bill.name) ? 'hidden' : 'flex'} items-center justify-center w-full h-full`}>
                    {getMerchantInitials(bill.name)}
                  </div>
                </div>
                <div>
                  <div className="font-medium">{bill.name}</div>
                  <div className="text-sm text-muted-foreground">
                    <div className="capitalize">{bill.frequency}</div>
                    {bill.nextDueDate && (
                      <div className="text-xs text-blue-600 dark:text-blue-400">
                        Due: {new Date(bill.nextDueDate).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric'
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="font-bold">{formatCurrency(bill.amount)}</div>
                </div>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          
          {billsAndUtilities.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <div className="text-4xl mb-2">🏠</div>
              <div>No bills found</div>
              <div className="text-sm">Connect your accounts to automatically detect recurring bills</div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}