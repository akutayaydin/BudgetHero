import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { PiggyBank, TrendingUp, Plus, Target, ArrowRight } from "lucide-react";
import { Link } from "wouter";

interface Asset {
  id: string;
  name: string;
  type: string;
  currentValue: string;
  return?: number;
}

export function SavingsInvestmentsSection() {
  const { data: assets = [] } = useQuery<Asset[]>({
    queryKey: ['/api/assets'],
  });

  const savingsAssets = assets.filter(asset => asset.type === 'savings');
  const investmentAssets = assets.filter(asset => asset.type === 'investment');
  
  const totalSavings = savingsAssets.reduce((sum, asset) => sum + parseFloat(asset.currentValue || '0'), 0);
  const totalInvestments = investmentAssets.reduce((sum, asset) => sum + parseFloat(asset.currentValue || '0'), 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      {/* Savings Section */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <PiggyBank className="w-5 h-5" />
              Savings
            </CardTitle>
            <Link href="/goals">
              <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                <Plus className="w-4 h-4 mr-1" />
                Start +
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center py-6">
            <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              ${totalSavings.toLocaleString()}
            </p>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Total Savings Balance
            </p>
          </div>

          {savingsAssets.length > 0 ? (
            <div className="space-y-3">
              {savingsAssets.map((asset) => (
                <div key={asset.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 dark:bg-green-950/30 rounded-lg flex items-center justify-center">
                      <Target className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                    <span className="font-medium text-gray-900 dark:text-white">{asset.name}</span>
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    ${parseFloat(asset.currentValue || '0').toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-950/30 rounded-full flex items-center justify-center mx-auto mb-3">
                <Target className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                Start Your First Goal
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Set up automatic savings to reach your financial goals faster
              </p>
              <Link href="/goals">
                <Button className="bg-green-600 hover:bg-green-700 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Goal
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Investments Section */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Investments
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center py-6">
            <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              ${totalInvestments.toLocaleString()}
            </p>
            <div className="flex items-center justify-center gap-2">
              <Badge variant="secondary" className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                <TrendingUp className="w-3 h-3 mr-1" />
                +5.2% YTD
              </Badge>
            </div>
          </div>

          {investmentAssets.length > 0 ? (
            <div className="space-y-3">
              {investmentAssets.map((asset) => (
                <div key={asset.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-950/30 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <span className="font-medium text-gray-900 dark:text-white block">{asset.name}</span>
                      {asset.return && (
                        <span className={`text-xs ${asset.return >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {asset.return >= 0 ? '+' : ''}{asset.return.toFixed(2)}%
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    ${parseFloat(asset.currentValue || '0').toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-950/30 rounded-full flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                Start Investing
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Build wealth with diversified investment portfolios
              </p>
              <Button variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50">
                Learn More
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}