import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, ChevronRight, CheckSquare } from "lucide-react";
import { Link } from "wouter";

export function TransactionReviewCard() {
  return (
    <Card className="mb-6 border-2 border-red-300 dark:border-red-700">
      <CardContent className="p-4">
        <Link href="/transactions/review">
          <div className="flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 -m-4 p-4 rounded-lg transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-50 dark:bg-blue-950/30 rounded-lg flex items-center justify-center">
                <CheckSquare className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Category Review
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Review Latest Transactions
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </div>
        </Link>
      </CardContent>
    </Card>
  );
}