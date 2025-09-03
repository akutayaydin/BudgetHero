import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronRight, Wallet, CreditCard, DollarSign, Building2 } from "lucide-react";
import { PlaidLink } from "@/components/PlaidLink";
import { useToast } from "@/hooks/use-toast";

interface Account {
  id: string;
  name: string;
  type: string;
  currentBalance: string | number;
  availableBalance?: string | number;
  officialName?: string;
  mask?: string;
}

interface AccountsSectionProps {
  className?: string;
}

export function AccountsSection({ className }: AccountsSectionProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const { toast } = useToast();

  const { data: accounts = [] } = useQuery<Account[]>({
    queryKey: ['/api/accounts'],
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  // Group accounts by type
  const checkingAccounts = accounts.filter(acc => acc.type === 'depository');
  const creditAccounts = accounts.filter(acc => acc.type === 'credit');
  
  const totalChecking = checkingAccounts.reduce((sum, acc) => {
    const balance = typeof acc.currentBalance === 'string' ? parseFloat(acc.currentBalance) : acc.currentBalance;
    return sum + (isNaN(balance) ? 0 : balance);
  }, 0);
  const totalCredit = creditAccounts.reduce((sum, acc) => {
    const balance = typeof acc.currentBalance === 'string' ? parseFloat(acc.currentBalance) : acc.currentBalance;
    return sum + Math.abs(isNaN(balance) ? 0 : balance);
  }, 0);
  const netCash = totalChecking - totalCredit;

  const isExpanded = (section: string) => expandedSections.includes(section);

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Wallet className="w-5 h-5" />
          Accounts
        </CardTitle>
        <PlaidLink 
          buttonText="Add Account"
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium px-3 py-1.5 text-xs shadow-md transition-all"
          size="sm"
          onSuccess={() => {
            toast({
              title: "Account Connected!",
              description: "Your bank account has been linked successfully",
            });
          }}
        />
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Checking Section */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg">
          <Button
            variant="ghost"
            className="w-full justify-between p-4 h-auto"
            onClick={() => toggleSection('checking')}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-950/30 rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-left">
                <h4 className="font-medium text-gray-900 dark:text-white">Checking</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {checkingAccounts.length} account{checkingAccounts.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900 dark:text-white">
                ${totalChecking.toLocaleString()}
              </span>
              {isExpanded('checking') ? 
                <ChevronDown className="w-4 h-4" /> : 
                <ChevronRight className="w-4 h-4" />
              }
            </div>
          </Button>
          
          {isExpanded('checking') && (
            <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-3">
              {checkingAccounts.map((account) => (
                <div key={account.id} className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{account.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {account.officialName} •••{account.mask}
                    </p>
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    ${((typeof account.currentBalance === 'string' ? parseFloat(account.currentBalance) : account.currentBalance) || 0).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Card Balance Section */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg">
          <Button
            variant="ghost"
            className="w-full justify-between p-4 h-auto"
            onClick={() => toggleSection('credit')}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-950/30 rounded-lg flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div className="text-left">
                <h4 className="font-medium text-gray-900 dark:text-white">Card Balance</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {creditAccounts.length} card{creditAccounts.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-red-600 dark:text-red-400">
                ${totalCredit.toLocaleString()}
              </span>
              {isExpanded('credit') ? 
                <ChevronDown className="w-4 h-4" /> : 
                <ChevronRight className="w-4 h-4" />
              }
            </div>
          </Button>
          
          {isExpanded('credit') && (
            <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-3">
              {creditAccounts.map((account) => (
                <div key={account.id} className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{account.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {account.officialName} •••{account.mask}
                    </p>
                  </div>
                  <span className="font-semibold text-red-600 dark:text-red-400">
                    ${Math.abs(account.currentBalance).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Net Cash Section */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-950/30 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Net Cash</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Checking minus credit balances
                  </p>
                </div>
              </div>
              <span className={`font-semibold ${netCash >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                ${netCash.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}