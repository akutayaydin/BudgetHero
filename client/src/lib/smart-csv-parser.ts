import { classifyTransaction, type CategoryDefinition } from "./transaction-classifier";

export interface SmartTransaction {
  date: string;
  description: string;
  merchant: string;
  rawAmount: number;
  amount: string;
  category: string;
  categoryId?: string;
  type: 'income' | 'expense';
}

interface ColumnMapping {
  date: number;
  description: number;  
  amount: number;
  category?: number;
  type?: number;
  debit?: number;
  credit?: number;
}

export function parseSmartCSV(csvText: string): SmartTransaction[] {
  console.log("🔍 Starting smart CSV parsing...");
  
  // Parse CSV into rows
  const rows = parseCSVRows(csvText);
  if (rows.length < 2) {
    throw new Error("CSV file must have at least a header and one data row");
  }

  const headers = rows[0].map(h => h.toLowerCase().trim());
  console.log("📋 CSV Headers:", headers);
  console.log("📋 First data row:", rows[1]);

  // Smart column detection
  const mapping = detectColumns(headers);
  console.log("🎯 Column mapping:", mapping);

  console.log("📋 Column mapping result:", mapping);
  
  if (mapping.date === -1 || mapping.description === -1 || (mapping.amount === -1 && ((mapping.debit || -1) === -1 || (mapping.credit || -1) === -1))) {
    throw new Error(`Unable to detect required columns. Found headers: ${headers.join(', ')}`);
  }

  // Process data rows
  const transactions: SmartTransaction[] = [];
  
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.every(cell => !cell.trim())) continue; // Skip empty rows

    try {
      const transaction = parseRow(row, mapping, headers);
      if (transaction) {
        transactions.push(transaction);
      }
    } catch (error) {
      console.warn(`⚠️ Skipped row ${i + 1}:`, error);
    }
  }

  console.log(`✅ Successfully parsed ${transactions.length} transactions`);
  return transactions;
}

function parseCSVRows(text: string): string[][] {
  // Use a simpler, more reliable CSV parser
  const lines = text.split(/\r?\n/).filter(line => line.trim());
  const rows: string[][] = [];
  
  for (const line of lines) {
    const fields: string[] = [];
    let currentField = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];
      
      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          currentField += '"';
          i++; // Skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        fields.push(currentField.trim());
        currentField = '';
      } else {
        currentField += char;
      }
    }
    
    // Add final field
    fields.push(currentField.trim());
    
    if (fields.some(field => field.length > 0)) {
      rows.push(fields);
    }
  }
  
  console.log(`📋 Parsed ${rows.length} rows from CSV`);
  console.log(`📋 Sample row 0:`, rows[0]);
  console.log(`📋 Sample row 1:`, rows[1]);
  
  return rows;
}

function detectColumns(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {
    date: -1,
    description: -1,
    amount: -1
  };

  // Date column detection - prioritize transaction date for Chase credit cards
  const datePatterns = ['transaction date', 'trans date', 'post date', 'posting date', 'date'];
  mapping.date = findBestMatch(headers, datePatterns);
  console.log(`🗓️ Date column detected: "${headers[mapping.date]}" (index ${mapping.date})`);

  // Description column detection
  const descPatterns = ['description', 'details', 'memo', 'payee', 'merchant'];
  mapping.description = findBestMatch(headers, descPatterns);

  // Amount column detection
  const amountPatterns = ['amount'];
  mapping.amount = findBestMatch(headers, amountPatterns);

  // If no single amount column, look for debit/credit
  if (mapping.amount === -1) {
    const debitPatterns = ['debit', 'withdrawal', 'expense'];
    const creditPatterns = ['credit', 'deposit', 'income'];
    
    mapping.debit = findBestMatch(headers, debitPatterns);
    mapping.credit = findBestMatch(headers, creditPatterns);
  } else {
    // Set defaults to avoid undefined
    mapping.debit = -1;
    mapping.credit = -1;
  }

  // Optional columns
  const categoryPatterns = ['category', 'type', 'classification'];
  mapping.category = findBestMatch(headers, categoryPatterns);

  const typePatterns = ['type', 'trans type', 'transaction type'];
  mapping.type = findBestMatch(headers, typePatterns);

  return mapping;
}

function findBestMatch(headers: string[], patterns: string[]): number {
  // Exact match first
  for (const pattern of patterns) {
    const index = headers.indexOf(pattern);
    if (index !== -1) return index;
  }

  // Partial match
  for (const pattern of patterns) {
    const index = headers.findIndex(h => h.includes(pattern));
    if (index !== -1) return index;
  }

  return -1;
}

function parseRow(row: string[], mapping: ColumnMapping, headers: string[]): SmartTransaction | null {
  // Extract date
  const dateStr = row[mapping.date];
  if (!dateStr?.trim()) {
    console.warn(`❌ Empty date field at index ${mapping.date}:`, row);
    return null;
  }

  console.log(`🗓️ Raw date from CSV: "${dateStr.trim()}" (column: ${headers[mapping.date]}, index: ${mapping.date})`);
  console.log(`🗓️ Full row data:`, row);
  const date = normalizeDate(dateStr.trim());
  if (!date) {
    console.warn(`❌ Failed to parse date: "${dateStr.trim()}"`);
    return null;
  }

  // Extract description  
  const description = row[mapping.description]?.trim() || 'Unknown Transaction';

  // Extract amount
  let rawAmount = 0;
  if (mapping.amount !== -1) {
    rawAmount = parseAmount(row[mapping.amount] || '0');
  } else if (mapping.debit !== undefined && mapping.credit !== undefined && mapping.debit !== -1 && mapping.credit !== -1) {
    const debit = parseAmount(row[mapping.debit!] || '0');
    const credit = parseAmount(row[mapping.credit!] || '0');
    rawAmount = credit - debit; // Credit is positive, debit is negative
  } else {
    return null;
  }

  // Classify transaction
  const classification = classifyTransaction(description, rawAmount);
  
  const transaction: SmartTransaction = {
    date,
    description,
    merchant: description,
    rawAmount,
    amount: Math.abs(rawAmount).toString(),
    category: classification.name,
    categoryId: classification.id,
    type: rawAmount >= 0 ? 'income' : 'expense'
  };

  console.log(`💰 Parsed: ${description} → $${rawAmount} → ${classification.name}`);
  return transaction;
}

function parseAmount(amountStr: string): number {
  if (!amountStr) return 0;
  
  // Remove currency symbols, commas, parentheses
  const cleaned = amountStr.replace(/[$,()]/g, '').trim();
  
  // Handle parentheses as negative (accounting format)
  const isNegative = amountStr.includes('(') && amountStr.includes(')');
  
  const amount = parseFloat(cleaned) || 0;
  return isNegative ? -Math.abs(amount) : amount;
}

function normalizeDate(dateStr: string): string | null {
  if (!dateStr) return null;
  
  const cleaned = dateStr.trim();
  console.log(`🗓️ Parsing date: "${cleaned}"`);
  
  // Check for already malformed date (debugging)
  if (cleaned.includes('202025')) {
    console.error(`❌ MALFORMED DATE DETECTED: "${cleaned}" - this suggests column parsing issue`);
    return null;
  }
  
  // Try multiple date formats with exact matching
  const formats = [
    { pattern: /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, type: 'MM/dd/yyyy' }, // MM/dd/yyyy
    { pattern: /^(\d{4})-(\d{1,2})-(\d{1,2})$/, type: 'yyyy-MM-dd' }, // yyyy-MM-dd  
    { pattern: /^(\d{1,2})-(\d{1,2})-(\d{4})$/, type: 'MM-dd-yyyy' }, // MM-dd-yyyy
    { pattern: /^(\d{1,2})\/(\d{1,2})\/(\d{2})$/, type: 'MM/dd/yy' }, // MM/dd/yy
  ];

  for (const format of formats) {
    const match = cleaned.match(format.pattern);
    if (match) {
      console.log(`🎯 Matched format: ${format.type}`, match);
      let month, day, year;
      
      if (format.type === 'yyyy-MM-dd') {
        [, year, month, day] = match;
      } else if (format.type === 'MM/dd/yy') {
        [, month, day, year] = match;
        // Convert 2-digit year to 4-digit (assume 20xx)
        year = year.length === 2 ? `20${year}` : year;
      } else {
        // MM/dd/yyyy or MM-dd-yyyy format  
        [, month, day, year] = match;
      }

      // Debug the components before normalizing
      console.log(`🔍 Date components: month="${month}", day="${day}", year="${year}"`);
      
      // Validate components
      if (!month || !day || !year || year.length !== 4) {
        console.warn(`❌ Invalid date components: month="${month}", day="${day}", year="${year}"`);
        return null;
      }
      
      const normalized = `${month.padStart(2, '0')}/${day.padStart(2, '0')}/${year}`;
      console.log(`✅ Date normalized: "${cleaned}" → "${normalized}"`);
      
      return normalized;
    }
  }

  console.warn(`❌ Unable to parse date: "${cleaned}"`);
  return null;
}

export async function parseAdvancedCSV(file: File): Promise<SmartTransaction[]> {
  const text = await file.text();
  return parseSmartCSV(text);
}