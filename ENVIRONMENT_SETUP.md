# BudgetHero Environment Configuration Guide

## Database Environment Separation

BudgetHero now uses separate databases for development and production environments:

### Development Environment
- **Database**: Uses `DATABASE_URL_DEVELOPMENT` or falls back to `DATABASE_URL`
- **Plaid**: Uses sandbox credentials (`PLAID_CLIENT_ID_SANDBOX`, `PLAID_SECRET_SANDBOX`)
- **Detection**: When `NODE_ENV` is not set or not equal to "production"

### Production Environment  
- **Database**: Uses `DATABASE_URL_PRODUCTION` or falls back to `DATABASE_URL`
- **Plaid**: Uses production credentials (`PLAID_CLIENT_ID`, `PLAID_SECRET`)
- **Detection**: When `NODE_ENV=production` or `REPLIT_DEPLOYMENT=true`

## Required Environment Variables

### Development
```bash
DATABASE_URL_DEVELOPMENT=postgresql://...  # Development database
PLAID_CLIENT_ID_SANDBOX=your_sandbox_client_id
PLAID_SECRET_SANDBOX=your_sandbox_secret
```

### Production
```bash
DATABASE_URL_PRODUCTION=postgresql://...  # Production database
PLAID_CLIENT_ID=your_production_client_id
PLAID_SECRET=your_production_secret
NODE_ENV=production
```

### Shared (Both Environments)
```bash
SESSION_SECRET=your_session_secret
REPLIT_DOMAINS=your_domain.com
STRIPE_SECRET_KEY=your_stripe_key
```

## Authentication in Production

In production, users must authenticate through the OAuth flow:

1. Users visit the landing page
2. Click "Login" to authenticate with Replit
3. After authentication, all API endpoints work properly
4. Bank account linking becomes available

## Production Data Cleanup

**COMPLETED**: All production user data has been cleared to ensure proper environment separation:
- ✅ Users: 0 records
- ✅ Transactions: 0 records  
- ✅ Accounts: 0 records
- ✅ Budgets: 0 records
- ✅ Assets: 0 records
- ✅ Liabilities: 0 records

System data preserved:
- Admin categories (27 records)
- Subscription plans (2 records)

## Troubleshooting

### 401 Errors in Production
- Ensure user is logged in via the landing page
- Check that `REPLIT_DOMAINS` includes the current domain
- Verify session configuration is working

### Database Issues
- Confirm environment-specific DATABASE_URL variables are set
- Check that databases are properly provisioned for each environment
- Verify database connections are working

### Plaid Integration
- Ensure correct Plaid credentials for each environment
- Sandbox for development, production keys for production
- Verify Plaid webhook URLs if using webhooks