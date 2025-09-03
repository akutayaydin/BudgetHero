import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Eye, MapPin, CreditCard, Building2, Calendar, Info, Star, DollarSign } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/financial-utils";

interface Transaction {
  id: string;
  date: string | Date;
  description: string;
  amount: string;
  rawAmount: string;
  category: string;
  type: "income" | "expense";
  merchant?: string;
  source: string;
  isPending?: boolean;
  paymentChannel?: string;
  isoCurrencyCode?: string;
  authorizedDate?: string | Date;
  personalFinanceCategoryPrimary?: string;
  personalFinanceCategoryDetailed?: string;
  personalFinanceCategoryConfidence?: string;
  locationJson?: string;
  paymentMetaJson?: string;
  plaidCategory?: any;
  plaidPersonalFinanceCategory?: any;
  accountId?: string;
  externalTransactionId?: string;
  createdAt: string | Date;
}

interface TransactionDetailDialogProps {
  transaction: Transaction;
  children: React.ReactNode;
}

export function TransactionDetailDialog({ transaction, children }: TransactionDetailDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Parse JSON fields safely
  const parseJsonField = (jsonString?: string) => {
    if (!jsonString) return null;
    try {
      return JSON.parse(jsonString);
    } catch {
      return null;
    }
  };

  const locationData = parseJsonField(transaction.locationJson);
  const paymentMeta = parseJsonField(transaction.paymentMetaJson);
  const plaidCategory = transaction.plaidCategory || parseJsonField(JSON.stringify(transaction.plaidCategory));
  const plaidPersonalFinanceCategory = transaction.plaidPersonalFinanceCategory || parseJsonField(JSON.stringify(transaction.plaidPersonalFinanceCategory));

  const getConfidenceBadgeColor = (confidence?: string) => {
    switch (confidence?.toUpperCase()) {
      case 'VERY_HIGH': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'HIGH': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'LOW': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const formatCategoryName = (category?: string) => {
    if (!category) return null;
    return category.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Transaction Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Transaction Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <DollarSign className="h-5 w-5" />
                Transaction Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Description</label>
                  <p className="text-lg font-semibold">{transaction.description}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Amount</label>
                  <p className={`text-lg font-bold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                    {transaction.type === 'income' ? '+' : '-'}{formatCurrency(parseFloat(transaction.amount))}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Category</label>
                  <Badge variant="outline" className="mt-1">
                    {transaction.category}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Date</label>
                  <p className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {formatDate(new Date(transaction.date))}
                  </p>
                </div>
                {transaction.merchant && (
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Merchant</label>
                    <p className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      {transaction.merchant}
                    </p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Source</label>
                  <Badge variant={transaction.source === 'plaid' ? 'default' : 'secondary'}>
                    {transaction.source.toUpperCase()}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Plaid Information */}
          {(transaction.personalFinanceCategoryPrimary || transaction.paymentChannel || transaction.isoCurrencyCode) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CreditCard className="h-5 w-5" />
                  Payment Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {transaction.paymentChannel && (
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Payment Channel</label>
                      <Badge variant="outline" className="mt-1">
                        {formatCategoryName(transaction.paymentChannel)}
                      </Badge>
                    </div>
                  )}
                  {transaction.isoCurrencyCode && (
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Currency</label>
                      <p className="font-mono text-sm">{transaction.isoCurrencyCode}</p>
                    </div>
                  )}
                  {transaction.authorizedDate && (
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Authorized Date</label>
                      <p className="text-sm">{formatDate(new Date(transaction.authorizedDate))}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Plaid Personal Finance Categories */}
          {(transaction.personalFinanceCategoryPrimary || transaction.personalFinanceCategoryDetailed) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Star className="h-5 w-5" />
                  AI Categorization
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {transaction.personalFinanceCategoryPrimary && (
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Primary Category</label>
                      <Badge variant="default" className="mt-1">
                        {formatCategoryName(transaction.personalFinanceCategoryPrimary)}
                      </Badge>
                    </div>
                  )}
                  {transaction.personalFinanceCategoryDetailed && (
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Detailed Category</label>
                      <Badge variant="outline" className="mt-1">
                        {formatCategoryName(transaction.personalFinanceCategoryDetailed)}
                      </Badge>
                    </div>
                  )}
                  {transaction.personalFinanceCategoryConfidence && (
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">AI Confidence</label>
                      <Badge className={`mt-1 ${getConfidenceBadgeColor(transaction.personalFinanceCategoryConfidence)}`}>
                        {formatCategoryName(transaction.personalFinanceCategoryConfidence)}
                      </Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Location Information */}
          {locationData && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MapPin className="h-5 w-5" />
                  Location Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {locationData.address && <p><strong>Address:</strong> {locationData.address}</p>}
                  {locationData.city && <p><strong>City:</strong> {locationData.city}</p>}
                  {locationData.region && <p><strong>State:</strong> {locationData.region}</p>}
                  {locationData.postal_code && <p><strong>ZIP:</strong> {locationData.postal_code}</p>}
                  {locationData.country && <p><strong>Country:</strong> {locationData.country}</p>}
                  {(locationData.lat && locationData.lon) && (
                    <p><strong>Coordinates:</strong> {locationData.lat}, {locationData.lon}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment Metadata */}
          {paymentMeta && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Info className="h-5 w-5" />
                  Payment Metadata
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {paymentMeta.reference_number && (
                    <p><strong>Reference Number:</strong> <span className="font-mono">{paymentMeta.reference_number}</span></p>
                  )}
                  {paymentMeta.ppd_id && (
                    <p><strong>PPD ID:</strong> <span className="font-mono">{paymentMeta.ppd_id}</span></p>
                  )}
                  {paymentMeta.payee && (
                    <p><strong>Payee:</strong> {paymentMeta.payee}</p>
                  )}
                  {paymentMeta.by_order_of && (
                    <p><strong>By Order Of:</strong> {paymentMeta.by_order_of}</p>
                  )}
                  {paymentMeta.processor && (
                    <p><strong>Processor:</strong> {paymentMeta.processor}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Technical Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Technical Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Transaction ID</label>
                  <p className="font-mono text-xs bg-gray-100 dark:bg-gray-800 p-1 rounded">{transaction.id}</p>
                </div>
                {transaction.externalTransactionId && (
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">External ID</label>
                    <p className="font-mono text-xs bg-gray-100 dark:bg-gray-800 p-1 rounded">{transaction.externalTransactionId}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Created</label>
                  <p className="text-xs">{formatDate(new Date(transaction.createdAt))}</p>
                </div>
                {transaction.isPending && (
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Status</label>
                    <Badge variant="outline" className="text-xs">Pending</Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}