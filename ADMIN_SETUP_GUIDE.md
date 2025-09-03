# BudgetHero Admin Access Guide

## Problem
Due to OAuth session persistence, you cannot switch between Gmail accounts in the same browser session. This prevents accessing the admin account when already logged into a regular user account.

## Solution: Secure Admin Override System

### Step 1: Generate Admin Token

Use this curl command to generate a secure admin token:

```bash
curl -X POST http://localhost:5000/api/admin/generate-token \
  -H "Content-Type: application/json" \
  -d '{"masterKey": "BUDGETHERO_ADMIN_2025", "targetUserId": "YOUR_USER_ID"}'
```

Replace `YOUR_USER_ID` with the actual user ID you want to grant admin access to.

**For your current session, use:**
```bash
curl -X POST http://localhost:5000/api/admin/generate-token \
  -H "Content-Type: application/json" \
  -d '{"masterKey": "BUDGETHERO_ADMIN_2025", "targetUserId": "42553967"}'
```

### Step 2: Use the Token

The response will include a token and a direct URL. Visit the URL to gain admin access:

```
http://localhost:5000/admin-override?token=YOUR_TOKEN_HERE
```

### Security Features

1. **Single-use tokens**: Each token can only be used once
2. **15-minute expiration**: Tokens automatically expire after 15 minutes
3. **Master key protection**: Requires the secure master key `BUDGETHERO_ADMIN_2025`
4. **Automatic cleanup**: Expired tokens are automatically removed from memory
5. **Server restart security**: All tokens are cleared when server restarts (in-memory storage)

### Additional Admin Management Commands

#### List All Admin Users
```bash
curl -X POST http://localhost:5000/api/admin/list-admins \
  -H "Content-Type: application/json" \
  -d '{"masterKey": "BUDGETHERO_ADMIN_2025"}'
```

#### Revoke Admin Access
```bash
curl -X POST http://localhost:5000/api/admin/revoke-admin \
  -H "Content-Type: application/json" \
  -d '{"masterKey": "BUDGETHERO_ADMIN_2025", "targetUserId": "USER_ID"}'
```

## Environment Configuration

The master key defaults to `BUDGETHERO_ADMIN_2025` but can be changed by setting the environment variable:

```bash
export ADMIN_MASTER_KEY="your_custom_master_key"
```

## Workflow for Development

1. **Current User Session**: Work as regular user (akutayaydin@gmail.com, ID: 42553967)
2. **Generate Token**: Use curl command when admin access is needed
3. **Access Admin**: Visit the override URL to gain admin privileges
4. **Admin Features**: Access admin-only features in the app
5. **Security**: Token is destroyed after use, admin access persists until manually revoked

## Production Security Notes

- Change the default master key in production
- Consider additional authentication layers for production use
- Monitor admin override usage in production logs
- Tokens are stored in memory only (cleared on server restart)

## Troubleshooting

- **"Invalid master key"**: Check the master key spelling and environment variable
- **"User not found"**: Verify the user ID exists in the database
- **"Token expired"**: Generate a new token (15-minute limit)
- **Server restart**: All tokens are cleared, generate new ones as needed