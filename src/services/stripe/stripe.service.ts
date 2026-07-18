import { Injectable, inject } from '@angular/core';
import { PaymentMethodResponse } from '../../core/domain/stripe.model';
import { HttpClient } from '@angular/common/http';
import * as variables from '@env/environment.development';

@Injectable({ providedIn: 'root' })
export class StripeService {
  private http = inject(HttpClient);
  private base = `${variables.environment.API_URL}/api/stripe`;

  getConfig() {
    return this.http.get<{ publishableKey: string }>(`${this.base}/config`);
  }

  createSetupIntent(){
    return this.http.post<{ clientSecret: string }>(
      `${this.base}/setup-intent`,
      {},
    );
  }

  savePaymentMethod() {
    return this.http.post(`${this.base}/save-customer-payment-method`, {});
  }

  getSavedCards() {
    return this.http.get<PaymentMethodResponse[]>(
      `${this.base}/payment-methods`,
    );
  }
}
