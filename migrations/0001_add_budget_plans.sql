CREATE TABLE "budget_plans" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" varchar NOT NULL,
  "month" varchar NOT NULL,
  "expected_earnings" numeric(10,2) NOT NULL,
  "expected_bills" numeric(10,2) NOT NULL,
  "savings_rate" integer NOT NULL,
  "savings_reserve" numeric(10,2) NOT NULL,
  "spending_budget" numeric(10,2) NOT NULL,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint