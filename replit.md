# BudgetHero - Level Up Your Money

## Overview
BudgetHero is a gamified financial analytics platform designed to transform financial management into an engaging and interactive experience. It combines traditional financial tracking with game mechanics, avatar customization, and AI-powered insights to make financial literacy accessible and fun. Key capabilities include comprehensive transaction enrichment/classification system, personalized avatars, smart budgeting wizards, and comprehensive analytics delivered via an intuitive, mobile-first dashboard. The business vision is to make financial management enjoyable and empower users to "Level Up Your Money."

## User Preferences
Preferred communication style: Simple, everyday language.
UI/UX Design Preference: Clear, intuitive interfaces with prominent call-to-action buttons, step-by-step guides, and user-friendly language. Tabbed layouts with descriptive icons and conversational form labels.
Navigation Preferences: Profile page renamed from "Account Settings" to "Profile". User name in navigation should be clickable to access profile page. Email addresses should not be displayed in navigation bars - only show user name with clickable access to profile editing.
Interface Preferences: Financial insights sidebar should be closed by default and displayed only as a clickable icon to minimize visual clutter and let users focus on main content.
Branding: Playful and catchy naming with "BudgetHero" as the app name, featuring gamified elements and personalization options. Logo uses purple-to-pink gradient with Shield icon (representing the hero concept). Tagline: "Level Up Your Money".

## System Architecture

### UML Documentation
Comprehensive UML diagrams and architecture documentation available in `BudgetHero-UML-Architecture.md` including:
- Class diagrams showing domain models and relationships
- Component architecture with frontend/backend interaction
- Sequence diagrams for transaction update flows
- State management flow diagrams
- Database schema relationships
- Design patterns implementation (Repository, Command, Observer, Strategy, Factory)

### Technical Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript, using Vite.
- **Routing**: Wouter for client-side routing (SPA).
- **UI Framework**: Radix UI components with shadcn/ui design system and Tailwind CSS.
- **State Management**: TanStack Query (React Query) for server state.
- **Form Handling**: React Hook Form with Zod for validation.
- **Charts**: Recharts for financial data visualization.
- **File Processing**: PapaParse for CSV parsing.
- **UI/UX Design**: Consistent tabbed interfaces, prominent CTAs, step-by-step guides, conversational forms, and responsive design for mobile. All page headers/titles are removed for a minimal interface.

### Backend Architecture
- **Runtime**: Node.js with Express.js.
- **Language**: TypeScript with ES modules.
- **API Design**: RESTful API.
- **Development Server**: Custom Vite integration with HMR.
- **Error Handling**: Centralized middleware.

### Data Layer
- **ORM**: Drizzle ORM for type-safe operations.
- **Database**: PostgreSQL with Neon serverless driver.
- **Schema Management**: Drizzle-kit for migrations.
- **Validation**: Zod schemas for runtime type validation.
- **Environment Separation**: Separate databases for development and production.

### Authentication & Security
- **Authentication**: Email-based system using Replit's OpenID Connect.
- **Session Management**: Connect-pg-simple for PostgreSQL-backed session storage.
- **Data Validation**: Zod schemas on both client and server.
- **User Consent**: Comprehensive system for Plaid bank connections with detailed data collection disclosure and explicit user agreement.
- **Password Reset**: Secure token-based reset system with email validation and professional HTML templates.

### Application Features
- **Dashboard**: Financial KPIs, spending trends, category breakdowns, AI-powered insights, budget vs. actual comparisons.
- **Transaction Management**: CRUD operations, filtering, searching, pagination, dual category editing, bulk deletion with individual selection, and drag-and-drop CSV upload. Redesigned with enhanced editing, hierarchical category filtering, and mobile responsiveness.
- **Analytics**: Comprehensive financial summaries, category breakdowns, time-based trend analysis. Includes interactive spending analysis with pie charts, "Frequent Spends," "Largest Purchases," and uncategorized transactions list.
- **Budgeting**: Comprehensive 8-step Q&A wizard for smart budget generation (50/30/20 framework).
- **Transaction Enrichment/Classification**: Comprehensive system that automatically classifies transactions with categories, subcategories, ledger types, budget types, and allows custom user tags. Intelligent priority system: Plaid categories → Merchant matching → Keyword-based → Uncategorized. Manual override capability for all classification elements.
- **Rules & Automation**: Custom transaction tags system, automated rules engine for merchant-based categorization and tagging, transaction splitting capabilities with original record integrity maintenance. Accessible at `/rules-automation`.
- **Recurring Transaction Overrides**: Complete user review system for recurring transaction detection with real-time transaction classification and merchant-level override capabilities. Features "apply to all vs just this one" confirmation dialogs and smart recurring detection integration. Accessible at `/automation`.
- **Bank Integration**: Plaid API for connecting bank accounts and syncing real-time transaction data, with multi-environment support.
- **Recurring Transactions**: Enhanced two-step detection algorithm leveraging Admin Merchant Table for intelligent recurring transaction identification. Step A: Advanced transaction-to-merchant matching using normalized text, fuzzy matching (Levenshtein distance), pattern regex, and keyword analysis. Step B: Historical pattern verification with time-based and amount-based recurrence analysis, confidence scoring, and smart recommendations. Fully integrated into main transaction processing workflow with automatic categorization and batch processing capabilities.
- **Reporting**: Export functionality.
- **Profile Management**: User account settings with name editing, avatar selection, and profile customization.
- **Admin Support**: Admin-only endpoints for user data access, account syncing, and analytics dashboard with conversion, engagement, and retention metrics. Auto-categorization testing tool using the same import algorithm (TransactionCategorizer) as transaction import for consistent categorization behavior.
- **SEO Optimization**: Comprehensive SEOHead component with meta tags, Open Graph data, structured data markup, and keyword-optimized content.
- **Trial Management**: 7-day premium trial reminder system with automated email notifications, dynamic subscription banner, and Stripe payment integration.
- **Financial Tracking Overhaul**: Integrated income, total spend, and net income tracking with interactive charts and detailed transaction breakdowns by category and period.

## External Dependencies

- **@neondatabase/serverless**: PostgreSQL driver.
- **drizzle-orm**, **drizzle-zod**: ORM and Zod integration.
- **@tanstack/react-query**: Server state management.
- **wouter**: React router.
- **@radix-ui/***: UI primitives.
- **tailwindcss**: CSS framework.
- **recharts**: Charting library.
- **lucide-react**: Icon library.
- **embla-carousel-react**: Carousel component.
- **papaparse**: CSV parsing.
- **date-fns**: Date utilities.
- **react-dropzone**: File upload component.
- **connect-pg-simple**: PostgreSQL session store.
- **Plaid SDK**: Bank account integration.
- **Clearbit Logo API**: For merchant logo detection.