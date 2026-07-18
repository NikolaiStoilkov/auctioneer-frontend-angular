export interface CardInfo {
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
}

export interface SepaDebitInfo {
  bankCode: string;
  branchCode: string;
  country: string;
  fingerprint: string;
  last4: string;
}

export interface BillingDetailsInfo {
  name: string;
  email: string;
  phone?: string;
}

export interface PaymentMethodResponse {
  id: string;
  type: string;
  customerAccount?: string;
  livemode: boolean;
  created: number;
  card?: CardInfo;
  sepaDebit?: SepaDebitInfo;
  billingDetails?: BillingDetailsInfo;
}
