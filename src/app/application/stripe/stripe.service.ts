import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { StripePort } from '@/core/ports/stripe.port';
import { PaymentMethodResponse } from '@/core/domain/stripe.model';

@Injectable({ providedIn: 'root' })
export class StripeService {
  private port = inject(StripePort);

  getConfig(): Observable<{ publishableKey: string }> {
    return this.port.getConfig();
  }

  createSetupIntent(): Observable<{ clientSecret: string }> {
    return this.port.createSetupIntent();
  }

  savePaymentMethod(): Observable<unknown> {
    return this.port.savePaymentMethod();
  }

  getSavedCards(): Observable<PaymentMethodResponse[]> {
    return this.port.getSavedCards();
  }
}
