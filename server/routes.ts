import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupMultiAuth, isAuthenticated } from "./multiAuth";
import { insertTransactionSchema, updateTransactionSchema, insertBudgetSchema, insertBudgetPlanSchema, insertGoalSchema, transactionFiltersSchema, insertInstitutionSchema, insertAccountSchema, insertAssetSchema, insertLiabilitySchema, insertManualSubscriptionSchema, insertTransactionTagSchema, insertAutomationRuleSchema, insertTransactionSplitSchema, transactions, budgets, accounts, adminCategories, passwordResetTokens, forgotPasswordSchema, resetPasswordSchema, recurringMerchants, insertRecurringMerchantSchema, users, insertWidgetLayoutSchema } from "@shared/schema";
import { sendEmail, generatePasswordResetEmail } from "./emailService";
import { getTransactionsNeedingReview } from "./enhancedCategorization";
import { enhancedRecurringDetection } from './enhancedRecurringDetection';
import { registerTrialRoutes } from "./routes-trial";
import { seedNewMerchants, bulkImportMerchants } from "./seedNewMerchants";
import { seedRealisticTransactions } from "./seedRealisticTransactions";
import Stripe from "stripe";
import { z, ZodError } from "zod";
import { and, count, desc, eq, gte, ilike, lte, or, sql } from "drizzle-orm";
import { db } from "./db";

// Helper function to get consistent user ID from request
function getUserId(req: any): string | null {
  // For multi-provider auth, use the user ID directly
  return req.user?.id || null;
}



// Initialize Stripe
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-07-30.basil",
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  await setupMultiAuth(app);

  // Debug endpoint for authentication troubleshooting
  app.get('/api/auth/debug', async (req: any, res) => {
    res.json({
      isAuthenticated: req.isAuthenticated(),
      hasUser: !!req.user,
      sessionID: req.sessionID,
      userAgent: req.get('User-Agent'),
      host: req.get('Host'),
      origin: req.get('Origin'),
      referer: req.get('Referer'),
      cookies: req.headers.cookie ? 'present' : 'missing',
      session: {
        exists: !!req.session,
        passport: req.session?.passport ? 'present' : 'missing'
      }
    });
  });

  // Auth routes
  app.get('/api/auth/user', async (req: any, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        console.log("User auth check failed: Not authenticated or no user");
        return res.status(401).json({ message: "Unauthorized" });
      }

      console.log("User session data:", {
        hasUser: !!req.user,
        userId: getUserId(req),
        userKeys: Object.keys(req.user || {})
      });

      // Get user from session directly
      const user = req.user;
      if (user) {
        console.log("Found user in session:", user.id);
        return res.json({
          id: user.id,
          email: user.email,
          name: user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : undefined,
          firstName: user.firstName,
          lastName: user.lastName,
          username: user.username,
          avatar: user.profileImageUrl,
          onboardingCompleted: user.onboardingCompleted,
          onboardingSkipped: user.onboardingSkipped,
          isAdmin: user.isAdmin
        });
      }
      
      console.log("User not found in database");
      return res.status(404).json({ message: "User not found" });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Mark onboarding as completed
  app.post('/api/user/onboarding-complete', isAuthenticated, async (req: any, res) => {
    try {


      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }

      await storage.updateUserOnboarding(userId, true);
      
      console.log(`User ${userId} completed onboarding`);
      res.json({ success: true });
    } catch (error) {
      console.error("Error completing onboarding:", error);
      res.status(500).json({ message: "Failed to complete onboarding" });
    }
  });

  // Update user profile (name)
  app.put('/api/user/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }

      const { firstName, lastName } = req.body;
      
      // Validate input
      if (firstName && typeof firstName !== 'string') {
        return res.status(400).json({ message: "Invalid first name" });
      }
      if (lastName && typeof lastName !== 'string') {
        return res.status(400).json({ message: "Invalid last name" });
      }

      const updates: any = {};
      if (firstName !== undefined) updates.firstName = firstName.trim();
      if (lastName !== undefined) updates.lastName = lastName.trim();

      const updatedUser = await storage.updateUser(userId, updates);
      
      console.log(`User ${userId} updated profile:`, updates);
      res.json({ 
        success: true, 
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          name: updatedUser.firstName ? `${updatedUser.firstName} ${updatedUser.lastName || ''}`.trim() : undefined,
        }
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Update user avatar
  app.patch('/api/user/avatar', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }

      const { profileImageUrl } = req.body;
      
      // Validate the URL if provided
      if (profileImageUrl && typeof profileImageUrl !== 'string') {
        return res.status(400).json({ message: "Invalid avatar URL" });
      }

      await storage.updateUserAvatar(userId, profileImageUrl || null);
      
      console.log(`User ${userId} updated avatar`);
      res.json({ success: true, profileImageUrl });
    } catch (error) {
      console.error("Error updating avatar:", error);
      res.status(500).json({ message: "Failed to update avatar" });
    }
  });

  // Mark onboarding as skipped (Limited Mode)
  app.post('/api/user/onboarding-skip', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }

      await storage.updateUser(userId, { 
        onboardingSkipped: true 
      });
      
      console.log(`User ${userId} skipped onboarding - entering Limited Mode`);
      res.json({ success: true });
    } catch (error) {
      console.error("Error skipping onboarding:", error);
      res.status(500).json({ message: "Failed to skip onboarding" });
    }
  });
  // Get all transactions with optional filters (protected route)
  app.get("/api/transactions", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }
      
      // Disable all caching to ensure fresh data
      res.set({
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store',
      });
      
      const filters = transactionFiltersSchema.parse(req.query);
      console.log(`Transactions API: Filters received:`, JSON.stringify(filters, null, 2));
      const transactions = await storage.getTransactions(userId, filters);
      console.log(`Transactions API: Returning ${transactions.length} transactions for user ${userId}`);
      
      // Debug: log first few transactions to understand structure
      if (transactions.length > 0) {
        console.log(`Sample transaction data:`, JSON.stringify(transactions.slice(0, 2), null, 2));
      }
      
      res.json(transactions);
    } catch (error) {
      console.error("Transaction fetch error:", error);
      res.status(400).json({ message: "Invalid filter parameters" });
    }
  });

  // Create single transaction (protected route)
  app.post("/api/transactions", isAuthenticated, async (req, res) => {
    try {
      console.log("Received transaction data:", JSON.stringify(req.body, null, 2));
      const transaction = insertTransactionSchema.parse(req.body);
      const created = await storage.createTransaction(transaction);
      res.status(201).json(created);
    } catch (error) {
      console.error("Transaction validation error:", error);
      if (error instanceof ZodError) {
        res.status(400).json({ 
          message: "Invalid transaction data", 
          errors: error.errors 
        });
      } else {
        res.status(400).json({ message: "Invalid transaction data" });
      }
    }
  });

  // Create multiple transactions (bulk upload) (protected route)
  app.post("/api/transactions/bulk", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }
      
      const rawTransactions = z.array(z.any()).parse(req.body);
      console.log(`Bulk upload: Processing ${rawTransactions.length} transactions for user ${userId}`);
      
      // Add userId to each transaction before validation
      const transactionsWithUserId = rawTransactions.map(tx => ({
        ...tx,
        userId
      }));
      
      // Now validate with userId included
      const transactions = z.array(insertTransactionSchema).parse(transactionsWithUserId);
      
      const created = await storage.createTransactions(transactions);
      console.log(`Bulk upload: Successfully created ${created.length} transactions for user ${userId}`);
      
      // Enhanced Recurring Detection for Bulk Transactions
      console.log(`🔍 Running enhanced detection on ${created.length} bulk transactions...`);
      let enhancedCount = 0;
      
      for (const transaction of created) {
        try {
          const detectionResult = await enhancedRecurringDetection.detectRecurringTransaction(
            transaction.description,
            parseFloat(transaction.amount),
            userId,
            new Date(transaction.date)
          );
          
          if (detectionResult.isRecurring && detectionResult.merchant && detectionResult.finalConfidence > 0.7) {
            await storage.updateTransaction(transaction.id, {
              category: detectionResult.merchant.category,
              merchant: detectionResult.merchant.merchantName
            });
            enhancedCount++;
            console.log(`✅ Enhanced: "${transaction.description}" → ${detectionResult.merchant.merchantName} (${detectionResult.merchant.category})`);
          }
        } catch (detectionError) {
          // Continue processing other transactions if one fails
          console.warn(`Detection failed for transaction ${transaction.id}:`, detectionError);
        }
      }
      
      console.log(`🎯 Enhanced detection completed: ${enhancedCount}/${created.length} transactions updated`);
      
      // Apply automation rules to all newly created transactions
      try {
        const userRules = await storage.getAutomationRules(userId);
        if (userRules.length > 0) {
          console.log(`🤖 Applying automation rules to ${created.length} new transactions...`);
          const automationEngine = await import('./automationRulesEngine');
          const engine = new automationEngine.AutomationRulesEngine();
          const { updatedTransactions } = await engine.applyRulesToTransactions(created, userRules);
          
          // Update transactions that were modified by rules
          let rulesAppliedCount = 0;
          for (let i = 0; i < updatedTransactions.length; i++) {
            const transaction = updatedTransactions[i];
            const original = created[i];
            
            if (transaction.categoryId !== original.categoryId || 
                transaction.description !== original.description) {
              await storage.updateTransaction(transaction.id!, {
                categoryId: transaction.categoryId,
                category: transaction.category || original.category,
                description: transaction.description,
              });
              rulesAppliedCount++;
            }
          }
          
          if (rulesAppliedCount > 0) {
            console.log(`✅ Applied automation rules to ${rulesAppliedCount}/${created.length} transactions`);
          }
        }
      } catch (rulesError) {
        console.warn("Bulk automation rules failed, continuing without:", rulesError);
      }
      
      res.status(201).json(created);
    } catch (error) {
      console.error("Bulk upload validation error:", error);
      if (error instanceof ZodError) {
        res.status(400).json({ 
          message: "Invalid transaction data", 
          errors: error.errors 
        });
      } else {
        res.status(400).json({ message: "Invalid transaction data" });
      }
    }
  });

  // Create manual transaction (protected route)
  app.post("/api/transactions/manual", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }
      
      console.log("Received manual transaction data:", JSON.stringify(req.body, null, 2));
      
      // Add userId and generate unique ID for manual transaction
      const transactionData = {
        ...req.body,
        userId,
        externalTransactionId: null, // Manual transactions don't have external IDs
        isPending: false,
        source: req.body.source || "manual",
      };
      
      const transaction = insertTransactionSchema.parse(transactionData);
      let created = await storage.createTransaction(transaction);
      
      // Enhanced Recurring Detection Integration
      try {
        const detectionResult = await enhancedRecurringDetection.detectRecurringTransaction(
          transaction.description,
          parseFloat(transaction.amount),
          userId,
          new Date(transaction.date)
        );
        
        if (detectionResult.isRecurring && detectionResult.merchant) {
          console.log(`🔍 Enhanced Detection: "${transaction.description}" matched "${detectionResult.merchant.merchantName}" (${detectionResult.finalConfidence.toFixed(2)} confidence)`);
          
          // Update transaction with enhanced merchant information if confidence is high
          if (detectionResult.finalConfidence > 0.8) {
            created = await storage.updateTransaction(created.id, {
              category: detectionResult.merchant.category,
              merchant: detectionResult.merchant.merchantName
            }) || created;
            console.log(`✅ Auto-updated transaction with merchant info: ${detectionResult.merchant.merchantName} → ${detectionResult.merchant.category}`);
          }
        }
      } catch (detectionError) {
        console.warn("Enhanced detection failed, continuing without:", detectionError);
      }
      
      // Apply automation rules to the new transaction
      try {
        const userRules = await storage.getAutomationRules(userId);
        if (userRules.length > 0) {
          const automationEngine = await import('./automationRulesEngine');
          const engine = new automationEngine.AutomationRulesEngine();
          const { updatedTransaction } = await engine.applyRulesToTransaction(created, userRules);
          
          // Update transaction if rules were applied
          if (updatedTransaction.categoryId !== created.categoryId || 
              updatedTransaction.description !== created.description) {
            created = await storage.updateTransaction(created.id, {
              categoryId: updatedTransaction.categoryId,
              category: updatedTransaction.category || created.category,
              description: updatedTransaction.description,
            }) || created;
            console.log(`✅ Applied automation rules to new transaction: ${created.description}`);
          }
        }
      } catch (rulesError) {
        console.warn("Automation rules failed, continuing without:", rulesError);
      }
      
      console.log(`Manual transaction created successfully: ${created.id}`);
      res.status(201).json(created);
    } catch (error) {
      console.error("Manual transaction validation error:", error);
      if (error instanceof ZodError) {
        res.status(400).json({ 
          message: "Invalid transaction data", 
          errors: error.errors 
        });
      } else {
        res.status(400).json({ message: "Invalid transaction data" });
      }
    }
  });

  // Update transaction (protected route)
  app.patch("/api/transactions/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = getUserId(req);
      
      console.log(`Update transaction request - ID: ${id}, User: ${userId}`);
      console.log("Update data:", JSON.stringify(req.body, null, 2));
      
      // Validate the update data using more lenient schema
      const updates = updateTransactionSchema.parse(req.body);
      
      // Check if transaction belongs to user
      const existingTransaction = await storage.getTransaction(id);
      if (!existingTransaction || existingTransaction.userId !== userId) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      
      const updated = await storage.updateTransaction(id, updates);
      
      if (!updated) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      
      console.log(`Transaction ${id} updated successfully`);
      res.json(updated);
    } catch (error) {
      console.error("Transaction update error:", error);
      if (error instanceof ZodError) {
        console.error("Validation errors:", error.errors);
        res.status(400).json({ 
          message: "Invalid transaction data", 
          errors: error.errors 
        });
      } else {
        res.status(400).json({ message: "Invalid transaction data" });
      }
    }
  });

  // Bulk delete transactions (selected IDs or all)
  app.delete("/api/transactions/bulk-delete", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }

      const { transactionIds, deleteAll } = req.body;

      let deletedTransactions;
      
      if (deleteAll) {
        // Delete all transactions for the user
        deletedTransactions = await db
          .delete(transactions)
          .where(eq(transactions.userId, userId))
          .returning();
      } else if (transactionIds && Array.isArray(transactionIds) && transactionIds.length > 0) {
        // Delete selected transactions
        const { inArray } = await import("drizzle-orm");
        deletedTransactions = await db
          .delete(transactions)
          .where(
            and(
              eq(transactions.userId, userId),
              inArray(transactions.id, transactionIds)
            )
          )
          .returning();
      } else {
        return res.status(400).json({ message: "Either provide transactionIds array or set deleteAll to true" });
      }

      console.log(`Bulk deleted ${deletedTransactions.length} transactions for user ${userId}`);
      res.json({ 
        success: true, 
        deletedCount: deletedTransactions.length,
        deletedTransactions: deletedTransactions.map(t => ({ id: t.id, amount: t.amount, description: t.description }))
      });
    } catch (error) {
      console.error("Error bulk deleting transactions:", error);
      res.status(500).json({ message: "Failed to bulk delete transactions" });
    }
  });

  // Get unique merchants from transactions (protected route)
  app.get("/api/transactions/merchants", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      // Get unique merchants and descriptions from user's transactions
      const userTransactions = await db
        .select({ 
          merchant: transactions.merchant, 
          description: transactions.description,
          source: transactions.source,
        })
        .from(transactions)
        .where(eq(transactions.userId, userId));

      // Create a map to group similar merchants
      const merchantGroups = new Map<string, {
        name: string;
        count: number;
        sources: Set<string>;
        isFromPlaid: boolean;
      }>();

      userTransactions.forEach(tx => {
        // Use merchant name if available (from Plaid), otherwise use description
        const merchantName = tx.merchant || tx.description;
        if (!merchantName || merchantName.trim() === "") return;

        // Clean up the merchant name for grouping
        const cleanedName = merchantName.trim();
        
        // Group similar merchants (case-insensitive)
        let groupKey = cleanedName.toLowerCase();
        
        // Find existing group with similar name
        let existingGroup = null;
        for (const [key, group] of merchantGroups) {
          if (key === groupKey || 
              key.includes(groupKey) || 
              groupKey.includes(key) ||
              // Check for partial matches for common merchants
              (key.includes('spotify') && groupKey.includes('spotify')) ||
              (key.includes('starbucks') && groupKey.includes('starbucks')) ||
              (key.includes('mcdonald') && groupKey.includes('mcdonald')) ||
              (key.includes('walmart') && groupKey.includes('walmart')) ||
              (key.includes('amazon') && groupKey.includes('amazon')) ||
              (key.includes('netflix') && groupKey.includes('netflix')) ||
              (key.includes('uber') && groupKey.includes('uber'))) {
            existingGroup = { key, group };
            break;
          }
        }

        if (existingGroup) {
          // Update existing group
          existingGroup.group.count++;
          existingGroup.group.sources.add(tx.source || 'manual');
          // Prefer Plaid merchant names over descriptions
          if (tx.merchant && tx.source === 'plaid') {
            existingGroup.group.name = tx.merchant;
            existingGroup.group.isFromPlaid = true;
          }
        } else {
          // Create new group
          merchantGroups.set(groupKey, {
            name: cleanedName,
            count: 1,
            sources: new Set([tx.source || 'manual']),
            isFromPlaid: tx.source === 'plaid' && !!tx.merchant
          });
        }
      });

      // Convert to array and sort alphabetically (users expect alphabetical order for filtering)
      const merchants = Array.from(merchantGroups.values())
        .map(group => {
          // Ensure proper capitalization for better readability
          const words = group.name.split(' ');
          const capitalizedName = words.map(word => {
            // Keep all caps words as-is (like "USA", "LLC", "ATM")
            if (word.match(/^[A-Z]{2,}$/)) return word;
            // Capitalize first letter of other words
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
          }).join(' ');
          
          return {
            ...group,
            name: capitalizedName
          };
        })
        .sort((a, b) => {
          // Primary sort: alphabetically for easy scanning
          return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
        })
        .map(group => group.name)
        .slice(0, 100); // Increased limit for better filtering

      console.log(`Returning ${merchants.length} unique merchants for user ${userId} (grouped from ${userTransactions.length} transactions)`);
      res.json(merchants);
    } catch (error) {
      console.error("Error fetching merchants:", error);
      res.status(500).json({ error: "Failed to fetch merchants" });
    }
  });

  // Get transactions that need review (protected route)
  app.get("/api/transactions/review", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      
      console.log(`Transactions API: Getting review transactions for user ${userId}`);
      const reviewTransactions = await getTransactionsNeedingReview(userId);
      console.log(`Transactions API: Returning ${reviewTransactions.length} review transactions for user ${userId}`);
      res.json(reviewTransactions);
    } catch (error) {
      console.error("Error getting review transactions:", error);
      res.status(500).json({ error: "Failed to get review transactions" });
    }
  });

  // Delete transaction (protected route)
  app.delete("/api/transactions/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteTransaction(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete transaction" });
    }
  });

  // Get financial summary (protected route)
  app.get("/api/analytics/summary", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }
      
      const { startDate, endDate } = req.query;
      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;
      
      const summary = await storage.getFinancialSummary(userId, start, end);
      res.json(summary);
    } catch (error) {
      res.status(400).json({ message: "Invalid date parameters" });
    }
  });

  // Get category breakdown (protected route)
  app.get("/api/analytics/categories", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }
      
      const { type } = req.query;
      const transactionType = type === "income" || type === "expense" ? type : undefined;
      
      const breakdown = await storage.getCategoryBreakdown(userId, transactionType);
      res.json(breakdown);
    } catch (error) {
      res.status(500).json({ message: "Failed to get category breakdown" });
    }
  });

  // Get all categories (protected route)
  app.get("/api/categories", isAuthenticated, async (req, res) => {
    try {
      // Updated categories with smart categorization system
      const categories = [
        "Bills & Utilities", "Bills & Insurance", "Bills & Government",
        "Groceries", "Food & Drink", "Auto & Transport",
        "Travel & Vacation", "Shopping", "Medical & Healthcare", "Finance & Payments",
        "Health & Wellness", "Education & Learning", "Hosting/DevOps", "Pets",
        "Family Care", "Gifts", "Reimbursement", "Savings Transfer", "Investment", "Income", "Other"
      ];
      
      // Return both database categories and new taxonomy categories
      const dbCategories = await storage.getCategories();
      const combinedCategories = Array.from(new Set([...dbCategories.map(c => c.name), ...categories]));
      
      res.json(combinedCategories.map(name => ({ name })));
    } catch (error) {
      res.status(500).json({ message: "Failed to get categories" });
    }
  });

  // Re-categorize existing transactions endpoint
  app.post("/api/transactions/recategorize", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }

      const { TransactionCategorizer } = await import('../shared/categories');
      const categorizer = new TransactionCategorizer();
      
      // Get all user transactions
      const transactions = await storage.getTransactions(userId);
      let updatedCount = 0;
      
      for (const transaction of transactions) {
        // Use rawAmount for categorization logic as it preserves the sign
        const amountForCategorization = transaction.rawAmount ? 
          parseFloat(transaction.rawAmount) : 
          (transaction.type === 'expense' ? -Math.abs(parseFloat(transaction.amount)) : parseFloat(transaction.amount));
          
        const categorization = categorizer.categorize(
          transaction.description,
          amountForCategorization,
          transaction.merchant || undefined
        );

        // Check for specific fixes we want to force
        const isUberLyftFix = transaction.category === 'Tips/Gig' && categorization.category === 'Auto & Transport';
        console.log(`Analyzing transaction: "${transaction.description}" | Current: "${transaction.category}" | Suggested: "${categorization.category}" | Confidence: ${categorization.confidence} | Type: ${categorization.type} | Amount: ${amountForCategorization} | UberLyftFix: ${isUberLyftFix}`);

        // Update if:
        // 1. Transaction has no category or generic category, OR
        // 2. New categorization is different from current (for specific fixes), OR  
        // 3. We want to fix specific mismatches (Tips/Gig → Transport > Rideshare)
        const hasGenericCategory = !transaction.category || 
          transaction.category === 'Other' || 
          transaction.category === 'Uncategorized' ||
          transaction.category.startsWith('Food & Drink') ||
          transaction.category.startsWith('Auto & Transport') ||
          transaction.category.startsWith('Transportation');
        
        const shouldUpdate = hasGenericCategory || isUberLyftFix || (
          categorization.confidence > 0.05 && 
          categorization.category !== transaction.category
        );

        if (shouldUpdate) {
          await storage.updateTransaction(transaction.id, {
            category: categorization.category
          });
          updatedCount++;
          console.log(`✅ Updated: "${transaction.description}" → "${categorization.category}"`);
        } else {
          console.log(`⏭️  Skipped: "${transaction.description}" | shouldUpdate: ${shouldUpdate} | confidence: ${categorization.confidence}`);
        }
      }

      res.json({ 
        success: true, 
        message: `Re-categorized ${updatedCount} transactions`,
        updatedCount 
      });
    } catch (error) {
      console.error('Re-categorization error:', error);
      res.status(500).json({ message: "Failed to re-categorize transactions" });
    }
  });

  // Enhanced categorization testing endpoint (admin only)
  app.post("/api/admin/test-enhanced-categorization", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const user = await storage.getUser(userId);
      
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      // Get transactions to test (limit to 50 for testing)
      const transactions = await storage.getTransactions(userId, { limit: 50 });
      console.log(`🧪 Testing enhanced categorization on ${transactions.length} transactions`);

      const { enhancedCategorizer } = await import('./enhancedCategorizer');
      
      const results = [];
      let plaidCount = 0;
      let merchantCount = 0;
      let keywordCount = 0;
      let uncategorizedCount = 0;
      
      // Test categorization on each transaction
      for (const transaction of transactions) {
        const match = await enhancedCategorizer.categorizeTransaction({
          id: transaction.id,
          description: transaction.description || '',
          merchant: transaction.merchant,
          source: transaction.source || 'manual',
          personalFinanceCategoryPrimary: transaction.personalFinanceCategoryPrimary,
          personalFinanceCategoryDetailed: transaction.personalFinanceCategoryDetailed,
          personalFinanceCategoryConfidence: transaction.personalFinanceCategoryConfidence,
        });

        if (match) {
          switch (match.source) {
            case 'plaid': plaidCount++; break;
            case 'merchant': merchantCount++; break;
            case 'keyword': keywordCount++; break;
            case 'uncategorized': uncategorizedCount++; break;
          }

          results.push({
            transactionId: transaction.id,
            description: transaction.description,
            currentCategory: transaction.category,
            currentCategoryId: transaction.categoryId,
            enhancedCategory: match.categoryName,
            enhancedSubcategory: match.subcategory,
            enhancedCategoryId: match.categoryId,
            confidence: match.confidence,
            source: match.source,
            budgetType: match.budgetType,
            ledgerType: match.ledgerType,
            merchant: transaction.merchant,
            plaidPrimary: transaction.personalFinanceCategoryPrimary,
            plaidDetailed: transaction.personalFinanceCategoryDetailed,
          });
        }
      }

      const stats = {
        total: transactions.length,
        plaidCategorized: plaidCount,
        merchantCategorized: merchantCount,
        keywordCategorized: keywordCount,
        uncategorized: uncategorizedCount,
        averageConfidence: results.length > 0 
          ? results.reduce((sum, r) => sum + r.confidence, 0) / results.length 
          : 0,
      };

      console.log(`📊 Enhanced categorization test results:`, stats);

      res.json({ 
        success: true, 
        results,
        stats,
        message: `Tested enhanced categorization on ${transactions.length} transactions`
      });
    } catch (error) {
      console.error('Enhanced categorization test error:', error);
      res.status(500).json({ message: "Failed to test enhanced categorization" });
    }
  });

  // Apply enhanced categorization to transactions (admin only)
  app.post("/api/admin/apply-enhanced-categorization", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const user = await storage.getUser(userId);
      
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      // Get all transactions for the user
      const transactions = await storage.getTransactions(userId);
      console.log(`🔄 Starting enhanced categorization for ${transactions.length} transactions`);

      const { enhancedCategorizer } = await import('./enhancedCategorizer');
      
      let updatedCount = 0;
      
      // Process each transaction
      for (const transaction of transactions) {
        // Only recategorize if not already using admin category ID or is uncategorized
        if (!transaction.categoryId || transaction.category === 'Uncategorized' || transaction.category === 'Other') {
          const match = await enhancedCategorizer.categorizeTransaction({
            id: transaction.id,
            description: transaction.description || '',
            merchant: transaction.merchant,
            source: transaction.source || 'manual',
            personalFinanceCategoryPrimary: transaction.personalFinanceCategoryPrimary,
            personalFinanceCategoryDetailed: transaction.personalFinanceCategoryDetailed,
            personalFinanceCategoryConfidence: transaction.personalFinanceCategoryConfidence,
          });

          if (match && match.categoryId) {
            await storage.updateTransaction(transaction.id, {
              categoryId: match.categoryId,
              category: match.subcategory || match.categoryName
            });
            updatedCount++;
            console.log(`✅ Enhanced: "${transaction.description}" → "${match.categoryName}${match.subcategory ? ` > ${match.subcategory}` : ''}" (${match.source})`);
          }
        }
      }

      res.json({ 
        success: true, 
        message: `Enhanced categorization applied to ${updatedCount} transactions`,
        updatedCount 
      });
    } catch (error) {
      console.error('Enhanced categorization error:', error);
      res.status(500).json({ message: "Failed to apply enhanced categorization" });
    }
  });

  // Mark onboarding as completed
  app.post("/api/user/onboarding-complete", isAuthenticated, async (req, res) => {
    try {
      // Use session-based userId like other endpoints
      const userId = (req.session as any).userId;
      if (!userId) {
        return res.status(401).json({ message: "User ID not found in session" });
      }
      console.log(`Attempting to complete onboarding for session user: ${userId}`);
      await storage.updateUserOnboarding(userId, true);
      res.json({ success: true });
    } catch (error) {
      console.error('Onboarding completion error:', error);
      res.status(500).json({ message: "Failed to complete onboarding" });
    }
  });

  

  // Budget plan routes
  app.get('/api/budget/plan', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: 'User ID not found' });
      const month = req.query.month as string;
      if (!month) return res.status(400).json({ message: 'month required' });
      const plan = await storage.getBudgetPlan(userId, month);
      if (!plan) return res.status(404).json({ message: 'Plan not found' });
      res.json(plan);
    } catch (error: any) {
      if (error?.message?.includes('budget_plans') || error?.code === 'ECONNREFUSED') {
        res.status(404).json({ message: 'Plan not found' });
      } else {
        res.status(500).json({ message: 'Failed to get budget plan' });
      }
    }
  });

  app.post('/api/budget/plan', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: 'User ID not found' });
      const data = insertBudgetPlanSchema.parse(req.body);
      // Ensure numeric fields are valid numbers to avoid NaN values causing database errors
      const earnings = Number(data.expectedEarnings) || 0;
      const bills = Number(data.expectedBills) || 0;
      const rate = Number(data.savingsRate) || 0
      const savingsReserve = earnings * rate / 100;
      const spendingBudget = earnings - bills - savingsReserve;
      const created = await storage.upsertBudgetPlan({
        ...data,
        userId,
        expectedEarnings: earnings,
        expectedBills: bills,
        savingsRate: rate,
        savingsReserve,
        spendingBudget,
      });
      res.status(201).json(created);
    } catch (error) {
      console.error('Failed to create budget plan:', error);
      if (error instanceof ZodError) {
        res.status(400).json({ message: 'Invalid budget plan data', errors: error.errors, error: error.message });
      } else {
        const message = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ message: 'Failed to create budget plan', error: message });
      }
    }
  });

  

  app.patch('/api/budget/plan/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const data = insertBudgetPlanSchema.partial().parse(req.body);
      let updates: any = { ...data };
      if (data.expectedEarnings !== undefined || data.expectedBills !== undefined || data.savingsRate !== undefined) {
        // Normalize values to prevent NaN from propagating to the database
        const earnings = Number(data.expectedEarnings ?? 0) || 0;
        const bills = Number(data.expectedBills ?? 0) || 0;
        const rate = Number(data.savingsRate ?? 0) || 0;
        const savingsReserve = earnings * rate / 100;
        const spendingBudget = earnings - bills - savingsReserve;
        updates = {
          ...updates,
          expectedEarnings: data.expectedEarnings !== undefined ? earnings : undefined,
          expectedBills: data.expectedBills !== undefined ? bills : undefined,
          savingsRate: data.savingsRate !== undefined ? rate : undefined,
          savingsReserve,
          spendingBudget,
        };
      }
      const updated = await storage.updateBudgetPlan(id, updates);
      if (!updated) return res.status(404).json({ message: 'Plan not found' });
      res.json(updated);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: 'Invalid budget plan data', errors: error.errors });
      } else {
        res.status(500).json({ message: 'Failed to update budget plan' });
      }
    }
  });

  app.get('/api/budget/income/estimate', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: 'User ID not found' });
      const months = parseInt((req.query.months as string) || '3');
      const data = await storage.getIncomeEstimate(userId, months);
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: 'Failed to estimate income' });
    }
  });

  app.get('/api/budget/bills/estimate', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: 'User ID not found' });
      const months = parseInt((req.query.months as string) || '3');
      const data = await storage.getBillsEstimate(userId, months);
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: 'Failed to estimate bills' });
    }
  });

  
  // Budget routes
  app.get("/api/budgets", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const budgets = await storage.getBudgets(userId);
      res.json(budgets);
    } catch (error) {
      res.status(500).json({ message: "Failed to get budgets" });
    }
  });

  app.post("/api/budgets", isAuthenticated, async (req, res) => {
    try {
      const budget = insertBudgetSchema.parse(req.body);
      const userId = (req.session as any).userId;
      const created = await storage.createBudget({ ...budget, userId });
      res.status(201).json(created);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ 
          message: "Invalid budget data", 
          errors: error.errors 
        });
      } else {
        res.status(400).json({ message: "Invalid budget data" });
      }
    }
  });




  app.patch("/api/budgets/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = insertBudgetSchema.partial().parse(req.body);
      const updated = await storage.updateBudget(id, updates);
      
      if (!updated) {
        return res.status(404).json({ message: "Budget not found" });
      }
      
      res.json(updated);
    } catch (error) {
      res.status(400).json({ message: "Invalid budget data" });
    }
  });

  app.delete("/api/budgets/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteBudget(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Budget not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete budget" });
    }
  });

  // Goal routes
  app.get("/api/goals", async (req, res) => {
    try {
      const goals = await storage.getGoals();
      res.json(goals);
    } catch (error) {
      res.status(500).json({ message: "Failed to get goals" });
    }
  });

  app.post("/api/goals", async (req, res) => {
    try {
      const goal = insertGoalSchema.parse(req.body);
      const created = await storage.createGoal(goal);
      res.status(201).json(created);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ 
          message: "Invalid goal data", 
          errors: error.errors 
        });
      } else {
        res.status(400).json({ message: "Invalid goal data" });
      }
    }
  });

  app.patch("/api/goals/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = insertGoalSchema.partial().parse(req.body);
      const updated = await storage.updateGoal(id, updates);
      
      if (!updated) {
        return res.status(404).json({ message: "Goal not found" });
      }
      
      res.json(updated);
    } catch (error) {
      res.status(400).json({ message: "Invalid goal data" });
    }
  });

  app.delete("/api/goals/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteGoal(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Goal not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete goal" });
    }
  });

  // Institution routes
  app.get("/api/institutions", async (req, res) => {
    try {
      const institutions = await storage.getInstitutions();
      res.json(institutions);
    } catch (error) {
      res.status(500).json({ message: "Failed to get institutions" });
    }
  });

  app.post("/api/institutions", isAuthenticated, async (req, res) => {
    try {
      const institution = insertInstitutionSchema.parse(req.body);
      const created = await storage.createInstitution(institution);
      res.status(201).json(created);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ 
          message: "Invalid institution data", 
          errors: error.errors 
        });
      } else {
        res.status(400).json({ message: "Invalid institution data" });
      }
    }
  });

  // Account routes (protected)
  app.get("/api/accounts", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }
      const accounts = await storage.getAccounts(userId);
      res.json(accounts);
    } catch (error) {
      console.error("Error getting accounts:", error);
      res.status(500).json({ message: "Failed to get accounts" });
    }
  });

  app.post("/api/accounts", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const account = insertAccountSchema.parse({
        ...req.body,
        userId
      });
      const created = await storage.createAccount(account);
      res.status(201).json(created);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ 
          message: "Invalid account data", 
          errors: error.errors 
        });
      } else {
        res.status(400).json({ message: "Invalid account data" });
      }
    }
  });

  app.patch("/api/accounts/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = insertAccountSchema.partial().parse(req.body);
      const updated = await storage.updateAccount(id, updates);
      
      if (!updated) {
        return res.status(404).json({ message: "Account not found" });
      }
      
      res.json(updated);
    } catch (error) {
      res.status(400).json({ message: "Invalid account data" });
    }
  });

  app.delete("/api/accounts/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteAccount(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Account not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete account" });
    }
  });

  // Account sync route
  app.post("/api/accounts/:id/sync", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const result = await storage.syncAccount(id);
      res.json(result);
    } catch (error) {
      console.error('Account sync error:', error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to sync account" 
      });
    }
  });

  // Sync all connected accounts
  app.post("/api/accounts/sync-all", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const accounts = await storage.getAccounts(userId);
      const plaidAccounts = accounts.filter(acc => acc.connectionSource === 'plaid' && acc.accessToken);
      
      const syncResults = [];
      for (const account of plaidAccounts) {
        try {
          const result = await storage.syncAccount(account.id);
          syncResults.push({ accountId: account.id, success: true, result });
        } catch (error) {
          console.error(`Failed to sync account ${account.id}:`, error);
          syncResults.push({ accountId: account.id, success: false, error: (error as Error).message });
        }
      }
      
      res.json({ 
        success: true, 
        syncedAccounts: syncResults.length,
        results: syncResults 
      });
    } catch (error) {
      console.error('Bulk sync error:', error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to sync accounts" 
      });
    }
  });

  // Get last synced timestamp for user's accounts
  app.get("/api/accounts/last-synced", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const accounts = await storage.getAccounts(userId);
      const lastSyncAt = accounts.reduce<Date | null>((latest, acc) => {
        const date = acc.lastSyncAt ? new Date(acc.lastSyncAt) : null;
        return date && (!latest || date > latest) ? date : latest;
      }, null);

      res.json({ lastSyncedAt: lastSyncAt ? lastSyncAt.toISOString() : null });
    } catch (error) {
      console.error('Error fetching last synced time:', error);
      res.status(500).json({ error: 'Failed to fetch last synced time' });
    }
  });

  
  
  // Accounts overview endpoint - returns grouped account data
  app.get("/api/accounts/overview", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }
      
      const accounts = await storage.getAccounts(userId);
      
      // Group accounts by type and create overview structure
      let groups: any[] = [];

      // Group checking accounts
      const checkingAccounts = accounts.filter(
        (acc) => acc.type === "depository" && acc.subtype === "checking"
      );
      let checkingGroup: any | undefined = undefined;
      if (checkingAccounts.length > 0) {
        checkingGroup = {
          id: "checking",
          label: "Checking",
          total: checkingAccounts.reduce(
            (sum, acc) => sum + parseFloat(acc.availableBalance || "0"),
            0
          ),
          children: checkingAccounts.map((acc) => ({
            id: acc.id,
            name: acc.name,
            subtitle: acc.institutionName,
            amount: parseFloat(acc.availableBalance || "0"),
            mask: acc.mask,
            officialName: acc.officialName,
            institutionName: acc.institutionName,
          })),
          tone: "default",
        };
      }

      // Group credit cards
      const creditCards = accounts.filter((acc) => acc.type === "credit");
      let creditGroup: any | undefined = undefined;
      if (creditCards.length > 0) {
        creditGroup = {
          id: "creditCards",
          label: "Credit Cards",
          total: creditCards.reduce(
            (sum, acc) => sum + parseFloat(acc.currentBalance || "0"),
            0
          ),
          children: creditCards.map((acc) => ({
            id: acc.id,
            name: acc.name,
            subtitle: acc.institutionName,
            amount: parseFloat(acc.currentBalance || "0"),
            mask: acc.mask,
            officialName: acc.officialName,
            institutionName: acc.institutionName,
          })),
          tone: "negative",
        };
      }

      // Group savings accounts
      const savingsAccounts = accounts.filter(
        (acc) => acc.type === "depository" && acc.subtype === "savings"
      );
      let savingsGroup: any | undefined = undefined;
      if (savingsAccounts.length > 0) {
        savingsGroup = {
          id: "savings",
          label: "Savings",
          total: savingsAccounts.reduce(
            (sum, acc) => sum + parseFloat(acc.availableBalance || "0"),
            0
          ),
          children: savingsAccounts.map((acc) => ({
            id: acc.id,
            name: acc.name,
            subtitle: acc.institutionName,
            amount: parseFloat(acc.availableBalance || "0"),
            mask: acc.mask,
            officialName: acc.officialName,
            institutionName: acc.institutionName,
          })),
          tone: "positive",
        };
      }

      // Group investment accounts (always include even if empty)
      const investmentAccounts = accounts.filter(
        (acc) => acc.type === "investment"
      );
      const investmentsGroup = {
        id: "investments",
        label: "Investments",
        total: investmentAccounts.reduce(
          (sum, acc) => sum + parseFloat(acc.currentBalance || "0"),
          0
        ),
        children: investmentAccounts.map((acc) => ({
          id: acc.id,
          name: acc.name,
          subtitle: acc.institutionName,
          amount: parseFloat(acc.currentBalance || "0"),
          mask: acc.mask,
          officialName: acc.officialName,
          institutionName: acc.institutionName,
        })),
        tone: "positive",
      };

      // Calculate net cash
      const totalChecking = checkingAccounts.reduce(
        (sum, acc) => sum + parseFloat(acc.availableBalance || "0"),
        0
      );
      const totalSavings = savingsAccounts.reduce(
        (sum, acc) => sum + parseFloat(acc.availableBalance || "0"),
        0
      );
      const totalCredit = creditCards.reduce(
        (sum, acc) => sum + parseFloat(acc.currentBalance || "0"),
        0
      );
      const netCash = totalChecking + totalSavings - Math.abs(totalCredit);

      // Assemble groups in the required order
      const order = [
        "checking",
        "creditCards",
        "netCash",
        "savings",
        "investments",
      ];
      const idx = (id: string) => {
        const i = order.indexOf(id);
        return i === -1 ? order.length : i;
      };

      groups = [
        checkingGroup,
        creditGroup,
        accounts.length > 0
          ? {
              id: "netCash",
              label: "Net Cash",
              total: netCash,
              tone: netCash >= 0 ? "positive" : "negative",
            }
          : null,
        savingsGroup,
        investmentsGroup,
      ]
        .filter(Boolean)
        .sort((a, b) => idx(a.id) - idx(b.id));

      res.json({ groups });
    } catch (error) {
      console.error("Error getting accounts overview:", error);
      res.status(500).json({ message: "Failed to get accounts overview" });
    }
  });

  // Plaid Link Token endpoint
  app.post("/api/plaid/link_token", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      console.log('🔗 Creating Plaid link token for user:', userId);
      console.log('🌍 Environment check:', {
        NODE_ENV: process.env.NODE_ENV,
        REPLIT_DEPLOYMENT: process.env.REPLIT_DEPLOYMENT,
        isProduction: process.env.NODE_ENV === 'production' || process.env.REPLIT_DEPLOYMENT === 'true'
      });
      
      // Import Plaid client and verify configuration
      let plaidClient, PLAID_PRODUCTS, PLAID_COUNTRY_CODES;
      try {
        const plaidModule = await import('./plaidClient');
        plaidClient = plaidModule.plaidClient;
        PLAID_PRODUCTS = plaidModule.PLAID_PRODUCTS;
        PLAID_COUNTRY_CODES = plaidModule.PLAID_COUNTRY_CODES;
        console.log('✅ Plaid client imported successfully');
      } catch (importError) {
        console.error('❌ Failed to import Plaid client:', importError);
        return res.status(500).json({ 
          error: 'Plaid configuration error. Please check your API credentials.',
          details: 'Failed to initialize Plaid client'
        });
      }
      
      // Determine if we're in production environment
      const isProduction = process.env.NODE_ENV === 'production' || process.env.REPLIT_DEPLOYMENT === 'true';
      
      // Use more conservative product set for production
      const products = isProduction 
        ? [PLAID_PRODUCTS[0]] // Just Transactions for production
        : PLAID_PRODUCTS;
      
      const linkTokenRequest = {
        user: { client_user_id: userId || 'anonymous' },
        client_name: "BudgetHero",
        products: products,
        country_codes: PLAID_COUNTRY_CODES,
        language: 'en' as const,
        // Add webhook for production environments
        ...(isProduction && { webhook: 'https://budgetheroapp.com/api/plaid/webhook' }),
      };
      
      console.log('📤 Plaid link token request:', JSON.stringify(linkTokenRequest, null, 2));
      
      const response = await plaidClient.linkTokenCreate(linkTokenRequest);
      
      console.log('✅ Plaid link token created successfully');
      res.json({ link_token: response.data.link_token });
    } catch (error: any) {
      console.error('❌ Link token creation error:', error);
      console.error('🔍 Detailed error information:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        response: error?.response?.data,
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        config: error?.config ? {
          url: error.config.url,
          method: error.config.method,
          headers: error.config.headers
        } : undefined
      });
      
      // Return specific error information with clearer messaging
      let errorMessage = 'Failed to create link token';
      let errorDetails = '';
      
      if (error?.response?.data) {
        const plaidError = error.response.data;
        errorMessage = plaidError.error_message || plaidError.display_message || errorMessage;
        errorDetails = `Plaid Error: ${plaidError.error_type} - ${plaidError.error_code}`;
      } else if (error?.message) {
        errorMessage = error.message;
        if (error.message.includes('credentials')) {
          errorDetails = 'Please check your Plaid API credentials';
        }
      }
      
      const statusCode = error?.response?.status === 400 ? 400 : 500;
      
      res.status(statusCode).json({ 
        error: errorMessage,
        details: errorDetails,
        code: error?.response?.data?.error_code,
        type: error?.response?.data?.error_type,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Sync account balance
  app.post("/api/accounts/:id/sync", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = getUserId(req);
      const account = await storage.getAccount(id);
      
      if (!account || account.userId !== userId) {
        return res.status(404).json({ message: "Account not found" });
      }

      // Simulate balance update with small random change
      const currentBalance = parseFloat(account.balance) || 0;
      const change = (Math.random() - 0.5) * 100; // Random change between -50 and +50
      const newBalance = Math.max(0, currentBalance + change);
      
      const updatedAccount = await storage.updateAccount(id, {
        balance: newBalance.toString(),
        lastSynced: new Date().toISOString(),
      });

      res.json(updatedAccount);
    } catch (error) {
      console.error('Error syncing account:', error);
      res.status(500).json({ message: "Failed to sync account" });
    }
  });

  // Delete account
  app.delete("/api/accounts/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = getUserId(req);
      const account = await storage.getAccount(id);
      
      if (!account || account.userId !== userId) {
        return res.status(404).json({ message: "Account not found" });
      }

      await storage.deleteAccount(id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting account:', error);
      res.status(500).json({ message: "Failed to delete account" });
    }
  });

  // Demo bank linking for development
  app.post("/api/plaid/link-account", isAuthenticated, async (req, res) => {
    try {
      const { bankId } = req.body;
      const userId = getUserId(req);
      
      // Create a demo account for the selected bank
      const bankNames: Record<string, string> = {
        chase: 'Chase Bank',
        bofa: 'Bank of America',
        wells: 'Wells Fargo',
        citi: 'Citibank',
        usbank: 'U.S. Bank',
        pnc: 'PNC Bank',
        td: 'TD Bank',
        capital: 'Capital One',
      };

      const accountTypes = ['checking', 'savings', 'credit'];
      const randomType = accountTypes[Math.floor(Math.random() * accountTypes.length)];
      const randomBalance = Math.floor(Math.random() * 50000) + 1000;
      
      const newAccount = {
        userId,
        plaidAccountId: `demo_${bankId}_${Date.now()}`,
        plaidItemId: `item_${bankId}_${Date.now()}`,
        name: `${bankNames[bankId]} ${randomType.charAt(0).toUpperCase() + randomType.slice(1)}`,
        officialName: `${bankNames[bankId]} ${randomType} Account`,
        type: randomType,
        subtype: randomType,
        institutionName: bankNames[bankId],
        balance: randomBalance.toString(),
        isActive: true,
        lastSynced: new Date().toISOString(),
      };

      const account = await storage.createAccount(newAccount);
      res.status(201).json(account);
    } catch (error) {
      console.error('Error linking account:', error);
      res.status(500).json({ message: "Failed to link account" });
    }
  });

  // Exchange public token for access token
  app.post("/api/plaid/exchange_public_token", isAuthenticated, async (req, res) => {
    try {
      const { public_token } = req.body;
      const userId = getUserId(req);
      const { plaidClient } = await import('./plaidClient');
      
      const response = await plaidClient.itemPublicTokenExchange({
        public_token,
      });

      const accessToken = response.data.access_token;
      
      // Get account info from Plaid
      const accountsResponse = await plaidClient.accountsGet({
        access_token: accessToken,
      });

      // Store accounts in database
      const createdAccounts = [];
      for (const plaidAccount of accountsResponse.data.accounts) {
        const account = await storage.createAccount({
          userId,
          externalAccountId: plaidAccount.account_id,
          accessToken,
          plaidAccountId: plaidAccount.account_id,
          name: plaidAccount.name,
          officialName: plaidAccount.official_name || plaidAccount.name,
          type: plaidAccount.type,
          subtype: plaidAccount.subtype || null,
          mask: plaidAccount.mask || null,
          currentBalance: plaidAccount.balances.current?.toString() || null,
          availableBalance: plaidAccount.balances.available?.toString() || null,
          connectionSource: 'plaid',
        });
        createdAccounts.push(account);
        
        // Automatically sync transactions for the new account
        try {
          await storage.syncAccount(account.id);
        } catch (syncError) {
          console.error('Failed to sync new account:', syncError);
        }
      }

      res.json({ accounts: createdAccounts });
    } catch (error) {
      console.error('Token exchange error:', error);
      res.status(500).json({ error: "Failed to exchange token" });
    }
  });

  // Sync all accounts for the current user
  app.post("/api/accounts/sync-all", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      const accounts = await storage.getAccounts(userId);
      const results = [];
      
      for (const account of accounts) {
        if (account.accessToken) {
          console.log(`Syncing account: ${account.name} (${account.mask})`);
          const result = await storage.syncAccount(account.id);
          results.push({ accountName: account.name, result });
        } else {
          results.push({ accountName: account.name, result: { success: false, message: "No access token" }});
        }
      }
      
      res.json({ success: true, results });
    } catch (error) {
      console.error("Error syncing all accounts:", error);
      res.status(500).json({ error: "Failed to sync accounts" });
    }
  });

  // Plaid webhook endpoint
  app.post("/api/plaid/webhook", async (req, res) => {
    try {
      const { webhook_type, webhook_code, item_id } = req.body;
      
      console.log('Plaid webhook received:', { webhook_type, webhook_code, item_id });
      
      // Handle different webhook types
      switch (webhook_type) {
        case 'TRANSACTIONS':
          if (webhook_code === 'DEFAULT_UPDATE' || webhook_code === 'INITIAL_UPDATE') {
            // Find accounts with this item_id and sync them
            const accounts = await storage.getAccountsByItemId(item_id);
            for (const account of accounts) {
              try {
                await storage.syncAccount(account.id);
                console.log(`Synced account ${account.id} for item ${item_id}`);
              } catch (syncError) {
                console.error(`Failed to sync account ${account.id}:`, syncError);
              }
            }
          }
          break;
        case 'ITEM':
          console.log(`Item webhook: ${webhook_code} for item ${item_id}`);
          break;
        default:
          console.log(`Unhandled webhook type: ${webhook_type}`);
      }
      
      res.status(200).json({ status: 'received' });
    } catch (error) {
      console.error('Webhook processing error:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  });

  // Sync Digest API endpoints
  app.get("/api/sync/digest", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }

      const { SyncDigestService, EventLogger } = await import("./syncDigest");
      const digest = await SyncDigestService.getSyncDigest(userId);
      await EventLogger.logDigestViewed(userId);
      
      res.json(digest);
    } catch (error) {
      console.error("Error fetching sync digest:", error);
      res.status(500).json({ message: "Failed to fetch sync digest" });
    }
  });

  app.get("/api/sync/apy-opportunities", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }

      const { SyncDigestService, EventLogger } = await import("./syncDigest");
      const opportunities = await SyncDigestService.getApyOpportunities(userId);
      await EventLogger.logTileView(userId, "apy");
      
      res.json(opportunities);
    } catch (error) {
      console.error("Error fetching APY opportunities:", error);
      res.status(500).json({ message: "Failed to fetch APY opportunities" });
    }
  });

  app.get("/api/sync/bills-subscriptions", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }

      const { SyncDigestService, EventLogger } = await import("./syncDigest");
      const billsData = await SyncDigestService.getBillsAndSubscriptions(userId);
      await EventLogger.logTileView(userId, "bills");
      
      res.json(billsData);
    } catch (error) {
      console.error("Error fetching bills and subscriptions:", error);
      res.status(500).json({ message: "Failed to fetch bills and subscriptions" });
    }
  });

  app.post("/api/sync/retry/:institutionId", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const institutionId = req.params.institutionId;
      
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }

      const { SyncDigestService, EventLogger } = await import("./syncDigest");
      await SyncDigestService.scheduleRetry(userId, institutionId);
      await EventLogger.logEvent({
        userId,
        institutionId,
        eventType: "retry_scheduled",
        success: true,
        eventData: { action: "manual_retry" },
      });
      
      res.json({ message: "Retry scheduled successfully" });
    } catch (error) {
      console.error("Error scheduling retry:", error);
      res.status(500).json({ message: "Failed to schedule retry" });
    }
  });

  app.post("/api/events/tile-click", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const { tileType } = req.body;
      
      if (!userId || !tileType) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const { EventLogger } = await import("./syncDigest");
      await EventLogger.logTileClick(userId, tileType);
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error logging tile click:", error);
      res.status(500).json({ message: "Failed to log tile click" });
    }
  });

  // Enhanced Recurring Transactions API Routes with Smart Detection
  app.get("/api/recurring-transactions", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      const { SmartRecurringDetector } = await import("./smartRecurringDetection");
      const { recurringTransactions } = await import("@shared/schema");
      const { desc } = await import("drizzle-orm");
      
      // First, try to get existing recurring transactions from database
      const existingRecurring = await db
        .select()
        .from(recurringTransactions)
        .where(eq(recurringTransactions.userId, userId))
        .orderBy(desc(recurringTransactions.confidence));
      
      // If we have existing data that's recent, return it
      if (existingRecurring.length > 0) {
        // Check if the data is less than 1 hour old
        const latestUpdate = Math.max(...existingRecurring.map(r => new Date(r.updatedAt).getTime()));
        const hourAgo = Date.now() - (60 * 60 * 1000);
        
        if (latestUpdate > hourAgo) {
          console.log(`Returning ${existingRecurring.length} existing recurring transactions from database`);
          res.json(existingRecurring.map(r => ({
            id: r.id,
            name: r.name,
            merchant: r.merchant,
            category: r.category,
            amount: parseFloat(r.amount),
            frequency: r.frequency,
            nextDueDate: r.nextDueDate,
            lastTransactionDate: r.lastTransactionDate,
            isActive: r.isActive,
            autoDetected: r.autoDetected,
            confidence: r.confidence,
            occurrences: 1, // Simplified
            amountVariance: 0, // Not stored in DB
            excludeFromBills: r.excludeFromBills,
            merchantLogo: r.merchantLogo,
            linkedTransactionIds: r.linkedTransactionIds || []
          })));
          return;
        }
      }

      // Detect new recurring patterns
      const detectedTransactions = await SmartRecurringDetector.detectRecurringTransactions(userId);
      
      console.log(`Smart Recurring API: Detected ${detectedTransactions.length} recurring patterns for user ${userId}`);
      
      // Debug: Show detected patterns with enhanced details
      if (detectedTransactions.length > 0) {
        detectedTransactions.forEach(item => {
          console.log(`- ${item.name}: ${item.frequency}, confidence: ${item.confidence.toFixed(2)}, occurrences: ${item.occurrences}, variance: ${(item.amountVariance * 100).toFixed(1)}%`);
        });

        // Clear existing recurring transactions for this user and save new ones
        await db.delete(recurringTransactions).where(eq(recurringTransactions.userId, userId));

        // Save detected patterns to database
        const insertData = detectedTransactions.map(item => ({
          id: item.id,
          userId,
          name: item.name,
          merchant: item.merchant,
          category: item.category,
          amount: item.amount.toString(),
          frequency: item.frequency,
          nextDueDate: new Date(item.nextDueDate),
          lastTransactionDate: new Date(item.lastTransactionDate),
          isActive: item.isActive,
          isRecurring: true,
          autoDetected: item.autoDetected,
          confidence: item.confidence,
          notificationDays: item.notificationDays || 3,
          accountId: item.accountId || null,
          excludeFromBills: item.excludeFromBills || false,
          tags: item.tags ? JSON.stringify(item.tags) : null,
          merchantLogo: item.merchantLogo || null,
          linkedTransactionIds: item.linkedTransactionIds || []
        }));

        await db.insert(recurringTransactions).values(insertData);
        console.log(`✅ Saved ${insertData.length} recurring transactions to database`);
      }
      
      res.json(detectedTransactions);
    } catch (error) {
      console.error("Error fetching recurring transactions:", error);
      res.status(500).json({ error: "Failed to fetch recurring transactions" });
    }
  });

  // Missed Payments Detection API
  app.get("/api/recurring-transactions/missed", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      const { SmartRecurringDetector } = await import("./smartRecurringDetection");
      const missedPayments = await SmartRecurringDetector.detectMissedPayments(userId);
      
      console.log(`Missed Payments API: Found ${missedPayments.length} potentially missed payments for user ${userId}`);
      
      res.json(missedPayments);
    } catch (error) {
      console.error("Error detecting missed payments:", error);
      res.status(500).json({ error: "Failed to detect missed payments" });
    }
  });



  app.get("/api/manual-subscriptions", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      const manualSubscriptions = await storage.getManualSubscriptions(userId);
      res.json(manualSubscriptions);
    } catch (error) {
      console.error("Error fetching manual subscriptions:", error);
      res.status(500).json({ error: "Failed to fetch manual subscriptions" });
    }
  });

  app.post("/api/recurring-transactions", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      // TODO: Implement creating recurring transactions
      res.status(501).json({ error: "Not implemented yet" });
    } catch (error) {
      console.error("Error creating recurring transaction:", error);
      res.status(500).json({ error: "Failed to create recurring transaction" });
    }
  });

  app.post("/api/manual-subscriptions", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      const subscriptionData = insertManualSubscriptionSchema.parse({
        ...req.body,
        startDate: new Date(req.body.startDate)
      });

      // Use the startDate directly as the next due date (user specifies when it's due)
      // Set to noon UTC to avoid timezone issues with date display
      const nextDueDate = new Date(subscriptionData.startDate);
      nextDueDate.setUTCHours(12, 0, 0, 0); // Set to noon UTC to avoid timezone display issues

      // Create as a recurring transaction instead of manual subscription
      const recurringTransaction = {
        userId,
        name: subscriptionData.name,
        category: subscriptionData.category,
        amount: subscriptionData.amount,
        frequency: subscriptionData.frequency,
        nextDueDate: nextDueDate,
        isActive: subscriptionData.isActive ?? true,
        autoDetected: false, // Mark as manually created
        confidence: null,
        tags: JSON.stringify([]),
        notes: subscriptionData.notes,
        notificationDays: 3,
        linkedTransactionIds: JSON.stringify([])
      };

      const created = await storage.createRecurringTransaction(recurringTransaction, userId);
      res.status(201).json(created);
    } catch (error) {
      console.error("Error creating manual subscription:", error);
      if (error instanceof ZodError) {
        res.status(400).json({ 
          error: "Invalid subscription data", 
          details: error.errors 
        });
      } else {
        res.status(500).json({ error: "Failed to create manual subscription" });
      }
    }
  });

  // ===== Transaction Tags API Routes =====
  app.get("/api/transaction-tags", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      const tags = await storage.getTransactionTags(userId);
      res.json(tags);
    } catch (error) {
      console.error("Error fetching transaction tags:", error);
      res.status(500).json({ error: "Failed to fetch transaction tags" });
    }
  });

  app.post("/api/transaction-tags", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      const data = insertTransactionTagSchema.parse(req.body);
      const tag = await storage.createTransactionTag(data, userId);
      res.status(201).json(tag);
    } catch (error) {
      console.error("Error creating transaction tag:", error);
      if (error instanceof ZodError) {
        res.status(400).json({ error: "Invalid data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create transaction tag" });
      }
    }
  });

  app.patch("/api/transaction-tags/:id", isAuthenticated, async (req, res) => {
    try {
      const tagId = req.params.id;
      const updates = req.body;
      
      const updatedTag = await storage.updateTransactionTag(tagId, updates);
      res.json(updatedTag);
    } catch (error) {
      console.error("Error updating transaction tag:", error);
      res.status(500).json({ error: "Failed to update transaction tag" });
    }
  });

  app.delete("/api/transaction-tags/:id", isAuthenticated, async (req, res) => {
    try {
      const tagId = req.params.id;
      const success = await storage.deleteTransactionTag(tagId);
      
      if (success) {
        res.json({ success: true });
      } else {
        res.status(404).json({ error: "Transaction tag not found" });
      }
    } catch (error) {
      console.error("Error deleting transaction tag:", error);
      res.status(500).json({ error: "Failed to delete transaction tag" });
    }
  });

  // ===== Automation Rules API Routes =====
  app.get("/api/automation-rules", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      const rules = await storage.getAutomationRules(userId);
      res.json(rules);
    } catch (error) {
      console.error("Error fetching automation rules:", error);
      res.status(500).json({ error: "Failed to fetch automation rules" });
    }
  });

  app.post("/api/automation-rules", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      console.log("🚀 Creating automation rule with data:", JSON.stringify(req.body, null, 2));

      // Handle new structured rule format
      const { name, conditions, actions, createdFromTransactionId } = req.body;

      // Convert new format to existing schema format
      const ruleData: any = {
        name: name,
        isActive: true,
        priority: 0,
        description: `Auto-generated rule from transaction ${createdFromTransactionId}`,
      };

      // Process conditions
      if (conditions && Array.isArray(conditions)) {
        conditions.forEach((condition: any) => {
          switch (condition.field) {
            case 'name':
              if (condition.operator === 'contains') {
                ruleData.merchantPattern = condition.value;
                ruleData.descriptionPattern = condition.value;
              }
              break;
            case 'amount':
              if (condition.operator === 'equals') {
                const amount = parseFloat(condition.value);
                ruleData.amountMin = amount - 0.01;
                ruleData.amountMax = amount + 0.01;
              }
              break;
            case 'account':
              // Store account filter in description for now
              ruleData.description = `${ruleData.description} - Account filter: ${condition.value}`;
              break;
          }
        });
      }

      // Process actions
      if (actions && Array.isArray(actions)) {
        actions.forEach((action: any) => {
          switch (action.type) {
            case 'set_category':
              ruleData.setCategoryId = action.value;
              ruleData.enableCategoryChange = true;
              break;
            case 'rename_transaction':
              ruleData.renameTransactionTo = action.value;
              ruleData.enableRename = true;
              break;
            case 'assign_to_bill':
              // Store in description for now
              ruleData.description = `${ruleData.description} - Assign to bill: ${action.value}`;
              break;
            case 'ignore_transaction':
              ruleData.ignoreTransaction = true;
              ruleData.enableIgnore = true;
              break;
            case 'mark_tax_deductible':
              // This would need a new field in the schema
              ruleData.description = `${ruleData.description} - Tax deductible: true`;
              break;
          }
        });
      }

      const validatedData = insertAutomationRuleSchema.parse(ruleData);
      const rule = await storage.createAutomationRule(validatedData, userId);
      
      // Immediately apply this rule to existing matching transactions
      console.log(`Applying new rule "${rule.name}" to existing transactions...`);
      const userTransactions = await storage.getTransactions(userId);
      
      if (userTransactions.length > 0) {
        const automationEngine = await import('./automationRulesEngine');
        const engine = new automationEngine.AutomationRulesEngine();
        const { updatedTransactions } = await engine.applyRulesToTransactions(userTransactions, [rule]);
        
        // Update transactions that were modified
        let appliedToExistingCount = 0;
        for (let i = 0; i < userTransactions.length; i++) {
          const original = userTransactions[i];
          const updated = updatedTransactions[i];
          
          // Check if transaction was actually modified
          const hasChanges = 
            original.categoryId !== updated.categoryId ||
            original.description !== updated.description;
            
          if (hasChanges) {
            const updates: any = {};
            if (original.categoryId !== updated.categoryId) {
              updates.categoryId = updated.categoryId;
              updates.category = updated.category || 'Uncategorized';
              console.log(`📂 Updating category: ${original.categoryId} → ${updated.categoryId} for transaction ${original.id}`);
            }
            if (original.description !== updated.description) {
              updates.description = updated.description;
              console.log(`📝 Updating description: "${original.description}" → "${updated.description}" for transaction ${original.id}`);
            }
            
            await storage.updateTransaction(original.id, updates);
            appliedToExistingCount++;
          }
        }
        console.log(`✅ Applied new rule to ${appliedToExistingCount} existing transactions out of ${userTransactions.length} total`);
      } else {
        console.log(`ℹ️ No existing transactions to apply rule to`);
      }
      
      console.log(`✅ Created and applied automation rule: ${rule.name}`);
      res.status(201).json(rule);
    } catch (error) {
      console.error("Error creating automation rule:", error);
      if (error instanceof ZodError) {
        res.status(400).json({ error: "Invalid data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create automation rule" });
      }
    }
  });

  app.patch("/api/automation-rules/:id", isAuthenticated, async (req, res) => {
    try {
      const ruleId = req.params.id;
      const updates = req.body;
      const userId = getUserId(req);
      
      console.log(`🔄 Updating automation rule ${ruleId} with:`, JSON.stringify(updates, null, 2));
      
      const updatedRule = await storage.updateAutomationRule(ruleId, updates);
      
      if (updatedRule) {
        console.log(`✅ Rule updated successfully: ${updatedRule.name}`);
        
        // Re-apply the updated rule to existing matching transactions
        console.log(`🔄 Re-applying updated rule to existing transactions...`);
        const userTransactions = await storage.getTransactions(userId);
        
        if (userTransactions.length > 0) {
          const automationEngine = await import('./automationRulesEngine');
          const engine = new automationEngine.AutomationRulesEngine();
          const { updatedTransactions } = await engine.applyRulesToTransactions(userTransactions, [updatedRule]);
          
          // Update transactions that were modified
          let appliedCount = 0;
          for (let i = 0; i < userTransactions.length; i++) {
            const original = userTransactions[i];
            const updated = updatedTransactions[i];
            
            // Check if transaction was actually modified
            const hasChanges = 
              original.categoryId !== updated.categoryId ||
              original.description !== updated.description;
              
            if (hasChanges) {
              const updateData: any = {};
              if (original.categoryId !== updated.categoryId) {
                updateData.categoryId = updated.categoryId;
                updateData.category = updated.category || 'Uncategorized';
                console.log(`📂 Re-applying category: ${original.categoryId} → ${updated.categoryId} for transaction ${original.id}`);
              }
              if (original.description !== updated.description) {
                updateData.description = updated.description;
                console.log(`📝 Re-applying description: "${original.description}" → "${updated.description}" for transaction ${original.id}`);
              }
              
              await storage.updateTransaction(original.id, updateData);
              appliedCount++;
            }
          }
          console.log(`✅ Re-applied updated rule to ${appliedCount} existing transactions`);
        }
      }
      
      res.json(updatedRule);
    } catch (error) {
      console.error("Error updating automation rule:", error);
      res.status(500).json({ error: "Failed to update automation rule" });
    }
  });

  app.delete("/api/automation-rules/:id", isAuthenticated, async (req, res) => {
    try {
      const ruleId = req.params.id;
      const success = await storage.deleteAutomationRule(ruleId);
      
      if (success) {
        res.json({ success: true });
      } else {
        res.status(404).json({ error: "Automation rule not found" });
      }
    } catch (error) {
      console.error("Error deleting automation rule:", error);
      res.status(500).json({ error: "Failed to delete automation rule" });
    }
  });

  // Apply automation rules to existing transactions
  app.post("/api/automation-rules/apply", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      const { transactionIds } = req.body;
      
      // Get user's automation rules
      const userRules = await storage.getAutomationRules(userId);
      
      if (userRules.length === 0) {
        return res.json({ 
          message: "No automation rules found", 
          processedCount: 0, 
          applicationsCount: 0 
        });
      }

      // Get transactions to process
      let transactions;
      if (transactionIds && transactionIds.length > 0) {
        // Apply to specific transactions
        transactions = [];
        for (const id of transactionIds) {
          const transaction = await storage.getTransaction(id);
          if (transaction && transaction.userId === userId) {
            transactions.push(transaction);
          }
        }
      } else {
        // Apply to all user's transactions
        transactions = await storage.getTransactions(userId);
      }

      if (transactions.length === 0) {
        return res.json({ 
          message: "No transactions found to process", 
          processedCount: 0, 
          applicationsCount: 0 
        });
      }

      // Apply automation rules
      const { automationRulesEngine } = await import('./automationRulesEngine');
      const { updatedTransactions, totalApplications } = await automationRulesEngine.applyRulesToTransactions(
        transactions, 
        userRules
      );

      // Update transactions in database
      let updatedCount = 0;
      for (let i = 0; i < transactions.length; i++) {
        const original = transactions[i];
        const updated = updatedTransactions[i];
        
        // Check if transaction was actually modified
        const hasChanges = 
          original.categoryId !== updated.categoryId ||
          original.description !== updated.description;
          
        if (hasChanges) {
          const updates: any = {};
          if (original.categoryId !== updated.categoryId) {
            updates.categoryId = updated.categoryId;
            updates.category = updated.category;
          }
          if (original.description !== updated.description) {
            updates.description = updated.description;
          }
          
          await storage.updateTransaction(original.id, updates);
          updatedCount++;
        }
      }

      res.json({
        message: `Applied automation rules to ${transactions.length} transactions`,
        processedCount: transactions.length,
        applicationsCount: totalApplications,
        updatedCount
      });

    } catch (error) {
      console.error("Error applying automation rules:", error);
      res.status(500).json({ error: "Failed to apply automation rules" });
    }
  });

  // ===== Transaction Splits API Routes =====
  app.get("/api/transaction-splits", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      const { originalTransactionId } = req.query;
      const splits = await storage.getTransactionSplits(
        originalTransactionId as string | undefined, 
        userId
      );
      res.json(splits);
    } catch (error) {
      console.error("Error fetching transaction splits:", error);
      res.status(500).json({ error: "Failed to fetch transaction splits" });
    }
  });

  app.post("/api/transaction-splits", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      const { originalTransactionId, splits } = req.body;
      
      // Validate and prepare splits data
      const splitsData = splits.map((split: any, index: number) => ({
        ...split,
        userId,
        originalTransactionId,
        splitOrder: index,
      }));

      const validatedSplits = z.array(insertTransactionSplitSchema).parse(splitsData);
      const createdSplits = await storage.createTransactionSplits(validatedSplits, userId);
      
      res.status(201).json(createdSplits);
    } catch (error) {
      console.error("Error creating transaction splits:", error);
      if (error instanceof ZodError) {
        res.status(400).json({ error: "Invalid data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create transaction splits" });
      }
    }
  });

  app.delete("/api/transaction-splits/:originalTransactionId", isAuthenticated, async (req, res) => {
    try {
      const originalTransactionId = req.params.originalTransactionId;
      const success = await storage.deleteTransactionSplits(originalTransactionId);
      
      if (success) {
        res.json({ success: true });
      } else {
        res.status(404).json({ error: "Transaction splits not found" });
      }
    } catch (error) {
      console.error("Error deleting transaction splits:", error);
      res.status(500).json({ error: "Failed to delete transaction splits" });
    }
  });

  // Admin routes (protected by admin middleware)
  const isAdmin = async (req: any, res: any, next: any) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const user = await storage.getUser(userId);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      next();
    } catch (error) {
      res.status(500).json({ message: "Admin check failed" });
    }
  };

  app.get("/api/admin/stats", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const stats = await storage.getAdminStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to get admin stats" });
    }
  });

  app.get("/api/admin/analytics", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const analytics = await storage.getAdminAnalytics();
      res.json(analytics);
    } catch (error) {
      console.error("Error getting admin analytics:", error);
      res.status(500).json({ message: "Failed to get admin analytics" });
    }
  });

  app.get("/api/admin/users", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsersWithStats();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to get users" });
    }
  });

  app.post("/api/admin/users/:userId/reset", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      await storage.resetUserData(userId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to reset user data" });
    }
  });

  // Admin Recurring Merchants Management API
  app.get("/api/admin/recurring-merchants", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const merchants = await db
        .select()
        .from(recurringMerchants)
        .orderBy(desc(recurringMerchants.createdAt));

      console.log(`Admin API: Returning ${merchants.length} recurring merchants`);
      res.json(merchants);
    } catch (error) {
      console.error("Error fetching recurring merchants:", error);
      res.status(500).json({ error: "Failed to fetch recurring merchants" });
    }
  });

  app.post("/api/admin/recurring-merchants", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const validatedData = insertRecurringMerchantSchema.parse(req.body);
      
      // Normalize the merchant name for matching
      const normalizedName = validatedData.merchantName.toLowerCase()
        .trim()
        .replace(/\s+/g, ' ')
        .replace(/[#*]+/g, '')
        .replace(/\s+(auto|eft|payment|bill|monthly)\s*$/i, '')
        .replace(/^\s*(payment|bill)\s+/i, '');

      const [newMerchant] = await db
        .insert(recurringMerchants)
        .values({ ...validatedData, normalizedName })
        .returning();

      console.log(`Admin API: Created new recurring merchant: ${newMerchant.merchantName}`);
      res.status(201).json(newMerchant);
    } catch (error) {
      console.error("Error creating recurring merchant:", error);
      res.status(500).json({ error: "Failed to create recurring merchant" });
    }
  });

  app.put("/api/admin/recurring-merchants/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      console.log("Update request - ID:", id);
      console.log("Update request - Body:", JSON.stringify(req.body, null, 2));
      
      // Manual validation to avoid normalizedName requirement
      const validatedData = {
        merchantName: req.body.merchantName,
        category: req.body.category,
        transactionType: req.body.transactionType,
        frequency: req.body.frequency || null,
        logoUrl: req.body.logoUrl || null,
        isActive: req.body.isActive ?? true,
        autoDetected: req.body.autoDetected ?? false,
        confidence: req.body.confidence || null,
        notes: req.body.notes || null,
        patterns: req.body.patterns || null,
        excludeFromBills: req.body.excludeFromBills ?? false,
        notificationDays: req.body.notificationDays?.toString() || "3",
      };
      
      // Basic validation
      if (!validatedData.merchantName || typeof validatedData.merchantName !== 'string') {
        return res.status(400).json({ error: "merchantName is required and must be a string" });
      }
      if (!validatedData.category || typeof validatedData.category !== 'string') {
        return res.status(400).json({ error: "category is required and must be a string" });
      }
      if (!validatedData.transactionType || typeof validatedData.transactionType !== 'string') {
        return res.status(400).json({ error: "transactionType is required and must be a string" });
      }
      
      console.log("Validated data:", JSON.stringify(validatedData, null, 2));
      
      // Normalize the merchant name for matching
      const normalizedName = validatedData.merchantName.toLowerCase()
        .trim()
        .replace(/\s+/g, ' ')
        .replace(/[#*]+/g, '')
        .replace(/\s+(auto|eft|payment|bill|monthly)\s*$/i, '')
        .replace(/^\s*(payment|bill)\s+/i, '');
      
      console.log("Generated normalized name:", normalizedName);

      const [updatedMerchant] = await db
        .update(recurringMerchants)
        .set({ ...validatedData, normalizedName, updatedAt: new Date() })
        .where(eq(recurringMerchants.id, id))
        .returning();

      if (!updatedMerchant) {
        return res.status(404).json({ error: "Recurring merchant not found" });
      }

      console.log(`Admin API: Updated recurring merchant: ${updatedMerchant.merchantName}`);
      res.json(updatedMerchant);
    } catch (error) {
      console.error("Error updating recurring merchant:", error);
      console.error("Request body:", req.body);
      console.error("Merchant ID:", req.params.id);
      
      // If it's a Zod validation error, provide more specific feedback
      if (error instanceof Error && error.name === 'ZodError') {
        console.error("Validation error details:", JSON.stringify((error as any).issues, null, 2));
        return res.status(400).json({ 
          error: "Validation failed", 
          details: (error as any).issues 
        });
      }
      
      res.status(500).json({ error: "Failed to update recurring merchant" });
    }
  });

  app.delete("/api/admin/recurring-merchants/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      
      const [deletedMerchant] = await db
        .delete(recurringMerchants)
        .where(eq(recurringMerchants.id, id))
        .returning();

      if (!deletedMerchant) {
        return res.status(404).json({ error: "Recurring merchant not found" });
      }

      console.log(`Admin API: Deleted recurring merchant: ${deletedMerchant.merchantName}`);
      res.json({ message: "Recurring merchant deleted successfully" });
    } catch (error) {
      console.error("Error deleting recurring merchant:", error);
      res.status(500).json({ error: "Failed to delete recurring merchant" });
    }
  });

  // Seed realistic transaction data for testing
  app.post("/api/admin/seed-realistic-transactions", isAuthenticated, isAdmin, async (req, res) => {
    try {
      await seedRealisticTransactions();
      res.json({ 
        success: true, 
        message: "Successfully seeded realistic transaction data for testing"
      });
    } catch (error) {
      console.error("Error seeding realistic transactions:", error);
      res.status(500).json({ error: "Failed to seed realistic transactions" });
    }
  });

  // Seed new merchants from attached data files
  app.post("/api/admin/recurring-merchants/seed-new", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const result = await seedNewMerchants();
      res.json({ 
        success: true, 
        message: `Successfully seeded merchants: ${result.added} added, ${result.skipped} skipped`,
        details: result
      });
    } catch (error) {
      console.error("Error seeding new merchants:", error);
      res.status(500).json({ error: "Failed to seed new merchants" });
    }
  });

  // Admin: Bulk import recurring merchants
  app.post("/api/admin/recurring-merchants/bulk-import", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { merchants } = req.body;
      
      if (!Array.isArray(merchants)) {
        return res.status(400).json({ success: false, error: "Invalid merchants data" });
      }

      const result = await bulkImportMerchants(merchants);
      res.json({ success: true, ...result, message: `Added ${result.added} merchants, skipped ${result.skipped} duplicates` });
    } catch (error) {
      console.error("Error bulk importing merchants:", error);
      res.status(500).json({ success: false, error: "Failed to bulk import merchants" });
    }
  });

  // Auto-populate recurring merchants from current detections
  app.post("/api/admin/recurring-merchants/auto-populate", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { SmartRecurringDetector } = await import("./smartRecurringDetection");
      
      // Get all users to analyze their recurring patterns
      const allUsers = await db.select({ id: users.id }).from(users);
      const autoMerchants = new Map<string, any>();

      for (const user of allUsers) {
        const userRecurring = await SmartRecurringDetector.detectRecurringTransactions(user.id);
        
        userRecurring.forEach(recurring => {
          const key = recurring.name.toLowerCase().trim();
          if (!autoMerchants.has(key) || autoMerchants.get(key).confidence < recurring.confidence) {
            autoMerchants.set(key, {
              merchantName: recurring.name,
              normalizedName: key,
              category: recurring.category,
              transactionType: recurring.tags.includes('utility') ? 'utility' :
                              recurring.tags.includes('subscription') ? 'subscription' :
                              recurring.tags.includes('credit') ? 'credit_card' :
                              'large_recurring',
              frequency: recurring.frequency,
              logoUrl: recurring.merchantLogo,
              isActive: true,
              autoDetected: true,
              confidence: recurring.confidence >= 0.9 ? 'high' : recurring.confidence >= 0.7 ? 'medium' : 'low',
              notes: `Auto-detected with ${recurring.confidence.toFixed(2)} confidence from ${recurring.occurrences} occurrences`,
              patterns: JSON.stringify([key]),
              excludeFromBills: recurring.excludeFromBills || false,
              notificationDays: recurring.notificationDays || 3,
            });
          }
        });
      }

      // Insert unique auto-detected merchants
      const merchantsToInsert = Array.from(autoMerchants.values());
      const insertedMerchants = [];

      for (const merchant of merchantsToInsert) {
        try {
          // Check if merchant already exists
          const existing = await db
            .select()
            .from(recurringMerchants)
            .where(eq(recurringMerchants.normalizedName, merchant.normalizedName))
            .limit(1);

          if (existing.length === 0) {
            const [inserted] = await db
              .insert(recurringMerchants)
              .values(merchant)
              .returning();
            insertedMerchants.push(inserted);
          }
        } catch (insertError) {
          console.warn(`Failed to insert merchant ${merchant.merchantName}:`, insertError);
        }
      }

      console.log(`Admin API: Auto-populated ${insertedMerchants.length} recurring merchants`);
      res.json({ 
        message: `Successfully auto-populated ${insertedMerchants.length} recurring merchants`,
        merchants: insertedMerchants
      });
    } catch (error) {
      console.error("Error auto-populating recurring merchants:", error);
      res.status(500).json({ error: "Failed to auto-populate recurring merchants" });
    }
  });

  app.patch("/api/admin/users/:userId/admin", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const { isAdmin: makeAdmin } = req.body;
      await storage.updateUser(userId, { isAdmin: makeAdmin });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to update admin status" });
    }
  });

  // Enhanced categorization endpoints
  
  // Get admin categories
  app.get("/api/admin/categories", async (req, res) => {
    try {
      const categories = await storage.getAdminCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching admin categories:", error);
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  // Get categories that are currently used in budgets
  app.get("/api/budget-categories", async (req, res) => {
    try {
      const userId = (req.session as any)?.userId;
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      // Get categories from current budgets
      const { budgets } = await import("@shared/schema");
      const { eq, and, isNotNull } = await import("drizzle-orm");
      
      const userBudgets = await db
        .select({ category: budgets.category })
        .from(budgets)
        .where(and(
          eq(budgets.userId, userId),
          isNotNull(budgets.category)
        ))
        .groupBy(budgets.category);

      const budgetCategoryNames = userBudgets.map(b => b.category).filter(Boolean);
      
      // Get matching admin categories
      const allAdminCategories = await storage.getAdminCategories();
      const budgetCategories = allAdminCategories.filter((cat: any) => 
        budgetCategoryNames.includes(cat.name) ||
        budgetCategoryNames.includes(cat.subcategory) ||
        budgetCategoryNames.some(budgetCat => 
          cat.subcategory && `${cat.name} (${cat.subcategory})` === budgetCat ||
          cat.subcategory && `${cat.name} - ${cat.subcategory}` === budgetCat
        )
      );

      res.json(budgetCategories);
    } catch (error) {
      console.error("Error fetching budget categories:", error);
      res.status(500).json({ error: "Failed to fetch budget categories" });
    }
  });

  // Create admin category
  app.post("/api/admin/categories", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      const { adminCategories } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");
      
      // Check if user is admin
      const user = await storage.getUser(userId);
      if (!user?.isAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const { name, description, parentId, color = "#3B82F6", ledgerType } = req.body;
      if (!name) {
        return res.status(400).json({ error: "Category name is required" });
      }
      if (!ledgerType) {
        return res.status(400).json({ error: "Ledger type is required" });
      }

      // Get next sort order
      const existingCategories = await db.select().from(adminCategories);
      const nextSortOrder = Math.max(...existingCategories.map(c => c.sortOrder), 0) + 1;

      const [newCategory] = await db
        .insert(adminCategories)
        .values({
          name,
          ledgerType,
          description,
          parentId: parentId || null,
          color,
          sortOrder: nextSortOrder,
          isActive: true,
        })
        .returning();

      res.json(newCategory);
    } catch (error) {
      console.error("Error creating admin category:", error);
      res.status(500).json({ error: "Failed to create category" });
    }
  });

  // Update admin category
  app.patch("/api/admin/categories/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      const { adminCategories } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");
      
      // Check if user is admin
      const user = await storage.getUser(userId);
      if (!user?.isAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const { id } = req.params;
      const updates = req.body;

      const [updatedCategory] = await db
        .update(adminCategories)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(adminCategories.id, id))
        .returning();

      if (!updatedCategory) {
        return res.status(404).json({ error: "Category not found" });
      }

      res.json(updatedCategory);
    } catch (error) {
      console.error("Error updating admin category:", error);
      res.status(500).json({ error: "Failed to update category" });
    }
  });

  // Delete admin category
  app.delete("/api/admin/categories/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      const { adminCategories } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");
      
      // Check if user is admin
      const user = await storage.getUser(userId);
      if (!user?.isAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const { id } = req.params;

      // Check if category has subcategories
      const subcategories = await db
        .select()
        .from(adminCategories)
        .where(eq(adminCategories.parentId, id));

      if (subcategories.length > 0) {
        return res.status(400).json({ 
          error: "Cannot delete category with subcategories. Delete subcategories first." 
        });
      }

      const [deletedCategory] = await db
        .delete(adminCategories)
        .where(eq(adminCategories.id, id))
        .returning();

      if (!deletedCategory) {
        return res.status(404).json({ error: "Category not found" });
      }

      res.json({ success: true, deletedCategory });
    } catch (error) {
      console.error("Error deleting admin category:", error);
      res.status(500).json({ error: "Failed to delete category" });
    }
  });

  // User merchant overrides endpoints
  
  // Get user's merchant overrides
  app.get("/api/user/merchant-overrides", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      const { userMerchantOverrides, adminCategories } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");

      const overrides = await db
        .select({
          id: userMerchantOverrides.id,
          merchantName: userMerchantOverrides.merchantName,
          adminCategoryId: userMerchantOverrides.adminCategoryId,
          subcategoryName: userMerchantOverrides.subcategoryName,
          createdAt: userMerchantOverrides.createdAt,
          adminCategory: {
            id: adminCategories.id,
            name: adminCategories.name,
            ledgerType: adminCategories.ledgerType,
            color: adminCategories.color,
          }
        })
        .from(userMerchantOverrides)
        .leftJoin(adminCategories, eq(userMerchantOverrides.adminCategoryId, adminCategories.id))
        .where(eq(userMerchantOverrides.userId, userId))
        .orderBy(userMerchantOverrides.createdAt);

      res.json(overrides);
    } catch (error) {
      console.error("Error fetching user merchant overrides:", error);
      res.status(500).json({ error: "Failed to fetch merchant overrides" });
    }
  });

  // Create user merchant override
  app.post("/api/user/merchant-overrides", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      const { userMerchantOverrides } = await import("@shared/schema");
      const { merchantName, adminCategoryId, subcategoryName } = req.body;

      if (!merchantName || !adminCategoryId) {
        return res.status(400).json({ error: "Merchant name and category are required" });
      }

      const [newOverride] = await db
        .insert(userMerchantOverrides)
        .values({
          userId,
          merchantName: merchantName.trim(),
          adminCategoryId,
          subcategoryName: subcategoryName?.trim() || null,
        })
        .returning();

      res.json(newOverride);
    } catch (error) {
      console.error("Error creating user merchant override:", error);
      res.status(500).json({ error: "Failed to create merchant override" });
    }
  });

  // Update user merchant override
  app.patch("/api/user/merchant-overrides/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      const { userMerchantOverrides } = await import("@shared/schema");
      const { eq, and } = await import("drizzle-orm");
      const { id } = req.params;
      const updates = req.body;

      const [updatedOverride] = await db
        .update(userMerchantOverrides)
        .set({ ...updates, updatedAt: new Date() })
        .where(and(
          eq(userMerchantOverrides.id, id),
          eq(userMerchantOverrides.userId, userId)
        ))
        .returning();

      if (!updatedOverride) {
        return res.status(404).json({ error: "Merchant override not found" });
      }

      res.json(updatedOverride);
    } catch (error) {
      console.error("Error updating user merchant override:", error);
      res.status(500).json({ error: "Failed to update merchant override" });
    }
  });

  // Delete user merchant override
  app.delete("/api/user/merchant-overrides/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      const { userMerchantOverrides } = await import("@shared/schema");
      const { eq, and } = await import("drizzle-orm");
      const { id } = req.params;

      const [deletedOverride] = await db
        .delete(userMerchantOverrides)
        .where(and(
          eq(userMerchantOverrides.id, id),
          eq(userMerchantOverrides.userId, userId)
        ))
        .returning();

      if (!deletedOverride) {
        return res.status(404).json({ error: "Merchant override not found" });
      }

      res.json({ success: true, deletedOverride });
    } catch (error) {
      console.error("Error deleting user merchant override:", error);
      res.status(500).json({ error: "Failed to delete merchant override" });
    }
  });

  // Get transactions needing review
  app.get("/api/transactions/review", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      const { getTransactionsNeedingReview } = await import("./enhancedCategorization");
      const reviewTransactions = await getTransactionsNeedingReview(userId);
      res.json(reviewTransactions);
    } catch (error) {
      console.error("Error getting review transactions:", error);
      res.status(500).json({ error: "Failed to get review transactions" });
    }
  });

  // Apply category fix (creates user override)
  app.post("/api/transactions/apply-category-fix", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      const { transactionId, adminCategoryId, subcategoryName } = req.body;
      const { applyUserCategoryFix } = await import("./enhancedCategorization");
      
      const result = await applyUserCategoryFix(
        userId,
        transactionId,
        adminCategoryId,
        subcategoryName
      );
      
      res.json(result);
    } catch (error) {
      console.error("Error applying category fix:", error);
      res.status(500).json({ error: "Failed to apply category fix" });
    }
  });

  // Enhanced bulk categorization
  app.post("/api/transactions/bulk-categorize", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      const { bulkCategorizeUserTransactions } = await import("./enhancedCategorization");
      const result = await bulkCategorizeUserTransactions(userId);
      res.json(result);
    } catch (error) {
      console.error("Bulk categorization error:", error);
      res.status(500).json({ error: "Failed to categorize transactions" });
    }
  });

  // Seed admin categories (admin only)
  app.post("/api/admin/seed-categories", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { seedAdminCategories } = await import("./seedAdminCategories");
      const result = await seedAdminCategories();
      res.json({ success: true, message: "Admin categories seeded successfully", result });
    } catch (error) {
      console.error("Error seeding admin categories:", error);
      res.status(500).json({ error: "Failed to seed admin categories" });
    }
  });

  // Financial tips endpoint
  app.get("/api/financial-tips", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      const { generateFinancialTips } = await import("./financialTipsGenerator");
      const tips = await generateFinancialTips(userId);
      
      res.json(tips);
    } catch (error) {
      console.error("Error generating financial tips:", error);
      res.status(500).json({ error: "Failed to generate financial tips" });
    }
  });

  // Financial health endpoint
  app.get("/api/financial-health", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      // Get user data
      const userTransactions = await db
        .select()
        .from(transactions)
        .where(eq(transactions.userId, userId))
        .orderBy(desc(transactions.date));

      const userBudgets = await db
        .select()
        .from(budgets)
        .where(eq(budgets.userId, userId));

      const userAccounts = await db
        .select()
        .from(accounts)
        .where(eq(accounts.userId, userId));

      // Calculate financial health metrics
      const now = new Date();
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const currentMonthTx = userTransactions.filter(tx => new Date(tx.date) >= currentMonthStart);

      const currentIncome = currentMonthTx
        .filter(tx => tx.type === 'income')
        .reduce((sum, tx) => sum + Math.abs(parseFloat(tx.amount)), 0);

      const currentExpenses = currentMonthTx
        .filter(tx => tx.type === 'expense')
        .reduce((sum, tx) => sum + Math.abs(parseFloat(tx.amount)), 0);

      const netWorth = userAccounts.reduce((sum, account) => sum + parseFloat(account.balance || '0'), 0);
      const cashFlow = currentIncome - currentExpenses;
      const savingsRate = currentIncome > 0 ? (cashFlow / currentIncome) * 100 : 0;

      // Emergency fund calculation
      const monthlyExpenses = currentExpenses || 1000;
      const emergencyFundMonths = monthlyExpenses > 0 ? netWorth / monthlyExpenses : 0;

      // Budget compliance
      const totalBudget = userBudgets.reduce((sum, budget) => sum + parseFloat(budget.limit || '0'), 0);
      const budgetCompliance = totalBudget > 0 ? Math.max(0, Math.min(100, ((totalBudget - currentExpenses) / totalBudget) * 100)) : 100;

      // Calculate individual scores
      const cashFlowScore = cashFlow > 0 ? (cashFlow > currentIncome * 0.2 ? 100 : 70) : 20;
      const savingsScore = savingsRate >= 20 ? 100 : savingsRate >= 10 ? 80 : savingsRate >= 5 ? 60 : 30;
      const emergencyScore = emergencyFundMonths >= 6 ? 100 : emergencyFundMonths >= 3 ? 80 : emergencyFundMonths >= 1 ? 60 : 30;
      const budgetScore = budgetCompliance >= 90 ? 100 : budgetCompliance >= 70 ? 80 : budgetCompliance >= 50 ? 60 : 30;

      const overallScore = Math.round((cashFlowScore + savingsScore + emergencyScore + budgetScore) / 4);

      // Determine grade
      const grade = overallScore >= 90 ? 'A+' : 
                   overallScore >= 80 ? 'A' : 
                   overallScore >= 70 ? 'B' : 
                   overallScore >= 60 ? 'C' : 
                   overallScore >= 50 ? 'D' : 'F';

      // Create detailed factors
      const factors = [
        {
          name: 'Cash Flow',
          status: cashFlow > 0 ? (cashFlow > currentIncome * 0.2 ? 'good' : 'warning') : 'critical',
          message: cashFlow > 0 ? 
            `Positive cash flow of $${cashFlow.toFixed(2)} this month` : 
            `Negative cash flow of $${Math.abs(cashFlow).toFixed(2)} - review expenses`
        },
        {
          name: 'Savings Rate',
          status: savingsRate >= 20 ? 'good' : savingsRate >= 10 ? 'warning' : 'critical',
          message: `Saving ${savingsRate.toFixed(1)}% of income${savingsRate < 20 ? ' - aim for 20%' : ''}`
        },
        {
          name: 'Emergency Fund',
          status: emergencyFundMonths >= 6 ? 'good' : emergencyFundMonths >= 3 ? 'warning' : 'critical',
          message: `${emergencyFundMonths.toFixed(1)} months of expenses covered${emergencyFundMonths < 6 ? ' - build to 6 months' : ''}`
        },
        {
          name: 'Budget Adherence',
          status: budgetCompliance >= 90 ? 'good' : budgetCompliance >= 70 ? 'warning' : 'critical',
          message: `${budgetCompliance.toFixed(1)}% budget compliance${budgetCompliance < 90 ? ' - track spending more closely' : ''}`
        }
      ];

      res.json({
        score: overallScore,
        grade,
        factors
      });
    } catch (error) {
      console.error("Error calculating financial health:", error);
      res.status(500).json({ error: "Failed to calculate financial health" });
    }
  });

  // ========================================
  // SUBSCRIPTION & BILLING ROUTES
  // ========================================

  // Get subscription plans
  app.get('/api/subscription/plans', async (req, res) => {
    try {
      const plans = await storage.getSubscriptionPlans();
      
      // Parse features from JSON strings
      const plansWithFeatures = plans.map(plan => ({
        ...plan,
        features: typeof plan.features === 'string' ? JSON.parse(plan.features) : plan.features
      }));
      
      res.json(plansWithFeatures);
    } catch (error) {
      console.error("Error fetching subscription plans:", error);
      res.status(500).json({ error: "Failed to fetch subscription plans" });
    }
  });

  // Get current user subscription status
  app.get('/api/subscription/status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const now = new Date();
      const isTrialActive = user.trialEndsAt && new Date(user.trialEndsAt) > now;
      const isSubscriptionActive = user.subscriptionStatus === 'active' && 
        (!user.subscriptionEndsAt || new Date(user.subscriptionEndsAt) > now);

      res.json({
        subscriptionPlan: user.subscriptionPlan || 'free',
        subscriptionStatus: user.subscriptionStatus || 'free',
        isTrialActive,
        trialEndsAt: user.trialEndsAt,
        isSubscriptionActive: isSubscriptionActive || isTrialActive,
        subscriptionEndsAt: user.subscriptionEndsAt,
        stripeCustomerId: user.stripeCustomerId,
        hasStripeSubscription: !!user.stripeSubscriptionId
      });
    } catch (error) {
      console.error("Error fetching subscription status:", error);
      res.status(500).json({ error: "Failed to fetch subscription status" });
    }
  });

  // Create subscription checkout session
  app.post('/api/subscription/checkout', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { planId } = req.body;
      if (!planId) {
        return res.status(400).json({ error: "Plan ID is required" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const plan = await storage.getSubscriptionPlan(planId);
      if (!plan) {
        return res.status(404).json({ error: "Plan not found" });
      }

      // Create or retrieve Stripe customer
      let customerId = user.stripeCustomerId;
      
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: user.username,
          metadata: {
            userId: userId
          }
        });
        customerId = customer.id;
        
        // Update user with Stripe customer ID
        await storage.updateUserStripeInfo(userId, customerId);
      }

      // Create checkout session
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: plan.currency.toLowerCase(),
              product_data: {
                name: `${plan.name} Plan`,
                description: plan.description,
              },
              unit_amount: Math.round(parseFloat(plan.price) * 100),
              recurring: {
                interval: plan.interval,
              },
            },
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${req.headers.origin}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.headers.origin}/subscription/plans`,
        metadata: {
          userId: userId,
          planId: planId
        },
        subscription_data: {
          trial_period_days: plan.trialDays || 0,
          metadata: {
            userId: userId,
            planId: planId
          }
        }
      });

      res.json({ 
        sessionId: session.id,
        url: session.url 
      });
    } catch (error) {
      console.error("Error creating checkout session:", error);
      res.status(500).json({ error: "Failed to create checkout session" });
    }
  });

  // Handle successful checkout (verify session)
  app.post('/api/subscription/verify', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { sessionId } = req.body;
      if (!sessionId) {
        return res.status(400).json({ error: "Session ID is required" });
      }

      // Retrieve the session from Stripe
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      
      if (session.metadata?.userId !== userId) {
        return res.status(403).json({ error: "Unauthorized session" });
      }

      if (session.payment_status === 'paid') {
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
        const planId = session.metadata?.planId;
        
        if (planId) {
          const plan = await storage.getSubscriptionPlan(planId);
          
          if (plan) {
            // Calculate trial and subscription end dates
            const now = new Date();
            const trialEnd = subscription.trial_end ? new Date(subscription.trial_end * 1000) : null;
            const subscriptionEnd = new Date(subscription.current_period_end * 1000);

            // Update user subscription
            await storage.updateUserStripeInfo(userId, session.customer as string, subscription.id);
            await storage.updateUserSubscription(userId, {
              subscriptionPlan: plan.name.toLowerCase(),
              subscriptionStatus: subscription.status as any,
              trialEndsAt: trialEnd,
              subscriptionEndsAt: subscriptionEnd
            });
          }
        }
      }

      res.json({ 
        success: true,
        status: session.payment_status 
      });
    } catch (error) {
      console.error("Error verifying checkout session:", error);
      res.status(500).json({ error: "Failed to verify checkout session" });
    }
  });

  // Cancel subscription
  app.post('/api/subscription/cancel', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const user = await storage.getUser(userId);
      if (!user || !user.stripeSubscriptionId) {
        return res.status(404).json({ error: "No active subscription found" });
      }

      // Cancel at period end (user retains access until end of billing period)
      const subscription = await stripe.subscriptions.update(user.stripeSubscriptionId, {
        cancel_at_period_end: true
      });

      // Update user subscription status
      await storage.updateUserSubscription(userId, {
        subscriptionStatus: 'cancel_at_period_end' as any,
        subscriptionEndsAt: new Date(subscription.current_period_end * 1000)
      });

      res.json({ 
        success: true,
        message: "Subscription will be cancelled at the end of the billing period",
        endsAt: new Date(subscription.current_period_end * 1000)
      });
    } catch (error) {
      console.error("Error canceling subscription:", error);
      res.status(500).json({ error: "Failed to cancel subscription" });
    }
  });

  // Reactivate cancelled subscription
  app.post('/api/subscription/reactivate', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const user = await storage.getUser(userId);
      if (!user || !user.stripeSubscriptionId) {
        return res.status(404).json({ error: "No subscription found" });
      }

      // Remove the cancellation
      const subscription = await stripe.subscriptions.update(user.stripeSubscriptionId, {
        cancel_at_period_end: false
      });

      // Update user subscription status
      await storage.updateUserSubscription(userId, {
        subscriptionStatus: subscription.status as any,
        subscriptionEndsAt: new Date(subscription.current_period_end * 1000)
      });

      res.json({ 
        success: true,
        message: "Subscription reactivated successfully"
      });
    } catch (error) {
      console.error("Error reactivating subscription:", error);
      res.status(500).json({ error: "Failed to reactivate subscription" });
    }
  });

  // Stripe webhook for handling subscription events
  app.post('/api/webhook/stripe', async (req, res) => {
    const sig = req.headers['stripe-signature'];
    
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.log('Stripe webhook secret not configured');
      return res.status(400).send('Webhook secret not configured');
    }

    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig as string, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err: any) {
      console.log(`Webhook signature verification failed:`, err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      switch (event.type) {
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted':
          const subscription = event.data.object as Stripe.Subscription;
          const userId = subscription.metadata.userId;
          
          if (userId) {
            let status = subscription.status;
            const subscriptionEnd = new Date(subscription.current_period_end * 1000);
            
            if (event.type === 'customer.subscription.deleted') {
              status = 'cancelled';
            }
            
            await storage.updateUserSubscription(userId, {
              subscriptionStatus: status as any,
              subscriptionEndsAt: subscriptionEnd
            });
          }
          break;

        case 'invoice.payment_succeeded':
          // Handle successful payments
          console.log('Payment succeeded for subscription');
          break;

        case 'invoice.payment_failed':
          // Handle failed payments
          const invoice = event.data.object as Stripe.Invoice;
          const customerId = invoice.customer as string;
          
          // You could notify the user or update subscription status
          console.log('Payment failed for customer:', customerId);
          break;

        default:
          console.log(`Unhandled event type ${event.type}`);
      }

      res.json({ received: true });
    } catch (error) {
      console.error('Error processing webhook:', error);
      res.status(500).json({ error: 'Failed to process webhook' });
    }
  });

  // Assets routes
  app.get("/api/assets", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      
      const assets = await storage.getAssets(userId);
      res.json(assets);
    } catch (error) {
      console.error("Error getting assets:", error);
      res.status(500).json({ error: "Failed to get assets" });
    }
  });

  app.post("/api/assets", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      console.log('Received asset data:', req.body);
      const asset = insertAssetSchema.parse(req.body);
      console.log('Parsed asset data:', asset);
      const newAsset = await storage.createAsset(asset, userId);
      res.status(201).json(newAsset);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ error: "Invalid asset data", details: error.errors });
      } else {
        console.error("Error creating asset:", error);
        res.status(500).json({ error: "Failed to create asset" });
      }
    }
  });

  app.put("/api/assets/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      const { id } = req.params;
      const asset = insertAssetSchema.partial().parse(req.body);
      const updatedAsset = await storage.updateAsset(id, asset);
      
      if (!updatedAsset) {
        return res.status(404).json({ error: "Asset not found" });
      }
      
      res.json(updatedAsset);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ error: "Invalid asset data", details: error.errors });
      } else {
        console.error("Error updating asset:", error);
        res.status(500).json({ error: "Failed to update asset" });
      }
    }
  });

  app.delete("/api/assets/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      const { id } = req.params;
      const deleted = await storage.deleteAsset(id);
      
      if (!deleted) {
        return res.status(404).json({ error: "Asset not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting asset:", error);
      res.status(500).json({ error: "Failed to delete asset" });
    }
  });

  // Liabilities routes
  app.get("/api/liabilities", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      
      const liabilities = await storage.getLiabilities(userId);
      res.json(liabilities);
    } catch (error) {
      console.error("Error getting liabilities:", error);
      res.status(500).json({ error: "Failed to get liabilities" });
    }
  });

  app.post("/api/liabilities", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      const liability = insertLiabilitySchema.parse(req.body);
      const newLiability = await storage.createLiability(liability, userId);
      res.status(201).json(newLiability);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ error: "Invalid liability data", details: error.errors });
      } else {
        console.error("Error creating liability:", error);
        res.status(500).json({ error: "Failed to create liability" });
      }
    }
  });

  app.put("/api/liabilities/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      const { id } = req.params;
      const liability = insertLiabilitySchema.partial().parse(req.body);
      const updatedLiability = await storage.updateLiability(id, liability);
      
      if (!updatedLiability) {
        return res.status(404).json({ error: "Liability not found" });
      }
      
      res.json(updatedLiability);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ error: "Invalid liability data", details: error.errors });
      } else {
        console.error("Error updating liability:", error);
        res.status(500).json({ error: "Failed to update liability" });
      }
    }
  });

  app.delete("/api/liabilities/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      const { id } = req.params;
      const deleted = await storage.deleteLiability(id);
      
      if (!deleted) {
        return res.status(404).json({ error: "Liability not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting liability:", error);
      res.status(500).json({ error: "Failed to delete liability" });
    }
  });

  // Net Worth calculation endpoint
  app.get("/api/net-worth", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      const [assets, liabilities, accounts] = await Promise.all([
        storage.getAssets(userId),
        storage.getLiabilities(userId),
        storage.getAccounts(userId)
      ]);

      const totalAssets = assets.reduce((sum, asset) => sum + parseFloat(asset.currentValue || '0'), 0);
      const totalLiabilities = liabilities.reduce((sum, liability) => sum + parseFloat(liability.currentBalance || '0'), 0);
      const totalBankAccounts = accounts.reduce((sum, account) => {
        // Use the balance field and handle various balance formats
        const balance = account.currentBalance || account.balance || '0';
        const parsedBalance = parseFloat(balance.toString());
        console.log(`Account ${account.name}: balance = ${balance}, parsed = ${parsedBalance}`);
        return sum + (isNaN(parsedBalance) ? 0 : parsedBalance);
      }, 0);

      const totalNetWorth = totalAssets + totalBankAccounts - totalLiabilities;
      
      console.log(`Net Worth Calculation: Assets=${totalAssets}, BankAccounts=${totalBankAccounts}, Liabilities=${totalLiabilities}, NetWorth=${totalNetWorth}`);

      res.json({
        totalAssets,
        totalLiabilities,
        totalBankAccounts,
        totalNetWorth,
        breakdown: {
          assets: assets.map(asset => ({
            name: asset.name,
            type: asset.type,
            subtype: asset.subtype,
            value: parseFloat(asset.currentValue)
          })),
          liabilities: liabilities.map(liability => ({
            name: liability.name,
            type: liability.type,
            balance: parseFloat(liability.currentBalance)
          })),
          accounts: accounts.map(account => ({
            name: account.name,
            type: account.type,
            balance: parseFloat(account.currentBalance || account.balance || '0')
          }))
        }
      });
    } catch (error) {
      console.error("Error calculating net worth:", error);
      res.status(500).json({ error: "Failed to calculate net worth" });
    }
  });

  // Admin Support Endpoints (Admin Only)
  app.get("/api/admin/user/:userId", isAuthenticated, isAdmin, async (req, res) => {
    try {
      
      const { userId } = req.params;
      const user = await storage.getUser(userId);
      const accounts = await storage.getAccounts(userId);
      const transactions = await storage.getTransactions(userId);
      
      res.json({
        user: user ? {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          createdAt: user.createdAt
        } : null,
        accountCount: accounts.length,
        transactionCount: transactions.length,
        accounts: accounts.map(acc => ({
          id: acc.id,
          name: acc.name,
          institutionName: acc.institutionName,
          accountType: acc.type,
          hasAccessToken: !!acc.accessToken,
          lastSyncAt: acc.lastSyncAt,
          currentBalance: acc.currentBalance,
          plaidAccountId: acc.plaidAccountId
        })),
        recentTransactions: transactions.slice(0, 10).map(tx => ({
          id: tx.id,
          date: tx.date,
          description: tx.description,
          amount: tx.amount,
          category: tx.category,
          merchant: tx.merchant
        }))
      });
    } catch (error) {
      console.error('Admin user lookup error:', error);
      res.status(500).json({ message: "Failed to get user data" });
    }
  });

  app.post("/api/admin/sync-account/:accountId", isAuthenticated, isAdmin, async (req, res) => {
    try {
      
      const { accountId } = req.params;
      console.log(`Admin forced sync for account: ${accountId}`);
      
      const result = await storage.syncAccount(accountId);
      res.json(result);
    } catch (error) {
      console.error('Admin sync error:', error);
      res.status(500).json({ message: "Failed to sync account" });
    }
  });

  // Enhanced Recurring Detection API
  app.post('/api/enhanced-recurring-detection', isAuthenticated, async (req: any, res) => {
    try {
      const { description, amount, date } = req.body;
      const userId = getUserId(req);
      
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const result = await enhancedRecurringDetection.detectRecurringTransaction(
        description,
        amount,
        userId,
        new Date(date)
      );

      res.json(result);
    } catch (error) {
      console.error('Enhanced recurring detection error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Merchant Matching API
  app.post('/api/match-merchant', isAuthenticated, async (req: any, res) => {
    try {
      const { description, amount } = req.body;
      const userId = getUserId(req);
      
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const merchantMatch = await enhancedRecurringDetection.matchTransaction(
        description,
        amount,
        userId
      );

      res.json({ merchantMatch });
    } catch (error) {
      console.error('Merchant matching error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Admin Auto-Categorization using same algorithm as transaction import
  app.post('/api/admin/auto-categorize-transactions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      console.log(`🤖 Starting admin auto-categorization for user ${userId}...`);
      
      // Get all user transactions
      const userTransactions = await storage.getTransactions(userId);
      console.log(`Processing ${userTransactions.length} transactions for auto-categorization...`);
      
      // Import the same enhanced categorizer used during transaction import
      const { EnhancedTransactionCategorizer } = await import('./enhancedTransactionCategorizer');
      const categorizer = new EnhancedTransactionCategorizer();
      
      let updatedCount = 0;
      let totalProcessed = 0;
      const results = [];
      
      for (const transaction of userTransactions) {
        totalProcessed++;
        
        try {
          // Only categorize if transaction has generic or missing category
          const shouldRecategorize = !transaction.category || 
                                   transaction.category === 'Other' || 
                                   transaction.category === 'Uncategorized';
          
          if (shouldRecategorize) {
            // Use the exact same enhanced categorization logic as transaction import
            const categorization = await categorizer.categorize(
              transaction.description,
              parseFloat(transaction.amount),
              transaction.merchant
            );
            
            // Update transaction with new category
            await storage.updateTransaction(transaction.id, {
              category: categorization.category
            });
            
            updatedCount++;
            
            console.log(`✅ Categorized: "${transaction.description}" → ${categorization.category} (confidence: ${(categorization.confidence * 100).toFixed(1)}%, source: ${categorization.source})`);
            
            results.push({
              transactionId: transaction.id,
              description: transaction.description,
              oldCategory: transaction.category,
              newCategory: categorization.category,
              confidence: categorization.confidence,
              source: categorization.source,
              updated: true
            });
          }
        } catch (error) {
          console.error(`❌ Failed to categorize transaction ${transaction.id}:`, error);
        }
      }
      
      console.log(`✅ Admin auto-categorization complete: ${updatedCount}/${totalProcessed} transactions updated`);
      
      res.json({
        success: true,
        message: `Auto-categorization complete: ${updatedCount} transactions updated`,
        totalProcessed,
        updatedCount,
        results: results.slice(0, 20) // Return first 20 for preview
      });
    } catch (error) {
      console.error('Admin auto-categorization error:', error);
      res.status(500).json({ 
        success: false,
        message: "Failed to auto-categorize transactions", 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // Enhanced Detection for All Existing Transactions
  app.post('/api/transactions/enhanced-detection-batch', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      console.log(`🔍 Starting enhanced detection batch process for user ${userId}...`);
      
      // Get all user transactions
      const userTransactions = await storage.getTransactions(userId);
      console.log(`Processing ${userTransactions.length} transactions for enhanced detection...`);
      
      let detectedCount = 0;
      let updatedCount = 0;
      const results = [];
      
      for (const transaction of userTransactions) {
        try {
          const detectionResult = await enhancedRecurringDetection.detectRecurringTransaction(
            transaction.description,
            parseFloat(transaction.amount),
            userId,
            new Date(transaction.date)
          );
          
          if (detectionResult.isRecurring && detectionResult.merchant) {
            detectedCount++;
            
            // Update transaction if confidence is high and different from current
            const shouldUpdate = detectionResult.finalConfidence > 0.7 && (
              !transaction.merchant || 
              transaction.merchant !== detectionResult.merchant.merchantName ||
              !transaction.category ||
              transaction.category === 'Other' ||
              transaction.category !== detectionResult.merchant.category
            );
            
            if (shouldUpdate) {
              await storage.updateTransaction(transaction.id, {
                category: detectionResult.merchant.category,
                merchant: detectionResult.merchant.merchantName
              });
              updatedCount++;
              
              console.log(`✅ Enhanced: "${transaction.description}" → ${detectionResult.merchant.merchantName} (${detectionResult.merchant.category}) [${(detectionResult.finalConfidence * 100).toFixed(1)}%]`);
            }
            
            results.push({
              transactionId: transaction.id,
              description: transaction.description,
              detectedMerchant: detectionResult.merchant.merchantName,
              detectedCategory: detectionResult.merchant.category,
              confidence: detectionResult.finalConfidence,
              updated: shouldUpdate
            });
          }
        } catch (detectionError) {
          console.warn(`Detection failed for transaction ${transaction.id}:`, detectionError);
        }
      }
      
      console.log(`🎯 Enhanced detection batch completed: ${detectedCount} detected, ${updatedCount} updated out of ${userTransactions.length} total transactions`);
      
      res.json({
        success: true,
        totalTransactions: userTransactions.length,
        detectedRecurring: detectedCount,
        updatedTransactions: updatedCount,
        results: results.slice(0, 20) // Return first 20 results to avoid large response
      });
    } catch (error) {
      console.error('Enhanced detection batch error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // User Recurring Overrides - Manual marking of merchants as recurring/non-recurring
  app.get('/api/user/recurring-overrides', isAuthenticated, async (req: any, res) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      const { default: UserRecurringOverrideService } = await import('./userRecurringOverrides');
      const overrides = await UserRecurringOverrideService.getUserOverrides(req.user.id);
      
      res.json(overrides);
    } catch (error) {
      console.error('Error fetching user recurring overrides:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Apply manual recurring selection
  app.post('/api/user/recurring-overrides/manual-selection', isAuthenticated, async (req: any, res) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      const { 
        merchantName,
        selectedTransactionIds,
        applyToFuture = true
      } = req.body;

      if (!merchantName || !selectedTransactionIds || !Array.isArray(selectedTransactionIds)) {
        return res.status(400).json({ message: 'Invalid request data' });
      }

      const { default: UserRecurringOverrideService } = await import('./userRecurringOverrides');
      
      // Apply the manual selection
      const result = await UserRecurringOverrideService.applyManualSelection({
        userId: req.user.id,
        merchantName,
        selectedTransactionIds,
        applyToFuture
      });

      res.json({
        success: true,
        message: `Applied manual selection for ${merchantName}`,
        result
      });
    } catch (error) {
      console.error('Error applying manual recurring selection:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Create or update recurring override
  app.post('/api/user/recurring-overrides', isAuthenticated, async (req: any, res) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      const { 
        merchantName, 
        originalMerchant,
        recurringStatus, 
        applyToAll = true, 
        reason,
        triggerTransactionId 
      } = req.body;

      if (!merchantName || !recurringStatus || !['recurring', 'non-recurring'].includes(recurringStatus)) {
        return res.status(400).json({ message: 'Invalid request data' });
      }

      const { default: UserRecurringOverrideService } = await import('./userRecurringOverrides');
      
      // Check if override already exists
      const existingOverride = await UserRecurringOverrideService.getOverrideForMerchant(
        req.user.id, 
        merchantName
      );

      let result;
      if (existingOverride) {
        // Update existing override
        result = await UserRecurringOverrideService.updateOverride(existingOverride.id, {
          recurringStatus,
          applyToAll,
          reason,
          triggerTransactionId
        });
      } else {
        // Create new override
        const relatedCount = await UserRecurringOverrideService.getRelatedTransactionCount(
          req.user.id, 
          merchantName
        );

        result = await UserRecurringOverrideService.createOverride({
          userId: req.user.id,
          merchantName,
          originalMerchant,
          recurringStatus,
          applyToAll,
          reason,
          triggerTransactionId,
          relatedTransactionCount: relatedCount
        });
      }

      res.json(result);
    } catch (error) {
      console.error('Error creating recurring override:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Get related transactions for a merchant (for user review)
  app.get('/api/user/recurring-overrides/related-transactions', isAuthenticated, async (req: any, res) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      const { merchant } = req.query;
      if (!merchant) {
        return res.status(400).json({ message: 'Merchant name required' });
      }

      const { default: UserRecurringOverrideService } = await import('./userRecurringOverrides');
      const relatedTransactions = await UserRecurringOverrideService.getRelatedTransactions(
        req.user.id, 
        merchant as string
      );

      res.json({
        merchant,
        count: relatedTransactions.length,
        transactions: relatedTransactions
      });
    } catch (error) {
      console.error('Error fetching related transactions:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Get grouped related transactions for better merchant analysis
  app.get('/api/user/recurring-overrides/grouped-transactions', isAuthenticated, async (req: any, res) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      const { merchant } = req.query;
      if (!merchant) {
        return res.status(400).json({ message: 'Merchant name required' });
      }

      const { default: UserRecurringOverrideService } = await import('./userRecurringOverrides');
      const groupedTransactions = await UserRecurringOverrideService.getGroupedRelatedTransactions(
        req.user.id, 
        merchant as string
      );

      res.json({
        merchant,
        ...groupedTransactions
      });
    } catch (error) {
      console.error('Error fetching grouped transactions:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Get merchant transaction counts for review system
  app.get('/api/user/recurring-overrides/merchant-counts', isAuthenticated, async (req: any, res) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      const { default: UserRecurringOverrideService } = await import('./userRecurringOverrides');
      
      // Get counts for common merchants that appear in review system
      const merchants = ['Netflix', 'Uber Eats', 'Spotify Premium', 'Amazon Prime', 'LA Fitness'];
      const merchantCounts: Record<string, number> = {};
      
      for (const merchant of merchants) {
        const count = await UserRecurringOverrideService.getRelatedTransactionCount(
          req.user.id, 
          merchant
        );
        merchantCounts[merchant] = count;
      }

      res.json(merchantCounts);
    } catch (error) {
      console.error('Error fetching merchant counts:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Get override summary for user dashboard
  app.get('/api/user/recurring-overrides/summary', isAuthenticated, async (req: any, res) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      const { default: UserRecurringOverrideService } = await import('./userRecurringOverrides');
      const summary = await UserRecurringOverrideService.getOverrideSummary(req.user.id);
      
      res.json(summary);
    } catch (error) {
      console.error('Error fetching override summary:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Delete/deactivate a recurring override
  app.delete('/api/user/recurring-overrides/:id', isAuthenticated, async (req: any, res) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      const { id } = req.params;
      const { default: UserRecurringOverrideService } = await import('./userRecurringOverrides');
      
      const success = await UserRecurringOverrideService.deactivateOverride(id);
      
      if (success) {
        res.json({ message: 'Override deactivated successfully' });
      } else {
        res.status(404).json({ message: 'Override not found' });
      }
    } catch (error) {
      console.error('Error deactivating override:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Transaction classification endpoint - classifies both category and recurring status
  app.post('/api/transactions/:id/classify', isAuthenticated, async (req: any, res) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      const { id } = req.params;
      
      // Get transaction
      const transaction = await storage.getTransactionById(id);
      if (!transaction || transaction.userId !== req.user.id) {
        return res.status(404).json({ message: 'Transaction not found' });
      }

      const { default: TransactionClassificationService } = await import('./transactionClassification');
      const classification = await TransactionClassificationService.classifyTransaction(
        transaction,
        req.user.id
      );

      res.json({
        transactionId: id,
        classification
      });
    } catch (error) {
      console.error('Error classifying transaction:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Register trial reminder routes
  const { registerTrialRoutes } = await import("./routes-trial");
  registerTrialRoutes(app);

  // Register notification routes
  const notificationRoutes = (await import('./routes/notifications.js')).default;
  app.use('/api/notifications', isAuthenticated, notificationRoutes);

  // Widget Layout routes
  app.get('/api/widget-layout', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const deviceId = req.query.deviceId as string | undefined;
      const layout = await storage.getWidgetLayout(userId, deviceId);
      
      if (layout) {
        res.json(layout);
      } else {
        // Return default layout if none exists
        res.json({
          layoutData: {
            left: ["netWorth", "accounts", "transactions"],
            right: ["bills", "budgets", "spending"],
            bottom: ["cashflow", "tracker", "goals", "netIncome", "insights"],
          }
        });
      }
    } catch (error) {
      console.error("Error fetching widget layout:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post('/api/widget-layout', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Add userId to the request body before validation
      const dataWithUserId = { ...req.body, userId };
      const validatedData = insertWidgetLayoutSchema.parse(dataWithUserId);
      const layout = await storage.saveWidgetLayout(validatedData, userId);
      
      res.json(layout);
    } catch (error) {
      if (error instanceof ZodError) {
        console.error("Widget layout validation error:", {
          requestBody: req.body,
          dataWithUserId: { ...req.body, userId },
          zodErrors: error.issues
        });
        return res.status(400).json({ 
          message: "Invalid layout data", 
          errors: error.issues 
        });
      }
      console.error("Error saving widget layout:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
