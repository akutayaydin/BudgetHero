import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../lib/queryClient';

export interface NotificationSettings {
  billNotificationsEnabled: boolean;
  billNotificationDays: number;
  emailNotificationsEnabled: boolean;
}

export interface UpcomingBill {
  id: string;
  name: string;
  amount: string;
  dueDate: string;
  type: 'recurring_transaction' | 'manual_subscription';
  userId: string;
}

export interface BillNotification {
  id: string;
  userId: string;
  billId: string;
  billName: string;
  billType: string;
  amount: string;
  dueDate: string;
  notificationDate: string;
  notificationType: string;
  method: string;
  status: string;
  sentAt: string | null;
  errorMessage: string | null;
  isRead: boolean;
  createdAt: string;
}

export function useNotificationSettings() {
  return useQuery<NotificationSettings>({
    queryKey: ['/api/notifications/settings'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useUpdateNotificationSettings() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (settings: Partial<NotificationSettings>) =>
      apiRequest('/api/notifications/settings', 'PATCH', settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/settings'] });
    },
  });
}

export function useUpcomingBills(daysAhead: number = 7) {
  return useQuery<UpcomingBill[]>({
    queryKey: ['/api/notifications/upcoming-bills', daysAhead],
    queryFn: () => apiRequest(`/api/notifications/upcoming-bills?days=${daysAhead}`, 'GET'),
  });
}

export function useNotificationHistory() {
  return useQuery<BillNotification[]>({
    queryKey: ['/api/notifications/history'],
  });
}

export function useTriggerNotifications() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => apiRequest('/api/notifications/trigger', 'POST'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/history'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/upcoming-bills'] });
    },
  });
}

export function useTestNotifications() {
  return useMutation({
    mutationFn: async () => {
      console.log('🧪 Making test notification request...');
      const response = await apiRequest('/api/notifications/test', 'POST');
      console.log('✅ Test notification response:', response);
      return await response.json();
    },
    onError: (error: any) => {
      console.error('❌ Test notification failed:', error);
    },
  });
}