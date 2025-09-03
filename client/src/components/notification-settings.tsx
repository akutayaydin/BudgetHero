import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bell, Mail, Calendar, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNotificationSettings, useUpdateNotificationSettings, useTestNotifications, useTriggerNotifications } from '@/hooks/use-notifications';
import { useQuery } from '@tanstack/react-query';

export function NotificationSettings() {
  const { toast } = useToast();
  const { data: settings, isLoading } = useNotificationSettings();
  const updateSettings = useUpdateNotificationSettings();
  const testNotifications = useTestNotifications();
  const triggerNotifications = useTriggerNotifications();

  // Check if current user is admin
  const { data: currentUser } = useQuery({
    queryKey: ["/api/auth/user"],
  });
  const isCurrentUserAdmin = Boolean(currentUser && typeof currentUser === 'object' && 'isAdmin' in currentUser && (currentUser as any).isAdmin === true);

  const [localSettings, setLocalSettings] = useState(settings || {
    billNotificationsEnabled: true,
    billNotificationDays: 3,
    emailNotificationsEnabled: true,
  });

  // Update local state when settings are loaded
  if (settings && localSettings !== settings) {
    setLocalSettings(settings);
  }

  const handleSettingChange = async (key: keyof typeof localSettings, value: boolean | number) => {
    const newSettings = { ...localSettings, [key]: value };
    setLocalSettings(newSettings);

    try {
      await updateSettings.mutateAsync({ [key]: value });
      toast({
        title: "Settings updated",
        description: "Your notification preferences have been saved.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update notification settings. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleTestNotifications = async () => {
    console.log('🧪 Test button clicked, email enabled:', localSettings.emailNotificationsEnabled);
    try {
      const result = await testNotifications.mutateAsync();
      console.log('✅ Test notification result:', result);
      toast({
        title: "Test notification sent!",
        description: result?.message || "Check your email for the test notification.",
      });
    } catch (error: any) {
      console.error('❌ Test notification error:', error);
      toast({
        title: "Error",
        description: error?.response?.data?.message || error?.message || "Failed to send test notification. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleTriggerBillNotifications = async () => {
    console.log('🔔 Triggering bill notifications...');
    try {
      const result = await triggerNotifications.mutateAsync();
      console.log('✅ Bill notifications triggered:', result);
      toast({
        title: "Bill notifications triggered!",
        description: "Any upcoming bills within your notification window will send reminders.",
      });
    } catch (error: any) {
      console.error('❌ Bill notification trigger error:', error);
      toast({
        title: "Error",
        description: error?.response?.data?.message || error?.message || "Failed to trigger bill notifications.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="notification-settings-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notification Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Bill Notifications Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Bill Reminders
            </Label>
            <p className="text-sm text-muted-foreground">
              Get notified about upcoming bill payments
            </p>
          </div>
          <Switch
            data-testid="toggle-bill-notifications"
            checked={localSettings.billNotificationsEnabled}
            onCheckedChange={(checked) => handleSettingChange('billNotificationsEnabled', checked)}
          />
        </div>

        {/* Days Ahead Setting */}
        {localSettings.billNotificationsEnabled && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Reminder Timing</Label>
            <Select
              value={localSettings.billNotificationDays.toString()}
              onValueChange={(value) => handleSettingChange('billNotificationDays', parseInt(value))}
            >
              <SelectTrigger data-testid="select-notification-days">
                <SelectValue placeholder="Select days" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 day before</SelectItem>
                <SelectItem value="2">2 days before</SelectItem>
                <SelectItem value="3">3 days before</SelectItem>
                <SelectItem value="5">5 days before</SelectItem>
                <SelectItem value="7">1 week before</SelectItem>
                <SelectItem value="14">2 weeks before</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              You'll be notified {localSettings.billNotificationDays} day{localSettings.billNotificationDays !== 1 ? 's' : ''} before bills are due
            </p>
          </div>
        )}

        {/* Email Notifications Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base font-medium flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email Notifications
            </Label>
            <p className="text-sm text-muted-foreground">
              Receive notifications via email
            </p>
          </div>
          <Switch
            data-testid="toggle-email-notifications"
            checked={localSettings.emailNotificationsEnabled}
            onCheckedChange={(checked) => handleSettingChange('emailNotificationsEnabled', checked)}
          />
        </div>

        {/* Test Notifications - Admin Only */}
        {isCurrentUserAdmin && (
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base font-medium">Test Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Send a test email notification to verify your settings
                </p>
              </div>
              <Button
                data-testid="button-test-notifications"
                onClick={handleTestNotifications}
                disabled={testNotifications.isPending || !localSettings.emailNotificationsEnabled}
                variant="outline"
                size="sm"
              >
                {testNotifications.isPending ? 'Sending...' : 'Send Test'}
              </Button>
            </div>
            {/* Bill Notification Trigger */}
            <div className="mt-4 flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Check Bills Now</Label>
                <p className="text-xs text-muted-foreground">
                  Manually check for upcoming bills and send reminders
                </p>
              </div>
              <Button
                data-testid="button-trigger-bills"
                onClick={handleTriggerBillNotifications}
                disabled={triggerNotifications.isPending || !localSettings.billNotificationsEnabled}
                variant="outline"
                size="sm"
              >
                {triggerNotifications.isPending ? 'Checking...' : 'Check Bills'}
              </Button>
            </div>
            
            {/* Debug info for testing */}
            <div className="mt-2 text-xs text-muted-foreground">
              Debug: Email {localSettings.emailNotificationsEnabled ? 'enabled' : 'disabled'}, Bills {localSettings.billNotificationsEnabled ? 'enabled' : 'disabled'}
            </div>
          </div>
        )}

        {/* Info Banner */}
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                How Bill Notifications Work
              </p>
              <p className="text-xs text-blue-800 dark:text-blue-200">
                We'll automatically detect your recurring bills and subscriptions, then send you email reminders based on your preferences. 
                Notifications are only sent for bills that are due within your selected timeframe.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}