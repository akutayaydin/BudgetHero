import { FinancialHealthSnapshot } from "@/components/financial-health-snapshot";

export default function HealthPage() {
  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 pt-16 md:pt-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Financial Health</h1>
        <p className="text-muted-foreground">
          Complete analysis of your financial wellness with actionable insights
        </p>
      </div>

      {/* Financial Health Snapshot */}
      <FinancialHealthSnapshot />
    </div>
  );
}