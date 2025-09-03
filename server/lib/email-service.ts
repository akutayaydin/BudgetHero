import nodemailer from 'nodemailer';

// Use Gmail configuration like password reset emails
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

interface BillReminderEmail {
  to: string;
  userName: string;
  billName: string;
  amount: string;
  dueDate: string;
  daysUntilDue: number;
}

interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.log('Gmail credentials not configured - email not sent:', params.subject);
    return false;
  }

  try {
    await transporter.sendMail({
      to: params.to,
      from: params.from,
      subject: params.subject,
      text: params.text,
      html: params.html,
    });
    return true;
  } catch (error) {
    console.error('Gmail email error:', error);
    return false;
  }
}

export async function sendBillReminderEmail(reminder: BillReminderEmail): Promise<boolean> {
  const subject = `📅 Bill Reminder: ${reminder.billName} due in ${reminder.daysUntilDue} day${reminder.daysUntilDue !== 1 ? 's' : ''}`;
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Bill Reminder</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; background-color: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden; }
        .header { background: linear-gradient(135deg, #a855f7 0%, #ec4899 100%); color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
        .content { padding: 30px; }
        .bill-info { background: #f1f5f9; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #a855f7; }
        .amount { font-size: 24px; font-weight: bold; color: #1e293b; }
        .due-date { color: #ef4444; font-weight: 600; }
        .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 14px; color: #64748b; }
        .cta-button { display: inline-block; background: linear-gradient(135deg, #a855f7 0%, #ec4899 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>💰 Bill Reminder from BudgetHero</h1>
        </div>
        <div class="content">
          <p>Hi ${reminder.userName},</p>
          <p>Just a friendly reminder that you have an upcoming bill payment:</p>
          
          <div class="bill-info">
            <h3>${reminder.billName}</h3>
            <p class="amount">$${reminder.amount}</p>
            <p class="due-date">Due: ${reminder.dueDate}</p>
            <p><strong>${reminder.daysUntilDue} day${reminder.daysUntilDue !== 1 ? 's' : ''} remaining</strong></p>
          </div>
          
          <p>Don't forget to make this payment on time to avoid any late fees!</p>
          
          <a href="${process.env.VITE_PUBLIC_URL || 'https://budgethero.replit.app'}/recurring" class="cta-button">View Bills & Subscriptions</a>
          
          <p>Stay on top of your finances with BudgetHero! 🚀</p>
        </div>
        <div class="footer">
          <p>This reminder was sent from BudgetHero - Level Up Your Money</p>
          <p>To manage your notification preferences, visit your profile settings.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
    Bill Reminder from BudgetHero
    
    Hi ${reminder.userName},
    
    You have an upcoming bill payment:
    
    Bill: ${reminder.billName}
    Amount: $${reminder.amount}
    Due Date: ${reminder.dueDate}
    Days Remaining: ${reminder.daysUntilDue}
    
    Don't forget to make this payment on time to avoid any late fees!
    
    Visit BudgetHero to manage your bills: ${process.env.VITE_PUBLIC_URL || 'https://budgethero.replit.app'}/recurring
    
    Stay on top of your finances!
    
    - BudgetHero Team
  `;

  return await sendEmail({
    to: reminder.to,
    from: process.env.GMAIL_USER || 'budgethero@gmail.com',
    subject,
    html: htmlContent,
    text: textContent,
  });
}