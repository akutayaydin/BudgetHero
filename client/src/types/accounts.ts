export type Money = number;

export interface AccountLeaf {
  id: string;
  name: string;
  subtitle?: string;
  amount: Money;
  icon?: string;
  mask?: string;
  officialName?: string;
  institutionName?: string;
}

export interface AccountGroup {
  id:
    | "checking"
    | "creditCards"
    | "savings"
    | "investments"
    | "netCash"
    | string;
  label: string;
  total?: Money;
  children?: AccountLeaf[];
  action?: { label: string; type: "add" };
  tone?: "positive" | "negative" | "default";
}

export interface AccountsOverviewResponse {
  groups: AccountGroup[];
}

export interface LastSyncedResponse {
  lastSyncedAt: string | null;
}
