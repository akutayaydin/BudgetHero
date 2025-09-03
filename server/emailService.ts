import nodemailer from 'nodemailer';

// Email configuration - prioritize Gmail if available, fallback to general config
const transporter = nodemailer.createTransport({
  host: process.env.GMAIL_USER ? 'smtp.gmail.com' : process.env.EMAIL_HOST,
  port: process.env.GMAIL_USER ? 587 : parseInt(process.env.EMAIL_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.GMAIL_USER || process.env.EMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD || process.env.EMAIL_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false
  },
  debug: process.env.NODE_ENV === 'development'
});

interface EmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  try {
    // Verify email configuration (Gmail or fallback)
    const hasGmail = process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD;
    const hasGeneral = process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASSWORD;
    
    if (!hasGmail && !hasGeneral) {
      console.error('Email configuration missing. Required: (GMAIL_USER + GMAIL_APP_PASSWORD) or (EMAIL_HOST + EMAIL_USER + EMAIL_PASSWORD)');
      return false;
    }

    const fromEmail = process.env.GMAIL_USER || process.env.EMAIL_FROM;
    const mailOptions = {
      from: `"BudgetHero" <${fromEmail}>`,
      replyTo: fromEmail,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
    };

    const emailConfig = process.env.GMAIL_USER ? {
      service: 'Gmail',
      user: process.env.GMAIL_USER?.slice(0, 10) + '...',
      from: fromEmail,
      to: params.to
    } : {
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      user: process.env.EMAIL_USER?.slice(0, 10) + '...',
      from: fromEmail,
      to: params.to
    };
    
    console.log('Attempting to send email with config:', emailConfig);

    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully to:', params.to);
    return true;
  } catch (error) {
    console.error('Email sending failed with error:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    return false;
  }
}

export function generatePasswordResetEmail(resetToken: string, origin?: string): { subject: string; html: string; text: string } {
  const baseUrl = origin || process.env.REPLIT_DOMAINS?.split(',')[0] || 'http://localhost:5000';
  const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;
  
  const subject = 'BudgetHero - Password Reset Request';
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset - BudgetHero</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            max-width: 600px; 
            margin: 0 auto; 
            padding: 20px; 
          }
          .header { 
            background: linear-gradient(135deg, #a855f7 0%, #ec4899 100%); 
            padding: 20px; 
            text-align: center; 
            border-radius: 8px 8px 0 0; 
          }
          .header h1 { 
            color: white; 
            margin: 0; 
            font-size: 24px; 
          }
          .content { 
            background: #f9fafb; 
            padding: 30px; 
            border-radius: 0 0 8px 8px; 
          }
          .button { 
            display: inline-block; 
            background: linear-gradient(135deg, #a855f7 0%, #ec4899 100%); 
            color: white; 
            padding: 12px 24px; 
            text-decoration: none; 
            border-radius: 6px; 
            font-weight: bold; 
            margin: 20px 0; 
          }
          .footer { 
            margin-top: 20px; 
            padding-top: 20px; 
            border-top: 1px solid #e5e7eb; 
            font-size: 14px; 
            color: #6b7280; 
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🛡️ BudgetHero</h1>
          <p style="color: white; margin: 0;">Level Up Your Money</p>
        </div>
        <div class="content">
          <h2>Password Reset Request</h2>
          <p>Hi there!</p>
          <p>You recently requested to reset your password for your BudgetHero account. Click the button below to reset your password:</p>
          
          <div style="text-align: center;">
            <a href="${resetUrl}" class="button">Reset My Password</a>
          </div>
          
          <p>Or copy and paste this link in your browser:</p>
          <p style="background: #e5e7eb; padding: 10px; border-radius: 4px; word-break: break-all;">
            ${resetUrl}
          </p>
          
          <p><strong>Important:</strong> This link will expire in 1 hour for security reasons.</p>
          
          <p>If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.</p>
          
          <p><strong>Security tip:</strong> If you received this email in your spam folder, please mark it as "Not Spam" to ensure future emails from BudgetHero reach your inbox.</p>
        </div>
        <div class="footer">
          <p>This email was sent from BudgetHero. If you have any questions, please contact our support team.</p>
          <p>© 2025 BudgetHero. All rights reserved.</p>
        </div>
      </body>
    </html>
  `;
  
  const text = `
BudgetHero - Password Reset Request

Hi there!

You recently requested to reset your password for your BudgetHero account. 

To reset your password, visit this link:
${resetUrl}

Important: This link will expire in 1 hour for security reasons.

If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.

© 2025 BudgetHero. All rights reserved.
  `;

  return { subject, html, text };
}