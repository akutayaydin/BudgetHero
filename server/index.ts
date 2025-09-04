import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

// Note: Authentication uses Replit's OpenID Connect, not Google OAuth
// Required environment variables are checked in replitAuth.ts

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Seed enhanced admin categories on startup
  try {
    const { seedEnhancedCategories } = await import("./seedEnhancedCategories");
    await seedEnhancedCategories();
  } catch (error) {
    console.error("Failed to seed enhanced admin categories:", error);
  }

  // Seed subscription plans on startup
  try {
    const { seedSubscriptionPlans } = await import("./seedSubscriptionPlans");
    await seedSubscriptionPlans();
  } catch (error) {
    console.error("Failed to seed subscription plans:", error);
  }

  // Start trial reminder service
  try {
    const { startTrialReminderService } = await import(
      "./trial-reminder-service"
    );
    await startTrialReminderService();

    // Start bill notification service
    const { billNotificationService } = await import(
      "./bill-notification-service"
    );
    billNotificationService.start();
  } catch (error) {
    console.error("Failed to start trial reminder service:", error);
  }

  // Setup admin override system
  const { setupAdminOverride } = await import("./adminOverride");
  setupAdminOverride(app);

  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  const isProduction = process.env.NODE_ENV === 'production' || process.env.REPLIT_DEPLOYMENT === 'true';
  
  if (isProduction) {
    // Ensure NODE_ENV is set to production for proper Express configuration
    process.env.NODE_ENV = 'production';
    app.set('env', 'production');
    serveStatic(app);
    console.log('Server running in PRODUCTION mode');
  } else {
    await setupVite(app, server);
    console.log('Server running in DEVELOPMENT mode');
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    },
  );
})();
