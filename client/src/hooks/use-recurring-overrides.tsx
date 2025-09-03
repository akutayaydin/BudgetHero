import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface UserRecurringOverride {
  id: string;
  userId: string;
  merchantName: string;
  originalMerchant?: string;
  recurringStatus: 'recurring' | 'non-recurring';
  applyToAll: boolean;
  confidence: string;
  reason?: string;
  ruleType: string;
  isActive: boolean;
  appliedCount: number;
  triggerTransactionId?: string;
  relatedTransactionCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface RecurringOverrideSummary {
  totalOverrides: number;
  recurringCount: number;
  nonRecurringCount: number;
  totalApplications: number;
}

export interface RelatedTransactionsResponse {
  merchant: string;
  count: number;
  transactions: Array<{
    id: string;
    date: string;
    description: string;
    amount: string;
    category?: string;
    merchant?: string;
  }>;
}

// Hook to get all user recurring overrides
export function useRecurringOverrides() {
  return useQuery({
    queryKey: ['/api/user/recurring-overrides'],
    queryFn: async () => {
      const response = await fetch('/api/user/recurring-overrides');
      if (!response.ok) throw new Error('Failed to fetch recurring overrides');
      return response.json() as Promise<UserRecurringOverride[]>;
    }
  });
}

// Hook to get override summary
export function useRecurringOverrideSummary() {
  return useQuery({
    queryKey: ['/api/user/recurring-overrides/summary'],
    queryFn: async () => {
      const response = await fetch('/api/user/recurring-overrides/summary');
      if (!response.ok) throw new Error('Failed to fetch override summary');
      return response.json() as Promise<RecurringOverrideSummary>;
    }
  });
}

// Hook to get related transactions for a merchant
export function useRelatedTransactions(merchantName: string, enabled = false) {
  return useQuery({
    queryKey: ['/api/user/recurring-overrides/related-transactions', merchantName],
    queryFn: async () => {
      const response = await fetch(`/api/user/recurring-overrides/related-transactions?merchant=${encodeURIComponent(merchantName)}`);
      if (!response.ok) throw new Error('Failed to fetch related transactions');
      return response.json() as Promise<RelatedTransactionsResponse>;
    },
    enabled: enabled && !!merchantName
  });
}

// Types for grouped transactions
interface GroupedTransaction {
  id: string;
  date: string;
  description: string;
  merchant?: string;
  amount: string;
  category: string;
  type: "income" | "expense";
}

interface GroupedTransactionsResponse {
  merchant: string;
  recurring: GroupedTransaction[];
  oneTime: GroupedTransaction[];
  unclear: GroupedTransaction[];
  summary: {
    total: number;
    recurringCount: number;
    oneTimeCount: number;
    unclearCount: number;
    potentialRecurringAmounts: string[];
  };
}

// Hook for grouped related transactions
export function useGroupedRelatedTransactions(merchantName: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ['/api/user/recurring-overrides/grouped-transactions', merchantName],
    queryFn: async () => {
      const response = await fetch(`/api/user/recurring-overrides/grouped-transactions?merchant=${encodeURIComponent(merchantName)}`);
      if (!response.ok) throw new Error('Failed to fetch grouped transactions');
      return response.json() as Promise<GroupedTransactionsResponse>;
    },
    enabled: enabled && !!merchantName
  });
}

// Hook to create or update a recurring override
export function useCreateRecurringOverride() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      merchantName: string;
      originalMerchant?: string;
      recurringStatus: 'recurring' | 'non-recurring';
      applyToAll?: boolean;
      reason?: string;
      triggerTransactionId?: string;
    }) => {
      const response = await fetch('/api/user/recurring-overrides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to create recurring override');
      }
      
      return response.json() as Promise<UserRecurringOverride>;
    },
    onSuccess: () => {
      // Invalidate related queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['/api/user/recurring-overrides'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user/recurring-overrides/summary'] });
      queryClient.invalidateQueries({ queryKey: ['/api/recurring-transactions'] });
    }
  });
}

// Hook to delete a recurring override
export function useDeleteRecurringOverride() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (overrideId: string) => {
      const response = await fetch(`/api/user/recurring-overrides/${overrideId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete recurring override');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate related queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['/api/user/recurring-overrides'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user/recurring-overrides/summary'] });
    }
  });
}

// Hook to classify a transaction (category + recurring status)
export function useClassifyTransaction() {
  return useMutation({
    mutationFn: async (transactionId: string) => {
      const response = await fetch(`/api/transactions/${transactionId}/classify`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error('Failed to classify transaction');
      }
      
      return response.json();
    }
  });
}