
import EnhancedAnalytics from "@/components/enhanced-analytics";
import TransactionsTable from "@/components/transactions-table";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function Home() {
  const { user } = useAuth();

  const handleLogout = () => {
    window.location.href = "/api/auth/logout";
  };

  return (
    <>
      <main className="flex-1 p-6 overflow-auto">
        {/* Enhanced Analytics with Ledger Types */}
        <EnhancedAnalytics />

        {/* Recent Transactions */}
        <div className="mt-8">
          <TransactionsTable limit={10} />
        </div>
      </main>
    </>
  );
}