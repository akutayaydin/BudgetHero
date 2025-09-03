import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, FileText, BarChart3, Target, CheckCircle, AlertTriangle } from "lucide-react";
import FileUploadZone from "@/components/file-upload-zone";
import KpiCards from "@/components/kpi-cards";
import SpendingTrendsChart from "@/components/charts/spending-trends-chart";
import CategoryBreakdownChart from "@/components/charts/category-breakdown-chart";
import TransactionsTable from "@/components/transactions-table";
import { useQuery } from "@tanstack/react-query";

export default function UploadPage() {
  const [activeTab, setActiveTab] = useState("upload");

  const { data: transactions = [], isLoading, error, refetch } = useQuery({
    queryKey: ["/api/transactions"],
    staleTime: 0, // Always refetch for fresh data
    gcTime: 0, // Don't cache old data
    refetchOnMount: true, // Always refetch when component mounts
    refetchOnWindowFocus: true, // Refetch when window gains focus
  });

  const hasData = (transactions as any[]).length > 0;
  
  // Debug logging
  console.log("Upload page data:", {
    transactionsCount: (transactions as any[]).length,
    isLoading,
    error,
    hasData
  });

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 pt-16 md:pt-6">
      {/* Welcome Header */}
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Upload Your Financial Data</h1>
        <p className="text-muted-foreground">
          Import bank statements and credit card data to start tracking your finances
        </p>
      </div>

      {/* Getting Started Guide */}
      {!hasData && (
        <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl p-8 text-white">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <Upload className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Ready to Import Your Financial Data?</h2>
              <p className="text-purple-100">Upload CSV files from your bank to get powerful insights and analytics</p>
            </div>
          </div>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upload" className="flex items-center justify-center gap-2">
            <Upload className="h-4 w-4" />
            <span className="sm:hidden">Upload</span>
            <span className="hidden sm:inline">Upload Files</span>
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center justify-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="sm:hidden">Data</span>
            <span className="hidden sm:inline">Data Preview</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center justify-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="sm:hidden">Analytics</span>
            <span className="hidden sm:inline">Quick Analytics</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-6">
          <Card className="border-2 border-blue-200">
            <CardHeader className="bg-blue-50">
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <Upload className="h-5 w-5 text-blue-600" />
                Import Your Bank Data
              </CardTitle>
              <p className="text-sm text-blue-700">
                Supported formats: CSV files from banks, credit cards, and financial institutions
              </p>
            </CardHeader>
            <CardContent className="p-6">
              <FileUploadZone />
              
              {/* Help Guide */}
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto mb-2 text-lg font-bold">1</div>
                  <h4 className="font-semibold text-gray-900">Download from Bank</h4>
                  <p className="text-sm text-gray-600">Export CSV from your online banking</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto mb-2 text-lg font-bold">2</div>
                  <h4 className="font-semibold text-gray-900">Upload Here</h4>
                  <p className="text-sm text-gray-600">Drag & drop or click to upload</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto mb-2 text-lg font-bold">3</div>
                  <h4 className="font-semibold text-gray-900">Get Insights</h4>
                  <p className="text-sm text-gray-600">View analytics and manage budgets</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="space-y-6">
          {/* Debug Status Card */}
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-blue-800 text-lg">Data Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Total Transactions:</span>
                <span className="font-semibold">{(transactions as any[]).length}</span>
              </div>
              <div className="flex justify-between">
                <span>Loading State:</span>
                <span className="font-semibold">{isLoading ? 'Loading...' : 'Complete'}</span>
              </div>
              <div className="flex justify-between">
                <span>Has Data:</span>
                <span className="font-semibold">{hasData ? 'Yes' : 'No'}</span>
              </div>
              {error && (
                <div className="flex justify-between text-red-600">
                  <span>Error:</span>
                  <span className="font-semibold">{String(error)}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Transactions Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Imported Data Preview
                {hasData && (
                  <span className="ml-2 text-sm font-normal text-gray-600">
                    ({(transactions as any[]).length} transactions)
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {hasData ? (
                <div className="space-y-4">
                  {/* Quick Test Display */}
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="font-semibold text-yellow-800 mb-2">Quick Test - Latest Transactions:</h4>
                    <div className="space-y-2 text-sm">
                      {(transactions as any[]).slice(0, 3).map((tx: any, index: number) => (
                        <div key={index} className="bg-white p-2 rounded border">
                          <div className="flex justify-between">
                            <span className="font-medium">{tx.description}</span>
                            <span className="text-green-600">${tx.amount}</span>
                          </div>
                          <div className="text-gray-500 text-xs">
                            {tx.date} | {tx.category} | {tx.type}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <TransactionsTable limit={20} showFilters={false} />
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium">No transactions imported yet</p>
                  <p className="text-sm">Upload CSV files from the Upload tab to see your data here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <KpiCards />
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <SpendingTrendsChart />
            <CategoryBreakdownChart />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
