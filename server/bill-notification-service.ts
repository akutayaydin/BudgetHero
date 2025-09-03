import { scheduleUserNotifications, processPendingNotifications } from './lib/notification-service';
import { db } from './db';
import { users } from '../shared/schema';
import { eq } from 'drizzle-orm';

class BillNotificationService {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;

  start() {
    if (this.isRunning) {
      console.log('📧 Bill notification service already running');
      return;
    }

    console.log('🚀 Bill notification service starting...');
    this.isRunning = true;

    // Run immediately on startup
    this.runNotificationCheck();

    // Schedule to run every 6 hours
    this.intervalId = setInterval(() => {
      this.runNotificationCheck();
    }, 6 * 60 * 60 * 1000); // 6 hours

    console.log('✅ Bill notification service configured (6-hour frequency)');
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('⏹️ Bill notification service stopped');
  }

  private async runNotificationCheck() {
    try {
      console.log('⏰ Running scheduled bill notification check...');
      console.log('🔔 Starting bill notification process...');

      // Get all users with notifications enabled
      const usersWithNotifications = await db
        .select({
          id: users.id,
          email: users.email,
          billNotificationsEnabled: users.billNotificationsEnabled,
        })
        .from(users)
        .where(eq(users.billNotificationsEnabled, true));

      console.log(`📧 Found ${usersWithNotifications.length} users with notifications enabled`);

      // Schedule notifications for each user
      for (const user of usersWithNotifications) {
        try {
          await scheduleUserNotifications(user.id);
        } catch (error) {
          console.error(`Failed to schedule notifications for user ${user.id}:`, error);
        }
      }

      // Process all pending notifications
      await processPendingNotifications();

      console.log('✅ Bill notification process completed');
    } catch (error) {
      console.error('❌ Error during bill notification check:', error);
    }
  }

  // Manual trigger for testing
  async triggerCheck() {
    console.log('🧪 Manual bill notification check triggered');
    await this.runNotificationCheck();
  }
}

export const billNotificationService = new BillNotificationService();