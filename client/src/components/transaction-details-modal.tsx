// client/src/components/transaction-details-modal.tsx
import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

import {
  ChevronRight,
  EyeOff,
  Scissors,
  Gavel,
  Calendar,
  History,
  ArrowDownCircle,
  ArrowUpCircle,
  BadgeDollarSign,
  Receipt,
} from "lucide-react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency, formatDateOnly } from "@/lib/financial-utils";
import { TransactionSplitModal } from "./transaction-split-modal";
import { CreateRuleModal } from "./create-rule-modal";
import { InlineCategorySelector } from "./inline-category-selector";
import { InlineDescriptionEditor } from "./inline-description-editor";
import { getClearbitLogoUrl, getMerchantInitials } from "@/lib/merchant-logo";
import type { Transaction } from "@shared/schema";

interface TransactionWithExtras extends Transaction {
  notes?: string | null;
  isTaxDeductible?: boolean | null;
}

interface TransactionDetailsModalProps {
  transaction: TransactionWithExtras | null;
  isOpen: boolean;
  onClose: () => void;
}

function toNumber(n: unknown): number {
  if (typeof n === "number") return n;
  if (typeof n === "string") {
    const v = parseFloat(n);
    return Number.isFinite(v) ? v : 0;
  }
  return 0;
}

export function TransactionDetailsModal({
  transaction,
  isOpen,
  onClose,
}: TransactionDetailsModalProps) {
  const [notes, setNotes] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [splitOpen, setSplitOpen] = useState(false);
  const [ruleOpen, setRuleOpen] = useState(false);
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queryClient = useQueryClient();
  const { data: accounts = [] } = useQuery({ queryKey: ["/api/accounts"] });

  const account =
    transaction && Array.isArray(accounts)
      ? accounts.find((acc: any) => acc.id === transaction.accountId)
      : undefined;

  useEffect(() => {
    setNotes(transaction?.notes || "");
    setDescription(transaction?.description || "");
    setCategoryId(transaction?.categoryId || "");
    setCategoryName(transaction?.category || "");
  }, [transaction]);

  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<TransactionWithExtras>) => {
      if (!transaction) return;
      return apiRequest(
        `/api/transactions/${transaction.id}`,
        "PATCH",
        updates,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
    },
  });

  // Debounced autosave for notes (500ms)
  useEffect(() => {
    if (!transaction) return;
    if (notes === (transaction.notes || "")) return;

    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      updateMutation.mutate({ notes });
    }, 500);

    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
    };
  }, [notes, transaction]); // intentionally not depending on mutate

  const handleIgnore = () => {
    if (!transaction) return;
    updateMutation.mutate({ ignoreType: "everything" } as any);
  };

  if (!transaction) return null;

  const accountInfo = account
    ? `${(account.type || "").toUpperCase()} | ${(account.institutionName || account.name || account.officialName || "").toUpperCase()} | ••${account.mask || ""}`
    : "";

  const MerchantLogo = ({
    merchant,
    size = 8,
  }: {
    merchant?: string | null;
    size?: number;
  }) => {
    const [imageError, setImageError] = useState(false);

    if (!merchant || merchant.trim() === "") {
      return (
        <div
          className={`w-${size} h-${size} bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center`}
        >
          <Receipt className="w-4 h-4 text-gray-500" />
        </div>
      );
    }

    const logoUrl = getClearbitLogoUrl(merchant);
    const initials = getMerchantInitials(merchant);
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader className="pb-2">
          <div className="flex items-center gap-3">
            <MerchantLogo
              merchant={transaction.merchant || transaction.description}
              size={9}
            />
            <div>
              <DialogTitle className="text-lg font-semibold">

                <InlineDescriptionEditor
                  currentDescription={description}
                  onDescriptionChange={(newDesc) => {
                    setDescription(newDesc);
                    updateMutation.mutate({ description: newDesc });
                  }}
                  className="w-full text-lg font-semibold"
                />
              </DialogTitle>
              {accountInfo && (
                <p className="text-xs text-muted-foreground">{accountInfo}</p>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatDateOnly(transaction.date as any)}
            </span>
            <Button variant="ghost" size="sm" className="gap-1">
              <History className="w-3 h-3" />
              View History
            </Button>
          </div>

          <div className="flex items-center justify-center text-3xl font-bold">
            {(transaction as any).type === "income" ? (
              <ArrowUpCircle className="w-7 h-7 mr-1 text-green-600" />
            ) : (
              <ArrowDownCircle className="w-7 h-7 mr-1 text-red-600" />
            )}
            <span
              className={
                (transaction as any).type === "income"
                  ? "text-green-600"
                  : "text-red-600"
              }
            >
              {formatCurrency(toNumber((transaction as any).amount))}
            </span>
          </div>

          <div className="flex justify-center">
            <InlineCategorySelector
              currentCategoryId={categoryId}
              currentCategoryName={categoryName}
              onCategoryChange={(id, name) => {
                setCategoryId(id);
                setCategoryName(name);
                updateMutation.mutate({
                  category: name,
                  categoryId: id || null,
                });
              }}
            />
          </div>

          <Textarea
            placeholder="Add notes..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1 text-sm">
              <BadgeDollarSign className="w-4 h-4" />
              Tax Deductible
            </span>
            <Switch
              checked={transaction.isTaxDeductible ?? false}
              onCheckedChange={(checked) =>
                updateMutation.mutate({ isTaxDeductible: checked })
              }
            />
          </div>

          <Separator />

          <div className="space-y-1">
            <Button
              variant="ghost"
              className="w-full justify-between"
              onClick={handleIgnore}
            >
              <span className="flex items-center gap-2">
                <EyeOff className="w-4 h-4" /> Ignore
              </span>
              <ChevronRight className="w-4 h-4" />
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-between"
              onClick={() => setSplitOpen(true)}
            >
              <span className="flex items-center gap-2">
                <Scissors className="w-4 h-4" /> Split
              </span>
              <ChevronRight className="w-4 h-4" />
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-between"
              onClick={() => setRuleOpen(true)}
            >
              <span className="flex items-center gap-2">
                <Gavel className="w-4 h-4" /> Rules
              </span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <TransactionSplitModal
          transaction={transaction}
          isOpen={splitOpen}
          onClose={() => setSplitOpen(false)}
        />
        <CreateRuleModal
          transaction={transaction}
          isOpen={ruleOpen}
          onClose={() => setRuleOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

export default TransactionDetailsModal;
