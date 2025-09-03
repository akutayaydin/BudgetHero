import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";

import { Strategy as MicrosoftStrategy } from "passport-microsoft";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";
import { db } from "./db";
import { passwordResetTokens, forgotPasswordSchema, resetPasswordSchema } from "@shared/schema";
import { eq, and, gt } from "drizzle-orm";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: sessionTtl,
    },
  });
}

export async function setupMultiAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Serialize user for session
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      if (!user) {
        return done(null, false); // User not found, clear session
      }
      done(null, user);
    } catch (error) {
      console.error("Deserialization error:", error);
      done(null, false); // Clear the session on error
    }
  });

  // Local Strategy (Email/Password)
  passport.use(new LocalStrategy(
    { usernameField: 'email' },
    async (email: string, password: string, done: any) => {
      try {
        const user = await storage.getUserByEmail(email);
        if (!user || !user.password) {
          return done(null, false, { message: 'Invalid email or password' });
        }

        const isValid = await comparePasswords(password, user.password);
        if (!isValid) {
          return done(null, false, { message: 'Invalid email or password' });
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  ));

  // Google OAuth Strategy
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/api/auth/google/callback"
    }, async (accessToken: any, refreshToken: any, profile: any, done: any) => {
      try {
        let user = await storage.getUserByEmail(profile.emails?.[0]?.value || '');
        
        if (!user) {
          const email = profile.emails?.[0]?.value || '';
          user = await storage.createUser({
            email,
            firstName: profile.name?.givenName || '',
            lastName: profile.name?.familyName || '',
            profileImageUrl: profile.photos?.[0]?.value || null,
            username: email || `google_${profile.id}`,
            password: 'oauth_user',
          });
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }));
  }



  // Microsoft OAuth Strategy
  if (process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET) {
    passport.use(new MicrosoftStrategy({
      clientID: process.env.MICROSOFT_CLIENT_ID,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
      callbackURL: "/api/auth/microsoft/callback",
      scope: ['user.read']
    }, async (accessToken: any, refreshToken: any, profile: any, done: any) => {
      try {
        let user = await storage.getUserByEmail(profile.emails?.[0]?.value || '');
        
        if (!user) {
          const email = profile.emails?.[0]?.value || '';
          user = await storage.createUser({
            email,
            firstName: profile.name?.givenName || '',
            lastName: profile.name?.familyName || '',
            profileImageUrl: profile.photos?.[0]?.value || null,
            username: email || `microsoft_${profile.id}`,
            password: 'oauth_user',
          });
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }));
  }

  // Routes
  
  // Local auth routes
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { email, password, firstName, lastName } = req.body;
      
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: 'An account with this email address already exists. Please try logging in instead or use a different email address.' });
      }

      const hashedPassword = await hashPassword(password);
      const user = await storage.createUser({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        username: email,
      });

      req.login(user, (err) => {
        if (err) return res.status(500).json({ error: 'Login failed' });
        res.status(201).json({ user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName } });
      });
    } catch (error) {
      res.status(500).json({ error: 'Registration failed' });
    }
  });

  app.post('/api/auth/login', passport.authenticate('local'), (req, res) => {
    const user = req.user as any;
    res.json({ user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName } });
  });

  // OAuth routes
  app.get('/api/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
  app.get('/api/auth/google/callback', passport.authenticate('google', { successRedirect: '/', failureRedirect: '/auth' }));



  app.get('/api/auth/microsoft', (req, res, next) => {
    // Clear any existing session to force account selection
    req.logout((err) => {
      if (err) console.error('Logout error:', err);
      // Proceed with Microsoft authentication
      passport.authenticate('microsoft')(req, res, next);
    });
  });
  app.get('/api/auth/microsoft/callback', passport.authenticate('microsoft', { successRedirect: '/', failureRedirect: '/auth' }));

  // Logout
  app.post('/api/auth/logout', (req, res) => {
    req.logout((err) => {
      if (err) return res.status(500).json({ error: 'Logout failed' });
      req.session.destroy((err) => {
        if (err) return res.status(500).json({ error: 'Session destruction failed' });
        res.clearCookie('connect.sid');
        res.json({ success: true });
      });
    });
  });

  // Forgot password
  app.post('/api/auth/forgot-password', async (req, res) => {
    try {
      const { email } = forgotPasswordSchema.parse(req.body);
      
      // Check if user exists
      const user = await storage.getUserByEmail(email);
      if (!user) {
        // For security, always return success even if user doesn't exist
        return res.json({ success: true, message: 'If an account with this email exists, you will receive a password reset link.' });
      }

      // Generate reset token
      const token = randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

      // Store reset token
      await db.insert(passwordResetTokens).values({
        userId: user.id,
        token,
        expiresAt,
      });

      // Send password reset email
      try {
        const { sendEmail, generatePasswordResetEmail } = await import('./emailService');
        const emailContent = generatePasswordResetEmail(token, req.get('origin') || `${req.protocol}://${req.get('host')}`);
        
        const emailSent = await sendEmail({
          to: email,
          subject: emailContent.subject,
          html: emailContent.html,
          text: emailContent.text,
        });

        if (emailSent) {
          console.log(`Password reset email sent successfully to: ${email}`);
        } else {
          console.error(`Failed to send password reset email to: ${email}`);
          // For development, also log the token so testing can continue
          if (process.env.NODE_ENV === 'development') {
            console.log(`Development fallback - Reset token: ${token}`);
            console.log(`Reset link: ${req.get('origin')}/reset-password?token=${token}`);
          }
        }
      } catch (error) {
        console.error('Email service error:', error);
        // For development, also log the token so testing can continue
        if (process.env.NODE_ENV === 'development') {
          console.log(`Development fallback - Reset token: ${token}`);
          console.log(`Reset link: ${req.get('origin')}/reset-password?token=${token}`);
        }
      }

      res.json({ 
        success: true, 
        message: 'If an account with this email exists, you will receive a password reset link.',
        // Remove this in production - only for testing
        resetToken: process.env.NODE_ENV === 'development' ? token : undefined
      });
    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(400).json({ error: 'Invalid request' });
    }
  });

  // Reset password
  app.post('/api/auth/reset-password', async (req, res) => {
    try {
      const { token, password } = resetPasswordSchema.parse(req.body);
      
      // Find valid reset token
      const resetToken = await db
        .select()
        .from(passwordResetTokens)
        .where(
          and(
            eq(passwordResetTokens.token, token),
            eq(passwordResetTokens.isUsed, false),
            gt(passwordResetTokens.expiresAt, new Date())
          )
        )
        .limit(1);

      if (resetToken.length === 0) {
        return res.status(400).json({ error: 'Invalid or expired reset token' });
      }

      // Get user
      const user = await storage.getUser(resetToken[0].userId);
      if (!user) {
        return res.status(400).json({ error: 'User not found' });
      }

      // Hash new password
      const hashedPassword = await hashPassword(password);

      // Update user password
      await storage.updateUser(user.id, { password: hashedPassword });

      // Mark token as used
      await db
        .update(passwordResetTokens)
        .set({ isUsed: true })
        .where(eq(passwordResetTokens.id, resetToken[0].id));

      res.json({ success: true, message: 'Password has been reset successfully' });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(400).json({ error: 'Invalid request' });
    }
  });


}

export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated() && req.user) {
    return next();
  }
  res.status(401).json({ error: "User not authenticated" });
};