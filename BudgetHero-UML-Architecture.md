# BudgetHero - UML Architecture Documentation

## System Overview

BudgetHero is a gamified financial analytics platform that transforms financial management into an engaging experience through comprehensive transaction tracking, AI-powered insights, and automated rules engines.

## Class Diagram

```mermaid
classDiagram
    %% Core Domain Models
    class User {
        +string id
        +string email
        +string firstName
        +string lastName
        +string username
        +string profileImageUrl
        +string authProvider
        +boolean onboardingCompleted
        +boolean isAdmin
        +string subscriptionStatus
        +string subscriptionPlan
        +Date trialEndsAt
        +Date createdAt
        +Date updatedAt
    }

    class Transaction {
        +string id
        +Date date
        +string description
        +string rawAmount
        +string amount
        +string categoryId
        +string category
        +string type
        +string merchant
        +string accountId
        +string userId
        +string source
        +string ignoreType
        +Date createdAt
        +Date updatedAt
    }

    class Category {
        +string id
        +string name
        +string parentId
        +string budgetType
        +string ledgerType
        +string plaidCategory
        +boolean isActive
    }

    class Account {
        +string id
        +string name
        +string type
        +string institutionName
        +string plaidAccountId
        +string userId
        +boolean isActive
    }

    class AutomationRule {
        +string id
        +string name
        +string userId
        +object conditions
        +object actions
        +boolean isActive
        +Date createdAt
    }

    class Bill {
        +string id
        +string name
        +decimal amount
        +Date dueDate
        +string frequency
        +string categoryId
        +string userId
        +boolean isActive
    }

    %% Frontend Components
    class TransactionsTable {
        +Transaction[] transactions
        +handleDescriptionChange()
        +handleCategoryChange()
        +handleBulkDelete()
        +handleExport()
    }

    class InlineDescriptionEditor {
        +string currentDescription
        +boolean isEditing
        +handleSave()
        +handleCancel()
    }

    class InlineCategorySelector {
        +string currentCategory
        +Category[] categories
        +handleCategorySelect()
    }

    class CreateRuleModal {
        +Transaction transaction
        +object pendingChanges
        +handleRuleCreation()
        +previewMatchedTransactions()
    }

    class RuleConfirmationModal {
        +Transaction transaction
        +object pendingChanges
        +handleCreateRule()
        +handleUpdateOnly()
    }

    class Dashboard {
        +displayKPIs()
        +renderCharts()
        +showInsights()
    }

    %% Backend Services
    class TransactionService {
        +getTransactions()
        +updateTransaction()
        +deleteTransactions()
        +categorizeTransaction()
        +applyAutomationRules()
    }

    class AutomationRulesEngine {
        +applyRulesToTransactions()
        +evaluateConditions()
        +executeActions()
        +detectConflicts()
    }

    class TransactionCategorizer {
        +categorizeTransaction()
        +matchMerchant()
        +applyKeywordRules()
        +assignDefaultCategory()
    }

    class PlaidService {
        +syncTransactions()
        +refreshAccounts()
        +handleWebhooks()
    }

    class AuthService {
        +authenticateUser()
        +validateSession()
        +handleOAuth()
    }

    %% Data Layer
    class Storage {
        +getTransactions()
        +updateTransaction()
        +createAutomationRule()
        +getCategories()
        +getUserAccounts()
    }

    class DrizzleORM {
        +query()
        +insert()
        +update()
        +delete()
    }

    %% Relationships
    User ||--o{ Transaction : owns
    User ||--o{ Account : owns
    User ||--o{ AutomationRule : creates
    User ||--o{ Bill : manages
    
    Transaction }o--|| Category : belongs_to
    Transaction }o--|| Account : from
    
    TransactionsTable *-- InlineDescriptionEditor
    TransactionsTable *-- InlineCategorySelector
    TransactionsTable *-- CreateRuleModal
    TransactionsTable *-- RuleConfirmationModal
    
    TransactionService --> Storage
    AutomationRulesEngine --> Storage
    TransactionCategorizer --> Storage
    PlaidService --> Storage
    AuthService --> Storage
    
    Storage --> DrizzleORM
    DrizzleORM --> PostgreSQL[(PostgreSQL)]
    
    TransactionsTable --> TransactionService
    CreateRuleModal --> AutomationRulesEngine
    Dashboard --> TransactionService
```

## Component Architecture Diagram

```mermaid
graph TB
    %% Frontend Layer
    subgraph "Frontend (React + TypeScript)"
        subgraph "Pages"
            TP[TransactionsPage]
            DP[DashboardPage]
            RP[RulesPage]
            AP[AnalyticsPage]
        end
        
        subgraph "Components"
            TT[TransactionsTable]
            IDE[InlineDescriptionEditor]
            ICS[InlineCategorySelector]
            CRM[CreateRuleModal]
            RCM[RuleConfirmationModal]
            IB[IgnoreButton]
        end
        
        subgraph "State Management"
            TQ[TanStack Query]
            QC[Query Client]
        end
    end
    
    %% Backend Layer
    subgraph "Backend (Node.js + Express)"
        subgraph "API Routes"
            TR[Transaction Routes]
            AR[Automation Routes]
            CR[Category Routes]
            UR[User Routes]
        end
        
        subgraph "Services"
            TS[TransactionService]
            ARE[AutomationRulesEngine]
            TC[TransactionCategorizer]
            PS[PlaidService]
            AS[AuthService]
        end
        
        subgraph "Middleware"
            AM[Auth Middleware]
            VM[Validation Middleware]
            EM[Error Middleware]
        end
    end
    
    %% Data Layer
    subgraph "Data Layer"
        ST[Storage Interface]
        DO[Drizzle ORM]
        PG[(PostgreSQL)]
    end
    
    %% External Services
    subgraph "External APIs"
        PLAID[Plaid API]
        STRIPE[Stripe API]
        CLEARBIT[Clearbit Logo API]
    end
    
    %% Connections
    TP --> TT
    TT --> IDE
    TT --> ICS
    TT --> CRM
    TT --> RCM
    TT --> IB
    
    TQ --> QC
    TT --> TQ
    DP --> TQ
    
    TT --> TR
    CRM --> AR
    DP --> TR
    
    TR --> TS
    AR --> ARE
    TR --> TC
    
    TS --> ST
    ARE --> ST
    TC --> ST
    AS --> ST
    
    ST --> DO
    DO --> PG
    
    PS --> PLAID
    AS --> STRIPE
    TC --> CLEARBIT
    
    TR --> AM
    AR --> AM
    TR --> VM
    AR --> VM
```

## Sequence Diagram - Transaction Update Flow

```mermaid
sequenceDiagram
    participant U as User
    participant TT as TransactionsTable
    participant IDE as InlineDescriptionEditor
    participant RCM as RuleConfirmationModal
    participant CRM as CreateRuleModal
    participant TS as TransactionService
    participant ARE as AutomationRulesEngine
    participant DB as Database
    
    U->>TT: Click transaction description
    TT->>IDE: Enable edit mode
    U->>IDE: Edit description
    IDE->>TT: handleDescriptionChange()
    TT->>RCM: Open confirmation modal
    
    alt User chooses "Update This Transaction Only"
        RCM->>TS: PATCH /api/transactions/:id
        TS->>DB: Update transaction
        DB-->>TS: Updated transaction
        TS-->>TT: Success response
        TT->>TT: Refresh transaction list
    
    else User chooses "Create Rule"
        RCM->>CRM: Open rule creation modal
        U->>CRM: Define rule conditions
        U->>CRM: Define rule actions
        CRM->>ARE: Create automation rule
        ARE->>DB: Save rule
        ARE->>ARE: Apply rule to existing transactions
        ARE->>DB: Batch update matching transactions
        ARE-->>TT: Success response
        TT->>TT: Refresh transaction list
    end
```

## State Management Flow

```mermaid
stateDiagram-v2
    [*] --> Loading
    Loading --> Authenticated : Login Success
    Loading --> Unauthenticated : No Session
    
    Authenticated --> ViewingTransactions
    ViewingTransactions --> EditingTransaction : Click Edit
    EditingTransaction --> ConfirmationModal : Save Changes
    
    ConfirmationModal --> UpdateSingle : Update This Transaction Only
    ConfirmationModal --> CreateRule : Create Rule for Similar
    
    UpdateSingle --> ViewingTransactions : Success
    UpdateSingle --> ErrorState : API Error
    
    CreateRule --> RuleDefinition
    RuleDefinition --> RuleActions
    RuleActions --> ApplyingRule
    ApplyingRule --> ViewingTransactions : Success
    ApplyingRule --> ErrorState : Rule Error
    
    ErrorState --> ViewingTransactions : Retry
    Unauthenticated --> [*] : Redirect to Login
```

## Database Schema Relationships

```mermaid
erDiagram
    users ||--o{ transactions : owns
    users ||--o{ accounts : owns
    users ||--o{ automation_rules : creates
    users ||--o{ bills : manages
    users ||--o{ goals : sets
    
    transactions }o--|| categories : belongs_to
    transactions }o--|| accounts : from
    
    categories ||--o{ categories : parent_child
    
    automation_rules ||--o{ automation_rule_executions : generates
    
    accounts }o--|| institutions : belongs_to
    
    bills }o--|| categories : categorized_as
    
    users {
        varchar id PK
        varchar email UK
        varchar username UK
        varchar firstName
        varchar lastName
        varchar authProvider
        boolean isAdmin
        varchar subscriptionStatus
        datetime createdAt
    }
    
    transactions {
        varchar id PK
        varchar userId FK
        date date
        varchar description
        decimal amount
        varchar categoryId FK
        varchar accountId FK
        varchar merchant
        varchar type
        varchar source
        varchar ignoreType
        datetime createdAt
    }
    
    categories {
        varchar id PK
        varchar name
        varchar parentId FK
        varchar budgetType
        varchar ledgerType
        varchar plaidCategory
        boolean isActive
    }
    
    automation_rules {
        varchar id PK
        varchar userId FK
        varchar name
        jsonb conditions
        jsonb actions
        boolean isActive
        datetime createdAt
    }
    
    accounts {
        varchar id PK
        varchar userId FK
        varchar name
        varchar type
        varchar institutionName
        varchar plaidAccountId
        boolean isActive
    }
```

## Key Design Patterns

### 1. Repository Pattern
- **Storage Interface**: Abstracts data access logic
- **Drizzle ORM**: Provides type-safe database operations
- **Service Layer**: Business logic separated from data access

### 2. Command Pattern
- **Automation Rules Engine**: Encapsulates rule execution logic
- **Transaction Categorizer**: Handles classification algorithms
- **Mutation Handlers**: Manage state changes with rollback capability

### 3. Observer Pattern
- **React Query**: Reactive state management for server data
- **Real-time Updates**: Automatic UI refresh on data changes
- **Webhook Handlers**: Process external API notifications

### 4. Strategy Pattern
- **Authentication Providers**: Multiple OAuth implementations
- **Rule Conditions**: Pluggable rule evaluation strategies
- **Transaction Sources**: Different import/sync mechanisms

### 5. Factory Pattern
- **Component Factories**: Dynamic UI component generation
- **Rule Builders**: Programmatic rule creation
- **Query Builders**: Dynamic database query construction

## Technology Stack Integration

```mermaid
graph LR
    subgraph "Frontend"
        React[React 18]
        TS[TypeScript]
        Tailwind[Tailwind CSS]
        Radix[Radix UI]
        TanStack[TanStack Query]
        Wouter[Wouter Router]
    end
    
    subgraph "Backend"
        Node[Node.js]
        Express[Express.js]
        Drizzle[Drizzle ORM]
        Zod[Zod Validation]
    end
    
    subgraph "Database"
        PostgreSQL[PostgreSQL]
        Neon[Neon Serverless]
    end
    
    subgraph "External"
        Plaid[Plaid API]
        Stripe[Stripe]
        Clearbit[Clearbit]
    end
    
    React --> Express
    TanStack --> Express
    Express --> Drizzle
    Drizzle --> PostgreSQL
    Express --> Plaid
    Express --> Stripe
    Express --> Clearbit
```

This UML documentation provides a comprehensive view of the BudgetHero application architecture, showing the relationships between components, data flow, and system interactions.