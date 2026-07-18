import { API_URL } from './api-url';

const stripeBase = `${API_URL}/api/stripe`;

export const STRIPE_API = {
  base: stripeBase,
  config: `${stripeBase}/config`,
  setupIntent: `${stripeBase}/setup-intent`,
  savePaymentMethod: `${stripeBase}/save-customer-payment-method`,
  paymentMethods: `${stripeBase}/payment-methods`,
} as const;
