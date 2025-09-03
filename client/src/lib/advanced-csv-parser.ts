import { classifyTransaction, type CategoryDefinition } from "./transaction-classifier";

export interface ParsedTransaction {
  date: string;
  merchant: string;
  rawAmount: number; // signed amount from bank
  amount: number; // absolute value
  category: string;
  categoryId?: string;
  ledgerType?: string;
}

export function parseCsvText(text: string): ParsedTransaction[] {
  // Determine delimiter
  const firstLineEnd = text.indexOf('\n') === -1 ? text.length : text.indexOf('\n');
  const headerLine = text.slice(0, firstLineEnd).trim();
  const delimiter = headerLine.includes('\t') ? '\t' : ',';

  // Parse CSV with proper quote handling
  const rows: string[][] = [];
  let field = '';
  let row: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (ch === '"') {
      if (inQuotes && next === '"') {
        field += '"';
        i++; // Skip next quote
        continue;
      }
      inQuotes = !inQuotes;
      continue;
    }

    if (!inQuotes && ch === delimiter) {
      row.push(field);
      field = '';
      continue;
    }

    if (!inQuotes && ch === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
      continue;
    }

    if (!inQuotes && ch === '\r') {
      continue; // Skip carriage returns
    }

    field += ch;
  }

  // Handle last field/row
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  if (rows.length === 0) return [];

  // Process header
  const header = (rows[0] || [])
    .map(s => s.trim().replace(/\uFEFF/g, '')) // Remove BOM
    .filter(h => h !== '');
  
  const lower = header.map(h => h.toLowerCase());

  // Detect CSV format - more flexible matching
  const isChaseChecking = lower.includes('posting date') && 
                         lower.includes('details') && 
                         lower.includes('description') && 
                         lower.includes('amount');

  const isChaseCredit = (lower.includes('transaction date') || lower.includes('trans date')) && 
                       lower.includes('post date') && 
                       lower.includes('description') && 
                       lower.includes('amount');

  // Generic format detection for unknown CSV files
  const hasDateColumn = lower.some(h => h.includes('date'));
  const hasAmountColumn = lower.some(h => h.includes('amount') || h.includes('debit') || h.includes('credit'));
  const hasDescColumn = lower.some(h => h.includes('description') || h.includes('memo') || h.includes('detail'));
  
  const isGenericFormat = hasDateColumn && hasAmountColumn && hasDescColumn && !isChaseChecking && !isChaseCredit;

  // Find column indices
  const dateIndex = isChaseChecking 
    ? lower.indexOf('posting date') 
    : isChaseCredit 
      ? lower.indexOf('post date') 
      : lower.indexOf('date');

  const descriptionIndex = lower.indexOf('description');
  const amountIndex = lower.indexOf('amount');
  const detailsIndex = isChaseChecking 
    ? lower.indexOf('details') 
    : isChaseCredit 
      ? lower.indexOf('type') 
      : -1;

  const categoryIndex = isChaseChecking 
    ? -1 
    : isChaseCredit 
      ? lower.indexOf('category') 
      : lower.indexOf('category');

  if (dateIndex === -1 || descriptionIndex === -1 || amountIndex === -1) {
    console.warn('Unsupported CSV header. Got:', header);
    return [];
  }

  // Process data rows
  const transactions = rows.slice(1)
    .filter(row => row.some(cell => String(cell || '').trim().length > 0))
    .map(columns => {
      const date = (columns[dateIndex] || '').trim();
      const description = (columns[descriptionIndex] || '').trim();
      const detailsRaw = detailsIndex > -1 ? String(columns[detailsIndex] || '').trim() : '';
      const details = detailsRaw.toUpperCase();
      const typeLower = detailsRaw.toLowerCase();
      
      // Parse amount
      const rawAmount = String(columns[amountIndex] || '0').trim();
      const isParen = /^\(.*\)$/.test(rawAmount);
      const cleaned = rawAmount.replace(/[()$,]/g, '');
      let amount = parseFloat(cleaned || '0');
      
      if (isNaN(amount)) amount = 0;
      if (isParen) amount = -Math.abs(amount);

      // Handle different bank formats
      if (isChaseChecking) {
        if (details === 'DEBIT' && amount > 0) amount = -amount;
        if (details === 'CREDIT' && amount < 0) amount = Math.abs(amount);
      } else if (isChaseCredit) {
        const isPayment = /(payment|credit|adjustment|return|refund)/i.test(typeLower) || 
                         /payment|credit/i.test(description);
        const isPurchase = /(sale|purchase|charge|fee)/i.test(typeLower);
        
        if (isPayment && amount < 0) amount = Math.abs(amount);
        if (isPurchase && amount > 0) amount = -Math.abs(amount);
        if (!isPayment && !isPurchase) {
          if (amount > 0) amount = -amount;
        }
      }

      // Use new classification system
      const signedAmount = amount; // Store the signed amount
      const absAmount = Math.abs(amount); // Absolute value for display
      
      // Classify the transaction using the new system
      const classifiedCategory = classifyTransaction(description, signedAmount);
      
      return {
        date,
        merchant: description,
        rawAmount: signedAmount,
        amount: absAmount,
        category: classifiedCategory.name,
        categoryId: classifiedCategory.id,
        ledgerType: classifiedCategory.ledgerType
      };
    })
    .filter(transaction => transaction.date && transaction.merchant);

  return transactions;
}

export function formatTransactionForApi(transaction: ParsedTransaction) {
  // Determine legacy type based on ledger type for backward compatibility
  let legacyType: 'income' | 'expense' = 'expense';
  if (transaction.ledgerType === 'INCOME') {
    legacyType = 'income';
  } else if (['EXPENSE', 'DEBT_INTEREST'].includes(transaction.ledgerType || '')) {
    legacyType = 'expense';
  } else {
    // For transfers, adjustments, etc., use the raw amount sign as fallback
    legacyType = transaction.rawAmount >= 0 ? 'income' : 'expense';
  }

  return {
    date: transaction.date,
    description: transaction.merchant,
    merchant: transaction.merchant,
    rawAmount: transaction.rawAmount,
    amount: transaction.amount.toString(),
    categoryId: transaction.categoryId,
    category: transaction.category,
    type: legacyType
  };
}

export async function parseAdvancedCSV(file: File): Promise<any[]> {
  const text = await file.text();
  const parsedTransactions = parseCsvText(text);
  return parsedTransactions.map(formatTransactionForApi);
}