import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { StripePort } from '@/core/ports/stripe.port';
import { PaymentMethodResponse } from '@/core/domain/stripe.model';
import { environment } from '@env/environment';

@Injectable({ providedIn: 'root' })
export class StripeHttpAdapter extends StripePort {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/api/stripe`;

  getConfig(): Observable<{ publishableKey: string }> {
    return this.http.get<{ publishableKey: string }>(`${this.base}/config`);
  }

  createSetupIntent(): Observable<{ clientSecret: string }> {
    return this.http.post<{ clientSecret: string }>(
      `${this.base}/setup-intent`,
      {},
    );
  }

  savePaymentMethod(): Observable<unknown> {
    return this.http.post(`${this.base}/save-customer-payment-method`, {});
  }

  getSavedCards(): Observable<PaymentMethodResponse[]> {
    return this.http.get<PaymentMethodResponse[]>(
      `${this.base}/payment-methods`,
    );
  }
}
