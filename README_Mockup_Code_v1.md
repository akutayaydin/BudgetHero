import React from "react";
import { BarChart2, PieChart, Wallet, CreditCard, PiggyBank, LineChart, Calendar, Gauge, Goal, Sparkles, Layers, Home, List, ChartPie, Receipt, ClipboardList, Settings } from "lucide-react";

// --- Basic UI primitives (no external deps beyond Tailwind) ---
const Card = ({ children, className = "" }) => (
  <div className={`rounded-2xl border border-gray-200/70 bg-white shadow-sm ${className}`}>{children}</div>
);
const CardHeader = ({ title, subtitle, action }) => (
  <div className="flex items-center justify-between p-4 border-b">
    <div>
      <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">{title}</h3>
      {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
    </div>
    {action}
  </div>
);
const CardBody = ({ children, className = "" }) => (
  <div className={`p-4 ${className}`}>{children}</div>
);

const MenuItem = ({ icon: Icon, label, active=false }) => (
  <a href="#" className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition ${active ? "bg-indigo-50 text-indigo-700" : "text-gray-700 hover:bg-gray-50"}`}>
    <Icon className={`w-4 h-4 ${active ? "text-indigo-600" : "text-gray-500"}`} />
    <span className="truncate">{label}</span>
  </a>
);

// --- Placeholder graph components ---
const LineSkeleton = () => (
  <div className="h-36 relative">
    <div className="absolute inset-0 bg-gradient-to-b from-gray-100 to-transparent rounded-xl" />
    <svg viewBox="0 0 300 100" className="w-full h-full opacity-70">
      <polyline fill="none" stroke="#8b5cf6" strokeWidth="3" points="0,80 30,70 60,72 90,60 120,65 150,50 180,58 210,45 240,55 270,38 300,42" />
    </svg>
  </div>
);
const DonutSkeleton = () => (
  <div className="h-36 flex items-center justify-center">
    <div className="relative">
      <div className="w-28 h-28 rounded-full border-[14px] border-gray-100" />
      <div className="absolute inset-0 m-1 rounded-full border-[14px] border-indigo-400 clip-path-[polygon(50%_0,100%_0,100%_100%,0_100%,0_0)] rotate-45" />
      <div className="absolute inset-8 bg-white rounded-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-xs text-gray-500">Spent</div>
          <div className="text-sm font-semibold">$2,874</div>
        </div>
      </div>
    </div>
  </div>
);

// --- Main mock component ---
export default function BudgetHeroMockDashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white text-gray-900">
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-white/70 backdrop-blur border-b">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 grid place-items-center text-white font-bold">BH</div>
            <div>
              <div className="font-semibold tracking-tight">BudgetHero</div>
              <div className="text-xs text-gray-500">Level Up Your Money</div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <button className="px-3 py-1.5 rounded-lg border bg-white hover:bg-gray-50">Personal</button>
            <button className="px-3 py-1.5 rounded-lg border bg-white hover:bg-gray-50">Household</button>
            <button className="px-3 py-1.5 rounded-lg border bg-white hover:bg-gray-50">Customize Layout</button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-12 gap-4">
        {/* Sidebar */}
        <aside className="col-span-12 md:col-span-3 lg:col-span-2">
          <Card>
            <CardBody>
              <nav className="space-y-1">
                <div className="text-[10px] uppercase tracking-wider text-gray-500 px-2 mb-1">Menu</div>
                <MenuItem icon={Home} label="Dashboard" active />
                <MenuItem icon={List} label="Transactions" />
                <MenuItem icon={ChartPie} label="Spending" />
                <MenuItem icon={Wallet} label="Budgets" />
                <MenuItem icon={Gauge} label="Cash Flow (Days Safe)" />
                <MenuItem icon={Receipt} label="Bills & Subscriptions" />
                <MenuItem icon={Goal} label="Goals & Reports" />
                <MenuItem icon={Sparkles} label="Insights (AI Coach)" />
                <div className="pt-2 border-t mt-2" />
                <MenuItem icon={Settings} label="More ▾" />
              </nav>
            </CardBody>
          </Card>
        </aside>

        {/* Main content */}
        <main className="col-span-12 md:col-span-9 lg:col-span-10">
          {/* Split headers */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            <Card>
              <CardHeader title={<span className="flex items-center gap-2"><span className="inline-flex w-6 h-6 rounded-full bg-blue-50 text-blue-600 items-center justify-center">🪞</span>Where Your Money Went</span>} subtitle="Past • Rearview" />
              <CardBody>
                <div className="text-xs text-gray-500">Historical insights: Spending, Net Worth trend, Transactions.</div>
              </CardBody>
            </Card>
            <Card>
              <CardHeader title={<span className="flex items-center gap-2"><span className="inline-flex w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 items-center justify-center">🔮</span>Where You're Headed</span>} subtitle="Future • Windshield" />
              <CardBody>
                <div className="text-xs text-gray-500">Budgets, Cash‑flow & Days Safe, Goals, Quick Trackers.</div>
              </CardBody>
            </Card>
          </div>

          {/* Two-column split */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left: Past */}
            <div className="space-y-4">
              <Card>
                <CardHeader title={<span className="flex items-center gap-2"><PieChart className="w-4 h-4"/>Spending (Donut)</span>} subtitle="This month • Include bills" action={<button className="text-xs px-2 py-1 rounded-md border">Month ▾</button>} />
                <CardBody>
                  <DonutSkeleton />
                  <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                    <div className="p-2 rounded-lg bg-gray-50">Dining <div className="font-mono">$412</div></div>
                    <div className="p-2 rounded-lg bg-gray-50">Groceries <div className="font-mono">$603</div></div>
                    <div className="p-2 rounded-lg bg-gray-50">Transport <div className="font-mono">$128</div></div>
                  </div>
                </CardBody>
              </Card>

              <Card>
                <CardHeader title={<span className="flex items-center gap-2"><LineChart className="w-4 h-4"/>Net Worth (Graph)</span>} subtitle="1Y trend" action={<div className="flex gap-1"><button className="text-xs px-2 py-1 rounded-md border">1M</button><button className="text-xs px-2 py-1 rounded-md border bg-gray-900 text-white">1Y</button></div>} />
                <CardBody>
                  <LineSkeleton />
                </CardBody>
              </Card>

              <Card>
                <CardHeader title={<span className="flex items-center gap-2"><List className="w-4 h-4"/>Recent Transactions</span>} subtitle="Latest 6" action={<button className="text-xs px-2 py-1 rounded-md border">See all</button>} />
                <CardBody>
                  <ul className="text-sm divide-y">
                    {[
                      { m:"Whole Foods", a:"-$56.78", t:"Groceries" },
                      { m:"Blue Shield", a:"-$485.00", t:"Medical" },
                      { m:"Salary", a:"+$4,200.00", t:"Income" },
                      { m:"Uber", a:"-$18.40", t:"Transport" },
                      { m:"Netflix", a:"-$15.99", t:"Subscription" },
                      { m:"Rent", a:"-$1,950.00", t:"Housing" },
                    ].map((row,i)=>(
                      <li key={i} className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-lg bg-gray-100 grid place-items-center text-xs">{row.m[0]}</div>
                          <div>
                            <div className="font-medium">{row.m}</div>
                            <div className="text-xs text-gray-500">{row.t}</div>
                          </div>
                        </div>
                        <div className={`font-mono ${row.a.startsWith("+")?"text-emerald-600":"text-gray-900"}`}>{row.a}</div>
                      </li>
                    ))}
                  </ul>
                </CardBody>
              </Card>
            </div>

            {/* Right: Future */}
            <div className="space-y-4">
              <Card>
                <CardHeader title={<span className="flex items-center gap-2"><Wallet className="w-4 h-4"/>Budgets (Left to Spend)</span>} subtitle="This month" action={<button className="text-xs px-2 py-1 rounded-md border">Manage</button>} />
                <CardBody>
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                      <div className="text-xs text-emerald-700">Left to Spend</div>
                      <div className="text-xl font-extrabold">$563</div>
                    </div>
                    <div className="p-3 rounded-xl bg-gray-50 border"><div className="text-xs text-gray-500">Budgeted</div><div className="font-semibold">$720</div></div>
                    <div className="p-3 rounded-xl bg-gray-50 border"><div className="text-xs text-gray-500">Current Spend</div><div className="font-semibold">$157</div></div>
                  </div>
                </CardBody>
              </Card>

              <Card>
                <CardHeader title={<span className="flex items-center gap-2"><Calendar className="w-4 h-4"/>Cash‑Flow & Days Safe</span>} subtitle="30‑day projection" action={<button className="text-xs px-2 py-1 rounded-md border">Calendar</button>} />
                <CardBody>
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div className="col-span-2"><LineSkeleton /></div>
                    <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100">
                      <div className="text-xs text-indigo-700">Days Safe</div>
                      <div className="text-2xl font-extrabold">12</div>
                      <div className="text-xs text-gray-500">until $0 balance</div>
                    </div>
                  </div>
                </CardBody>
              </Card>

              <Card>
                <CardHeader title={<span className="flex items-center gap-2"><CreditCard className="w-4 h-4"/>Quick Category Tracker</span>} subtitle="Groceries • Week / Month" action={<div className="flex gap-1"><button className="text-xs px-2 py-1 rounded-md border bg-gray-900 text-white">Week</button><button className="text-xs px-2 py-1 rounded-md border">Month</button></div>} />
                <CardBody>
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div className="p-3 rounded-xl bg-gray-50 border"><div className="text-xs text-gray-500">Spent</div><div className="font-mono">$146.22</div></div>
                    <div className="p-3 rounded-xl bg-gray-50 border"><div className="text-xs text-gray-500">Budget</div><div className="font-mono">$200.00</div></div>
                    <div className="p-3 rounded-xl bg-gray-50 border"><div className="text-xs text-gray-500">Left</div><div className="font-mono text-emerald-600">$53.78</div></div>
                  </div>
                </CardBody>
              </Card>

              <Card>
                <CardHeader title={<span className="flex items-center gap-2"><Goal className="w-4 h-4"/>Goals Progress</span>} subtitle="Emergency • Vacation • Debt" />
                <CardBody>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between"><span>Emergency Fund</span><span className="font-mono">$2,300 / $5,000</span></div>
                    <div className="w-full h-2 bg-gray-100 rounded-full"><div className="h-2 bg-emerald-500 rounded-full w-[46%]" /></div>
                    <div className="flex items-center justify-between"><span>Vacation</span><span className="font-mono">$900 / $1,500</span></div>
                    <div className="w-full h-2 bg-gray-100 rounded-full"><div className="h-2 bg-indigo-500 rounded-full w-[60%]" /></div>
                  </div>
                </CardBody>
              </Card>
            </div>
          </div>

          {/* Today snapshot row */}
          <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader title={<span className="flex items-center gap-2"><Layers className="w-4 h-4"/>Accounts (Snapshot)</span>} subtitle="Checking • Credit • Net Cash • Savings • Investments" />
              <CardBody>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                  <div className="p-3 rounded-xl bg-white border"><div className="text-xs text-gray-500">Checking</div><div className="font-mono font-semibold">$17,130</div></div>
                  <div className="p-3 rounded-xl bg-white border"><div className="text-xs text-gray-500">Credit Cards</div><div className="font-mono font-semibold">$2,250</div></div>
                  <div className="p-3 rounded-xl bg-white border"><div className="text-xs text-gray-500">Net Cash</div><div className="font-mono font-semibold">$14,880</div></div>
                  <div className="p-3 rounded-xl bg-white border"><div className="text-xs text-gray-500">Savings</div><div className="font-mono font-semibold">$16,170</div></div>
                  <div className="p-3 rounded-xl bg-white border"><div className="text-xs text-gray-500">Investments</div><div className="font-mono font-semibold">—</div></div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader title={<span className="flex items-center gap-2"><BarChart2 className="w-4 h-4"/>Net Income (This Month)</span>} subtitle="Income – Expenses = Net" />
              <CardBody>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                    <div className="text-xs text-emerald-700">Income</div>
                    <div className="text-lg font-bold">$4,500</div>
                  </div>
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-100">
                    <div className="text-xs text-rose-700">Expenses</div>
                    <div className="text-lg font-bold">$3,800</div>
                  </div>
                  <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100">
                    <div className="text-xs text-indigo-700">Net Income</div>
                    <div className="text-lg font-bold">$700</div>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader title={<span className="flex items-center gap-2"><Sparkles className="w-4 h-4"/>AI Insights</span>} subtitle="Nudges • Anomalies • Tips" />
              <CardBody>
                <ul className="space-y-2 text-sm">
                  <li>💡 Dining is 18% lower than last month — nice!</li>
                  <li>⚠️ Free trial ends in 3 days: Acme Music</li>
                  <li>🎯 Move $50 to savings to hit goal on time</li>
                </ul>
              </CardBody>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
