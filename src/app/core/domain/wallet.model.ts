export interface WalletBalance {
  balance: number;
  credits: number;
}

export interface CreditTransaction {
  id: number;
  amount: number;
  type: 'PURCHASE' | 'DEBIT' | 'REFUND';
  description: string;
  createdAt: string;
}
