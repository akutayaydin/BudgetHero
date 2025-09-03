import { db } from '../db';
import { billNotifications, recurringTransactions, manualSubscriptions, users } from '../../shared/schema';
import { eq, and, lte, isNull, desc } from 'drizzle-orm';
import { sendBillReminderEmail } from './email-service';

export interface BillDue {
  id: string;
  name: string;
  amount: string;
  dueDate: Date;
  type: 'recurring_transaction' | 'manual_subscription';
  userId: string;
}

export async function getUpcomingBills(userId: string, daysAhead: number = 7): Promise<BillDue[]> {
  const now = new Date();
  const futureDate = new Date();
  futureDate.setDate(now.getDate() + daysAhead);

  const upcomingBills: BillDue[] = [];

  // Get recurring transactions with due dates within the range
  const recurringBills = await db
    .select({
      id: recurringTransactions.id,
      name: recurringTransactions.name,
      amount: recurringTransactions.amount,
      nextDueDate: recurringTransactions.nextDueDate,
      userId: recurringTransactions.userId,
    })
    .from(recurringTransactions)
    .where(
      and(
        eq(recurringTransactions.userId, userId),
        eq(recurringTransactions.isActive, true),
        lte(recurringTransactions.nextDueDate, futureDate)
      )
    );

  recurringBills.forEach((bill: any) => {
    if (bill.nextDueDate && bill.nextDueDate >= now) {
      upcomingBills.push({
        id: bill.id,
        name: bill.name,
        amount: bill.amount?.toString() || '0',
        dueDate: bill.nextDueDate,
        type: 'recurring_transaction',
        userId: bill.userId,
      });
    }
  });

  // Get manual subscriptions with due dates within the range
  const manualBills = await db
    .select({
      id: manualSubscriptions.id,
      name: manualSubscriptions.name,
      amount: manualSubscriptions.amount,
      startDate: manualSubscriptions.startDate,
      userId: manualSubscriptions.userId,
    })
    .from(manualSubscriptions)
    .where(
      and(
        eq(manualSubscriptions.userId, userId),
        eq(manualSubscriptions.isActive, true),
        lte(manualSubscriptions.startDate, futureDate)
      )
    );

  manualBills.forEach((bill: any) => {
    if (bill.startDate && bill.startDate >= now) {
      upcomingBills.push({
        id: bill.id,
        name: bill.name,
        amount: bill.amount?.toString() || '0',
        dueDate: bill.startDate,
        type: 'manual_subscription',
        userId: bill.userId,
      });
    }
  });

  return upcomingBills.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
}

export async function createBillNotifications(bills: BillDue[], notificationDays: number = 3): Promise<void> {
  const now = new Date();

  for (const bill of bills) {
    const daysUntilDue = Math.ceil((bill.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    // Only create notifications for bills due within the notification window
    if (daysUntilDue <= notificationDays && daysUntilDue >= 0) {
      const notificationDate = new Date();
      notificationDate.setDate(bill.dueDate.getDate() - notificationDays);

      // Check if notification already exists
      const existingNotification = await db
        .select()
        .from(billNotifications)
        .where(
          and(
            eq(billNotifications.userId, bill.userId),
            eq(billNotifications.billId, bill.id),
            eq(billNotifications.dueDate, bill.dueDate)
          )
        )
        .limit(1);

      if (existingNotification.length === 0) {
        console.log('📧 Creating notification for bill:', bill.name, 'due:', bill.dueDate);
        await db.insert(billNotifications).values({
          userId: bill.userId,
          billId: bill.id,
          billName: bill.name,
          billType: bill.type,
          amount: bill.amount,
          dueDate: bill.dueDate,
          scheduledFor: notificationDate, // Use scheduledFor instead of notificationDate
          notificationType: 'upcoming',
          method: 'email',
          status: 'pending',
          sentAt: null,
          errorMessage: null,
          isRead: false,
        });
        console.log('✅ Notification created successfully');
      }
    }
  }
}

export async function processPendingNotifications(): Promise<void> {
  const now = new Date();

  // Get all pending notifications that should be sent now
  const pendingNotifications = await db
    .select({
      notification: billNotifications,
      user: {
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        billNotificationsEnabled: users.billNotificationsEnabled,
        emailNotificationsEnabled: users.emailNotificationsEnabled,
      },
    })
    .from(billNotifications)
    .innerJoin(users, eq(billNotifications.userId, users.id))
    .where(
      and(
        eq(billNotifications.status, 'pending'),
        lte(billNotifications.scheduledFor, now),
        eq(users.billNotificationsEnabled, true),
        eq(users.emailNotificationsEnabled, true)
      )
    )
    .orderBy(desc(billNotifications.scheduledFor));

  for (const { notification, user } of pendingNotifications) {
    try {
      // Fix date calculation and formatting
      const dueDate = notification.dueDate ? new Date(notification.dueDate) : new Date();
      const daysUntilDue = Math.max(0, Math.ceil(
        (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      ));

      const userName = user.firstName || user.email?.split('@')[0] || 'User';
      const success = await sendBillReminderEmail({
        to: user.email || '',
        userName,
        billName: notification.billName || 'Bill',
        amount: notification.amount?.toString() || '0',
        dueDate: dueDate.toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        }),
        daysUntilDue,
      });

      // Update notification status
      await db
        .update(billNotifications)
        .set({
          status: success ? 'sent' : 'failed',
          sentAt: success ? now : null,
          errorMessage: success ? null : 'Email delivery failed',
        })
        .where(eq(billNotifications.id, notification.id));

      console.log(
        `Bill notification ${success ? 'sent' : 'failed'} to ${user.email} for ${notification.billName}`
      );
    } catch (error) {
      console.error('Error processing notification:', error);
      
      // Mark as failed
      await db
        .update(billNotifications)
        .set({
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        })
        .where(eq(billNotifications.id, notification.id));
    }
  }
}

export async function scheduleUserNotifications(userId: string): Promise<void> {
  // Get user notification preferences
  const user = await db
    .select({
      billNotificationDays: users.billNotificationDays,
      billNotificationsEnabled: users.billNotificationsEnabled,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (user.length === 0 || !user[0].billNotificationsEnabled) {
    return;
  }

  const notificationDays = user[0].billNotificationDays || 3;
  const upcomingBills = await getUpcomingBills(userId, notificationDays + 1);
  
  await createBillNotifications(upcomingBills, notificationDays);
}