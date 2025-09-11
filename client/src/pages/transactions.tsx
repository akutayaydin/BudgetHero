import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { List, Upload, Plus } from "lucide-react";
import TransactionsTable from "@/components/transactions-table";
import { ManualTransactionDialog } from "@/components/manual-transaction-dialog";
import { useQuery } from "@tanstack/react-query";


export default function TransactionsPage() {
  const [showAddTransaction, setShowAddTransaction] = useState(false);

  const { data: transactions = [] } = useQuery<any[]>({
    queryKey: ["/api/transactions"],
  });

  const hasData = transactions.length > 0;

  return (
    <>
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Call-to-action if no data */}
        {!hasData && (
          <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-xl p-8 text-white">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <Upload className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">No Transactions Yet</h2>
                <p className="text-orange-100">Upload your bank data to start viewing and managing your transactions</p>
                <p className="text-orange-200 text-sm mt-1">👆 Go to Upload Data to get started</p>
              </div>
            </div>
          </div>
        )}

        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <List className="h-5 w-5" />
              Transaction History
            </CardTitle>
            <Button
              onClick={() => setShowAddTransaction(true)}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold px-6 py-2 shadow-lg"
              data-testid="button-add-transaction"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Transaction
            </Button>
          </CardHeader>
          <CardContent>
            <TransactionsTable showFilters={true} />
          </CardContent>
        </Card>

        {/* Manual Transaction Dialog */}
        <ManualTransactionDialog
          open={showAddTransaction}
          onOpenChange={setShowAddTransaction}
        />
      </div>
    </>
  );
}
