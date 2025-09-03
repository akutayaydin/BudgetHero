import { db } from "./db";
import { 
  events, 
  syncStatus, 
  apyOffers, 
  subscriptions, 
  accounts, 
  transactions, 
  institutions,
  type InsertEvent,
  type InsertSyncStatus,
  type Event,
  type SyncStatus,
  type ApyOffer,
  type Subscription
} from "@shared/schema";
import { eq, and, desc, sql, gte, count, avg } from "drizzle-orm";

// Event logging service for KPI tracking
export class EventLogger {
  static async logEvent(eventData: InsertEvent): Promise<void> {
    try {
      await db.insert(events).values(eventData);
    } catch (error) {
      console.error("Failed to log event:", error);
    }
  }

  static async logSyncStart(userId: string, institutionId: string): Promise<void> {
    await this.logEvent({
      userId,
      institutionId,
      eventType: "sync_start",
      eventData: { timestamp: new Date().toISOString() },
      success: true,
    });
  }

  static async logSyncComplete(
    userId: string, 
    institutionId: string, 
    latencyMs: number, 
    success: boolean,
    errorMessage?: string
  ): Promise<void> {
    await this.logEvent({
      userId,
      institutionId,
      eventType: "sync_complete",
      eventData: { latency: latencyMs },
      latencyMs,
      success,
      errorMessage,
    });
  }

  static async logDigestViewed(userId: string): Promise<void> {
    await this.logEvent({
      userId,
      eventType: "digest_viewed",
      eventData: { timestamp: new Date().toISOString() },
      success: true,
    });
  }

  static async logTileView(userId: string, tileType: string): Promise<void> {
    await this.logEvent({
      userId,
      eventType: "tile_view",
      eventData: { tile_type: tileType },
      success: true,
    });
  }

  static async logTileClick(userId: string, tileType: string): Promise<void> {
    await this.logEvent({
      userId,
      eventType: "tile_click",
      eventData: { tile_type: tileType },
      success: true,
    });
  }
}

// Sync management service
export class SyncDigestService {
  // Update or create sync status for an institution
  static async updateSyncStatus(statusData: Omit<InsertSyncStatus, 'id'>): Promise<void> {
    const existing = await db
      .select()
      .from(syncStatus)
      .where(
        and(
          eq(syncStatus.userId, statusData.userId),
          eq(syncStatus.institutionId, statusData.institutionId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(syncStatus)
        .set({
          ...statusData,
          updatedAt: new Date(),
        })
        .where(eq(syncStatus.id, existing[0].id));
    } else {
      await db.insert(syncStatus).values(statusData);
    }
  }

  // Get sync digest data for a user
  static async getSyncDigest(userId: string): Promise<{
    summary: {
      newTransactions: number;
      updatedTransactions: number;
      duplicatesRemoved: number;
    };
    institutions: Array<SyncStatus & { institutionName: string | null; institutionLogo?: string | null }>;
    lastSyncAt?: Date;
  }> {
    // Get institution sync statuses with institution details
    const institutionStatuses = await db
      .select({
        id: syncStatus.id,
        userId: syncStatus.userId,
        institutionId: syncStatus.institutionId,
        status: syncStatus.status,
        lastSyncAt: syncStatus.lastSyncAt,
        lastSuccessAt: syncStatus.lastSuccessAt,
        retryCount: syncStatus.retryCount,
        maxRetries: syncStatus.maxRetries,
        nextRetryAt: syncStatus.nextRetryAt,
        errorMessage: syncStatus.errorMessage,
        newTransactionsCount: syncStatus.newTransactionsCount,
        updatedTransactionsCount: syncStatus.updatedTransactionsCount,
        duplicatesRemovedCount: syncStatus.duplicatesRemovedCount,
        createdAt: syncStatus.createdAt,
        updatedAt: syncStatus.updatedAt,
        institutionName: institutions.name,
        institutionLogo: institutions.logo,
      })
      .from(syncStatus)
      .leftJoin(institutions, eq(syncStatus.institutionId, institutions.id))
      .where(eq(syncStatus.userId, userId))
      .orderBy(desc(syncStatus.lastSyncAt));

    // Calculate summary totals
    const summary = institutionStatuses.reduce(
      (acc, status) => ({
        newTransactions: acc.newTransactions + (status.newTransactionsCount || 0),
        updatedTransactions: acc.updatedTransactions + (status.updatedTransactionsCount || 0),
        duplicatesRemoved: acc.duplicatesRemoved + (status.duplicatesRemovedCount || 0),
      }),
      { newTransactions: 0, updatedTransactions: 0, duplicatesRemoved: 0 }
    );

    const lastSyncAt = institutionStatuses.length > 0 
      ? institutionStatuses[0].lastSyncAt 
      : undefined;

    return {
      summary,
      institutions: institutionStatuses,
      lastSyncAt: lastSyncAt || undefined,
    };
  }

  // Handle auto-retry logic with exponential backoff
  static async scheduleRetry(userId: string, institutionId: string): Promise<void> {
    const status = await db
      .select()
      .from(syncStatus)
      .where(
        and(
          eq(syncStatus.userId, userId),
          eq(syncStatus.institutionId, institutionId)
        )
      )
      .limit(1);

    if (status.length === 0) return;

    const currentStatus = status[0];
    const newRetryCount = (currentStatus.retryCount || 0) + 1;

    if (newRetryCount <= (currentStatus.maxRetries || 3)) {
      // Exponential backoff: 2^retry * 60 seconds
      const backoffMinutes = Math.pow(2, newRetryCount - 1) * 1;
      const nextRetryAt = new Date(Date.now() + backoffMinutes * 60 * 1000);

      await db
        .update(syncStatus)
        .set({
          retryCount: newRetryCount,
          nextRetryAt,
          status: "pending",
          updatedAt: new Date(),
        })
        .where(eq(syncStatus.id, currentStatus.id));
    } else {
      // Max retries reached, mark as failed
      await db
        .update(syncStatus)
        .set({
          status: "failed",
          updatedAt: new Date(),
        })
        .where(eq(syncStatus.id, currentStatus.id));
    }
  }

  // Get APY opportunities based on user's savings account balances
  static async getApyOpportunities(userId: string): Promise<{
    currentApy: number;
    bestApy: number;
    monthlyImpact: number;
    offers: ApyOffer[];
    totalSavingsBalance: number;
  }> {
    // Get user's savings accounts
    const savingsAccounts = await db
      .select()
      .from(accounts)
      .where(
        and(
          eq(accounts.userId, userId),
          eq(accounts.type, "savings"),
          eq(accounts.isActive, true)
        )
      );

    const totalSavingsBalance = savingsAccounts.reduce(
      (sum, account) => sum + parseFloat(account.currentBalance || "0"),
      0
    );

    // Get best APY offers
    const offers = await db
      .select()
      .from(apyOffers)
      .where(eq(apyOffers.isActive, true))
      .orderBy(desc(apyOffers.apyPct))
      .limit(5);

    const currentApy = 0; // Assume 0% for savings accounts (could be enhanced to track actual APY)
    const bestApy = offers.length > 0 ? parseFloat(offers[0].apyPct.toString()) : 0;
    
    // Calculate monthly impact: (bestAPY - currentAPY) * balance / 12
    const annualImpact = (bestApy - currentApy) / 100 * totalSavingsBalance;
    const monthlyImpact = annualImpact / 12;

    return {
      currentApy,
      bestApy,
      monthlyImpact,
      offers,
      totalSavingsBalance,
    };
  }

  // Get bills and subscriptions insights
  static async getBillsAndSubscriptions(userId: string): Promise<{
    upcomingBills: Subscription[];
    totalMonthlySubscriptions: number;
    cancelableSubscriptions: Subscription[];
  }> {
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Get upcoming bills (next 7 days)
    const upcomingBills = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, userId),
          eq(subscriptions.isActive, true),
          eq(subscriptions.type, "bill"),
          gte(subscriptions.nextDueDate, now)
        )
      )
      .orderBy(subscriptions.nextDueDate)
      .limit(5);

    // Get all active subscriptions for monthly total
    const allSubscriptions = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, userId),
          eq(subscriptions.isActive, true),
          eq(subscriptions.type, "subscription")
        )
      );

    const totalMonthlySubscriptions = allSubscriptions.reduce((sum, sub) => {
      const amount = parseFloat(sub.amount.toString());
      // Convert to monthly amount based on frequency
      switch (sub.frequency) {
        case "monthly": return sum + amount;
        case "yearly": return sum + (amount / 12);
        case "quarterly": return sum + (amount / 3);
        case "weekly": return sum + (amount * 4.33);
        default: return sum + amount;
      }
    }, 0);

    // Identify potentially cancelable subscriptions (entertainment, streaming)
    const cancelableSubscriptions = allSubscriptions.filter(sub => 
      sub.name.toLowerCase().includes("netflix") ||
      sub.name.toLowerCase().includes("spotify") ||
      sub.name.toLowerCase().includes("disney") ||
      sub.name.toLowerCase().includes("hulu") ||
      sub.name.toLowerCase().includes("gym") ||
      sub.name.toLowerCase().includes("subscription")
    );

    return {
      upcomingBills,
      totalMonthlySubscriptions,
      cancelableSubscriptions,
    };
  }

  // Duplicate detection and handling
  static async handleDuplicateTransactions(userId: string): Promise<number> {
    // Find potential duplicates: same amount, same merchant, within 3 days
    // Focus on pending → posted matches
    const potentialDuplicates = await db.execute(sql`
      WITH duplicate_groups AS (
        SELECT 
          t1.id as pending_id,
          t2.id as posted_id,
          t1.amount,
          t1.merchant,
          t1.date as pending_date,
          t2.date as posted_date
        FROM transactions t1
        JOIN transactions t2 ON (
          t1.user_id = t2.user_id
          AND t1.account_id = t2.account_id
          AND t1.amount = t2.amount
          AND t1.merchant = t2.merchant
          AND t1.is_pending = true
          AND t2.is_pending = false
          AND ABS(EXTRACT(EPOCH FROM (t2.date - t1.date))) <= 259200 -- 3 days in seconds
          AND t1.id != t2.id
        )
        WHERE t1.user_id = ${userId}
      )
      SELECT pending_id FROM duplicate_groups
    `);

    const duplicateIds = (potentialDuplicates as any[]).map((row: any) => row.pending_id);
    
    if (duplicateIds.length > 0) {
      // Soft delete duplicates (mark as inactive or add a flag)
      await db
        .update(transactions)
        .set({ 
          merchant: sql`CONCAT(${transactions.merchant}, ' (DUPLICATE)')`,
        })
        .where(sql`id = ANY(${duplicateIds})`);
    }

    return duplicateIds.length;
  }

  // Get KPI metrics
  static async getKpiMetrics(userId?: string): Promise<{
    medianSyncLatency: number;
    errorRate: number;
    tileClickThroughRate: number;
    totalSyncs: number;
    totalErrors: number;
  }> {
    const whereClause = userId ? eq(events.userId, userId) : sql`1 = 1`;
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Get sync performance metrics
    const syncMetrics = await db
      .select({
        avgLatency: avg(events.latencyMs),
        totalSyncs: count(),
        totalErrors: sql<number>`SUM(CASE WHEN success = false THEN 1 ELSE 0 END)`,
      })
      .from(events)
      .where(
        and(
          whereClause,
          eq(events.eventType, "sync_complete"),
          gte(events.createdAt, last24Hours)
        )
      );

    // Get tile engagement metrics
    const tileViews = await db
      .select({ count: count() })
      .from(events)
      .where(
        and(
          whereClause,
          eq(events.eventType, "tile_view"),
          gte(events.createdAt, last24Hours)
        )
      );

    const tileClicks = await db
      .select({ count: count() })
      .from(events)
      .where(
        and(
          whereClause,
          eq(events.eventType, "tile_click"),
          gte(events.createdAt, last24Hours)
        )
      );

    const metrics = syncMetrics[0] || { avgLatency: 0, totalSyncs: 0, totalErrors: 0 };
    const viewCount = tileViews[0]?.count || 0;
    const clickCount = tileClicks[0]?.count || 0;

    return {
      medianSyncLatency: Number(metrics.avgLatency) || 0,
      errorRate: metrics.totalSyncs > 0 ? (Number(metrics.totalErrors) / Number(metrics.totalSyncs)) * 100 : 0,
      tileClickThroughRate: viewCount > 0 ? (clickCount / viewCount) * 100 : 0,
      totalSyncs: Number(metrics.totalSyncs) || 0,
      totalErrors: Number(metrics.totalErrors) || 0,
    };
  }
}