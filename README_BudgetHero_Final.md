# BudgetHero Web App Menu & Features (Final)

This document outlines the **BudgetHero** web application menu structure and features, updated after competitive analysis of Rocket Money, Monarch, and Copilot.

---

## 📂 Sidebar Menu (final)
1. **Dashboard**
2. **Transactions**
3. **Spending**
4. **Budgets**
5. **Cash Flow (Days Safe)**
6. **Bills & Subscriptions**
7. **Net Worth**
8. **Goals & Reports**
9. **Insights (AI Coach)**
10. **More ▾** (Profile/Settings, Categories & Rules, Admin)

---

## 1. Dashboard (Overview)
**Purpose:** Quick financial snapshot.

**Features:**
- ✅ Current month spending vs. last month
- ✅ Net Income (Income – Expenses)
- Left to Spend (ring/donut chart)
- Days Safe mini‑meter
- ✅ Recent Transactions (latest 5–10)
- Upcoming Bills (next 7 days)
- Top Categories (mini chart)
- Alerts (overspending, low balance, upcoming due)
- Quick Category Tracker:
      - **Purpose:** Let users instantly monitor a specific category (e.g., Groceries) before making spending decisions.  
      **Features:**
      - Add a category shortcut to **Dashboard** or a quick‑access menu  
      - Shows **spent this week/month** and **remaining budget** for that category  
      - One‑tap to switch categories being tracked  
      - Ideal for on‑the‑go checks before shopping (e.g., “How much left for Groceries this week?”)  
      - Mobile‑friendly card widget for quick glance

---

## 2. Transactions
**Purpose:** Master list & source of truth for all money movements.

**Features:**
- Search & filter (date, category, merchant, account, tags)
- Transaction detail drawer (notes, receipts/attachments, split transactions)
- Bulk edit & recategorize
- Export/Import (CSV, Plaid sync)
- Flags: Reimbursable, Business, Tax-deductible, Personal, Ignored
- AI-suggested categories (assist with classification)
- **WOW:** Inline edit everything + “Apply to similar?” → build rules
- **Rules v1:** JSON rules engine
  - Match: merchant_regex, memo_regex, amount_range, account
  - Actions: set category, exclude, rename merchant

---

## 3. Spending
**Purpose:** Backward-looking insights — *where money went*.

**Features:**
- Donut/Pie chart — % spend by category
  - Toggle: include/exclude bills
  - Month selector & time comparisons (MoM, YoY)
  - Keyboard shortcuts (← → to change month)
- Sankey Flow (Wow Factor) — Income → Bills → Spending → Savings (interactive drill-down)
- Frequent merchants (e.g., “Trader Joe’s 7 times this month”)
- Largest purchases (highlight top 3–5 by amount)
- Category insights with AI coach (e.g., “Dining is up 20% vs last month”)
- Drill-down: click a slice/merchant → open **filtered Transactions** with date range picker
- Export snapshot (PNG/PDF)

**Data:** Aggregates by month, category, merchant. Re-uses existing **Transactions table** as source of truth.

---

## 4. Budgets
**Purpose:** Plan spending ahead.

**Features:**
- Budget Basics (Income, Bills & Utilities)
- Category Budgets (Groceries, Dining, etc.)
- “Everything Else” catch-all category
- Inline editing (click to adjust)
- Budget vs. Actual vs. Remaining (with progress rings)
- Allocation Pie Chart (toggleable)
- Validation (warn if over-allocating)
- Drill‑down to category detail: bar chart (monthly trend) + filtered transactions
-  **New:** Pin category to Dashboard for Quick Tracker 

---

## 5. Cash Flow (Days Safe) — *Differentiator*
**Purpose:** Forward-looking runway & survival timing — answers *“Will I make it until payday?”*  

**Features:**
- Cash-flow calendar (30–60 day projection) with daily balances
- Projected balance line (shows upcoming inflows/outflows)
- **Days Safe meter** (“X days until balance hits $0”)
- Burn rate ($/day discretionary spend)
- Income projection modes: Fixed vs Rolling Average (gig/freelance)
- Scenario toggle: Conservative vs Optimistic
- Smart nudges: if Days Safe < 7 → actionable tips (“Pause X,” “Move $ from savings”)

---

## 6. Bills & Subscriptions
**Purpose:** Manage recurring payments & avoid surprises.

**Features:**
- Calendar view — monthly schedule of bills & subscriptions
- Upcoming list — due payments in the next 7 days
- Full list — active subscriptions & bills, with sort & filter
- **WOW:** Subscription Radar badges (price ↑, trial ending, annual due)
- One-click cancel helpers (steps/scripts/deep links)
- Price increase alerts
- Annual vs. monthly breakdown

---

## 7. Net Worth
**Purpose:** Track assets & debts in one place.

**Features:**
- Summary: Net worth = Assets – Debts
- Assets: cash, savings, investments, property
- Debts: credit cards, loans, mortgages
- Trend chart (1M / 3M / 6M / 1Y)
- Asset allocation view
- Debt payoff progress

---

## 8. Goals & Reports

### Goals (Gamified Savings)
**Purpose:** Motivate and track long-term saving.  
**Features:**
- Create savings goals (Emergency Fund, Vacation, Debt Payoff)
- Progress bars & completion %
- Auto-transfer suggestions (e.g., “move $50/week to Vacation Fund”)
- Achievements & badges (gamification layer — celebrate milestones)

### Reports (Deep Insights)
**Purpose:** Provide historical and analytical views of finances.  
**Features:**
- Monthly & yearly summaries (Income vs Expenses vs Savings)
- Trend analysis (MoM, YoY growth/decline)
- Export reports (CSV, PDF)
- **WOW:** *Sankey Flow — Where your money goes*
  - Visualize income → bills → categories → merchants
  - Interactive drill-down with tooltips (% of income, changes vs last month)

---

## 9. Insights (AI Coach)
**Purpose:** Personalized financial guidance.

**Features:**
- Overspending alerts (e.g., “Dining is 25% above normal”)
- Savings nudges (e.g., “Move $150 to savings to hit goal”)
- Category reports (Dining ↑, Groceries ↓)
- Predictive insights (forecast end-of-month balance)

---

## 10. More ▾

### Profile & Settings
**Purpose:** Personalize the app and manage core connections.  
**Features:**
- Profile & preferences (currency, theme, timezone)
- Linked accounts (Plaid integration)
- Categories & tags management
- Transaction rules (create/edit/delete automation rules)
- Notifications & alerts (email, push, in-app)
- Premium upgrade flow (plan management, billing info)
- Data backup/export (CSV, JSON, PDF)

### Admin (SaaS / Internal Use)
**Purpose:** Manage users and platform operations.  
**Features:**
- User management (invite, suspend, roles)
- Subscription plans (free, premium tiers)
- Billing & invoices

---

## ✅ Differentiators vs Rocket Money / Monarch
- **AI Spend Coach** – nudges & insights (not just raw data)
- **Cash Flow Forecast + Days Safe** – shows financial runway
- **Sankey Flow** – visual “where money goes” beyond pie charts
- **Automation** – category auto-rules + AI suggestions
- **Gamification** – badges for meeting goals & good habits

---

## 🔮 Future Wow Features
- Proactive AI chatbot (“Can I afford $300 on dining this month?”)
- Credit health simulator (“Paying $500 on card reduces debt-free date by 6 months”)
- Social leaderboard (compare savings progress with friends, optional)





## 🔮 Phase 2 — Future Differentiators

# BudgetHero — Phase 2 Sidebar & Feature Changes

This document highlights the **Phase 2 sidebar structure** and the **new/changed features** compared to Phase 1.

---

## 📂 Sidebar Menu (Phase 2)

1. **Dashboard** (with household toggle)  
2. **Transactions** 🆕 (sentiment + splits)  
3. **Spending** 🆕 (personal vs household toggle)  
4. **Budgets (Dynamic)** 🆕  
5. **Cash Flow (Days Safe)** 🆕 (group-level runway)  
6. **Bills & Subscriptions** 🆕 (shared subs)  
7. **Net Worth**  
8. **Goals & Reports** 🆕 (shared goals, group gamification)  
9. **Insights (AI Coach)** 🆕 (emotion-aware, behavior-driven)  
10. **Collaboration** 🆕  
11. **More ▾**

---

## 🔄 Changed Features

### Budgets → **Budgets (Dynamic)**
- Not static anymore — automatically adapts to spending patterns  
- Adds behavior-based automation & smart rules  

### Dashboard
- Personal vs household toggle  
- Group-level **Left to Spend** and shared **Days Safe**  

### Transactions
- Sentiment tagging (joy, regret, stress)  
- Splits for roommates/family (assign % or $ to members)  

### Spending
- Toggle between personal and household views  
- AI insights highlight group-level overspending  
  - *Example:* “Dining overshoot shared across 3 members”  

### Cash Flow (Days Safe)
- Personal vs household runway  
- Burn rate per person + group  

### Bills & Subscriptions
- Split subscription handling (e.g., “Netflix: 50/50 roommates”)  
- Detect unused subs at group level (*“Hulu unused by 3 members”*)  

### Goals & Reports
- Shared goals (vacation fund, rent savings, debt payoff)  
- Contributions tracked per member  
- Gamification at group level (badges, milestones)  

### Insights (AI Coach)
- Emotion-aware nudges  
  - *Example:* “Last time you tagged dining as regret, want to reduce budget?”  
- Mood-to-spend analytics  
- Predictive alerts based on personal + group behavior  

---

## 🆕 New Menu Item

### Collaboration
- Invite family/roommates/partners  
- Role-based access (parent, teen, partner, roommate)  
- Shared budgets & goals  
- In-app chat & notes on categories/goals  
- Group notifications (“Alex added a new Grocery budget”)  

---

### IMPROVEMENT DETAILS

### 1. Collaborative Money Management
**Purpose:** Make money a shared journey (families, roommates, partners).  
**Features:**
- Shared budgets (multiple users see/edit the same plan)
- Role-based access (parent vs. teen, partner vs. roommate)
- Split expenses (assign/share transactions across users)
- Group goals (vacation fund, rent, debt payoff as a team)
- In-app chat/notes on budgets (“Let’s cut dining by $100 this month”)

---

### 2. Emotion-Driven Financial Insights
**Purpose:** Connect money decisions with feelings, not just numbers.  
**Features:**
- Sentiment tagging on transactions (e.g., “joy,” “stress,” “regret”)
- Mood-to-spend correlation charts (e.g., “stress ↑ → shopping ↑”)
- AI-generated nudges (“Last time you overspent on dining, you tagged it regret — want to adjust budget?”)
- Journaling prompts: “How did this purchase make you feel?”

Insights (AI Coach)
Emotion-driven insights (correlation between spending + moods).
Behavioral nudges (“Dining overshoot linked to stress days”).
Shared nudges (“Groceries trending high — roommates split?”).

---

### 3. Behavior-Based Automation (Beyond Static Budgets)
**Purpose:** Budgets that adapt dynamically to user behavior.  
**Features:**
- Auto-adjust categories based on spending patterns (“Dining trending +20%, reduce Shopping by $50 automatically”)
- Predictive allocation (if income is variable, system creates rolling envelopes)
- Smart savings sweeps (move unspent funds to savings goals automatically)
- Dynamic alerts (“If you keep spending at this pace, Groceries will overshoot by $120”)

---

## 🚀 Why This Matters
- Turns **BudgetHero** from a tracker into a **coach + collaborator**.  
- Moves beyond “static buckets” → into **adaptive, personalized money systems**.  
- Makes budgeting feel **human + social**, not just math.  

