import { db } from "./db";
import { users } from "@shared/schema";
import { eq, and, isNull, gte, lte, or } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { sendEmail } from "./emailService";

interface TrialUser {
  id: string;
  email: string;
  username: string;
  firstName?: string | null;
  trialEndsAt: string;
  trialRemindersSent: number;
  lastTrialReminderAt?: string;
}

export async function sendTrialReminders() {
  console.log('🔔 Starting trial reminder process...');
  
  try {
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + (3 * 24 * 60 * 60 * 1000));
    const oneDayFromNow = new Date(now.getTime() + (1 * 24 * 60 * 60 * 1000));
    const twelveHoursFromNow = new Date(now.getTime() + (12 * 60 * 60 * 1000));
    const twoHoursAgo = new Date(now.getTime() - (2 * 60 * 60 * 1000));

    // Find users in trial who need reminders
    const trialUsers = await db
      .select({
        id: users.id,
        email: users.email,
        username: users.username,
        firstName: users.firstName,
        trialEndsAt: users.trialEndsAt,
        trialRemindersSent: users.trialRemindersSent,
        lastTrialReminderAt: users.lastTrialReminderAt
      })
      .from(users)
      .where(
        and(
          eq(users.subscriptionStatus, 'trialing'),
          gte(users.trialEndsAt, now), // Trial hasn't ended yet
          or(
            // Haven't sent any reminders yet and trial ends within 3 days
            and(
              or(isNull(users.trialRemindersSent), eq(users.trialRemindersSent, 0)),
              lte(users.trialEndsAt, threeDaysFromNow)
            ),
            // Sent first reminder but not second, and trial ends within 1 day
            and(
              eq(users.trialRemindersSent, 1),
              lte(users.trialEndsAt, oneDayFromNow),
              or(
                isNull(users.lastTrialReminderAt),
                gte(users.lastTrialReminderAt, twoHoursAgo)
              )
            ),
            // Sent second reminder but not final, and trial ends within 12 hours
            and(
              eq(users.trialRemindersSent, 2),
              lte(users.trialEndsAt, twelveHoursFromNow),
              or(
                isNull(users.lastTrialReminderAt),
                gte(users.lastTrialReminderAt, twoHoursAgo)
              )
            )
          )
        )
      );

    console.log(`📧 Found ${trialUsers.length} users eligible for trial reminders`);

    for (const user of trialUsers) {
      await sendTrialReminderEmail(user);
    }

    console.log('✅ Trial reminder process completed');
  } catch (error) {
    console.error('❌ Error in trial reminder process:', error);
  }
}

async function sendTrialReminderEmail(user: TrialUser) {
  try {
    const trialEndsAt = new Date(user.trialEndsAt);
    const now = new Date();
    const timeRemaining = trialEndsAt.getTime() - now.getTime();
    const daysRemaining = Math.ceil(timeRemaining / (24 * 60 * 60 * 1000));
    const hoursRemaining = Math.ceil(timeRemaining / (60 * 60 * 1000));

    const currentReminderCount = user.trialRemindersSent || 0;
    let reminderType = '';
    let subject = '';
    let urgencyLevel = '';

    // Determine reminder type based on time remaining and previous reminders
    if (daysRemaining >= 2 && currentReminderCount === 0) {
      reminderType = 'early';
      subject = '💎 Your BudgetHero Premium Trial - 3 Days Left!';
      urgencyLevel = 'info';
    } else if (daysRemaining <= 1 && hoursRemaining > 12 && currentReminderCount <= 1) {
      reminderType = 'urgent';
      subject = '⚡ Final Day! Your BudgetHero Trial Expires Soon';
      urgencyLevel = 'warning';
    } else if (hoursRemaining <= 12 && currentReminderCount <= 2) {
      reminderType = 'final';
      subject = '🚨 Last Chance! Your BudgetHero Trial Expires in Hours';
      urgencyLevel = 'critical';
    } else {
      console.log(`⏭️ Skipping reminder for user ${user.email} - criteria not met`);
      return;
    }

    const displayName = user.firstName || user.username;
    const timeLeftText = hoursRemaining <= 24 
      ? `${hoursRemaining} hours` 
      : `${daysRemaining} days`;

    // Create personalized email content
    const htmlContent = createTrialReminderEmailHTML({
      displayName,
      timeLeftText,
      reminderType,
      urgencyLevel,
      trialEndsAt: trialEndsAt.toLocaleDateString()
    });

    const textContent = createTrialReminderEmailText({
      displayName,
      timeLeftText,
      reminderType
    });

    // Send email
    const emailSent = await sendEmail({
      to: user.email,
      subject,
      text: textContent,
      html: htmlContent
    });

    if (emailSent) {
      // Update user's reminder count and timestamp
      await db
        .update(users)
        .set({
          trialRemindersSent: currentReminderCount + 1,
          lastTrialReminderAt: new Date()
        })
        .where(eq(users.id, user.id));

      console.log(`✅ Sent ${reminderType} trial reminder to ${user.email} (${timeLeftText} remaining)`);
    } else {
      console.error(`❌ Failed to send trial reminder to ${user.email}`);
    }
  } catch (error) {
    console.error(`❌ Error sending trial reminder to ${user.email}:`, error);
  }
}

function createTrialReminderEmailHTML({ displayName, timeLeftText, reminderType, urgencyLevel, trialEndsAt }: {
  displayName: string;
  timeLeftText: string;
  reminderType: string;
  urgencyLevel: string;
  trialEndsAt: string;
}) {
  const colors = {
    info: { bg: '#dbeafe', border: '#3b82f6', text: '#1e40af' },
    warning: { bg: '#fef3c7', border: '#f59e0b', text: '#92400e' },
    critical: { bg: '#fee2e2', border: '#ef4444', text: '#dc2626' }
  };

  const color = colors[urgencyLevel as keyof typeof colors] || colors.info;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>BudgetHero Trial Reminder</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; background-color: #f8fafc;">
      <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
          <div style="width: 60px; height: 60px; background: rgba(255,255,255,0.2); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
            <span style="font-size: 24px;">👑</span>
          </div>
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">BudgetHero</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 16px;">Level Up Your Money</p>
        </div>

        <!-- Content -->
        <div style="padding: 40px 30px;">
          <h2 style="color: #1a202c; font-size: 24px; margin: 0 0 20px;">Hi ${displayName}! 👋</h2>
          
          <!-- Urgency Banner -->
          <div style="background: ${color.bg}; border-left: 4px solid ${color.border}; padding: 20px; margin: 20px 0; border-radius: 6px;">
            <p style="margin: 0; color: ${color.text}; font-weight: 600; font-size: 18px;">
              ${reminderType === 'final' ? '🚨 Final Hours!' : reminderType === 'urgent' ? '⚡ Almost Over!' : '💎 Trial Ending Soon!'}
            </p>
            <p style="margin: 10px 0 0; color: ${color.text}; font-size: 16px;">
              Your premium trial expires in <strong>${timeLeftText}</strong> (${trialEndsAt})
            </p>
          </div>

          <div style="background: #f8fafc; padding: 25px; border-radius: 8px; margin: 25px 0;">
            <h3 style="margin: 0 0 15px; color: #2d3748; font-size: 18px;">🎯 Don't Lose Your Premium Features:</h3>
            <ul style="margin: 0; padding-left: 20px; color: #4a5568;">
              <li style="margin-bottom: 8px;">Unlimited bank account connections</li>
              <li style="margin-bottom: 8px;">AI-powered financial insights & predictions</li>
              <li style="margin-bottom: 8px;">Advanced budgeting and goal tracking</li>
              <li style="margin-bottom: 8px;">Smart subscription management</li>
              <li style="margin-bottom: 8px;">Comprehensive financial analytics</li>
            </ul>
          </div>

          <div style="text-align: center; margin: 35px 0;">
            <a href="https://budgetheroapp.com/subscription/plans" 
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);">
              🚀 Continue with Premium - $9.99/month
            </a>
          </div>

          ${reminderType === 'final' ? `
          <div style="background: linear-gradient(135deg, #fef3c7, #fee2e2); padding: 20px; border-radius: 8px; margin: 25px 0; text-align: center;">
            <p style="margin: 0; color: #92400e; font-weight: 600; font-size: 16px;">
              ⏰ This is your final reminder - don't miss out on premium features!
            </p>
          </div>
          ` : ''}

          <div style="color: #6b7280; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0 0 10px;">Questions? We're here to help!</p>
            <p style="margin: 0;">Contact us at <a href="mailto:support@budgetheroapp.com" style="color: #667eea;">support@budgetheroapp.com</a></p>
          </div>
        </div>

        <!-- Footer -->
        <div style="background: #f8fafc; padding: 25px 30px; text-align: center; color: #6b7280; font-size: 12px;">
          <p style="margin: 0 0 10px;">© 2025 BudgetHero. All rights reserved.</p>
          <p style="margin: 0;">You're receiving this because you started a premium trial.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function createTrialReminderEmailText({ displayName, timeLeftText, reminderType }: {
  displayName: string;
  timeLeftText: string;
  reminderType: string;
}) {
  return `
Hi ${displayName}!

${reminderType === 'final' ? 'FINAL REMINDER' : reminderType === 'urgent' ? 'URGENT REMINDER' : 'TRIAL ENDING SOON'}: Your BudgetHero premium trial expires in ${timeLeftText}.

Don't lose access to your premium features:
- Unlimited bank account connections
- AI-powered financial insights & predictions  
- Advanced budgeting and goal tracking
- Smart subscription management
- Comprehensive financial analytics

Continue with Premium for just $9.99/month:
https://budgetheroapp.com/subscription/plans

Questions? Contact us at support@budgetheroapp.com

Best regards,
The BudgetHero Team

---
© 2025 BudgetHero. All rights reserved.
You're receiving this because you started a premium trial.
  `.trim();
}

export async function startTrialReminderService() {
  console.log('🚀 Trial reminder service starting...');
  
  // Daily checks for normal reminders (24 hours), frequent checks in final 24 hours (30 minutes)
  const normalInterval = process.env.NODE_ENV === 'production' ? 24 * 60 * 60 * 1000 : 2 * 60 * 1000; // 24 hours prod, 2 min dev
  const urgentInterval = process.env.NODE_ENV === 'production' ? 30 * 60 * 1000 : 30 * 1000; // 30 minutes prod, 30 sec dev
  
  let currentInterval = normalInterval;
  
  const runReminderCheck = async () => {
    try {
      console.log('⏰ Running scheduled trial reminder check...');
      
      // Check if any users are in final 24 hours to adjust frequency
      const now = new Date();
      const oneDayFromNow = new Date(now.getTime() + (24 * 60 * 60 * 1000));
      
      const urgentUsers = await db
        .select({ id: users.id })
        .from(users)
        .where(
          and(
            eq(users.subscriptionStatus, 'trialing'),
            gte(users.trialEndsAt, now),
            lte(users.trialEndsAt, oneDayFromNow)
          )
        );
      
      // Adjust checking frequency based on urgent users
      const newInterval = urgentUsers.length > 0 ? urgentInterval : normalInterval;
      if (newInterval !== currentInterval) {
        currentInterval = newInterval;
        console.log(`🔄 Adjusted reminder frequency: checking every ${newInterval / 60000} minutes (${urgentUsers.length} urgent users)`);
        
        // Clear current interval and restart with new frequency
        clearInterval(intervalId);
        intervalId = setInterval(runReminderCheck, currentInterval);
      }
      
      await sendTrialReminders();
    } catch (error) {
      console.error('❌ Trial reminder service error:', error);
    }
  };
  
  // Start with normal interval
  let intervalId = setInterval(runReminderCheck, currentInterval);

  // Run immediately on startup (after 2 minute delay to let server fully start)
  setTimeout(async () => {
    try {
      console.log('🔄 Running initial trial reminder check...');
      await runReminderCheck();
    } catch (error) {
      console.error('❌ Initial trial reminder check failed:', error);
    }
  }, 2 * 60 * 1000);

  console.log(`✅ Trial reminder service configured (daily checks, 30-min frequency in final 24 hours)`);
}