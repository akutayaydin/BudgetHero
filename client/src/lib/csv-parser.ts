import Papa from "papaparse";
import type { InsertTransaction } from "@shared/schema";

interface CSVRow {
  [key: string]: string;
}

export async function parseCSVData(file: File): Promise<InsertTransaction[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results: any) => {
        try {
          const transactions = processCSVData(results.data as CSVRow[]);
          resolve(transactions);
        } catch (error) {
          reject(error);
        }
      },
      error: (error: any) => {
        reject(new Error(`CSV parsing failed: ${error.message}`));
      }
    });
  });
}

function processCSVData(data: CSVRow[]): InsertTransaction[] {
  const transactions: InsertTransaction[] = [];
  
  for (const row of data) {
    try {
      const transaction = parseRow(row);
      if (transaction) {
        transactions.push(transaction);
      }
    } catch (error) {
      console.warn("Skipping invalid row:", row, error);
    }
  }
  
  if (transactions.length === 0) {
    throw new Error("No valid transactions found in CSV file");
  }
  
  return transactions;
}

function parseRow(row: CSVRow): InsertTransaction | null {
  // Try to detect common CSV formats
  const possibleDateFields = ["date", "Date", "DATE", "transaction_date", "Transaction Date"];
  const possibleDescriptionFields = ["description", "Description", "DESCRIPTION", "memo", "Memo", "MEMO"];
  const possibleAmountFields = ["amount", "Amount", "AMOUNT", "value", "Value", "VALUE"];
  const possibleCategoryFields = ["category", "Category", "CATEGORY", "type", "Type", "TYPE"];

  const dateField = possibleDateFields.find(field => row[field]);
  const descriptionField = possibleDescriptionFields.find(field => row[field]);
  const amountField = possibleAmountFields.find(field => row[field]);
  const categoryField = possibleCategoryFields.find(field => row[field]);

  if (!dateField || !descriptionField || !amountField) {
    return null;
  }

  const dateStr = row[dateField];
  const description = row[descriptionField];
  const amountStr = row[amountField];
  const category = categoryField ? row[categoryField] || "Other" : "Other";

  // Parse date
  const date = parseDate(dateStr);
  if (!date) {
    return null;
  }

  // Parse amount
  const amount = parseAmount(amountStr);
  if (amount === null) {
    return null;
  }

  // Determine transaction type
  const type: "income" | "expense" = amount >= 0 ? "income" : "expense";
  const absoluteAmount = Math.abs(amount).toFixed(2);

  return {
    date: date,
    description: description.trim(),
    amount: absoluteAmount,
    category: mapCategory(category, type),
    type: type,
    userId: null
  };
}

function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  
  // Try common date formats
  const formats = [
    // MM/DD/YYYY or MM-DD-YYYY
    /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/,
    // YYYY/MM/DD or YYYY-MM-DD
    /^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/,
    // DD/MM/YYYY or DD-MM-YYYY
    /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/
  ];

  const trimmed = dateStr.trim();
  
  // Try parsing as ISO date first
  const isoDate = new Date(trimmed);
  if (!isNaN(isoDate.getTime())) {
    return isoDate;
  }

  // Try regex patterns
  for (const format of formats) {
    const match = trimmed.match(format);
    if (match) {
      const [, part1, part2, part3] = match;
      
      // Assume YYYY-MM-DD if first part has 4 digits
      if (part1.length === 4) {
        const date = new Date(parseInt(part1), parseInt(part2) - 1, parseInt(part3));
        if (!isNaN(date.getTime())) return date;
      } else {
        // Assume MM/DD/YYYY
        const date = new Date(parseInt(part3), parseInt(part1) - 1, parseInt(part2));
        if (!isNaN(date.getTime())) return date;
      }
    }
  }

  return null;
}

function parseAmount(amountStr: string): number | null {
  if (!amountStr) return null;
  
  // Remove currency symbols, commas, and whitespace
  const cleaned = amountStr
    .replace(/[$£€¥₹,\s]/g, "")
    .replace(/[()]/g, "-") // Handle parentheses for negative amounts
    .trim();
  
  const amount = parseFloat(cleaned);
  return isNaN(amount) ? null : amount;
}

function mapCategory(category: string, type: "income" | "expense"): string {
  const lowerCategory = category.toLowerCase().trim();
  
  // Income categories
  if (type === "income") {
    if (lowerCategory.includes("salary") || lowerCategory.includes("wage")) return "Salary";
    if (lowerCategory.includes("freelance") || lowerCategory.includes("contract")) return "Freelance";
    if (lowerCategory.includes("investment") || lowerCategory.includes("dividend")) return "Investment";
    return "Income";
  }
  
  // Expense categories
  if (lowerCategory.includes("food") || lowerCategory.includes("restaurant") || 
      lowerCategory.includes("grocery") || lowerCategory.includes("dining")) {
    return "Food & Dining";
  }
  if (lowerCategory.includes("gas") || lowerCategory.includes("transport") || 
      lowerCategory.includes("uber") || lowerCategory.includes("taxi")) {
    return "Transportation";
  }
  if (lowerCategory.includes("electric") || lowerCategory.includes("utility") || 
      lowerCategory.includes("water") || lowerCategory.includes("internet")) {
    return "Utilities";
  }
  if (lowerCategory.includes("entertainment") || lowerCategory.includes("movie") || 
      lowerCategory.includes("gaming")) {
    return "Entertainment";
  }
  if (lowerCategory.includes("health") || lowerCategory.includes("medical") || 
      lowerCategory.includes("pharmacy")) {
    return "Healthcare";
  }
  if (lowerCategory.includes("shopping") || lowerCategory.includes("retail") || 
      lowerCategory.includes("store")) {
    return "Shopping";
  }
  
  return category || "Other";
}
