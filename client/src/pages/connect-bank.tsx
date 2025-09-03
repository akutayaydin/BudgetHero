import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Landmark, CheckCircle, Shield, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Link } from 'wouter';

const DEMO_BANKS = [
  { id: 'chase', name: 'Chase Bank', logo: '🏦', popular: true },
  { id: 'bofa', name: 'Bank of America', logo: '🏛️', popular: true },
  { id: 'wells', name: 'Wells Fargo', logo: '🏪', popular: true },
  { id: 'citi', name: 'Citibank', logo: '🏢', popular: false },
  { id: 'usbank', name: 'U.S. Bank', logo: '🏦', popular: false },
  { id: 'pnc', name: 'PNC Bank', logo: '🏛️', popular: false },
  { id: 'td', name: 'TD Bank', logo: '🏪', popular: false },
  { id: 'capital', name: 'Capital One', logo: '🏢', popular: false },
];

export default function ConnectBank() {
  const [selectedBank, setSelectedBank] = useState<string>('');
  const [showAllBanks, setShowAllBanks] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const connectBankMutation = useMutation({
    mutationFn: (bankId: string) => apiRequest('POST', '/api/plaid/link-account', { bankId }),
    onSuccess: () => {
      toast({
        title: "Bank Connected Successfully",
        description: "Your bank account has been linked and will sync automatically.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/accounts'] });
      window.location.href = '/wealth-management?tab=accounts';
    },
    onError: (error: any) => {
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect bank account. Please try again.",
        variant: "destructive",
      });
      setIsConnecting(false);
    },
  });

  const handleConnectBank = (bankId: string) => {
    setIsConnecting(true);
    setSelectedBank(bankId);
    // Simulate connecting - in real implementation this would open Plaid Link
    setTimeout(() => {
      connectBankMutation.mutate(bankId);
    }, 2000);
  };

  const popularBanks = DEMO_BANKS.filter(bank => bank.popular);
  const otherBanks = DEMO_BANKS.filter(bank => !bank.popular);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/wealth-management?tab=accounts">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Accounts
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Connect Your Bank Account</h1>
          <p className="text-gray-600">Link your bank to automatically sync transactions and balances</p>
        </div>
      </div>

      {/* Security Notice */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-900">Bank-Level Security</h3>
              <p className="text-sm text-blue-700 mt-1">
                Your data is encrypted and protected. We never store your banking credentials and use read-only access to sync your transactions.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Popular Banks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Landmark className="h-5 w-5" />
            Popular Banks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {popularBanks.map((bank) => (
              <Button
                key={bank.id}
                variant="outline"
                className="h-16 justify-start relative"
                onClick={() => handleConnectBank(bank.id)}
                disabled={isConnecting}
              >
                <span className="text-2xl mr-3">{bank.logo}</span>
                <span className="font-medium">{bank.name}</span>
                {selectedBank === bank.id && isConnecting && (
                  <div className="absolute right-3">
                    <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full" />
                  </div>
                )}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* All Banks */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Supported Banks</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAllBanks(!showAllBanks)}
            >
              {showAllBanks ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
              {showAllBanks ? 'Hide' : 'Show All'}
            </Button>
          </div>
        </CardHeader>
        {showAllBanks && (
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {otherBanks.map((bank) => (
                <Button
                  key={bank.id}
                  variant="outline"
                  className="h-12 justify-start relative"
                  onClick={() => handleConnectBank(bank.id)}
                  disabled={isConnecting}
                >
                  <span className="text-xl mr-3">{bank.logo}</span>
                  <span className="font-medium">{bank.name}</span>
                  {selectedBank === bank.id && isConnecting && (
                    <div className="absolute right-3">
                      <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full" />
                    </div>
                  )}
                </Button>
              ))}
            </div>
          </CardContent>
        )}
      </Card>

      {/* What Happens Next */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            What Happens Next
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <Badge variant="secondary" className="mt-0.5">1</Badge>
              <div>
                <p className="font-medium">Secure Authentication</p>
                <p className="text-gray-600">Log in securely with your online banking credentials</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="secondary" className="mt-0.5">2</Badge>
              <div>
                <p className="font-medium">Account Selection</p>
                <p className="text-gray-600">Choose which accounts you want to connect</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="secondary" className="mt-0.5">3</Badge>
              <div>
                <p className="font-medium">Automatic Sync</p>
                <p className="text-gray-600">Your transactions will sync automatically and appear in your dashboard</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {isConnecting && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="animate-spin w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full" />
              <div>
                <p className="font-medium text-blue-900">Connecting to {DEMO_BANKS.find(b => b.id === selectedBank)?.name}...</p>
                <p className="text-sm text-blue-700">Please wait while we establish a secure connection</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}