import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  CreditCard,
  PiggyBank,
  ArrowRight,
  ExternalLink,
  X,
  Info
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

interface SyncDigestData {
  summary: {
    newTransactions: number;
    updatedTransactions: number;
    duplicatesRemoved: number;
  };
  institutions: Array<{
    id: string;
    institutionName: string | null;
    institutionLogo?: string | null;
    status: string;
    lastSyncAt: string | null;
    lastSuccessAt: string | null;
    retryCount: number | null;
    maxRetries: number | null;
    nextRetryAt: string | null;
    errorMessage: string | null;
    newTransactionsCount: number | null;
    updatedTransactionsCount: number | null;
    duplicatesRemovedCount: number | null;
  }>;
  lastSyncAt?: string;
}

interface ApyOpportunity {
  currentApy: number;
  bestApy: number;
  monthlyImpact: number;
  offers: Array<{
    id: string;
    bank: string;
    productName: string;
    apyPct: string;
    minDeposit: string;
    productUrl: string | null;
    notes: string | null;
  }>;
  totalSavingsBalance: number;
}

interface BillsData {
  upcomingBills: Array<{
    id: string;
    name: string;
    amount: string;
    nextDueDate: string | null;
    type: string;
  }>;
  totalMonthlySubscriptions: number;
  cancelableSubscriptions: Array<{
    id: string;
    name: string;
    amount: string;
    frequency: string;
  }>;
}

export function SyncDigest() {
  const queryClient = useQueryClient();
  const [showMoneyMoveSheet, setShowMoneyMoveSheet] = useState(false);

  // Fetch sync digest data
  const { data: digestData, isLoading: digestLoading } = useQuery<SyncDigestData>({
    queryKey: ["/api/sync/digest"],
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 10000, // Consider data stale after 10 seconds
  });

  // Fetch APY opportunities
  const { data: apyData, isLoading: apyLoading } = useQuery<ApyOpportunity>({
    queryKey: ["/api/sync/apy-opportunities"],
    staleTime: 300000, // 5 minutes - APY data doesn't change frequently
  });

  // Fetch bills and subscriptions
  const { data: billsData, isLoading: billsLoading } = useQuery<BillsData>({
    queryKey: ["/api/sync/bills-subscriptions"],
    staleTime: 60000, // 1 minute
  });

  // Retry sync mutation
  const retryMutation = useMutation({
    mutationFn: async (institutionId: string) => {
      const response = await fetch(`/api/sync/retry/${institutionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error("Failed to retry sync");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Sync retry scheduled", description: "Your account will be synced shortly." });
      queryClient.invalidateQueries({ queryKey: ["/api/sync/digest"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to schedule sync retry.", variant: "destructive" });
    },
  });

  // Log tile click events
  const logTileClick = async (tileType: string) => {
    try {
      await fetch("/api/events/tile-click", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tileType }),
      });
    } catch (error) {
      console.error("Failed to log tile click:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Success</Badge>;
      case "failed":
        return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" />Failed</Badge>;
      case "reauth_required":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><AlertTriangle className="w-3 h-3 mr-1" />Reauth Required</Badge>;
      case "pending":
        return <Badge variant="outline"><RefreshCw className="w-3 h-3 mr-1" />Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (digestLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin" />
            Loading Sync Digest...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Sync Digest Card */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5" />
                Sync Digest
              </CardTitle>
              <CardDescription>
                {digestData?.lastSyncAt 
                  ? `Last sync: ${new Date(digestData.lastSyncAt).toLocaleDateString()}`
                  : "No sync activity"
                }
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/sync/digest"] })}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Concise Summary */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">
                  {digestData?.summary.newTransactions || 0}
                </div>
                <div className="text-xs text-gray-600">New</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600">
                  {digestData?.summary.updatedTransactions || 0}
                </div>
                <div className="text-xs text-gray-600">Updated</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-purple-600">
                  {digestData?.summary.duplicatesRemoved || 0}
                </div>
                <div className="text-xs text-gray-600">Cleaned</div>
              </div>
            </div>
            {(digestData?.summary.newTransactions || 0) > 0 && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  logTileClick("new_transactions");
                  window.location.href = "/transactions";
                }}
              >
                View <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            )}
          </div>

          <Separator />

          {/* Concise Institution Status */}
          {digestData?.institutions && digestData.institutions.length > 0 && (
            <div>
              <h4 className="font-medium mb-2 text-sm">Institution Status</h4>
              <div className="space-y-2">
                {digestData.institutions.map((institution) => (
                  <div key={institution.id} className="flex items-center justify-between p-2 border rounded text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                        <CreditCard className="w-3 h-3" />
                      </div>
                      <span className="font-medium truncate">{institution.institutionName || "Unknown"}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {getStatusBadge(institution.status)}
                      {institution.status === "failed" && (
                        <Button size="sm" variant="outline" className="h-6 text-xs px-2">
                          Retry
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Savings Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* APY Opportunities Tile */}
        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => logTileClick("apy")}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <PiggyBank className="h-5 w-5 text-green-600" />
              Better APY Available
            </CardTitle>
          </CardHeader>
          <CardContent>
            {apyLoading ? (
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded mb-2 w-3/4"></div>
              </div>
            ) : apyData ? (
              <div className="space-y-2">
                <div className="text-2xl font-bold text-green-600">
                  {apyData.bestApy.toFixed(2)}% APY
                </div>
                <div className="text-sm text-gray-600">
                  vs your current {apyData.currentApy.toFixed(2)}%
                </div>
                <div className="text-lg font-medium text-gray-900">
                  +${apyData.monthlyImpact.toFixed(0)}/month
                </div>
                <div className="text-xs text-gray-500 mb-3">
                  On ${apyData.totalSavingsBalance.toLocaleString()} savings
                </div>
                <Button 
                  size="sm" 
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    logTileClick("apy_move_cash");
                    setShowMoneyMoveSheet(true);
                  }}
                  disabled={!apyData || apyData.monthlyImpact <= 0}
                >
                  <DollarSign className="w-4 h-4 mr-2" />
                  {!apyData || apyData.monthlyImpact <= 0 ? "No Improvement" : "Move Cash"}
                </Button>
              </div>
            ) : (
              <div className="text-sm text-gray-500">No savings accounts found</div>
            )}
          </CardContent>
        </Card>

        {/* Bills Tile */}
        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => logTileClick("bills")}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5 text-orange-600" />
              Upcoming Bills
            </CardTitle>
          </CardHeader>
          <CardContent>
            {billsLoading ? (
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded mb-2 w-3/4"></div>
              </div>
            ) : billsData ? (
              <div className="space-y-2">
                <div className="text-2xl font-bold text-orange-600">
                  {billsData.upcomingBills.length}
                </div>
                <div className="text-sm text-gray-600">Due next 7 days</div>
                {billsData.upcomingBills.length > 0 && (
                  <div className="space-y-1">
                    {billsData.upcomingBills.slice(0, 2).map((bill) => (
                      <div key={bill.id} className="flex justify-between text-sm">
                        <span className="truncate">{bill.name}</span>
                        <span className="font-medium">${bill.amount}</span>
                      </div>
                    ))}
                  </div>
                )}
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    logTileClick("bills_review");
                    window.location.href = "/bills";
                  }}
                >
                  Review Bills
                </Button>
              </div>
            ) : (
              <div className="text-sm text-gray-500">No upcoming bills</div>
            )}
          </CardContent>
        </Card>

        {/* Subscriptions Tile */}
        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => logTileClick("subscriptions")}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <RefreshCw className="h-5 w-5 text-purple-600" />
              Subscriptions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {billsLoading ? (
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded mb-2 w-3/4"></div>
              </div>
            ) : billsData ? (
              <div className="space-y-2">
                <div className="text-2xl font-bold text-purple-600">
                  ${billsData.totalMonthlySubscriptions.toFixed(0)}
                </div>
                <div className="text-sm text-gray-600">Monthly total</div>
                {billsData.cancelableSubscriptions.length > 0 && (
                  <div className="text-sm text-gray-500">
                    {billsData.cancelableSubscriptions.length} potentially cancelable
                  </div>
                )}
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    logTileClick("subscriptions_manage");
                    window.location.href = "/bills";
                  }}
                >
                  Manage Subs
                </Button>
              </div>
            ) : (
              <div className="text-sm text-gray-500">No subscriptions tracked</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Compliance Note */}
      <Card className="border-l-4 border-l-gray-400">
        <CardContent className="pt-4">
          <div className="flex items-start gap-2 text-sm text-gray-600">
            <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div>
              <strong>Compliance Note:</strong> APY rates are variable and subject to change. Bank switching recommendations 
              are for informational purposes only. Always verify current rates and terms directly with financial institutions 
              before making decisions. This platform does not provide financial advice.
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inline Money Move Sheet */}
      {showMoneyMoveSheet && (
        <Card className="border-l-4 border-l-green-500">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Move Your Cash
              </CardTitle>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowMoneyMoveSheet(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-medium text-green-800 mb-2">Best APY Offers</h4>
              <div className="space-y-2">
                {apyData?.offers.slice(0, 3).map((offer) => (
                  <div key={offer.id} className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{offer.bank}</div>
                      <div className="text-sm text-gray-600">{offer.productName}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-600">{offer.apyPct}% APY</div>
                      {offer.productUrl && (
                        <Button 
                          variant="link" 
                          size="sm" 
                          className="p-0 h-auto"
                          onClick={() => {
                            logTileClick("apy_external_link");
                            window.open(offer.productUrl!, "_blank");
                          }}
                        >
                          Learn More <ExternalLink className="w-3 h-3 ml-1" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                className="flex-1"
                onClick={() => {
                  logTileClick("transfers_advanced");
                  window.location.href = "/transfers";
                }}
              >
                Advanced Transfer Options
              </Button>
              <Button 
                variant="outline"
                onClick={() => setShowMoneyMoveSheet(false)}
              >
                Close
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}