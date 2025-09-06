import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronRight, Wallet, CreditCard, DollarSign, Building2, Plus } from "lucide-react";
import { PlaidLink } from "@/components/PlaidLink";
import { useToast } from "@/hooks/use-toast";

interface Account {
  id: string;
  name: string;
  type: string;
  subtype?: string;
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

  const handlePlaidSuccess = () => {
    toast({
      title: "Account Connected!",
      description: "Your bank account has been linked successfully",
    });
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  // Group accounts by type
  const checkingAccounts = accounts.filter(acc => acc.type === 'depository' && acc.subtype !== 'savings');
  const creditAccounts = accounts.filter(acc => acc.type === 'credit');


  const isCheckingEmpty = checkingAccounts.length === 0;
  const isCreditEmpty = creditAccounts.length === 0;
  const hasAnyAccount = !isCheckingEmpty || !isCreditEmpty;
  
  
  const savingsAccounts = accounts.filter(acc => acc.type === 'depository' && acc.subtype === 'savings');
  const investmentAccounts = accounts.filter(acc => acc.type === 'investment');
  
  const totalChecking = checkingAccounts.reduce((sum, acc) => {
    const balance = typeof acc.currentBalance === 'string' ? parseFloat(acc.currentBalance) : acc.currentBalance;
    return sum + (isNaN(balance) ? 0 : balance);
  }, 0);
  const totalCredit = creditAccounts.reduce((sum, acc) => {
    const balance = typeof acc.currentBalance === 'string' ? parseFloat(acc.currentBalance) : acc.currentBalance;
    return sum + Math.abs(isNaN(balance) ? 0 : balance);
  }, 0);
  const totalSavings = savingsAccounts.reduce((sum, acc) => {
    const balance = typeof acc.currentBalance === 'string' ? parseFloat(acc.currentBalance) : acc.currentBalance;
    return sum + (isNaN(balance) ? 0 : balance);
  }, 0);
  const totalInvestments = investmentAccounts.reduce((sum, acc) => {
    const balance = typeof acc.currentBalance === 'string' ? parseFloat(acc.currentBalance) : acc.currentBalance;
    return sum + (isNaN(balance) ? 0 : balance);
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
          onSuccess={handlePlaidSuccess}
        />
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Checking Section */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg">
          <Button
            variant="ghost"
            className="w-full justify-between p-4 h-auto"
            onClick={() => !isCheckingEmpty && toggleSection('checking')}
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
              {isCheckingEmpty ? (
                <PlaidLink
                  icon={<Plus className="h-4 w-4" />}
                  buttonText=""
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onSuccess={handlePlaidSuccess}
                />
              ) : (
                <>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    ${totalChecking.toLocaleString()}
                  </span>
                  {isExpanded('checking') ?
                    <ChevronDown className="w-4 h-4" /> :
                    <ChevronRight className="w-4 h-4" />
                  }
                </>
              )}
            </div>
          </Button>
          
          {isExpanded('checking') && !isCheckingEmpty && (
            <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-3">
              {checkingAccounts.map((account) => (
                <div key={account.id} className="flex items-center gap-3 py-2">
                  {/* Institution Logo or Placeholder */}
                  <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                      {account.name.charAt(0).toUpperCase()}
                    </span>
                  </div>

                  {/* Account Details */}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">
                      {account.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {account.mask ? `••${account.mask}` : ''}
                      {account.mask && account.officialName ? ' | ' : ''}
                      {account.officialName || ''}
                    </div>
                  </div>

                  {/* Balance */}
                  <div className="text-sm font-semibold text-gray-900 dark:text-white text-right">
                    ${((typeof account.currentBalance === 'string' ? parseFloat(account.currentBalance) : account.currentBalance) || 0).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Credit Cards Section */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg">
          <Button
            variant="ghost"
            className="w-full justify-between p-4 h-auto"
            onClick={() => !isCreditEmpty && toggleSection('credit')}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-950/30 rounded-lg flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div className="text-left">
                <h4 className="font-medium text-gray-900 dark:text-white">Credit Cards</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {creditAccounts.length} card{creditAccounts.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isCreditEmpty ? (
                <PlaidLink
                  icon={<Plus className="h-4 w-4" />}
                  buttonText=""
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onSuccess={handlePlaidSuccess}
                />
              ) : (
                <>
                  <span className="font-semibold text-red-600 dark:text-red-400">
                    ${totalCredit.toLocaleString()}
                  </span>
                  {isExpanded('credit') ?
                    <ChevronDown className="w-4 h-4" /> :
                    <ChevronRight className="w-4 h-4" />
                  }
                </>
              )}
            </div>
          </Button>
          
          {isExpanded('credit') && !isCreditEmpty && (
            <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-3">
              {creditAccounts.map((account) => (
                <div key={account.id} className="flex items-center gap-3 py-2">
                  {/* Institution Logo or Placeholder */}
                  <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                      {account.name.charAt(0).toUpperCase()}
                    </span>
                  </div>

                  {/* Account Details */}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">
                      {account.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {account.mask ? `••${account.mask}` : ''}
                      {account.mask && account.officialName ? ' | ' : ''}
                      {account.officialName || ''}
                    </div>
                  </div>

                  {/* Balance */}
                  <div className="text-sm font-semibold text-red-600 dark:text-red-400 text-right">
                    ${Math.abs((typeof account.currentBalance === 'string' ? parseFloat(account.currentBalance) : account.currentBalance) || 0).toLocaleString()}
                  </div>
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
              {hasAnyAccount && (
                <span className={`font-semibold ${netCash >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  ${netCash.toLocaleString()}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Savings Section */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg">
          <Button
            variant="ghost"
            className="w-full justify-between p-4 h-auto"
            onClick={() => toggleSection('savings')}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-950/30 rounded-lg flex items-center justify-center">
                <PiggyBank className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="text-left">
                <h4 className="font-medium text-gray-900 dark:text-white">Savings</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {savingsAccounts.length} account{savingsAccounts.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900 dark:text-white">
                ${totalSavings.toLocaleString()}
              </span>
              {isExpanded('savings') ?
                <ChevronDown className="w-4 h-4" /> :
                <ChevronRight className="w-4 h-4" />
              }
            </div>
          </Button>

          {isExpanded('savings') && (
            <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-3">
              {savingsAccounts.map((account) => (
                <div key={account.id} className="flex items-center gap-3 py-2">
                  <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                      {account.name.charAt(0).toUpperCase()}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">
                      {account.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {account.mask ? `••${account.mask}` : ''}
                      {account.mask && account.officialName ? ' | ' : ''}
                      {account.officialName || ''}
                    </div>
                  </div>

                  <div className="text-sm font-semibold text-gray-900 dark:text-white text-right">
                    ${((typeof account.currentBalance === 'string' ? parseFloat(account.currentBalance) : account.currentBalance) || 0).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Investments Section */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg">
          <Button
            variant="ghost"
            className="w-full justify-between p-4 h-auto"
            onClick={() => toggleSection('investments')}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-950/30 rounded-lg flex items-center justify-center">
                <LineChart className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="text-left">
                <h4 className="font-medium text-gray-900 dark:text-white">Investments</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {investmentAccounts.length} account{investmentAccounts.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900 dark:text-white">
                ${totalInvestments.toLocaleString()}
              </span>
              {isExpanded('investments') ?
                <ChevronDown className="w-4 h-4" /> :
                <ChevronRight className="w-4 h-4" />
              }
            </div>
          </Button>

          {isExpanded('investments') && (
            <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-3">
              {investmentAccounts.map((account) => (
                <div key={account.id} className="flex items-center gap-3 py-2">
                  <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                      {account.name.charAt(0).toUpperCase()}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">
                      {account.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {account.mask ? `••${account.mask}` : ''}
                      {account.mask && account.officialName ? ' | ' : ''}
                      {account.officialName || ''}
                    </div>
                  </div>

                  <div className="text-sm font-semibold text-gray-900 dark:text-white text-right">
                    ${((typeof account.currentBalance === 'string' ? parseFloat(account.currentBalance) : account.currentBalance) || 0).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}