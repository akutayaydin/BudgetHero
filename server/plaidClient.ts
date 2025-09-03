import { PlaidApi, PlaidEnvironments, Configuration, CountryCode, Products } from 'plaid';

// Determine environment and use appropriate credentials
const isProduction = process.env.NODE_ENV === 'production' || process.env.REPLIT_DEPLOYMENT === 'true';
const isDevelopment = !isProduction;

console.log('Plaid environment detection:', {
  NODE_ENV: process.env.NODE_ENV,
  REPLIT_DEPLOYMENT: process.env.REPLIT_DEPLOYMENT,
  isProduction,
  isDevelopment
});

// Use sandbox credentials in development, production credentials when deployed
const plaidClientId = isDevelopment 
  ? process.env.PLAID_CLIENT_ID_SANDBOX 
  : process.env.PLAID_CLIENT_ID;

const plaidSecret = isDevelopment 
  ? process.env.PLAID_SECRET_SANDBOX 
  : process.env.PLAID_SECRET;

// Use sandbox environment for development, production for deployment
const plaidEnvironment = isDevelopment 
  ? PlaidEnvironments.sandbox 
  : PlaidEnvironments.production;

console.log(`Plaid configuration: ${isDevelopment ? 'SANDBOX' : 'PRODUCTION'} environment`);

// Log credential availability for debugging
console.log('Plaid credentials check:', {
  plaidClientId: plaidClientId ? 'present' : 'missing',
  plaidSecret: plaidSecret ? 'present' : 'missing',
  environment: isDevelopment ? 'SANDBOX' : 'PRODUCTION'
});

// Validate that required credentials are available
if (!plaidClientId || !plaidSecret) {
  const envType = isDevelopment ? 'SANDBOX' : 'PRODUCTION';
  const clientIdVar = isDevelopment ? 'PLAID_CLIENT_ID_SANDBOX' : 'PLAID_CLIENT_ID';
  const secretVar = isDevelopment ? 'PLAID_SECRET_SANDBOX' : 'PLAID_SECRET';
  
  console.error(`Missing Plaid ${envType} credentials:`, {
    clientIdVar,
    secretVar,
    clientIdValue: plaidClientId ? 'present' : 'missing',
    secretValue: plaidSecret ? 'present' : 'missing'
  });
  
  throw new Error(
    `Missing Plaid ${envType} credentials. Please set ${clientIdVar} and ${secretVar} environment variables.`
  );
}

const configuration = new Configuration({
  basePath: plaidEnvironment,
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': plaidClientId,
      'PLAID-SECRET': plaidSecret,
    },
  },
});

export const plaidClient = new PlaidApi(configuration);

// Use different products for sandbox vs production
export const PLAID_PRODUCTS = isDevelopment 
  ? [Products.Transactions, Products.Auth, Products.Identity] 
  : [Products.Transactions]; // Start with just Transactions for production

export const PLAID_COUNTRY_CODES = [CountryCode.Us];