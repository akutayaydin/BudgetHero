import express from 'express';
import { z } from 'zod';
import { db } from '../db';
import { users, billNotifications } from '../../shared/schema';
import { eq, and, desc } from 'drizzle-orm';
import { scheduleUserNotifications, processPendingNotifications, getUpcomingBills } from '../lib/notification-service';
import { isAuthenticated } from '../multiAuth';

const router = express.Router();

// Get notification settings for current user
router.get('/settings', isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await db
      .select({
        billNotificationsEnabled: users.billNotificationsEnabled,
        billNotificationDays: users.billNotificationDays,
        emailNotificationsEnabled: users.emailNotificationsEnabled,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (user.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user[0]);
  } catch (error) {
    console.error('Error fetching notification settings:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update notification settings for current user
router.patch('/settings', isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const updateSchema = z.object({
      billNotificationsEnabled: z.boolean().optional(),
      billNotificationDays: z.number().min(1).max(14).optional(),
      emailNotificationsEnabled: z.boolean().optional(),
    });

    const validatedData = updateSchema.parse(req.body);

    const updatedUser = await db
      .update(users)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning({
        billNotificationsEnabled: users.billNotificationsEnabled,
        billNotificationDays: users.billNotificationDays,
        emailNotificationsEnabled: users.emailNotificationsEnabled,
      });

    if (updatedUser.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Schedule new notifications if enabled
    if (validatedData.billNotificationsEnabled === true) {
      await scheduleUserNotifications(userId);
    }

    res.json(updatedUser[0]);
  } catch (error) {
    console.error('Error updating notification settings:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid request data', errors: error.errors });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get upcoming bills for current user
router.get('/upcoming-bills', async (req: any, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const daysAhead = parseInt(req.query.days as string) || 7;
    const bills = await getUpcomingBills(userId, daysAhead);

    res.json(bills);
  } catch (error) {
    console.error('Error fetching upcoming bills:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get notification history for current user
router.get('/history', async (req: any, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const notifications = await db
      .select()
      .from(billNotifications)
      .where(eq(billNotifications.userId, userId))
      .orderBy(desc(billNotifications.createdAt))
      .limit(50);

    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notification history:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Manually trigger notifications for a user (admin or user themselves)
router.post('/trigger', isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    console.log('🔔 Manual notification trigger for user:', userId);
    
    await scheduleUserNotifications(userId);
    await processPendingNotifications();

    res.json({ message: 'Notifications triggered successfully' });
  } catch (error) {
    console.error('Error triggering notifications:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Admin endpoint to process all pending notifications
router.post('/admin/process-all', async (req: any, res) => {
  try {
    const userId = req.user?.id;
    if (!userId || !req.user?.isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    await processPendingNotifications();

    res.json({ message: 'All pending notifications processed' });
  } catch (error) {
    console.error('Error processing all notifications:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Test notification endpoint  
router.post('/test', isAuthenticated, async (req: any, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    // Send a simple test email using the current user's information
    const { sendBillReminderEmail } = await import('../lib/email-service');
    
    const userName = req.user.firstName || req.user.email.split('@')[0];
    const success = await sendBillReminderEmail({
      to: req.user.email,
      userName,
      billName: 'Test Bill (Demo)',
      amount: '$29.99',
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      daysUntilDue: 3,
    });

    if (success) {
      res.json({ message: 'Test notification sent successfully to ' + req.user.email });
    } else {
      res.status(500).json({ message: 'Failed to send test notification - check email configuration' });
    }
  } catch (error) {
    console.error('Error sending test notification:', error);
    res.status(500).json({ message: 'Failed to trigger test notification' });
  }
});

export default router;