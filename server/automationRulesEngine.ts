// Automation Rules Engine
// Applies user-created automation rules to transactions

import { AutomationRule, Transaction, InsertTransaction } from '../shared/schema';

interface RuleApplication {
  ruleId: string;
  ruleName: string;
  applied: boolean;
  reason?: string;
}

class AutomationRulesEngine {
  /**
   * Apply automation rules to a single transaction
   */
  async applyRulesToTransaction(
    transaction: InsertTransaction | Transaction,
    userRules: AutomationRule[]
  ): Promise<{ updatedTransaction: InsertTransaction | Transaction; applications: RuleApplication[] }> {
    const applications: RuleApplication[] = [];
    let updatedTransaction = { ...transaction };

    // Sort rules by priority (higher numbers first)
    const sortedRules = userRules
      .filter(rule => rule.isActive)
      .sort((a, b) => (b.priority || 0) - (a.priority || 0));

    for (const rule of sortedRules) {
      const application = this.evaluateRule(rule, updatedTransaction);
      applications.push(application);

      if (application.applied) {
        updatedTransaction = this.applyRuleActions(rule, updatedTransaction);
        
        // Update applied count for rule
        await this.incrementRuleAppliedCount(rule.id);
        
        console.log(`✅ Applied automation rule "${rule.name}" to transaction: ${updatedTransaction.description}`);
      }
    }

    return { updatedTransaction, applications };
  }

  /**
   * Apply automation rules to multiple transactions in batch
   */
  async applyRulesToTransactions(
    transactions: (InsertTransaction | Transaction)[],
    userRules: AutomationRule[]
  ): Promise<{ updatedTransactions: (InsertTransaction | Transaction)[]; totalApplications: number }> {
    const updatedTransactions = [];
    let totalApplications = 0;

    console.log(`🔧 AutomationRulesEngine: Processing ${transactions.length} transactions with ${userRules.length} rules`);
    console.log(`📋 Active rules: ${userRules.filter(r => r.isActive).map(r => r.name).join(', ')}`);

    for (const transaction of transactions) {
      const { updatedTransaction, applications } = await this.applyRulesToTransaction(transaction, userRules);
      updatedTransactions.push(updatedTransaction);
      totalApplications += applications.filter(app => app.applied).length;
      
      // Log if transaction was modified
      if (transaction.description !== updatedTransaction.description) {
        console.log(`📝 Transaction rename: "${transaction.description}" → "${updatedTransaction.description}" (ID: ${transaction.id})`);
      }
    }

    if (totalApplications > 0) {
      console.log(`✅ Automation rules: Applied ${totalApplications} rule applications across ${transactions.length} transactions`);
    }

    return { updatedTransactions, totalApplications };
  }

  /**
   * Evaluate if a rule matches a transaction
   */
  private evaluateRule(rule: AutomationRule, transaction: InsertTransaction | Transaction): RuleApplication {
    const application: RuleApplication = {
      ruleId: rule.id,
      ruleName: rule.name,
      applied: false
    };

    try {
      // Check transaction type filter
      if (rule.transactionType && rule.transactionType !== 'both') {
        const transactionType = transaction.type || (parseFloat(transaction.amount) > 0 ? 'expense' : 'income');
        if (rule.transactionType !== transactionType) {
          application.reason = `Transaction type ${transactionType} doesn't match rule filter ${rule.transactionType}`;
          return application;
        }
      }

      // Check amount range
      const amount = Math.abs(parseFloat(transaction.amount));
      if (rule.amountMin !== null && amount < parseFloat(rule.amountMin.toString())) {
        application.reason = `Amount ${amount} below minimum ${rule.amountMin}`;
        return application;
      }
      if (rule.amountMax !== null && amount > parseFloat(rule.amountMax.toString())) {
        application.reason = `Amount ${amount} above maximum ${rule.amountMax}`;
        return application;
      }

      // Check merchant pattern
      if (rule.merchantPattern) {
        const merchant = transaction.merchant || '';
        if (!this.matchesPattern(merchant, rule.merchantPattern)) {
          application.reason = `Merchant "${merchant}" doesn't match pattern "${rule.merchantPattern}"`;
          return application;
        }
      }

      // Check description pattern
      if (rule.descriptionPattern) {
        const description = transaction.description || '';
        if (!this.matchesPattern(description, rule.descriptionPattern)) {
          application.reason = `Description "${description}" doesn't match pattern "${rule.descriptionPattern}"`;
          return application;
        }
      }

      // If we get here, all conditions passed
      application.applied = true;
      application.reason = 'All conditions matched';
      return application;

    } catch (error) {
      application.reason = `Error evaluating rule: ${error}`;
      return application;
    }
  }

  /**
   * Apply rule actions to a transaction
   */
  private applyRuleActions(rule: AutomationRule, transaction: InsertTransaction | Transaction): InsertTransaction | Transaction {
    const updated = { ...transaction };

    // Apply category assignment
    if (rule.setCategoryId) {
      updated.categoryId = rule.setCategoryId;
    }

    // Apply transaction rename
    if (rule.renameTransactionTo) {
      updated.description = rule.renameTransactionTo;
    }

    // Apply tag assignments (if transaction has tagIds field)
    if (rule.addTagIds && rule.addTagIds.length > 0 && 'tagIds' in updated) {
      const existingTagIds = (updated as any).tagIds || [];
      const newTagIds = Array.from(new Set([...existingTagIds, ...rule.addTagIds]));
      (updated as any).tagIds = newTagIds;
    }

    // Apply other rule flags (these would affect how transaction is processed in reports/budgets)
    if (rule.ignoreForBudgeting || rule.ignoreForReporting) {
      // These flags would be used in analytics/reporting logic
      (updated as any).ignoreForBudgeting = rule.ignoreForBudgeting;
      (updated as any).ignoreForReporting = rule.ignoreForReporting;
    }

    return updated;
  }

  /**
   * Check if a text matches a pattern (supports simple wildcards)
   */
  private matchesPattern(text: string, pattern: string): boolean {
    // Convert pattern to case-insensitive regex
    // Support wildcards: * for any characters, ? for single character
    const regexPattern = pattern
      .toLowerCase()
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.')
      .replace(/[+\-\[\]{}()|^$\.\\]/g, '\\$&'); // Escape special regex chars except * and ?

    const regex = new RegExp(regexPattern, 'i');
    return regex.test(text.toLowerCase());
  }

  /**
   * Increment the applied count for a rule
   */
  private async incrementRuleAppliedCount(ruleId: string): Promise<void> {
    try {
      const { storage } = await import('./storage');
      await storage.incrementAutomationRuleAppliedCount(ruleId);
    } catch (error) {
      console.error('Failed to increment rule applied count:', error);
    }
  }
}

export { AutomationRulesEngine };
export const automationRulesEngine = new AutomationRulesEngine();