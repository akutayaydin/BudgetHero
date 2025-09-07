// client/src/components/budget/ManageBudget.tsx
import React, { useMemo, useState, useEffect } from "react";
import type { BudgetPlan, Transaction, Budget, AdminCategory } from "@shared/schema";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { getIcon } from "@/lib/category-icons";
import { Check, X, Trash2, Plus, Wallet, PiggyBank, Info, type LucideIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Props {
  plan: BudgetPlan;
}

const fmt = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

function Ring({ percent }: { percent: number }) {
  const dash = Math.max(0, Math.min(percent, 100));
  return (
    <svg
      viewBox="0 0 36 36"
      className="w-6 h-6"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M18 2.0845a 15.9155 15.9155 0 1 1 0 31.831a 15.9155 15.9155 0 1 1 0 -31.831"
        fill="none"
        stroke="currentColor"
        className="text-gray-300 dark:text-gray-700"
        strokeWidth="3"
      />
      <path
        d="M18 2.0845a 15.9155 15.9155 0 1 1 0 31.831a 15.9155 15.9155 0 1 1 0 -31.831"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={`${dash}, 100`}
        style={{ transition: "stroke-dasharray 0.3s ease" }}
      />
    </svg>
  );
}

interface RowProps {
  id?: string;
  name: string;
  budgeted: number;
  actual: number;
  icon: LucideIcon;
  isIncome?: boolean;
  editable?: boolean;
  onUpdate?: (id: string, value: number) => Promise<void> | void;
  onDelete?: (id: string) => Promise<void> | void;
}

function BudgetRow({
  id,
  name,
  budgeted,
  actual,
  icon: Icon,
  isIncome,
  editable,
  onUpdate,
  onDelete,
}: RowProps) {
  const remaining = budgeted - actual;
  const percentUsed = budgeted > 0 ? Math.min((actual / budgeted) * 100, 100) : 0;

  let color = "text-muted-foreground";
  if (isIncome) {
    color = remaining < 0 ? "text-green-600 dark:text-green-400" : "text-muted-foreground";
  } else {
    color =
      remaining < 0
        ? "text-red-500 dark:text-red-400"
        : remaining > 0
          ? "text-green-600 dark:text-green-400"
          : "text-muted-foreground";
  }

  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(String(budgeted));

  useEffect(() => {
    if (!isEditing) setEditValue(String(budgeted));
  }, [budgeted, isEditing]);

  const handleSave = async () => {
    const val = parseFloat(editValue);
    if (!isNaN(val) && onUpdate && id) {
      await onUpdate(id, val);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(String(budgeted));
    setIsEditing(false);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") handleCancel();
  };

  return (
    <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted odd:bg-muted/30">
      <td className="h-12 px-4 text-left align-middle">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
          <span className={`font-medium ${onDelete ? "flex-1" : ""}`}>{name}</span>
          {onDelete && id && (
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 text-muted-foreground hover:text-red-600 dark:hover:text-red-400"
              onClick={() => onDelete(id)}
              aria-label={`Delete ${name} budget`}
              data-testid={`button-delete-budget-${id}`}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </td>
      <td className="p-4 align-middle text-right">
        {editable && isEditing ? (
          <div className="flex items-center justify-end gap-1 w-full">
            <Input
              type="number"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKey}
              className="w-24 h-8 text-right text-sm"
              step="0.01"
              autoFocus
              data-testid={`input-edit-budget-${id}`}
            />
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
              onClick={handleSave}
              aria-label="Save changes"
              data-testid={`button-save-budget-${id}`}
            >
              <Check className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
              onClick={handleCancel}
              aria-label="Cancel changes"
              data-testid={`button-cancel-budget-${id}`}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : editable ? (
          <button
            onClick={() => setIsEditing(true)}
            className="group flex flex-col items-end w-full text-right cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
            title="Click to edit budget amount"
            aria-label={`Edit budget for ${name}. Current amount: ${fmt.format(budgeted)}`}
            data-testid={`button-edit-budget-${id}`}
          >
            <span className="px-1 pb-[1px] border-b border-dashed border-muted-foreground/50 hover:border-primary transition-colors font-medium">
              {fmt.format(budgeted)}
            </span>
            <span className="text-xs text-muted-foreground mt-1">Click to edit</span>
          </button>
        ) : (
          <div className="flex flex-col items-end w-full text-right">
            <div className="font-medium">{fmt.format(budgeted)}</div>
          </div>
        )}
      </td>
      <td className="p-4 align-middle text-right">
        <div className="font-medium">{fmt.format(actual)}</div>
        <div className="text-xs text-muted-foreground">actual</div>
      </td>
      <td className="p-4 align-middle text-right">
        <div className={`flex items-center justify-end gap-2 ${color}`}>
          <Ring percent={percentUsed} />
          <div className="font-medium">{fmt.format(remaining)}</div>
        </div>
        <div className="text-xs text-muted-foreground text-right mt-1">
          {isIncome ? "surplus" : "remaining"}
        </div>
      </td>
    </tr>
  );
}

export default function ManageBudget({ plan }: Props) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { month, expectedEarnings, expectedBills } = plan;

  const { data: transactions = [] } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions", month],
    queryFn: async () => {
      const [y, m] = month.split("-").map(Number);
      const start = new Date(y, m - 1, 1).toISOString().slice(0, 10);
      const end = new Date(y, m, 0).toISOString().slice(0, 10);
      const res = await fetch(
        `/api/transactions?startDate=${start}&endDate=${end}`,
        { credentials: "include" }
      );
      if (!res.ok) throw new Error("Failed to fetch transactions");
      return res.json();
    },
  });

  const { data: budgets = [] } = useQuery<Budget[]>({
    queryKey: ["/api/budgets"],
    queryFn: async () => {
      const res = await fetch("/api/budgets", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch budgets");
      return res.json();
    },
  });

  const [openAdd, setOpenAdd] = useState(false);
  const [selectedCats, setSelectedCats] = useState<Set<string>>(new Set());

  const { data: adminCats = [] } = useQuery<AdminCategory[]>({
    queryKey: ["/api/admin/categories"],
    queryFn: async () => {
      const res = await fetch("/api/admin/categories", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch categories");
      return res.json();
    },
  });

  const basicsSet = new Set(["income", "bills & utilities"]);

  const availableCategories = Array.from(
    new Map(
      adminCats
        .filter((c) => c.ledgerType === "EXPENSE")
        .map((c) => [c.name.toLowerCase(), c.name] as const),
    ).values(),
  )
    .filter(
      (name) =>
        !basicsSet.has(name.toLowerCase()) &&
        !budgets.some((b) => (b.name || "").toLowerCase() === name.toLowerCase()),
    )
    .sort();
  
  const faqItems = [
    {
      value: "income",
      title: "Income",
      question: "What does \u201cIncome\u201d mean here?",
      answer:
        "This is your total expected money coming in for the month (e.g., salary, business income). It\u2019s considered fixed and used to calculate your available Spending Budget and Savings.",
    },
    {
      value: "bills",
      title: "Bills & Utilities",
      question: "Why are Bills & Utilities separate from other categories?",
      answer:
        "Bills & Utilities are treated as fixed expenses. They are subtracted first from your income to calculate your Spending Budget.",
    },
    {
      value: "spending",
      title: "Spending Budget",
      question: "What is my Spending Budget?",
      answer:
        "Your Spending Budget is what\u2019s left after subtracting Bills & Utilities and Savings from your Income. This is the pool available for all flexible categories (e.g., Groceries, Pets, Dining, etc.).",
    },
    {
      value: "left-to-spend",
      title: "Left to Spend (Budget Summary)",
      question: "How is \u2018Left to Spend\u2019 calculated?",
      answer:
        "Left to Spend = Spending Budget \u2013 Actual Spending. It shows how much of your discretionary money is still available this month.",
    },
    {
      value: "savings",
      title: "Left for Savings",
      question: "How is \u2018Left for Savings\u2019 calculated?",
      answer:
        "During Budget Setup, you choose a portion of your income to be reserved for savings. If you don\u2019t have enough left after covering bills, the remaining amount becomes your savings instead. If flexible budgets overshoot, savings are reduced and can go negative.",
    },
    {
      value: "everything-else",
      title: "Everything Else",
      question: "What is the \u2018Everything Else\u2019 category?",
      answer:
        "This is a catch-all bucket. Any money not explicitly assigned to a category budget will fall here, so you always account for 100% of spending.",
    },
  ] as const;

  const [faqOpenItem, setFaqOpenItem] = useState<string | undefined>(() =>
    typeof window !== "undefined" ? sessionStorage.getItem("bh-faq-open") ?? undefined : undefined,
  );

  useEffect(() => {
    if (faqOpenItem) sessionStorage.setItem("bh-faq-open", faqOpenItem);
    else sessionStorage.removeItem("bh-faq-open");
  }, [faqOpenItem]);

  const [showDetails, setShowDetails] = useState(false);

  async function handleAddCategories() {
    try {
      const created: Budget[] = [];
      const [y, m] = month.split("-").map(Number);
      const start = new Date(y, m - 4, 1).toISOString().slice(0, 10);
      const end = new Date(y, m - 1, 0).toISOString().slice(0, 10);
      for (const name of Array.from(selectedCats)) {
        let avg = 0;
        try {
          const txRes = await fetch(
            `/api/transactions?startDate=${start}&endDate=${end}&category=${encodeURIComponent(name)}`,
            { credentials: "include" },
          );
          if (txRes.ok) {
            const txs = (await txRes.json()) as Transaction[];
            const total = txs.reduce(
              (s, t) => s + Math.abs(Number(t.amount) || 0),
              0,
            );
            avg = total / 3;
          }
        } catch (e) {
          // ignore errors and default average to 0
        }
        const res = await fetch("/api/budgets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          // Backend expects decimal values as strings (NUMERIC columns).
          body: JSON.stringify({ name, limit: String(avg.toFixed(2)), spent: "0" }),
        });
        if (res.ok) {
          const budget = (await res.json()) as Budget;
          created.push(budget);
        }
      }
      if (created.length) {
        queryClient.setQueryData<Budget[]>(["/api/budgets"], (old) => [
          ...(old || []),
          ...created,
        ]);
        toast({
          title: "Budget Categories Added",
          description: `Successfully added ${created.length} budget ${created.length === 1 ? 'category' : 'categories'}.`,
        });
      }
      setSelectedCats(new Set());
      setOpenAdd(false);
      await queryClient.invalidateQueries({ queryKey: ["/api/budgets"] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add budget categories. Please try again.",
        variant: "destructive",
      });
    }
  }

  async function handleBudgetUpdate(id: string, value: number) {
    try {
      const res = await fetch(`/api/budgets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ limit: String(value) }),
      });
      if (res.ok) {
        queryClient.setQueryData<Budget[]>(["/api/budgets"], (old) =>
          (old || []).map((b) => ((b as any).id === id ? { ...b, limit: String(value) } : b)),
        );
        await queryClient.invalidateQueries({ queryKey: ["/api/budgets"] });
        toast({
          title: "Budget Updated",
          description: "Budget amount has been successfully updated.",
        });
      } else {
        throw new Error('Failed to update budget');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update budget. Please try again.",
        variant: "destructive",
      });
    }
  }

  async function handleBudgetDelete(id: string) {
    try {
      const res = await fetch(`/api/budgets/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        queryClient.setQueryData<Budget[]>(["/api/budgets"], (old) =>
          (old || []).filter((b) => (b as any).id !== id),
        );
        await queryClient.invalidateQueries({ queryKey: ["/api/budgets"] });
        toast({
          title: "Budget Deleted",
          description: "Budget category has been successfully removed.",
        });
      } else {
        throw new Error('Failed to delete budget');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete budget. Please try again.",
        variant: "destructive",
      });
    }
  }

  async function handlePlanUpdate(id: string, value: number) {
    try {
      const field = id === "income" ? "expectedEarnings" : "expectedBills";
      const res = await fetch(`/api/budget/plan/${plan.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ [field]: value }),
      });
      if (res.ok) {
        await queryClient.invalidateQueries({ queryKey: ["/api/budget/plan", plan.month] });
        toast({
          title: "Plan Updated",
          description: `${field === 'expectedEarnings' ? 'Expected earnings' : 'Expected bills'} has been updated.`,
        });
      } else {
        throw new Error('Failed to update plan');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update budget plan. Please try again.",
        variant: "destructive",
      });
    }
  }


    const {
      basics,
      categoryRows,
      currentSpend,
      remaining,
      validationError,
      spendingBudget,
      leftForSavings,
    } = useMemo(() => {
    let income = 0;
    let billsActual = 0;
    let totalExpenses = 0;
    const actualByCat: Record<string, number> = {};

    const [y, m] = month.split("-").map(Number);
    const rangeStart = new Date(y, m - 1, 1);
    const rangeEnd = new Date(y, m, 0, 23, 59, 59, 999);

    transactions.forEach((t) => {
      const txDate = new Date(t.date);
      if (txDate < rangeStart || txDate > rangeEnd) return;

      const amt = Number(t.amount) || 0;
      if ((t as any).type === "income") {
        income += amt;
      } else {
        totalExpenses += amt;
        const cat = (t.category || "").toLowerCase();
        if (cat === "bills & utilities") billsActual += amt;
        actualByCat[cat] = (actualByCat[cat] || 0) + amt;
      }
    });

    const categoriesMap = new Map<string, Budget>();
    budgets.forEach((b) => {
      const key = (b.name || "").toLowerCase();
      if (!categoriesMap.has(key)) categoriesMap.set(key, b);
    });

    const categories = Array.from(categoriesMap.values())
      .filter((b) => !basicsSet.has((b.name || "").toLowerCase()))
      .map((b) => ({
        id: (b as any).id,
        name: (b as any).name as string,
        budgeted: Number((b as any).limit),
        actual: actualByCat[((b as any).name || "").toLowerCase()] || 0,
        icon: getIcon((b as any).name || ""),
      }));

    const allocated = categories.reduce((s, c) => s + c.budgeted, 0);
    const categoriesSpent = categories.reduce((s, c) => s + c.actual, 0);
    const spendingExpenses = totalExpenses - billsActual;

      const incomeBudgeted = Number(expectedEarnings);
      const billsBudgeted = Number(expectedBills);
      const diff = incomeBudgeted - billsBudgeted;
      const targetSavings = incomeBudgeted * 0.15;
      let savings = diff >= targetSavings ? targetSavings : diff;
      let everythingElseBudgeted = diff - savings;

      if (allocated > everythingElseBudgeted) {
        const overspend = allocated - everythingElseBudgeted;
        savings -= overspend;
        everythingElseBudgeted = 0;
      } else {
        everythingElseBudgeted -= allocated;
      }

    const everythingElse = {
      id: "everything-else",
      name: "Everything Else",
      budgeted: everythingElseBudgeted,
      actual: Math.max(spendingExpenses - categoriesSpent, 0),
      icon: getIcon("everything else"),
    };

    const basicsRows: RowProps[] = [
      {
        id: "income",
        name: "Income",
        budgeted: incomeBudgeted,
        actual: income,
        icon: getIcon("income"),
        isIncome: true,
      },
      {
        id: "bills",
        name: "Bills & Utilities",
        budgeted: billsBudgeted,
        actual: billsActual,
        icon: getIcon("bills & utilities"),
      },
    ];

    const totalBudgeted = allocated + everythingElseBudgeted;

    const currentSpendVal = categoriesSpent + everythingElse.actual;
      const remainingVal = totalBudgeted - currentSpendVal;

      return {
        basics: basicsRows,
        categoryRows: [...categories, everythingElse],
        currentSpend: currentSpendVal,
        remaining: remainingVal,
        validationError: savings < 0,
        spendingBudget: totalBudgeted,
        leftForSavings: savings,
      };
      }, [transactions, budgets, expectedEarnings, expectedBills, month]);

  const percentLeft = useMemo(
    () => (spendingBudget > 0 ? (remaining / spendingBudget) * 100 : 0),
    [spendingBudget, remaining],
  );

  const ringColor =
    remaining < 0 ? "text-red-500" : percentLeft <= 10 ? "text-orange-500" : "text-green-600";

  const [yy, mm] = month.split("-").map(Number);
  const endOfMonth = new Date(yy, mm, 0);
  const today = new Date();
  let daysRemaining = endOfMonth.getDate();
  if (today.getFullYear() === yy && today.getMonth() + 1 === mm) {
    daysRemaining = Math.max(endOfMonth.getDate() - today.getDate() + 1, 0);
  }
  const dailyAllowance = daysRemaining > 0 ? remaining / daysRemaining : 0;

  const isLoading = transactions.length === 0 && budgets.length === 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <div className="space-y-3">
              <Skeleton className="h-6 w-32" />
              <Card>
                <CardContent className="p-0">
                  <div className="space-y-3 p-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="space-y-3">
              <Skeleton className="h-6 w-40" />
              <Card>
                <CardContent className="p-0">
                  <div className="space-y-3 p-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          <Card>
            <CardContent className="p-4 space-y-4">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-24 w-24 rounded-full mx-auto" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between md:hidden">
        <h1 className="text-xl font-semibold">Budgets</h1>
        <Drawer>
          <DrawerTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full border"
              aria-label="Open budget FAQ"
            >
              <Info className="h-4 w-4" />
            </Button>
          </DrawerTrigger>
          <DrawerContent
            className="h-full p-4"
            aria-labelledby="faq-title-mobile"
          >
            <div className="flex justify-end">
              <DrawerClose asChild>
                <Button variant="ghost" size="icon" aria-label="Close FAQ">
                  <X className="h-4 w-4" />
                </Button>
              </DrawerClose>
            </div>
            <DrawerHeader className="text-left">
              <DrawerTitle id="faq-title-mobile">BudgetHero FAQ</DrawerTitle>
            </DrawerHeader>
            <Accordion
              type="single"
              collapsible
              value={faqOpenItem}
              onValueChange={setFaqOpenItem}
              className="w-full text-sm"
            >
              {faqItems.map((item) => (
                <AccordionItem key={item.value} value={item.value}>
                  <AccordionTrigger className="text-left">{item.title}</AccordionTrigger>
                  <AccordionContent className="space-y-2">
                    <p>
                      <strong>Q:</strong> {item.question}
                    </p>
                    <p>
                      <strong>A:</strong> {item.answer}
                    </p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </DrawerContent>
        </Drawer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_360px] gap-4 items-start">
        <div className="space-y-6">
          <section>
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-card-foreground">Budget Basics</h2>
              <p className="text-sm text-muted-foreground">Your core income and expense categories</p>
            </div>
            <Card className="shadow-sm">
              <CardContent className="p-0">

                  <table className="w-full caption-bottom text-sm">
                    <thead className="[&_tr]:border-b">
                      <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">
                          Category
                        </th>
                        <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">
                          Budgeted
                        </th>
                        <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">
                          Actual
                        </th>
                        <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">
                          Remaining
                        </th>
                      </tr>
                    </thead>
                    <tbody className="[&_tr:last-child]:border-0">
                      {basics.map((b) => (
                        <BudgetRow
                          key={b.name}
                          {...b}
                          editable
                          onUpdate={handlePlanUpdate}
                        />
                      ))}

                    </tbody>
                  </table>

              </CardContent>
            </Card>
          </section>

          <Separator className="my-6" />

          <section>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-card-foreground">Budget Categories</h2>
                <p className="text-sm text-muted-foreground">Track spending by category</p>
              </div>
              <Dialog open={openAdd} onOpenChange={setOpenAdd}>
                <DialogTrigger asChild>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="gap-2"
                    data-testid="button-add-budget"
                  >
                    <Plus className="h-4 w-4" />
                    Add Budget
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add Budget Categories</DialogTitle>
                  </DialogHeader>

                  {availableCategories.length === 0 ? (
                    <div className="text-center py-6">
                      <p className="text-sm text-muted-foreground">
                        All available categories have been added to your budget.
                      </p>
                    </div>
                  ) : (
                    <div className="max-h-60 overflow-y-auto space-y-2 py-2">
                      {availableCategories.map((name) => {
                        const Icon = getIcon(name);
                        const checked = selectedCats.has(name);
                        return (
                          <div key={name} className="flex items-center justify-between py-2 px-1 rounded hover:bg-muted/50">
                            <div className="flex items-center gap-3">
                              <Icon className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                              <span className="text-sm font-medium">{name}</span>
                            </div>
                            <Switch
                              checked={checked}
                              onCheckedChange={(val) => {
                                const next = new Set(selectedCats);
                                if (val) next.add(name);
                                else next.delete(name);
                                setSelectedCats(next);
                              }}
                              aria-label={`${checked ? 'Remove' : 'Add'} ${name} budget`}
                              data-testid={`switch-budget-${name.toLowerCase().replace(/\s+/g, '-')}`}
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setSelectedCats(new Set());
                        setOpenAdd(false);
                      }}
                      data-testid="button-cancel-add-budget"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      onClick={handleAddCategories}
                      disabled={selectedCats.size === 0}
                      data-testid="button-confirm-add-budget"
                    >
                      Add {selectedCats.size > 0 ? `(${selectedCats.size})` : ''}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <Card className="shadow-sm">
              <CardContent className="p-0">
                {validationError && (
                  <div className="bg-destructive/10 border-l-4 border-destructive p-4 mb-0">
                    <div className="flex items-start gap-2">
                      <X className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-destructive">
                          Budget Validation Error
                        </p>
                        <p className="text-sm text-destructive/80">
                          Your category budgets exceed your available spending budget. Please adjust your allocations.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                  <table className="w-full caption-bottom text-sm">
                    <thead className="[&_tr]:border-b">
                      <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">
                          Category
                        </th>
                        <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">
                          Budgeted
                        </th>
                        <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">
                          Actual
                        </th>
                        <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">
                          Remaining
                        </th>
                      </tr>
                    </thead>
                    <tbody className="[&_tr:last-child]:border-0">
                      {categoryRows.map((c) => (
                        <BudgetRow
                          key={c.id}
                          id={c.id}
                          name={c.name}
                          budgeted={c.budgeted}
                          actual={c.actual}
                          icon={c.icon}
                          editable={c.id !== "everything-else"}
                          onUpdate={handleBudgetUpdate}
                          onDelete={c.id !== "everything-else" ? handleBudgetDelete : undefined}
                        />
                      ))}
                      <tr className="border-b bg-muted/50">
                        <td className="h-12 px-4 text-left align-middle">
                          <div className="flex items-center gap-2">
                            <Wallet className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                            <span className="font-medium">Spending Budget</span>
                          </div>
                        </td>
                        <td className="p-4 align-middle text-right font-medium">
                          {fmt.format(spendingBudget)}
                        </td>
                        <td className="p-4 align-middle text-right font-medium">
                          {fmt.format(currentSpend)}
                        </td>
                        <td className="p-4 align-middle text-right font-medium">
                          {fmt.format(remaining)}
                        </td>
                      </tr>
                      <tr className="border-b bg-muted/50">
                        <td className="h-12 px-4 text-left align-middle">
                          <div className="flex items-center gap-2">
                            <PiggyBank className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                            <span className="font-medium">Left for Savings</span>
                          </div>
                        </td>
                        <td className={`p-4 align-middle text-right font-medium ${leftForSavings < 0 ? 'text-red-600' : ''}`}>
                          {fmt.format(leftForSavings)}
                        </td>
                        <td className="p-4 align-middle text-right"></td>
                        <td className="p-4 align-middle text-right"></td>
                      </tr>
                    </tbody>
                  </table>

                </CardContent>
                    </Card>
                  </section>

                </div>
        

        
            <div className="md:col-start-2 md:row-span-1 md:sticky md:top-6">
            <div className="flex items-center justify-between">
              <h2 id="budget-summary-title" className="text-lg font-semibold text-card-foreground">
                 Budget Summary
               </h2>
               <Dialog>
                 <DialogTrigger asChild>
                   <Button
                     variant="ghost"
                     size="icon"
                     className="hidden md:flex rounded-full border"
                     aria-label="Open budget FAQ"
                   >
                     <Info className="h-4 w-4" />
                   </Button>
                 </DialogTrigger>
                 <DialogContent
                   className="sm:max-w-[720px]"
                   aria-labelledby="faq-title-desktop"
                 >
                   <DialogHeader>
                     <DialogTitle id="faq-title-desktop">BudgetHero FAQ</DialogTitle>
                   </DialogHeader>
                   <Accordion
                     type="single"
                     collapsible
                     value={faqOpenItem}
                     onValueChange={setFaqOpenItem}
                     className="w-full text-sm"
                   >
                     {faqItems.map((item) => (
                       <AccordionItem key={item.value} value={item.value}>
                         <AccordionTrigger className="text-left">{item.title}</AccordionTrigger>
                         <AccordionContent className="space-y-2">
                           <p>
                             <strong>Q:</strong> {item.question}
                           </p>
                           <p>
                             <strong>A:</strong> {item.answer}
                           </p>
                         </AccordionContent>
                       </AccordionItem>
                     ))}
                   </Accordion>
                 </DialogContent>
               </Dialog>
            </div>
           <p className="text-sm text-muted-foreground mb-3">
             Your spending overview for this month
           </p>
               <Card className="shadow-sm w-full">
                 <CardContent className="p-4 md:p-6 space-y-4 md:space-y-6">
                  <div className="md:hidden space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Left to Spend</span>
                      <span>{fmt.format(remaining)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Spending Budget</span>
                      <span>{fmt.format(spendingBudget)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Current Spend</span>
                      <span>{fmt.format(currentSpend)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-1">
                      <span>Remaining</span>
                      <span className={ringColor}>{fmt.format(remaining)}</span>
                    </div>
                    {daysRemaining > 0 && showDetails && (
                      <p className="text-center text-xs text-muted-foreground mt-2">
                        {fmt.format(dailyAllowance)}/day • {daysRemaining} days left
                      </p>
                    )}
                    {daysRemaining > 0 && (
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto p-0 mt-2"
                        onClick={() => setShowDetails(!showDetails)}
                      >
                        {showDetails ? "Hide details" : "Show details"}
                      </Button>
                    )}
                  </div>

              <div
                className="hidden md:flex flex-col items-center justify-center"
                aria-label={`Left to spend: ${fmt.format(remaining)}`}
              >
                <div className="relative w-48 h-48">
                  <svg viewBox="0 0 36 36" className="w-48 h-48" aria-hidden="true">
                    <path
                      d="M18 2.0845a 15.9155 15.9155 0 1 1 0 31.831a 15.9155 15.9155 0 1 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      className="text-gray-300 dark:text-gray-700"
                      strokeWidth="3"
                    />
                    <path
                      d="M18 2.0845a 15.9155 15.9155 0 1 1 0 31.831a 15.9155 15.9155 0 1 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      className={ringColor}
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeDasharray={`${Math.max(Math.min(percentLeft, 100), 0)}, 100`}
                      style={{ transition: "stroke-dasharray 0.3s ease" }}
                    />
                  </svg>
                  <div className="absolute inset-4 lg:inset-5 flex flex-col items-center justify-center text-center gap-1">
                    <p className="text-sm font-small text-card-foreground">Left to Spend</p>
                    <span className="text-2xl font-extrabold tracking-tight text-card-foreground">
                      
                      {fmt.format(remaining)}
                    </span>
                  </div>
                </div>
                <div className="text-center mt-3">
                  <p className="text-sm font-medium text-card-foreground">Left to Spend</p>
                  {daysRemaining > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {fmt.format(dailyAllowance)}/day • {daysRemaining} days left
                    </p>
                  )}
                </div>
              </div>

                   <Separator className="hidden md:block" />

                   <div className="hidden md:block space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Spending Budget</span>
                  <span className="text-sm font-medium">{fmt.format(spendingBudget)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Current Spend</span>
                  <span className="text-sm">{fmt.format(currentSpend)}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-sm font-medium">Remaining</span>
                  <span className={`text-sm font-semibold ${ringColor}`}>
                    {fmt.format(remaining)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>


    </div>
  );
}
