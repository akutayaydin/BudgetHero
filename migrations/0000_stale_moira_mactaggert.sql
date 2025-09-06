CREATE TABLE "accounts" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" varchar NOT NULL,
  "institution_id" varchar,
  "external_account_id" text,
  "access_token" text,
  "plaid_account_id" text,
  "name" text NOT NULL,
  "official_name" text,
  "type" varchar(50) NOT NULL,
  "subtype" varchar(50),
  "mask" varchar(10),
  "current_balance" numeric(12, 2),
  "available_balance" numeric(12, 2),
  "credit_limit" numeric(12, 2),
  "balance" numeric(12, 2),
  "institution_name" text,
  "is_active" boolean DEFAULT true,
  "connection_source" varchar(20) DEFAULT 'manual',
  "last_sync_at" timestamp,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "admin_categories" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "subcategory" text,
  "ledger_type" text NOT NULL,
  "budget_type" text DEFAULT 'FLEXIBLE' NOT NULL,
  "plaid_primary" text,
  "plaid_detailed" text,
  "description" text,
  "parent_id" varchar,
  "color" text NOT NULL,
  "is_active" boolean DEFAULT true,
  "sort_order" integer DEFAULT 0,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "apy_offers" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "bank" text NOT NULL,
  "product_name" text NOT NULL,
  "apy_pct" numeric(5, 2) NOT NULL,
  "apy_bps" integer NOT NULL,
  "min_deposit" numeric(10, 2) DEFAULT '0',
  "direct_deposit_required" boolean DEFAULT false,
  "monthly_fee" numeric(6, 2) DEFAULT '0',
  "product_url" text,
  "source_url" text,
  "as_of_date" timestamp NOT NULL,
  "notes" text,
  "is_active" boolean DEFAULT true,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "assets" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" varchar NOT NULL,
  "name" text NOT NULL,
  "type" varchar(50) NOT NULL,
  "subtype" varchar(50) NOT NULL,
  "current_value" numeric(12, 2) NOT NULL,
  "purchase_value" numeric(12, 2),
  "purchase_date" timestamp,
  "description" text,
  "notes" text,
  "include_in_net_worth" boolean DEFAULT true,
  "is_active" boolean DEFAULT true,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "automation_rules" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" varchar NOT NULL,
  "name" text NOT NULL,
  "description" text,
  "is_active" boolean DEFAULT true,
  "priority" integer DEFAULT 0,
  "merchant_pattern" text,
  "description_pattern" text,
  "amount_min" numeric(10, 2),
  "amount_max" numeric(10, 2),
  "transaction_type" text DEFAULT 'both',
  "set_category_id" varchar,
  "add_tag_ids" text[],
  "rename_transaction_to" text,
  "ignore_transaction" boolean DEFAULT false,
  "ignore_for_budgeting" boolean DEFAULT false,
  "ignore_for_reporting" boolean DEFAULT false,
  "enable_category_change" boolean DEFAULT false,
  "enable_rename" boolean DEFAULT false,
  "enable_tagging" boolean DEFAULT false,
  "enable_ignore" boolean DEFAULT false,
  "applied_count" integer DEFAULT 0,
  "last_applied_at" timestamp,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "bill_notifications" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" varchar NOT NULL,
  "bill_id" varchar NOT NULL,
  "bill_name" text,
  "bill_type" text,
  "amount" numeric(12, 2),
  "due_date" timestamp,
  "scheduled_for" timestamp NOT NULL,
  "notification_date" timestamp,
  "notification_type" text NOT NULL,
  "method" text NOT NULL,
  "status" text DEFAULT 'pending' NOT NULL,
  "sent_at" timestamp,
  "error_message" text,
  "is_read" boolean DEFAULT false,
  "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "budget_plans" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" varchar NOT NULL,
  "month" varchar(7) NOT NULL,
  "expected_earnings" numeric(10, 2) NOT NULL,
  "expected_bills" numeric(10, 2) NOT NULL,
  "savings_rate" integer NOT NULL,
  "savings_reserve" numeric(10, 2) NOT NULL,
  "spending_budget" numeric(10, 2) NOT NULL,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now(),
  CONSTRAINT "budget_plans_user_id_month_unique" UNIQUE("user_id","month")
);
--> statement-breakpoint
CREATE TABLE "budgets" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "limit" numeric(10, 2) NOT NULL,
  "spent" numeric(10, 2) DEFAULT '0' NOT NULL,
  "user_id" varchar,
  "category" text,
  "rationale" text,
  "budget_type" varchar(20) DEFAULT 'manual',
  "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "categories" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "ledger_type" text NOT NULL,
  "color" text NOT NULL,
  "is_default" text DEFAULT 'false',
  "user_id" varchar,
  "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "categorization_rules" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" varchar NOT NULL,
  "rule_name" text NOT NULL,
  "merchant_pattern" text,
  "description_pattern" text,
  "amount_min" numeric(10, 2),
  "amount_max" numeric(10, 2),
  "category" text NOT NULL,
  "category_id" varchar,
  "is_active" boolean DEFAULT true,
  "priority" integer DEFAULT 0,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "events" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" varchar,
  "event_type" varchar(50) NOT NULL,
  "event_data" jsonb,
  "institution_id" varchar,
  "latency_ms" integer,
  "success" boolean,
  "error_message" text,
  "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "goals" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "target" numeric(10, 2) NOT NULL,
  "saved" numeric(10, 2) DEFAULT '0' NOT NULL,
  "user_id" varchar,
  "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "institutions" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "logo" text,
  "primary_color" varchar(7),
  "url" text,
  "plaid_institution_id" text,
  "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "liabilities" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" varchar NOT NULL,
  "name" text NOT NULL,
  "type" varchar(50) NOT NULL,
  "subtype" varchar(50) NOT NULL,
  "current_balance" numeric(12, 2) NOT NULL,
  "original_amount" numeric(12, 2),
  "interest_rate" numeric(5, 2),
  "monthly_payment" numeric(10, 2),
  "minimum_payment" numeric(10, 2),
  "due_date" timestamp,
  "payoff_date" timestamp,
  "description" text,
  "notes" text,
  "is_active" boolean DEFAULT true,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "manual_subscriptions" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" varchar NOT NULL,
  "name" text NOT NULL,
  "amount" numeric(10, 2),
  "frequency" text NOT NULL,
  "start_date" timestamp NOT NULL,
  "end_date" timestamp,
  "is_trial" boolean DEFAULT false,
  "trial_ends_at" timestamp,
  "category" text NOT NULL,
  "notes" text,
  "is_active" boolean DEFAULT true,
  "linked_recurring_transaction_id" varchar,
  "reminder_enabled" boolean DEFAULT true,
  "reminder_days" integer DEFAULT 7,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" varchar NOT NULL,
  "token" text NOT NULL,
  "expires_at" timestamp NOT NULL,
  "is_used" boolean DEFAULT false,
  "created_at" timestamp DEFAULT now(),
  CONSTRAINT "password_reset_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "recurring_merchants" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "merchant_name" text NOT NULL,
  "normalized_name" text NOT NULL,
  "category" text NOT NULL,
  "transaction_type" text NOT NULL,
  "frequency" text,
  "logo_url" text,
  "is_active" boolean DEFAULT true,
  "auto_detected" boolean DEFAULT false,
  "confidence" text,
  "notes" text,
  "patterns" text,
  "exclude_from_bills" boolean DEFAULT false,
  "notification_days" integer DEFAULT 3,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "recurring_transactions" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" varchar NOT NULL,
  "name" text NOT NULL,
  "merchant" text,
  "category" text NOT NULL,
  "category_id" varchar,
  "amount" numeric(10, 2) NOT NULL,
  "frequency" text NOT NULL,
  "frequency_days" integer,
  "next_due_date" timestamp,
  "last_transaction_date" timestamp,
  "is_active" boolean DEFAULT true,
  "is_recurring" boolean DEFAULT true,
  "ignore_type" text DEFAULT 'none',
  "tags" jsonb DEFAULT '[]',
  "notes" text,
  "notification_days" integer DEFAULT 3,
  "linked_transaction_ids" jsonb DEFAULT '[]',
  "account_id" varchar,
  "auto_detected" boolean DEFAULT false,
  "confidence" numeric(3, 2),
  "merchant_logo" text,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sessions" (
  "sid" varchar PRIMARY KEY NOT NULL,
  "sess" jsonb NOT NULL,
  "expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscription_plans" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "description" text,
  "price" numeric(10, 2) NOT NULL,
  "currency" text DEFAULT 'USD' NOT NULL,
  "interval" text DEFAULT 'month' NOT NULL,
  "trial_days" integer DEFAULT 0,
  "stripe_price_id" text,
  "features" jsonb DEFAULT '[]',
  "is_active" boolean DEFAULT true,
  "sort_order" integer DEFAULT 0,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" varchar NOT NULL,
  "name" text NOT NULL,
  "type" varchar(20) NOT NULL,
  "amount" numeric(10, 2) NOT NULL,
  "frequency" varchar(20) NOT NULL,
  "next_due_date" timestamp,
  "category_id" varchar,
  "is_active" boolean DEFAULT true,
  "auto_detected" boolean DEFAULT false,
  "merchant_name" text,
  "last_charge_transaction_id" varchar,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sync_status" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" varchar NOT NULL,
  "institution_id" varchar NOT NULL,
  "status" varchar(20) NOT NULL,
  "last_sync_at" timestamp,
  "last_success_at" timestamp,
  "retry_count" integer DEFAULT 0,
  "max_retries" integer DEFAULT 3,
  "next_retry_at" timestamp,
  "error_message" text,
  "new_transactions_count" integer DEFAULT 0,
  "updated_transactions_count" integer DEFAULT 0,
  "duplicates_removed_count" integer DEFAULT 0,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "transaction_categorization_meta" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "transaction_id" varchar NOT NULL,
  "admin_category_id" varchar,
  "user_merchant_override_id" varchar,
  "confidence" numeric(3, 2),
  "categorized_by" varchar(20) DEFAULT 'system',
  "needs_review" boolean DEFAULT false,
  "reviewed_at" timestamp,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "transaction_splits" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "original_transaction_id" varchar NOT NULL,
  "user_id" varchar NOT NULL,
  "description" text NOT NULL,
  "amount" numeric(10, 2) NOT NULL,
  "category_id" varchar,
  "category" text,
  "tag_ids" text[],
  "notes" text,
  "split_order" integer DEFAULT 0,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "transaction_tag_assignments" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "transaction_id" varchar NOT NULL,
  "tag_id" varchar NOT NULL,
  "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "transaction_tags" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" varchar NOT NULL,
  "name" text NOT NULL,
  "color" text DEFAULT '#6366f1' NOT NULL,
  "description" text,
  "is_active" boolean DEFAULT true,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "transactions" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "date" timestamp NOT NULL,
  "description" text NOT NULL,
  "raw_amount" numeric(10, 2) NOT NULL,
  "amount" numeric(10, 2) NOT NULL,
  "category_id" varchar,
  "category" text NOT NULL,
  "type" text NOT NULL,
  "merchant" text,
  "account_id" varchar,
  "user_id" varchar,
  "external_transaction_id" text,
  "is_pending" boolean DEFAULT false,
  "source" varchar(20) DEFAULT 'manual',
  "plaid_category" jsonb,
  "plaid_personal_finance_category" jsonb,
  "plaid_account_id" text,
  "authorized_date" timestamp,
  "iso_currency_code" varchar(3),
  "payment_channel" varchar(20),
  "personal_finance_category_primary" text,
  "personal_finance_category_detailed" text,
  "personal_finance_category_confidence" text,
  "location_json" text,
  "payment_meta_json" text,
  "ignore_type" text DEFAULT 'none',
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_merchant_overrides" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" varchar NOT NULL,
  "merchant_name" text NOT NULL,
  "admin_category_id" varchar NOT NULL,
  "subcategory_name" text,
  "confidence" numeric(3, 2) DEFAULT '1.00',
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_recurring_overrides" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" varchar NOT NULL,
  "merchant_name" text NOT NULL,
  "original_merchant" text,
  "recurring_status" text NOT NULL,
  "apply_to_all" boolean DEFAULT true,
  "confidence" numeric(3, 2) DEFAULT '1.00',
  "reason" text,
  "rule_type" text DEFAULT 'recurring_override',
  "is_active" boolean DEFAULT true,
  "applied_count" integer DEFAULT 0,
  "trigger_transaction_id" varchar,
  "related_transaction_count" integer DEFAULT 0,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "email" varchar NOT NULL,
  "first_name" varchar,
  "last_name" varchar,
  "profile_image_url" varchar,
  "username" text NOT NULL,
  "password" text NOT NULL,
  "auth_provider" varchar(20) DEFAULT 'local',
  "auth_provider_id" text,
  "onboarding_completed" boolean DEFAULT false,
  "onboarding_skipped" boolean DEFAULT false,
  "is_admin" boolean DEFAULT false,
  "stripe_customer_id" text,
  "stripe_subscription_id" text,
  "subscription_status" text DEFAULT 'free' NOT NULL,
  "subscription_plan" text DEFAULT 'free' NOT NULL,
  "trial_ends_at" timestamp,
  "subscription_ends_at" timestamp,
  "trial_reminders_sent" jsonb DEFAULT '[]',
  "last_trial_reminder_at" timestamp,
  "bill_notifications_enabled" boolean DEFAULT true,
  "bill_notification_days" integer DEFAULT 3,
  "email_notifications_enabled" boolean DEFAULT true,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now(),
  CONSTRAINT "users_email_unique" UNIQUE("email"),
  CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE INDEX "bill_notifications_user_id_idx" ON "bill_notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "bill_notifications_scheduled_for_idx" ON "bill_notifications" USING btree ("scheduled_for");--> statement-breakpoint
CREATE INDEX "bill_notifications_due_date_idx" ON "bill_notifications" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "bill_notifications_status_idx" ON "bill_notifications" USING btree ("status");--> statement-breakpoint
CREATE INDEX "budget_plans_user_id_idx" ON "budget_plans" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "categorization_rules_user_id_idx" ON "categorization_rules" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "manual_subscriptions_user_id_idx" ON "manual_subscriptions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "manual_subscriptions_trial_ends_at_idx" ON "manual_subscriptions" USING btree ("trial_ends_at");--> statement-breakpoint
CREATE INDEX "password_reset_tokens_user_id_idx" ON "password_reset_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "password_reset_tokens_token_idx" ON "password_reset_tokens" USING btree ("token");--> statement-breakpoint
CREATE INDEX "recurring_transactions_user_id_idx" ON "recurring_transactions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "recurring_transactions_next_due_date_idx" ON "recurring_transactions" USING btree ("next_due_date");--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");--> statement-breakpoint
CREATE INDEX "user_recurring_overrides_user_merchant_idx" ON "user_recurring_overrides" USING btree ("user_id","merchant_name");--> statement-breakpoint
CREATE INDEX "user_recurring_overrides_user_id_idx" ON "user_recurring_overrides" USING btree ("user_id");