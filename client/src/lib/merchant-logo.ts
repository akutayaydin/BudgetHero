/**
 * Utility functions for generating merchant logos using Clearbit API
 */

export function getClearbitLogoUrl(merchantName: string): string {
  if (!merchantName) return '';
  
  // Clean up merchant name to extract domain-like identifier
  const cleanName = merchantName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove special characters
    .replace(/\s+/g, '') // Remove spaces
    .replace(/inc|corp|llc|ltd|co$/g, '') // Remove common company suffixes
    .trim();

  // Map common merchant names to their domains
  const merchantDomainMap: Record<string, string> = {
    'netflix': 'netflix.com',
    'spotify': 'spotify.com',
    'disney': 'disney.com',
    'disneyplus': 'disney.com',
    'hulu': 'hulu.com',
    'amazon': 'amazon.com',
    'amazonprime': 'amazon.com',
    'apple': 'apple.com',
    'applemusic': 'apple.com',
    'youtube': 'youtube.com',
    'googleyoutube': 'youtube.com',
    'microsoft': 'microsoft.com',
    'office365': 'microsoft.com',
    'adobe': 'adobe.com',
    'adobecreativecloud': 'adobe.com',
    'verizon': 'verizon.com',
    'verizonwireless': 'verizon.com',
    'atandt': 'att.com',
    'tmobile': 't-mobile.com',
    'comcast': 'comcast.com',
    'xfinity': 'xfinity.com',
    'starbucks': 'starbucks.com',
    'mcdonalds': 'mcdonalds.com',
    'uber': 'uber.com',
    'lyft': 'lyft.com',
    'doordash': 'doordash.com',
    'grubhub': 'grubhub.com',
    'target': 'target.com',
    'walmart': 'walmart.com',
    'costco': 'costco.com',
    'safeway': 'safeway.com',
    'kroger': 'kroger.com',
    'shell': 'shell.com',
    'exxon': 'exxonmobil.com',
    'chevron': 'chevron.com',
    'bp': 'bp.com',
    'tesla': 'tesla.com',
    'chipotle': 'chipotle.com',
    'subway': 'subway.com',
    'starbuckscoffee': 'starbucks.com',
    'dunkindonuts': 'dunkindonuts.com',
    'pizzahut': 'pizzahut.com',
    'dominos': 'dominos.com',
    'geico': 'geico.com',
    'statefarm': 'statefarm.com',
    'allstate': 'allstate.com',
    'progressive': 'progressive.com',
    'usaa': 'usaa.com',
    'chase': 'chase.com',
    'bankofamerica': 'bankofamerica.com',
    'wellsfargo': 'wellsfargo.com',
    'citi': 'citi.com',
    'americanexpress': 'americanexpress.com',
    'discover': 'discover.com',
    'paypal': 'paypal.com',
    'venmo': 'venmo.com',
    'zelle': 'zellepay.com',
  };

  // Try to find exact match first
  const domain = merchantDomainMap[cleanName];
  if (domain) {
    return `https://logo.clearbit.com/${domain}`;
  }

  // Try partial matches for complex merchant names
  for (const [key, domain] of Object.entries(merchantDomainMap)) {
    if (cleanName.includes(key) || key.includes(cleanName)) {
      return `https://logo.clearbit.com/${domain}`;
    }
  }

  // Fallback: try to construct a domain from the merchant name
  const fallbackDomain = `${cleanName}.com`;
  return `https://logo.clearbit.com/${fallbackDomain}`;
}

export function getMerchantDisplayName(merchantName: string): string {
  if (!merchantName) return '';
  
  // Clean up merchant name for display
  return merchantName
    .replace(/[^\w\s]/g, '') // Remove special characters except spaces
    .replace(/\s+/g, ' ') // Normalize spaces
    .replace(/\b\w/g, l => l.toUpperCase()) // Title case
    .replace(/\s+(Inc|Corp|Llc|Ltd|Co)\b/gi, '') // Remove company suffixes
    .trim();
}

export function getMerchantInitials(merchantName: string): string {
  const displayName = getMerchantDisplayName(merchantName);
  const words = displayName.split(' ').filter(word => word.length > 0);
  
  if (words.length === 0) return '??';
  if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
  
  return words.slice(0, 2).map(word => word[0]).join('').toUpperCase();
}