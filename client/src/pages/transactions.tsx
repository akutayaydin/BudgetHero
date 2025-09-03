import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { List, Filter, Search, Download, Upload, Plus, AlertTriangle, Gamepad2, Target, FileText } from "lucide-react";
import TransactionsTable from "@/components/transactions-table";
import { FullTransactionReviewWorkflow } from "@/components/full-transaction-review-workflow";
import { CategorizationGame } from "@/components/categorization-game";
import { ManualTransactionDialog } from "@/components/manual-transaction-dialog";
import { useQuery } from "@tanstack/react-query";


export default function TransactionsPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const { data: transactions = [] } = useQuery<any[]>({
    queryKey: ["/api/transactions"],
  });

  const { data: adminCategories = [] } = useQuery({
    queryKey: ["/api/admin/categories"],
  });

  const hasData = transactions.length > 0;

  // Check URL hash and switch to game tab if needed
  useEffect(() => {
    if (window.location.hash === "#game") {
      setActiveTab("game");
    }
  }, []);

  return (
    <>
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">

      {/* Add Transaction Button */}
      <div className="flex justify-end">
        <Button 
          onClick={() => setShowAddTransaction(true)}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold px-6 py-2 shadow-lg"
          data-testid="button-add-transaction"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Transaction
        </Button>
      </div>

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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all" className="flex items-center justify-center gap-2">
            <List className="h-4 w-4" />
            <span className="sm:hidden">All</span>
            <span className="hidden sm:inline">All Transactions</span>
          </TabsTrigger>
          <TabsTrigger value="game" className="flex items-center justify-center gap-2">
            <Target className="h-4 w-4" />
            <span className="sm:hidden">Game</span>
            <span className="hidden sm:inline">Quick Game</span>
          </TabsTrigger>
          <TabsTrigger value="review" className="flex items-center justify-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            <span className="sm:hidden">Review</span>
            <span className="hidden sm:inline">Smart Review</span>
          </TabsTrigger>
          <TabsTrigger value="export" className="flex items-center justify-center gap-2">
            <Download className="h-4 w-4" />
            <span className="sm:hidden">Export</span>
            <span className="hidden sm:inline">Export Data</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <List className="h-5 w-5" />
                Complete Transaction History
              </CardTitle>
              <p className="text-sm text-gray-600">
                All your transactions including data imported from connected bank accounts via Plaid
              </p>
            </CardHeader>
            <CardContent>
              <TransactionsTable showFilters={true} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="game" className="space-y-6">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Categorization Game
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Quick, fun way to categorize uncategorized transactions with game mechanics
              </p>
            </CardHeader>
            <CardContent>
              <CategorizationGame onComplete={() => setActiveTab("all")} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="review" className="space-y-6">
          <FullTransactionReviewWorkflow />
        </TabsContent>

        <TabsContent value="search" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Advanced Search & Filtering
              </CardTitle>
              <p className="text-sm text-gray-600">
                Find specific transactions using filters and search
              </p>
            </CardHeader>
            <CardContent>
              <TransactionsTable showFilters />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="export" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Export Your Data
              </CardTitle>
              <p className="text-sm text-gray-600">
                Download your transaction data in various formats
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-600">
                  Export your transaction data for use in other applications or for backup purposes.
                </p>
                <div className="flex gap-4">
                  <Button className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Export as CSV
                  </Button>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Export as PDF Report
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Manual Transaction Dialog */}
      <ManualTransactionDialog 
        open={showAddTransaction}
        onOpenChange={setShowAddTransaction}
      />
      </div>
    </>
  );
}
