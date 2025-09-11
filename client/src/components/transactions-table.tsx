import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Search,
  Download,
  TrendingUp,
  TrendingDown,
  Edit3,
  Save,
  X,
  Trash2,
  Upload,
  Filter,
  ChevronDown,
  Eye,
  MapPin,
  CreditCard,
  Star,
  Receipt,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  ChevronLeft,
  EllipsisVertical,
  Plus,
} from "lucide-react";
//import { TransactionDetailDialog } from "./transaction-detail-dialog";
import { TransactionRecurringBadge } from "./transaction-recurring-badge";

import { MerchantSparkline } from "./merchant-sparkline";
import { MerchantHoverTooltip } from "./merchant-hover-tooltip";
import { MerchantDetailDialog } from "./merchant-detail-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  formatCurrency,
  formatDate,
  formatDateShort,
} from "@/lib/financial-utils";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  defaultCategories,
  getLedgerTypeColor,
  getLedgerTypeLabel,
} from "@/lib/transaction-classifier";
import { TransactionDetailsModal } from "./transaction-details-modal";
import { InlineCategorySelector } from "./inline-category-selector";
import { CategoryBadge } from "./category-badge";
import { getCategoryIcon } from "@/lib/category-icons";
import { IgnoreButton } from "./ignore-button";
import { InlineDescriptionEditor } from "./inline-description-editor";
import { CreateRuleModal } from "./create-rule-modal";
import { RuleConfirmationModal } from "./rule-confirmation-modal";
import type {
  Transaction,
  TransactionFilters,
  LedgerType,
} from "@shared/schema";

interface TransactionsTableProps {
  limit?: number;
  showFilters?: boolean;
  filterByCategory?: string; // New prop to filter by specific category
  onAddTransaction?: () => void;
}

export default function TransactionsTable({
  limit,
  showFilters = false,
  filterByCategory,
  onAddTransaction,
}: TransactionsTableProps) {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(
    null,
  );
  const [editForm, setEditForm] = useState<Partial<Transaction>>({});
  const [categoryFilter, setCategoryFilter] = useState(filterByCategory || "");
  const [typeFilter, setTypeFilter] = useState("");
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(
    new Set(),
  );
  const [swipeStates, setSwipeStates] = useState<
    Record<string, { offset: number; isSwiping: boolean }>
  >({});
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Advanced filtering state
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(
    new Set(),
  );
  const [selectedMerchants, setSelectedMerchants] = useState<Set<string>>(
    new Set(),
  );
  const [selectedAccounts, setSelectedAccounts] = useState<Set<string>>(
    new Set(),
  );
  const [amountMin, setAmountMin] = useState("");
  const [amountMax, setAmountMax] = useState("");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showSearchDialog, setShowSearchDialog] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");

  // Transaction details modal state
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // Rule creation modal state
  const [ruleModalOpen, setRuleModalOpen] = useState(false);
  const [ruleModalTransaction, setRuleModalTransaction] =
    useState<Transaction | null>(null);
  const [pendingChanges, setPendingChanges] = useState<
    Partial<Transaction> | undefined
  >(undefined);

  // Rule confirmation modal state
  const [confirmationModalOpen, setConfirmationModalOpen] = useState(false);

  // Sorting state
  const [sortField, setSortField] = useState<
    "date" | "merchant" | "category" | "amount"
  >("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const [itemsPerPage, setItemsPerPage] = useState(limit || 10);
  const pageSize = itemsPerPage;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Simple Trend Indicator Component
  const TrendIndicator = ({
    merchant,
    amount,
  }: {
    merchant: string;
    amount: number;
  }) => {
    // Create consistent trend based on merchant name hash (stable, no randomness)
    const merchantHash = merchant
      .toLowerCase()
      .split("")
      .reduce((a, b) => {
        a = (a << 5) - a + b.charCodeAt(0);
        return a & a;
      }, 0);

    const isPositiveTrend = Math.abs(merchantHash) % 2 === 0;

    return (
      <div className="flex items-center ml-1">
        <div
          className={`
          flex items-center justify-center w-3 h-3 rounded-full
          ${
            isPositiveTrend
              ? "bg-green-500 text-white"
              : "bg-red-500 text-white"
          }
        `}
        >
          <span className="text-2xs font-medium">
            {isPositiveTrend ? "↓" : "↑"}
          </span>
        </div>
      </div>
    );
  };

  // Debounced search to prevent excessive API calls
  const [debouncedSearch, setDebouncedSearch] = useState(search);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300); // 300ms delay

    return () => clearTimeout(timer);
  }, [search]);

  // Use admin categories for consistency with new categorization system
  const { data: adminCategories = [] } = useQuery({
    queryKey: ["/api/admin/categories"],
  });

  // Organize categories by type for better filtering, with subcategory display
  const categoriesArray = Array.isArray(adminCategories) ? adminCategories : [];

  // Create category display function that includes subcategory
  const formatCategoryWithSubcategory = (cat: any) => {
    // Check if there's a subcategory and it's different from the main category
    if (
      cat.subcategory &&
      cat.subcategory.trim() &&
      cat.subcategory !== cat.name &&
      cat.subcategory !== "null"
    ) {
      return `${cat.name} (${cat.subcategory})`;
    }
    return cat.name;
  };

  const incomeCategories = categoriesArray
    .filter((cat: any) => cat.ledgerType === "INCOME")
    .map(formatCategoryWithSubcategory)
    .sort((a, b) => a.localeCompare(b));

  const expenseCategories = categoriesArray
    .filter((cat: any) => cat.ledgerType === "EXPENSE")
    .map(formatCategoryWithSubcategory)
    .sort((a, b) => a.localeCompare(b));

  const businessCategories = categoriesArray
    .filter(
      (cat: any) =>
        cat.ledgerType === "EXPENSE" &&
        cat.sortOrder >= 200 &&
        cat.sortOrder < 300,
    )
    .map(formatCategoryWithSubcategory)
    .sort((a, b) => a.localeCompare(b));

  const transferCategories = categoriesArray
    .filter(
      (cat: any) =>
        cat.ledgerType === "TRANSFER" || cat.ledgerType === "ADJUSTMENT",
    )
    .map(formatCategoryWithSubcategory)
    .sort((a, b) => a.localeCompare(b));

  const allCategories = categoriesArray.map((cat: any) => cat.name);

  // Fetch merchants and accounts for advanced filtering
  const { data: rawMerchants = [] } = useQuery({
    queryKey: ["/api/transactions/merchants"],
  });

  const { data: rawAccounts = [] } = useQuery({
    queryKey: ["/api/accounts"],
  });

  // Use merchants as-is from server (already properly sorted and capitalized)
  const merchants = Array.isArray(rawMerchants) ? rawMerchants : [];

  // Process accounts: sort and ensure proper capitalization
  const accounts = Array.isArray(rawAccounts)
    ? rawAccounts
        .filter((acc) => acc && (acc.name || acc.officialName)) // Only accounts with names
        .map((acc) => ({
          ...acc,
          displayName: (acc.name || acc.officialName || "Unknown Account")
            .split(" ")
            .map(
              (word: string) =>
                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
            )
            .join(" "),
        }))
        .sort((a, b) => a.displayName.localeCompare(b.displayName)) // Sort by display name
    : [];

  // Convert filter sets to single values for API (simplified approach)
  // Use lowercase for merchant filter to match database storage
  const merchantFilter =
    selectedMerchants.size > 0
      ? Array.from(selectedMerchants)[0].toLowerCase()
      : "";
  const accountFilter =
    selectedAccounts.size > 0 ? Array.from(selectedAccounts)[0] : "";

  const {
    data: transactions,
    isLoading,
    error,
  } = useQuery({
    queryKey: [
      "/api/transactions",
      {
        search: debouncedSearch,
        categoryFilter,
        typeFilter,
        merchantFilter,
        accountFilter,
      },
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (debouncedSearch) params.append("search", debouncedSearch);
      if (categoryFilter) params.append("category", categoryFilter);
      if (typeFilter) params.append("type", typeFilter);
      if (merchantFilter) params.append("merchant", merchantFilter);
      if (accountFilter) params.append("account", accountFilter);

      const response = await fetch(`/api/transactions?${params}`);
      const data = await response.json();
      // Ensure we always return an array
      const result = Array.isArray(data) ? data : [];
      console.log("TransactionsTable data:", {
        responseStatus: response.status,
        dataLength: result.length,
        sampleData: result.slice(0, 2),
        search: debouncedSearch,
        categoryFilter,
        typeFilter,
        merchantFilter,
        accountFilter,
        limit,
      });
      return result;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: { id: string } & Partial<Transaction>) => {
      const response = await fetch(`/api/transactions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error("Failed to update transaction");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/summary"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/analytics/categories"],
      });
      setEditingId(null);
      setEditForm({});
      toast({
        title: "Success",
        description: "Transaction updated successfully!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update transaction",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/transactions/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete transaction");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/summary"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/analytics/categories"],
      });
      toast({
        title: "Success",
        description: "Transaction deleted successfully!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete transaction",
        variant: "destructive",
      });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async ({
      transactionIds,
      deleteAll,
    }: {
      transactionIds?: string[];
      deleteAll?: boolean;
    }) => {
      const response = await fetch("/api/transactions/bulk-delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionIds, deleteAll }),
      });
      if (!response.ok) throw new Error("Failed to delete transactions");
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/summary"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/analytics/categories"],
      });
      setSelectedTransactions(new Set()); // Clear selection
      toast({
        title: "Success",
        description: `Deleted ${data.deletedCount} transactions`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete manual entries",
        variant: "destructive",
      });
    },
  });

  const startEdit = (transaction: Transaction) => {
    setEditingId(transaction.id);
    setEditForm({
      description: transaction.description,
      merchant: transaction.merchant,
      category: transaction.category,
      amount: transaction.amount,
      type: transaction.type,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEdit = () => {
    if (!editingId) return;
    updateMutation.mutate({ id: editingId, ...editForm });
  };

  const deleteTransaction = (id: string) => {
    if (confirm("Are you sure you want to delete this transaction?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleBulkDelete = (deleteAll = false) => {
    if (deleteAll) {
      const totalCount = Array.isArray(transactions) ? transactions.length : 0;
      if (totalCount === 0) {
        toast({
          title: "No Transactions",
          description: "No transactions found to delete",
        });
        return;
      }
      if (
        confirm(
          `Are you sure you want to delete ALL ${totalCount} transactions? This cannot be undone.`,
        )
      ) {
        bulkDeleteMutation.mutate({ deleteAll: true });
      }
    } else {
      const selectedCount = selectedTransactions.size;
      if (selectedCount === 0) {
        toast({
          title: "No Selection",
          description: "Please select transactions to delete",
        });
        return;
      }
      if (
        confirm(
          `Are you sure you want to delete ${selectedCount} selected transactions? This cannot be undone.`,
        )
      ) {
        bulkDeleteMutation.mutate({
          transactionIds: Array.from(selectedTransactions),
        });
      }
    }
  };

  const toggleSelectTransaction = (id: string) => {
    const newSelected = new Set(selectedTransactions);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedTransactions(newSelected);
  };

  const toggleSelectAll = () => {
    if (!Array.isArray(transactions)) return;

    const currentPageTransactions = transactions.slice(
      (currentPage - 1) * pageSize,
      currentPage * pageSize,
    );

    const allSelected = currentPageTransactions.every((t) =>
      selectedTransactions.has(t.id),
    );
    const newSelected = new Set(selectedTransactions);

    if (allSelected) {
      currentPageTransactions.forEach((t) => newSelected.delete(t.id));
    } else {
      currentPageTransactions.forEach((t) => newSelected.add(t.id));
    }

    setSelectedTransactions(newSelected);
  };

  const handleDescriptionChange = (
    transaction: Transaction,
    newDescription: string,
  ) => {
    if (newDescription !== (transaction.description || "")) {
      console.log("📝 Description change triggered:", {
        transactionId: transaction.id,
        oldDescription: transaction.description,
        newDescription: newDescription,
      });
      setRuleModalTransaction(transaction);
      setPendingChanges({ description: newDescription });
      setConfirmationModalOpen(true);
    }
  };

  const handleCategoryChangeWithRule = (
    transaction: Transaction,
    categoryId: string,
    categoryName: string,
  ) => {
    if (categoryName !== transaction.category) {
      setRuleModalTransaction(transaction);
      setPendingChanges({
        category: categoryName,
        categoryId: categoryId || null,
      });
      setConfirmationModalOpen(true);
    }
  };

  const handleCreateRuleConfirmed = () => {
    setConfirmationModalOpen(false);
    setRuleModalOpen(true);
  };

  const handleUpdateOnlyConfirmed = async () => {
    if (!ruleModalTransaction || !pendingChanges) {
      console.log("❌ Missing data for update:", {
        ruleModalTransaction,
        pendingChanges,
      });
      return;
    }

    try {
      const updateData: any = {};

      if (pendingChanges.description) {
        updateData.description = pendingChanges.description;
      }
      if (pendingChanges.category) {
        updateData.category = pendingChanges.category;
        updateData.categoryId = pendingChanges.categoryId;
      }

      console.log("🔄 Updating transaction:", {
        id: ruleModalTransaction.id,
        updateData,
        originalDescription: ruleModalTransaction.description,
        newDescription: pendingChanges.description,
      });

      const response = await apiRequest(
        `/api/transactions/${ruleModalTransaction.id}`,
        "PATCH",
        updateData,
      );
      console.log("✅ Update response:", response);
      console.log(
        "📝 Response type:",
        typeof response,
        "Response data:",
        JSON.stringify(response, null, 2),
      );

      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });

      toast({
        title: "Success",
        description: `Transaction ${pendingChanges.description ? "description" : "category"} updated`,
      });

      // Reset states
      setConfirmationModalOpen(false);
      setRuleModalTransaction(null);
      setPendingChanges(undefined);
    } catch (error) {
      console.error("❌ Error updating transaction:", error);
      console.error("❌ Error details:", {
        errorType: typeof error,
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        errorStack: error instanceof Error ? error.stack : undefined,
        fullError: error,
      });

      // Check if it's an authentication error
      if (
        error instanceof Error &&
        (error.message.includes("Unauthorized") ||
          error.message.includes("401"))
      ) {
        toast({
          title: "Authentication Required",
          description:
            "Please log in to update transactions. Redirecting to login page...",
          variant: "destructive",
        });

        // Redirect to login after a short delay
        setTimeout(() => {
          window.location.href = "/login";
        }, 2000);
        return;
      }

      toast({
        title: "Error",
        description: `Failed to update transaction: ${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "destructive",
      });
    }
  };

  const handleRuleModalSuccess = () => {
    // Reset all states
    setRuleModalOpen(false);
    setConfirmationModalOpen(false);
    setRuleModalTransaction(null);
    setPendingChanges(undefined);

    // Refresh transactions
    queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
  };

  const handleExport = () => {
    if (
      !Array.isArray(filteredTransactions) ||
      filteredTransactions.length === 0
    )
      return;

    // Proper CSV formatting with escaped quotes and commas
    const formatCSVField = (field: string | number) => {
      const str = String(field);
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const csvContent = [
      [
        "Date",
        "Merchant",
        "Description",
        "Category",
        "Amount",
        "Type",
      ],
      ...filteredTransactions.map((t: Transaction) => [
        formatDate(new Date(t.date)),
        formatCSVField(t.merchant || ""),
        formatCSVField(t.description),
        formatCSVField(t.category),
        formatCSVField(`${t.type === "income" ? "+" : "-"}$${t.amount}`),
        formatCSVField(t.type),
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Enhanced merchant logo with proper fallbacks
  const MerchantLogo = ({
    merchant,
    size = 8,
  }: {
    merchant?: string | null;
    size?: number;
  }) => {
    const [imageError, setImageError] = useState(false);

    // Handle null/empty merchant names with generic icon
    if (!merchant || merchant.trim() === "") {
      return (
        <div
          className={`w-${size} h-${size} bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center`}
        >
          <Receipt className="w-4 h-4 text-gray-500" />
        </div>
      );
    }

    const cleanMerchant = merchant.toLowerCase().replace(/[^a-z0-9]/g, "");
    const logoUrl = `https://logo.clearbit.com/${cleanMerchant}.com`;

    // Generate fallback initials and color for valid merchant names
    const initials = merchant
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
    const colors = [
      "bg-blue-500",
      "bg-green-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-indigo-500",
      "bg-yellow-500",
      "bg-red-500",
      "bg-teal-500",
    ];
    const colorIndex = merchant.length % colors.length;
    const bgColor = colors[colorIndex];

    if (imageError) {
      return (
        <div
          className={`w-${size} h-${size} ${bgColor} rounded-full flex items-center justify-center text-white text-xs font-semibold`}
        >
          {initials}
        </div>
      );
    }

    return (
      <img
        src={logoUrl}
        alt={`${merchant} logo`}
        className={`w-${size} h-${size} rounded-full object-cover border border-gray-200`}
        onError={() => setImageError(true)}
      />
    );
  };

  // Calculate totals for current page
  const calculatePageTotals = () => {
    const income = paginatedTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const expenses = paginatedTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    return { income, expenses, net: income - expenses };
  };

  // Advanced filtering logic
  let filteredTransactions = Array.isArray(transactions) ? transactions : [];

  // Text search - case insensitive
  if (search) {
    const searchTerm = search.toLowerCase().trim();
    filteredTransactions = filteredTransactions.filter(
      (transaction: Transaction) =>
        transaction.description.toLowerCase().includes(searchTerm) ||
        transaction.category.toLowerCase().includes(searchTerm) ||
        (transaction.merchant &&
          transaction.merchant.toLowerCase().includes(searchTerm)),
    );
  }

  // Legacy single category filter (for backwards compatibility)
  if (categoryFilter && categoryFilter !== "all" && categoryFilter !== "") {
    filteredTransactions = filteredTransactions.filter(
      (transaction: Transaction) => transaction.category === categoryFilter,
    );
  }

  // Advanced multi-category filter - handle both plain and subcategory format
  if (selectedCategories.size > 0) {
    filteredTransactions = filteredTransactions.filter(
      (transaction: Transaction) => {
        // Check if the exact category is selected
        if (selectedCategories.has(transaction.category)) return true;

        // Check if any selected category matches when formatted with subcategory
        return Array.from(selectedCategories).some((selectedCat) => {
          // Extract base category name from "Category (Subcategory)" format
          const baseCatMatch = selectedCat.match(/^([^(]+)/);
          const baseCat = baseCatMatch ? baseCatMatch[1].trim() : selectedCat;
          return transaction.category === baseCat;
        });
      },
    );
  }

  // Merchant filter - support multiple selections client-side
  if (selectedMerchants.size > 0) {
    filteredTransactions = filteredTransactions.filter(
      (transaction: Transaction) => {
        if (!transaction.merchant) return false;
        const merchantName = transaction.merchant.toLowerCase();
        return Array.from(selectedMerchants).some(
          (m) => merchantName === m.toLowerCase(),
        );
      },
    );
  }

  // Account filter
  if (selectedAccounts.size > 0) {
    filteredTransactions = filteredTransactions.filter(
      (transaction: Transaction) =>
        transaction.accountId && selectedAccounts.has(transaction.accountId),
    );
  }

  // Amount range filter
  if (amountMin || amountMax) {
    filteredTransactions = filteredTransactions.filter(
      (transaction: Transaction) => {
        const amount = parseFloat(transaction.amount);
        const min = amountMin ? parseFloat(amountMin) : 0;
        const max = amountMax ? parseFloat(amountMax) : Infinity;
        return amount >= min && amount <= max;
      },
    );
  }

  // Type filter
  if (typeFilter && typeFilter !== "all") {
    filteredTransactions = filteredTransactions.filter(
      (transaction: Transaction) => transaction.type === typeFilter,
    );
  }

  // Sorting function
  const handleSort = (field: "date" | "merchant" | "category" | "amount") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  // Apply sorting
  filteredTransactions = filteredTransactions.sort(
    (a: Transaction, b: Transaction) => {
      let comparison = 0;

      switch (sortField) {
        case "date":
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case "merchant":
          comparison = (a.merchant || "Unknown").localeCompare(
            b.merchant || "Unknown",
          );
          break;
        case "category":
          comparison = a.category.localeCompare(b.category);
          break;
        case "amount":
          comparison = parseFloat(a.amount) - parseFloat(b.amount);
          break;
        default:
          comparison = 0;
      }

      return sortDirection === "asc" ? comparison : -comparison;
    },
  );

  const paginatedTransactions = limit
    ? filteredTransactions.slice(0, limit)
    : filteredTransactions.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize,
      );

  const totalPages = Math.ceil(filteredTransactions.length / pageSize);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-12 bg-slate-100 rounded animate-pulse"
              ></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    console.error("TransactionsTable error:", error);
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <p className="text-lg font-medium text-red-600">
              Error loading transactions
            </p>
            <p className="text-slate-600">
              {error instanceof Error ? error.message : "Please try refreshing"}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-3">
          <CardTitle>Transactions</CardTitle>
          {onAddTransaction && (
            <Button
              onClick={onAddTransaction}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold px-6 py-2 shadow-lg"
              data-testid="button-add-transaction"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Transaction
            </Button>
          )}
          {showFilters && (
            <>
                {/* Search Button */}
              <Dialog
                open={showSearchDialog}
                onOpenChange={setShowSearchDialog}
              >
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Search className="w-4 h-4" />
                    Search
                  </Button>
                </DialogTrigger>
                <DialogContent
                  className="sm:max-w-md"
                  aria-describedby="search-description"
                >
                  <DialogHeader>
                    <DialogTitle>Search Transactions</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Enter search keyword
                      </label>
                      <Input
                        placeholder="e.g., Uber, Zelle, McDonald's..."
                        value={searchKeyword}
                        onChange={(e) => setSearchKeyword(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            setSearch(searchKeyword);
                            setShowSearchDialog(false);
                          }
                        }}
                        autoFocus
                        data-testid="input-search-keyword"
                      />
                      <p
                        id="search-description"
                        className="text-xs text-slate-500"
                      >
                        Search by merchant name, description, or category
                      </p>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setShowSearchDialog(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={() => {
                          setSearch(searchKeyword);
                          setShowSearchDialog(false);
                        }}
                        disabled={!searchKeyword.trim()}
                        data-testid="button-search-execute"
                      >
                        <Search className="w-4 h-4 mr-2" />
                        Search
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Clear Search Button */}
              {search && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearch("");
                    setSearchKeyword("");
                  }}
                  className="gap-2 text-slate-600"
                >
                  <X className="w-4 h-4" />
                  Clear Search
                </Button>
              )}

              {/* Advanced Filters Toggle */}
              <Button
                variant="outline"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="gap-2"
              >
                <Filter className="w-4 h-4" />
                Advanced Filters
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${showAdvancedFilters ? "rotate-180" : ""}`}
                />
              </Button>

              {/* Enhanced bulk selection actions */}
              {selectedTransactions.size > 0 && (
                <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-300 px-2">
                    {selectedTransactions.size} selected
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const selectedTxns = paginatedTransactions.filter((t) =>
                        selectedTransactions.has(t.id),
                      );
                      toast({
                        title: "Feature Coming Soon",
                        description:
                          "Bulk category editing will be available soon!",
                      });
                    }}
                    className="h-7"
                  >
                    <Edit3 className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const selectedTxns = paginatedTransactions.filter((t) =>
                        selectedTransactions.has(t.id),
                      );
                      const csvContent = [
                        [
                          "Date",
                          "Merchant",
                          "Description",
                          "Category",
                          "Amount",
                          "Type",
                        ],
                        ...selectedTxns.map((t: Transaction) => [
                          formatDate(new Date(t.date)),
                          t.merchant || "",
                          t.description,
                          t.category,
                          `${t.type === "income" ? "+" : "-"}$${t.amount}`,
                          t.type,
                        ]),
                      ]
                        .map((row) => row.join(","))
                        .join("\n");

                      const blob = new Blob([csvContent], { type: "text/csv" });
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `selected-transactions-${new Date().toISOString().split("T")[0]}.csv`;
                      a.click();
                      window.URL.revokeObjectURL(url);
                    }}
                    className="h-7"
                  >
                    <Download className="w-3 h-3 mr-1" />
                    Export
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleBulkDelete(false)}
                    disabled={bulkDeleteMutation.isPending}
                    className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300 h-7"
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Delete
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelectedTransactions(new Set())}
                    className="h-7"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              )}

            </>
            )}
          <Button
            variant="outline"
            onClick={handleExport}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Export All
          </Button>
        </div>

        {/* Search Results Display */}
        {search && (
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 border-b">
            <div className="text-sm text-blue-700 dark:text-blue-300">
              Search results for:{" "}
              <span className="font-semibold">"{search}"</span>
              {filteredTransactions.length > 0 && (
                <span className="ml-2">
                  ({filteredTransactions.length} found)
                </span>
              )}
              {filteredTransactions.length === 0 && (
                <span className="ml-2 text-orange-600">(no results found)</span>
              )}
            </div>
          </div>
        )}

        {/* Advanced Filters Panel */}
        {showFilters && showAdvancedFilters && (
          <div className="border-t bg-slate-50 dark:bg-slate-800/50 p-4 space-y-4">
            {/* Search Section */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none z-10" />
                <Input
                  placeholder="Search transactions, categories, merchants..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                  autoComplete="off"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Multi-Category Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Categories</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between"
                    >
                      {selectedCategories.size > 0
                        ? `${selectedCategories.size} selected`
                        : "Select categories"}
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 max-h-60 overflow-y-auto p-3">
                    <div className="space-y-3">
                      {/* Income Section */}
                      {incomeCategories.length > 0 && (
                        <div>
                          <div className="text-xs font-semibold text-green-600 bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-md mb-2">
                            💰 Income
                          </div>
                          <div className="space-y-2">
                            {incomeCategories.map((category: string) => (
                              <div
                                key={category}
                                className="flex items-center space-x-3 pl-2"
                              >
                                <Checkbox
                                  checked={selectedCategories.has(category)}
                                  onCheckedChange={(checked) => {
                                    const newSet = new Set(selectedCategories);
                                    if (checked) {
                                      newSet.add(category);
                                    } else {
                                      newSet.delete(category);
                                    }
                                    setSelectedCategories(newSet);
                                  }}
                                  className="w-4 h-4"
                                />
                                <label
                                  className="text-sm cursor-pointer flex-1"
                                  onClick={() => {
                                    const newSet = new Set(selectedCategories);
                                    if (selectedCategories.has(category)) {
                                      newSet.delete(category);
                                    } else {
                                      newSet.add(category);
                                    }
                                    setSelectedCategories(newSet);
                                  }}
                                >
                                  {category}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Expense Section */}
                      {expenseCategories.length > 0 && (
                        <div>
                          <div className="text-xs font-semibold text-red-600 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-md mb-2">
                            💸 Expenses
                          </div>
                          <div className="space-y-2">
                            {expenseCategories.map((category: string) => (
                              <div
                                key={category}
                                className="flex items-center space-x-3 pl-2"
                              >
                                <Checkbox
                                  checked={selectedCategories.has(category)}
                                  onCheckedChange={(checked) => {
                                    const newSet = new Set(selectedCategories);
                                    if (checked) {
                                      newSet.add(category);
                                    } else {
                                      newSet.delete(category);
                                    }
                                    setSelectedCategories(newSet);
                                  }}
                                  className="w-4 h-4"
                                />
                                <label
                                  className="text-sm cursor-pointer flex-1"
                                  onClick={() => {
                                    const newSet = new Set(selectedCategories);
                                    if (selectedCategories.has(category)) {
                                      newSet.delete(category);
                                    } else {
                                      newSet.add(category);
                                    }
                                    setSelectedCategories(newSet);
                                  }}
                                >
                                  {category}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Business Section */}
                      {businessCategories.length > 0 && (
                        <div>
                          <div className="text-xs font-semibold text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-md mb-2">
                            🏢 Business
                          </div>
                          <div className="space-y-2">
                            {businessCategories.map((category: string) => (
                              <div
                                key={category}
                                className="flex items-center space-x-3 pl-2"
                              >
                                <Checkbox
                                  checked={selectedCategories.has(category)}
                                  onCheckedChange={(checked) => {
                                    const newSet = new Set(selectedCategories);
                                    if (checked) {
                                      newSet.add(category);
                                    } else {
                                      newSet.delete(category);
                                    }
                                    setSelectedCategories(newSet);
                                  }}
                                  className="w-4 h-4"
                                />
                                <label
                                  className="text-sm cursor-pointer flex-1"
                                  onClick={() => {
                                    const newSet = new Set(selectedCategories);
                                    if (selectedCategories.has(category)) {
                                      newSet.delete(category);
                                    } else {
                                      newSet.add(category);
                                    }
                                    setSelectedCategories(newSet);
                                  }}
                                >
                                  {category}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Transfers Section */}
                      {transferCategories.length > 0 && (
                        <div>
                          <div className="text-xs font-semibold text-purple-600 bg-purple-50 dark:bg-purple-900/20 px-3 py-2 rounded-md mb-2">
                            🔄 Transfers
                          </div>
                          <div className="space-y-2">
                            {transferCategories.map((category: string) => (
                              <div
                                key={category}
                                className="flex items-center space-x-3 pl-2"
                              >
                                <Checkbox
                                  checked={selectedCategories.has(category)}
                                  onCheckedChange={(checked) => {
                                    const newSet = new Set(selectedCategories);
                                    if (checked) {
                                      newSet.add(category);
                                    } else {
                                      newSet.delete(category);
                                    }
                                    setSelectedCategories(newSet);
                                  }}
                                  className="w-4 h-4"
                                />
                                <label
                                  className="text-sm cursor-pointer flex-1"
                                  onClick={() => {
                                    const newSet = new Set(selectedCategories);
                                    if (selectedCategories.has(category)) {
                                      newSet.delete(category);
                                    } else {
                                      newSet.add(category);
                                    }
                                    setSelectedCategories(newSet);
                                  }}
                                >
                                  {category}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Multi-Merchant Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Merchants</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between"
                    >
                      {selectedMerchants.size > 0
                        ? `${selectedMerchants.size} selected`
                        : "Select merchants"}
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 max-h-60 overflow-y-auto">
                    <div className="space-y-2">
                      {Array.isArray(merchants) &&
                        merchants.map((merchant: string) => (
                          <div
                            key={merchant}
                            className="flex items-center space-x-2"
                          >
                            <Checkbox
                              checked={selectedMerchants.has(merchant)}
                              onCheckedChange={(checked) => {
                                const newSet = new Set(selectedMerchants);
                                if (checked) {
                                  newSet.add(merchant);
                                } else {
                                  newSet.delete(merchant);
                                }
                                setSelectedMerchants(newSet);
                              }}
                            />
                            <label className="text-sm">{merchant}</label>
                          </div>
                        ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Multi-Account Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Accounts</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between"
                    >
                      {selectedAccounts.size > 0
                        ? `${selectedAccounts.size} selected`
                        : "Select accounts"}
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 max-h-60 overflow-y-auto">
                    <div className="space-y-2">
                      {Array.isArray(accounts) &&
                        accounts.map((account: any) => (
                          <div
                            key={account.id}
                            className="flex items-center space-x-2"
                          >
                            <Checkbox
                              checked={selectedAccounts.has(account.id)}
                              onCheckedChange={(checked) => {
                                const newSet = new Set(selectedAccounts);
                                if (checked) {
                                  newSet.add(account.id);
                                } else {
                                  newSet.delete(account.id);
                                }
                                setSelectedAccounts(newSet);
                              }}
                            />
                            <label className="text-sm">
                              {account.displayName ||
                                account.name ||
                                account.officialName ||
                                "Unknown Account"}
                            </label>
                          </div>
                        ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Amount Range Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Amount Range</label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Min $"
                    value={amountMin}
                    onChange={(e) => setAmountMin(e.target.value)}
                    className="w-full text-sm"
                  />
                  <Input
                    type="number"
                    placeholder="Max $"
                    value={amountMax}
                    onChange={(e) => setAmountMax(e.target.value)}
                    className="w-full text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Clear Filters Button */}
            <div className="flex justify-between items-center pt-2 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedCategories(new Set());
                  setSelectedMerchants(new Set());
                  setSelectedAccounts(new Set());
                  setAmountMin("");
                  setAmountMax("");
                  setSearch("");
                  setCategoryFilter("");
                  setTypeFilter("");
                }}
                className="text-red-600 hover:text-red-700"
              >
                Clear All Filters
              </Button>
              <div className="text-sm text-slate-600">
                {filteredTransactions.length} transactions found
              </div>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="p-0">
        {paginatedTransactions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg font-medium text-foreground">
              No transactions found
            </p>
            <p className="text-muted-foreground">
              {Array.isArray(transactions)
                ? `Found ${transactions.length} transactions total, but none on current page`
                : "Upload your financial data to see transactions here"}
            </p>
            <div className="mt-4 text-xs text-muted-foreground/70">
              Debug: isLoading={isLoading.toString()}, transactions=
              {Array.isArray(transactions) ? transactions.length : "null"},
              paginated={paginatedTransactions.length}, limit=
              {limit || "no limit"}
            </div>
          </div>
        ) : (
          <>
            {/* Mobile Card Layout - Simplified & Efficient */}
            <div className="block sm:hidden">
              {/* Mobile Summary Bar */}
              <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border p-3 mb-2 z-20">
                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-4">
                    <div className="text-green-600 dark:text-green-400 font-semibold">
                      Income:{" "}
                      {formatCurrency(
                        paginatedTransactions
                          .filter((t) => t.type === "income")
                          .reduce((sum, t) => sum + parseFloat(t.amount), 0),
                      )}
                    </div>
                    <div className="text-red-600 dark:text-red-400 font-semibold">
                      Expenses:{" "}
                      {formatCurrency(
                        paginatedTransactions
                          .filter((t) => t.type === "expense")
                          .reduce((sum, t) => sum + parseFloat(t.amount), 0),
                      )}
                    </div>
                  </div>
                  <div className="font-bold">
                    Net:{" "}
                    {formatCurrency(
                      paginatedTransactions.reduce(
                        (sum, t) =>
                          t.type === "income"
                            ? sum + parseFloat(t.amount)
                            : sum - parseFloat(t.amount),
                        0,
                      ),
                    )}
                  </div>
                </div>
              </div>

              {/* Group transactions by date */}
              <div className="px-4 pb-20">
                {(() => {
                  const groupedTransactions = paginatedTransactions.reduce(
                    (groups, transaction) => {
                      const dateKey = new Date(transaction.date).toDateString();
                      if (!groups[dateKey]) groups[dateKey] = [];
                      groups[dateKey].push(transaction);
                      return groups;
                    },
                    {} as Record<string, any[]>,
                  );

                  const today = new Date().toDateString();
                  const yesterday = new Date(
                    Date.now() - 86400000,
                  ).toDateString();

                  return Object.entries(groupedTransactions).map(
                    ([dateKey, transactions], groupIndex) => {
                      let dateLabel = dateKey;
                      if (dateKey === today) dateLabel = "Today";
                      else if (dateKey === yesterday) dateLabel = "Yesterday";
                      else {
                        const date = new Date(dateKey);
                        const isThisWeek =
                          (Date.now() - date.getTime()) /
                            (1000 * 60 * 60 * 24) <=
                          7;
                        if (isThisWeek)
                          dateLabel = date.toLocaleDateString("en-US", {
                            weekday: "long",
                          });
                        else
                          dateLabel = date.toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          });
                      }

                      return (
                        <div key={dateKey} className="mb-6">
                          <h3 className="text-sm font-semibold text-muted-foreground mb-3 px-1">
                            {dateLabel} ({transactions.length})
                          </h3>
                          <div className="space-y-2">
                            {transactions.map(
                              (transaction: Transaction, index: number) => {
                                const isSelected = selectedTransactions.has(
                                  transaction.id,
                                );
                                const isRecurring =
                                  transaction.merchant &&
                                  [
                                    "netflix",
                                    "spotify",
                                    "adobe",
                                    "disney",
                                    "hulu",
                                    "amazon prime",
                                    "wells fargo",
                                  ].includes(
                                    transaction.merchant.toLowerCase(),
                                  );
                                const categoryIcon = getCategoryIcon(
                                  transaction.category,
                                );
                                const swipeState = swipeStates[
                                  transaction.id
                                ] || { offset: 0, isSwiping: false };

                                return (
                                  <div
                                    key={transaction.id}
                                    className={`
                                  relative bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800
                                  rounded-lg p-2 shadow-sm transition-all duration-200 ease-out
                                  ${isRecurring ? "border-l-2 border-l-blue-500" : ""}
                                  mobile-card-enter overflow-hidden
                                `}
                                    style={{
                                      animationDelay: `${groupIndex * 100 + index * 50}ms`,
                                    }}
                                  >
                                    {/* Compact Mobile Transaction Row */}
                                    <div className="flex items-center gap-2">
                                      {/* Merchant Logo or White Circle */}
                                      <div className="relative flex-shrink-0">
                                        {transaction.merchant ? (
                                          <MerchantLogo
                                            merchant={transaction.merchant}
                                            size={6}
                                          />
                                        ) : (
                                          <div className="w-6 h-6 bg-white rounded-full border border-gray-200 dark:border-gray-600" />
                                        )}
                                        {isRecurring && (
                                          <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-blue-500 rounded-full" />
                                        )}
                                      </div>

                                      {/* Transaction Info */}
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                          <div className="min-w-0 flex-1">
                                            <div className="font-medium text-xs text-foreground truncate">
                                              {transaction.merchant ||
                                                transaction.description}
                                            </div>
                                            <div className="flex items-center gap-1 text-xs">
                                              <CategoryBadge
                                                categoryName={
                                                  transaction.category
                                                }
                                                className="text-xs"
                                              />
                                              {/* Dynamic Trend Indicator */}
                                              {transaction.merchant && (
                                                <TrendIndicator
                                                  merchant={
                                                    transaction.merchant
                                                  }
                                                  amount={parseFloat(
                                                    transaction.amount,
                                                  )}
                                                />
                                              )}
                                            </div>
                                          </div>

                                          {/* Amount and Details Button */}
                                          <div className="flex items-center gap-2">
                                            <div
                                              className={`font-semibold text-xs flex-shrink-0 ${
                                                transaction.ignoreType &&
                                                transaction.ignoreType !==
                                                  "none"
                                                  ? "text-gray-400 dark:text-gray-500"
                                                  : transaction.type ===
                                                      "income"
                                                    ? "text-green-600"
                                                    : "text-red-600"
                                              }`}
                                            >
                                              {transaction.type === "income"
                                                ? "+"
                                                : ""}
                                              {formatCurrency(
                                                parseFloat(transaction.amount),
                                              )}
                                            </div>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              className="h-6 w-6 p-0 opacity-60 hover:opacity-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-all"
                                              data-testid={`details-button-${transaction.id}`}
                                              onClick={() => {
                                                setSelectedTransaction(transaction);
                                                setIsDetailsModalOpen(true);
                                              }}
                                            >
                                              <EllipsisVertical className="h-3 w-3" />
                                            </Button>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              },
                            )}
                          </div>
                        </div>
                      );
                    },
                  );
                })()}
              </div>

              {/* Floating Action Button for Filters */}
              <div className="fixed bottom-4 right-4 z-30">
                <Button
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className="w-12 h-12 rounded-full shadow-lg bg-blue-600 hover:bg-blue-700 text-white border-0"
                  size="sm"
                  data-testid="fab-mobile-filters"
                >
                  <Filter className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Desktop Table Layout */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-12">
                      <Checkbox
                        checked={
                          paginatedTransactions.length > 0 &&
                          paginatedTransactions.every((t) =>
                            selectedTransactions.has(t.id),
                          )
                        }
                        onCheckedChange={toggleSelectAll}
                        data-testid="checkbox-select-all"
                      />
                    </th>
                    {/* Sortable Date Column */}
                    <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-20 sm:w-auto">
                      <button
                        className="flex items-center gap-1 hover:text-foreground transition-colors"
                        onClick={() => handleSort("date")}
                      >
                        Date
                        {sortField === "date" &&
                          (sortDirection === "asc" ? (
                            <ArrowUp className="w-3 h-3" />
                          ) : (
                            <ArrowDown className="w-3 h-3" />
                          ))}
                        {sortField !== "date" && (
                          <ArrowUpDown className="w-3 h-3 opacity-40" />
                        )}
                      </button>
                    </th>

                    {/* Sortable Merchant Column */}
                    <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider min-w-0">
                      <button
                        className="flex items-center gap-1 hover:text-foreground transition-colors"
                        onClick={() => handleSort("merchant")}
                      >
                        Merchant & Description
                        {sortField === "merchant" &&
                          (sortDirection === "asc" ? (
                            <ArrowUp className="w-3 h-3" />
                          ) : (
                            <ArrowDown className="w-3 h-3" />
                          ))}
                        {sortField !== "merchant" && (
                          <ArrowUpDown className="w-3 h-3 opacity-40" />
                        )}
                      </button>
                    </th>

                    {/* Sortable Category Column */}
                    <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-24 sm:w-auto hidden sm:table-cell">
                      <button
                        className="flex items-center gap-1 hover:text-foreground transition-colors"
                        onClick={() => handleSort("category")}
                      >
                        Category
                        {sortField === "category" &&
                          (sortDirection === "asc" ? (
                            <ArrowUp className="w-3 h-3" />
                          ) : (
                            <ArrowDown className="w-3 h-3" />
                          ))}
                        {sortField !== "category" && (
                          <ArrowUpDown className="w-3 h-3 opacity-40" />
                        )}
                      </button>
                    </th>

                      {/* Sparkline Column Header */}
                    <th className="px-2 sm:px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider w-24 hidden sm:table-cell">
                      Trend
                    </th>

                    {/* Sortable Amount Column */}
                    <th className="px-2 sm:px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider w-28 sm:w-32">
                      <button
                        className="flex items-center gap-1 hover:text-foreground transition-colors justify-end w-full"
                        onClick={() => handleSort("amount")}
                      >
                        Amount
                        {sortField === "amount" &&
                          (sortDirection === "asc" ? (
                            <ArrowUp className="w-3 h-3" />
                          ) : (
                            <ArrowDown className="w-3 h-3" />
                          ))}
                        {sortField !== "amount" && (
                          <ArrowUpDown className="w-3 h-3 opacity-40" />
                        )}
                      </button>
                    </th>
                    <th className="px-2 sm:px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider w-20 sm:w-24">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-background divide-y divide-border">
                  {paginatedTransactions.map((transaction: Transaction) => {
                    const isEditing = editingId === transaction.id;
                    return (
                      <tr key={transaction.id} className="hover:bg-muted/50">
                        <td className="px-2 sm:px-4 py-3 sm:py-4 whitespace-nowrap">
                          <Checkbox
                            checked={selectedTransactions.has(transaction.id)}
                            onCheckedChange={() =>
                              toggleSelectTransaction(transaction.id)
                            }
                            data-testid={`checkbox-select-${transaction.id}`}
                          />
                        </td>
                        <td className="px-2 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-foreground">
                          <div className="font-medium">
                            {formatDateShort(new Date(transaction.date))}
                          </div>
                        </td>
                        <td className="px-2 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-foreground min-w-0">
                          {isEditing ? (
                            <div className="space-y-2">
                              <Input
                                value={editForm.description || ""}
                                onChange={(e) =>
                                  setEditForm({
                                    ...editForm,
                                    description: e.target.value,
                                  })
                                }
                                className="w-full text-xs sm:text-sm"
                                placeholder="Description"
                              />
                              <Input
                                value={editForm.merchant || ""}
                                onChange={(e) =>
                                  setEditForm({
                                    ...editForm,
                                    merchant: e.target.value,
                                  })
                                }
                                className="w-full text-xs sm:text-sm"
                                placeholder="Merchant"
                              />
                            </div>
                          ) : (
                            <div className="min-w-0">
                              <div className="flex items-center gap-3">
                                {/* Enhanced Merchant Logo */}
                                {transaction.merchant && (
                                  <div className="flex-shrink-0">
                                    <MerchantLogo
                                      merchant={transaction.merchant}
                                      size={8}
                                    />
                                  </div>
                                )}
                                <div className="min-w-0 flex-1">
                                  {/* Merchant Name with Hover Tooltip, Click for Details, and Recurring Indicator */}
                                  {transaction.merchant && (
                                    <MerchantHoverTooltip
                                      merchant={transaction.merchant}
                                    >
                                      <MerchantDetailDialog
                                        merchant={transaction.merchant}
                                      >
                                        <div
                                          className="flex items-center gap-2 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md p-1 -m-1 transition-colors"
                                          data-testid={`merchant-name-${transaction.id}`}
                                        >
                                          <span className="font-semibold text-sm text-foreground hover:text-blue-600 transition-colors">
                                            {transaction.merchant}
                                          </span>
                                          {/* Recurring Indicator - Visual indicator only */}
                                          {[
                                            "netflix",
                                            "spotify",
                                            "adobe",
                                            "disney",
                                            "hulu",
                                            "amazon prime",
                                          ].includes(
                                            transaction.merchant.toLowerCase(),
                                          ) && (
                                            <div
                                              className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"
                                              title="Recurring transaction"
                                            ></div>
                                          )}
                                        </div>
                                      </MerchantDetailDialog>
                                    </MerchantHoverTooltip>
                                  )}
                                  {/* Transaction Description */}
                                  <div
                                    className={`break-words whitespace-normal leading-relaxed ${transaction.merchant ? "text-xs text-muted-foreground" : "font-medium"}`}
                                    data-testid={`transaction-description-${transaction.id}`}
                                  >
                                    <InlineDescriptionEditor
                                      currentDescription={
                                        transaction.description || ""
                                      }
                                      onDescriptionChange={(newDescription) =>
                                        handleDescriptionChange(
                                          transaction,
                                          newDescription,
                                        )
                                      }
                                      className="w-full"
                                    />
                                  </div>
                                </div>
                              </div>
                              {/* Show category on mobile since it's hidden in table */}
                              <div className="sm:hidden text-xs mt-2">
                                <CategoryBadge
                                  categoryName={transaction.category}
                                  className="text-xs"
                                />
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="px-2 sm:px-6 py-3 sm:py-4 whitespace-nowrap hidden sm:table-cell">
                          {editingCategoryId === transaction.id ? (
                            <InlineCategorySelector
                              currentCategoryName={transaction.category}
                              onCategoryChange={(categoryId, categoryName) => {

                                handleCategoryChangeWithRule(
                                  transaction,
                                  categoryId,
                                  categoryName,
                                );
                                setEditingCategoryId(null);
                              }}
                              className="w-full min-w-[180px]"
                            />
                          ) : (
                            <button
                              onClick={() => setEditingCategoryId(transaction.id)}
                              className="group text-left hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md p-1 -m-1 transition-colors cursor-pointer"
                              title="Click to edit category"
                            >
                              <CategoryBadge
                                categoryName={transaction.category}
                                className="text-xs"
                                editable
                              />
                            </button>
                          )}
                        </td>
                        {/* Sparkline Column - Desktop only */}
                        <td className="px-2 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-center hidden sm:table-cell">
                          {transaction.merchant && (
                            <MerchantSparkline
                              merchant={transaction.merchant}
                              currentAmount={transaction.amount}
                              transactionDate={
                                typeof transaction.date === "string"
                                  ? transaction.date
                                  : transaction.date.toISOString()
                              }
                            />
                          )}
                        </td>

                        <td className="px-2 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm font-medium">
                          <div className="text-right">
                            <span
                              className={`font-bold text-sm sm:text-base ${
                                transaction.ignoreType &&
                                transaction.ignoreType !== "none"
                                  ? "text-gray-400 dark:text-gray-500"
                                  : transaction.type === "income"
                                    ? "text-green-600 dark:text-green-400"
                                    : "text-red-600 dark:text-red-400"
                              }`}
                            >
                              {transaction.type === "income" ? "+" : "-"}
                              {formatCurrency(
                                Math.abs(parseFloat(transaction.amount)),
                              )}
                            </span>
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {isEditing ? (
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                onClick={saveEdit}
                                disabled={updateMutation.isPending}
                              >
                                <Save className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={cancelEdit}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex justify-center space-x-1">
                              {/* Transaction Details Modal Button */}
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0 sm:h-8 sm:w-8 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-all"
                                onClick={() => {
                                  setSelectedTransaction(transaction);
                                  setIsDetailsModalOpen(true);
                                }}
                                title="View transaction details"
                                data-testid={`details-button-${transaction.id}`}
                              >
                                <EllipsisVertical className="w-3 h-3 sm:w-4 sm:h-4" />
                              </Button>

                              {/* Ignore Button */}
                              <IgnoreButton
                                transaction={transaction}
                                onIgnoreChange={(ignoreType) => {
                                  updateMutation.mutate({
                                    id: transaction.id,
                                    ignoreType,
                                  });
                                }}
                              />
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 w-7 p-0 sm:h-8 sm:w-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                onClick={() =>
                                  deleteTransaction(transaction.id)
                                }
                                disabled={deleteMutation.isPending}
                                title="Delete transaction"
                                data-testid={`button-delete-${transaction.id}`}
                              >
                                <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>

                {/* Summary Row */}
                {paginatedTransactions.length > 0 &&
                  (() => {
                    const totals = calculatePageTotals();
                    return (
                      <tfoot className="bg-muted/30 border-t-2 border-border">
                        <tr className="font-semibold">
                          <td
                            colSpan={7}
                            className="px-2 sm:px-6 py-3 text-right text-sm"
                          >
                            Page Summary:
                          </td>
                          <td className="px-2 sm:px-6 py-3 text-right">
                            <div className="space-y-1">
                              <div className="text-green-600 text-xs">
                                Income: +{formatCurrency(totals.income)}
                              </div>
                              <div className="text-red-600 text-xs">
                                Expenses: -{formatCurrency(totals.expenses)}
                              </div>
                              <div
                                className={`font-bold ${totals.net >= 0 ? "text-green-600" : "text-red-600"}`}
                              >
                                Net: {totals.net >= 0 ? "+" : ""}
                                {formatCurrency(Math.abs(totals.net))}
                              </div>
                            </div>
                          </td>
                          <td className="px-2 sm:px-6 py-3"></td>
                        </tr>
                      </tfoot>
                    );
                  })()}
              </table>
            </div>
          </>
        )}

        {!limit && transactions && transactions.length > 0 && (
          <div className="px-6 py-3 border-t border-border">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="text-sm text-muted-foreground">
                  Showing{" "}
                  <span className="font-medium text-foreground">
                    {(currentPage - 1) * pageSize + 1}
                  </span>{" "}
                  to{" "}
                  <span className="font-medium text-foreground">
                    {Math.min(
                      currentPage * pageSize,
                      filteredTransactions.length,
                    )}
                  </span>{" "}
                  of{" "}
                  <span className="font-medium text-foreground">
                    {filteredTransactions.length}
                  </span>{" "}
                  transactions
                </div>

                {/* Items per page selector */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Items per page:
                  </span>
                  <Select
                    value={itemsPerPage.toString()}
                    onValueChange={(value) => {
                      setItemsPerPage(parseInt(value));
                      setCurrentPage(1); // Reset to first page when changing items per page
                    }}
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                  >
                    Previous
                  </Button>

                  {[...Array(Math.min(5, totalPages))].map((_, i) => {
                    let page;
                    if (totalPages <= 5) {
                      page = i + 1;
                    } else if (currentPage <= 3) {
                      page = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      page = totalPages - 4 + i;
                    } else {
                      page = currentPage - 2 + i;
                    }

                    return (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className="w-8"
                      >
                        {page}
                      </Button>
                    );
                  })}

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(currentPage + 1)}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>

      {/* Transaction Details Modal */}
      <TransactionDetailsModal
        transaction={selectedTransaction as Transaction | null}
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedTransaction(null);
        }}
      />

      {/* Rule Confirmation Modal */}
      <RuleConfirmationModal
        isOpen={confirmationModalOpen}
        onClose={() => {
          setConfirmationModalOpen(false);
          setRuleModalTransaction(null);
          setPendingChanges(undefined);
        }}
        transaction={ruleModalTransaction}
        pendingChanges={pendingChanges}
        onCreateRule={handleCreateRuleConfirmed}
        onUpdateOnly={handleUpdateOnlyConfirmed}
      />

      {/* Comprehensive Rule Creation Modal */}
      <CreateRuleModal
        transaction={ruleModalTransaction}
        pendingChanges={pendingChanges}
        isOpen={ruleModalOpen}
        onClose={() => {
          setRuleModalOpen(false);
          setConfirmationModalOpen(false);
          setRuleModalTransaction(null);
          setPendingChanges(undefined);
        }}
        onSuccess={handleRuleModalSuccess}
      />
    </Card>
  );
}
