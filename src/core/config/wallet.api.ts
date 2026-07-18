import { API_URL } from './api-url';

const walletBase = `${API_URL}/api/wallet`;

export const WALLET_API = {
  base: walletBase,
  balance: `${walletBase}/balance`,
  createPaymentIntent: `${walletBase}/create-payment-intent`,
  confirmCredits: `${walletBase}/confirm-credits`,
  addCredits: `${walletBase}/add-credits`,
  transactions: (page: number, size: number) =>
    `${walletBase}/transactions?page=${page}&size=${size}`,
} as const;
