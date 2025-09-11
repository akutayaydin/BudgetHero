import { useState } from "react";
import { Upload } from "lucide-react";
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

        <TransactionsTable
          showFilters={true}
          onAddTransaction={() => setShowAddTransaction(true)}
        />

        {/* Manual Transaction Dialog */}
        <ManualTransactionDialog
          open={showAddTransaction}
          onOpenChange={setShowAddTransaction}
        />
      </div>
    </>
  );
}
