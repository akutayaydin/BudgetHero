import { Request, Response } from 'express';
import crypto from 'crypto';
import { db } from './db';
import { users } from '../shared/schema';
import { eq } from 'drizzle-orm';

// Store temporary admin tokens (in memory - resets on server restart for security)
const temporaryAdminTokens = new Map<string, { userId: string, expires: number }>();

// Clean up expired tokens every hour
setInterval(() => {
  const now = Date.now();
  const expiredTokens: string[] = [];
  temporaryAdminTokens.forEach((data, token) => {
    if (data.expires < now) {
      expiredTokens.push(token);
    }
  });
  expiredTokens.forEach(token => temporaryAdminTokens.delete(token));
}, 60 * 60 * 1000);

export function setupAdminOverride(app: any) {
  // Endpoint to generate admin token (requires environment variable for security)
  app.post("/api/admin/generate-token", async (req: Request, res: Response) => {
    try {
      const { masterKey, targetUserId } = req.body;
      
      // Check master key (must be set in environment for production)
      const expectedMasterKey = process.env.ADMIN_MASTER_KEY || (process.env.NODE_ENV === 'development' ? 'BUDGETHERO_ADMIN_2025' : null);
      if (!expectedMasterKey) {
        console.error('ADMIN_MASTER_KEY environment variable not set');
        return res.status(503).json({ error: "Admin system not configured" });
      }
      if (masterKey !== expectedMasterKey) {
        return res.status(401).json({ error: "Invalid master key" });
      }
      
      // Verify target user exists and can be made admin
      const targetUser = await db.select().from(users).where(eq(users.id, targetUserId)).limit(1);
      if (targetUser.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Generate secure random token
      const token = crypto.randomBytes(32).toString('hex');
      const expires = Date.now() + (15 * 60 * 1000); // 15 minutes
      
      temporaryAdminTokens.set(token, {
        userId: targetUserId,
        expires
      });
      
      console.log(`[ADMIN AUDIT] Generated admin token for user ${targetUserId}, expires in 15 minutes, requested from IP: ${req.ip}`);
      
      res.json({
        success: true,
        token,
        expiresIn: 15 * 60, // 15 minutes in seconds
        instructions: `Use this token at: ${req.protocol}://${req.hostname}:5000/admin-override?token=${token}`,
        security: {
          singleUse: true,
          expiresAt: new Date(expires).toISOString(),
          environment: process.env.NODE_ENV || 'development'
        }
      });
      
    } catch (error) {
      console.error('Admin token generation error:', error);
      res.status(500).json({ error: "Failed to generate admin token" });
    }
  });
  
  // Endpoint to use admin token and gain admin access
  app.get("/admin-override", async (req: Request, res: Response) => {
    try {
      const { token } = req.query;
      
      if (!token || typeof token !== 'string') {
        return res.status(400).send(`
          <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px;">
              <h2 style="color: #dc2626;">Invalid Admin Override Request</h2>
              <p>No valid token provided.</p>
              <a href="/" style="color: #2563eb;">Return to BudgetHero</a>
            </body>
          </html>
        `);
      }
      
      const tokenData = temporaryAdminTokens.get(token);
      if (!tokenData || tokenData.expires < Date.now()) {
        temporaryAdminTokens.delete(token); // Clean up expired token
        return res.status(401).send(`
          <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px;">
              <h2 style="color: #dc2626;">Admin Token Expired or Invalid</h2>
              <p>The admin token has expired or is invalid. Please generate a new one.</p>
              <a href="/" style="color: #2563eb;">Return to BudgetHero</a>
            </body>
          </html>
        `);
      }
      
      // Grant admin access to the user
      await db.update(users)
        .set({ isAdmin: true })
        .where(eq(users.id, tokenData.userId));
      
      // Remove the token after use (single-use)
      temporaryAdminTokens.delete(token);
      
      console.log(`[ADMIN AUDIT] Granted admin access to user ${tokenData.userId} via token override from IP: ${req.ip} at ${new Date().toISOString()}`);
      
      res.send(`
        <html>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px;">
            <h2 style="color: #16a34a;">✓ Admin Access Granted</h2>
            <p>You have been successfully granted admin access.</p>
            <p><strong>User ID:</strong> ${tokenData.userId}</p>
            <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
            <div style="margin: 30px 0; padding: 15px; background: #fef3c7; border-radius: 8px;">
              <p style="margin: 0; color: #92400e;"><strong>Security Note:</strong> This token was single-use and has been destroyed. Your admin access is now permanent until manually revoked.</p>
            </div>
            <a href="/" style="display: inline-block; background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px;">Continue to BudgetHero</a>
          </body>
        </html>
      `);
      
    } catch (error) {
      console.error('Admin override error:', error);
      res.status(500).send(`
        <html>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px;">
            <h2 style="color: #dc2626;">Admin Override Error</h2>
            <p>An error occurred while processing the admin override.</p>
            <a href="/" style="color: #2563eb;">Return to BudgetHero</a>
          </body>
        </html>
      `);
    }
  });
  
  // Endpoint to revoke admin access (for security)
  app.post("/api/admin/revoke-admin", async (req: Request, res: Response) => {
    try {
      const { masterKey, targetUserId } = req.body;
      
      const expectedMasterKey = process.env.ADMIN_MASTER_KEY || (process.env.NODE_ENV === 'development' ? 'BUDGETHERO_ADMIN_2025' : null);
      if (!expectedMasterKey) {
        return res.status(503).json({ error: "Admin system not configured" });
      }
      if (masterKey !== expectedMasterKey) {
        return res.status(401).json({ error: "Invalid master key" });
      }
      
      await db.update(users)
        .set({ isAdmin: false })
        .where(eq(users.id, targetUserId));
      
      console.log(`Revoked admin access from user ${targetUserId}`);
      
      res.json({ success: true, message: "Admin access revoked" });
      
    } catch (error) {
      console.error('Admin revoke error:', error);
      res.status(500).json({ error: "Failed to revoke admin access" });
    }
  });
  
  // List current admin users (for management)
  app.post("/api/admin/list-admins", async (req: Request, res: Response) => {
    try {
      const { masterKey } = req.body;
      
      const expectedMasterKey = process.env.ADMIN_MASTER_KEY || (process.env.NODE_ENV === 'development' ? 'BUDGETHERO_ADMIN_2025' : null);
      if (!expectedMasterKey) {
        return res.status(503).json({ error: "Admin system not configured" });
      }
      if (masterKey !== expectedMasterKey) {
        return res.status(401).json({ error: "Invalid master key" });
      }
      
      const adminUsers = await db.select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        isAdmin: users.isAdmin
      }).from(users).where(eq(users.isAdmin, true));
      
      res.json({ admins: adminUsers });
      
    } catch (error) {
      console.error('List admins error:', error);
      res.status(500).json({ error: "Failed to list admin users" });
    }
  });
}