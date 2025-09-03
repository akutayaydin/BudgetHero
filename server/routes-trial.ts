import type { Express } from "express";
import { sendTrialReminders } from "./trial-reminder-service";

export function registerTrialRoutes(app: Express) {
  
  // Admin endpoint to manually trigger trial reminders
  app.post("/api/admin/trial-reminders/send", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }

    try {
      const result = await trialReminderService.processTrialReminders();
      res.json({ 
        message: "Trial reminders processed",
        sent: result.sent,
        failed: result.failed
      });
    } catch (error: any) {
      console.error("Error processing trial reminders:", error);
      res.status(500).json({ message: "Failed to process trial reminders: " + error.message });
    }
  });

  // Admin endpoint to check users needing reminders
  app.get("/api/admin/trial-reminders/check", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }

    try {
      const users = await trialReminderService.findUsersNeedingReminders();
      const usersWithReminderTypes = users.map(user => ({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        username: user.username,
        trialEndsAt: user.trialEndsAt,
        daysLeft: Math.ceil((user.trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
        reminderType: trialReminderService.getReminderType(user),
        remindersSent: user.trialRemindersSent,
      }));

      res.json({ 
        users: usersWithReminderTypes,
        totalCount: usersWithReminderTypes.length
      });
    } catch (error: any) {
      console.error("Error checking trial reminders:", error);
      res.status(500).json({ message: "Failed to check trial reminders: " + error.message });
    }
  });

  // Endpoint to start a 7-day trial for a user
  app.post("/api/subscription/start-trial", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const userId = req.user.id;
      const trialEndsAt = new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)); // 7 days from now

      // Update user to start trial
      const { storage } = await import("./storage");
      const updatedUser = await storage.updateUserSubscription(userId, {
        subscriptionStatus: 'trialing',
        subscriptionPlan: 'pro',
        trialEndsAt,
        trialRemindersSent: [],
        lastTrialReminderAt: null,
      });

      res.json({ 
        message: "Trial started successfully",
        trialEndsAt: updatedUser.trialEndsAt,
        subscriptionStatus: updatedUser.subscriptionStatus,
        subscriptionPlan: updatedUser.subscriptionPlan,
      });
    } catch (error: any) {
      console.error("Error starting trial:", error);
      res.status(500).json({ message: "Failed to start trial: " + error.message });
    }
  });

  // Get personalized trial banner message
  app.get("/api/subscription/trial-banner", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const user = req.user;
      
      if (user.subscriptionStatus !== 'trialing' || !user.trialEndsAt) {
        return res.json({ showBanner: false });
      }

      const trialEnd = new Date(user.trialEndsAt);
      const daysLeft = Math.ceil((trialEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      
      const message = trialReminderService.getBannerMessage(user, daysLeft);

      res.json({
        showBanner: true,
        daysLeft,
        message,
        trialEndsAt: user.trialEndsAt,
        urgencyLevel: daysLeft <= 1 ? 'high' : daysLeft <= 3 ? 'medium' : 'low'
      });
    } catch (error: any) {
      console.error("Error getting trial banner:", error);
      res.status(500).json({ message: "Failed to get trial banner: " + error.message });
    }
  });
}