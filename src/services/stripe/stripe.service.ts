import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { PaymentMethodResponse } from '../../core/domain/stripe.model';
import { STRIPE_API } from '../../core/config/stripe.api';

/**
 * HTTP client for the backend's Stripe integration endpoints.
 *
 * Provides the publishable key, setup intents for saving cards,
 * and access to the user's saved payment methods. The actual card
 * confirmation happens client-side via Stripe.js.
 */
@Injectable({ providedIn: 'root' })
export class StripeService {
  private http = inject(HttpClient);
  private api = STRIPE_API;

  /**
   * Fetches the Stripe publishable key used to initialize Stripe.js.
   *
   * @returns Observable emitting the publishable key.
   */
  getConfig() {
    return this.http.get<{ publishableKey: string }>(this.api.config);
  }

  /**
   * Creates a Stripe setup intent for saving a new card.
   *
   * @returns Observable emitting the client secret used with `stripe.confirmCardSetup`.
   */
  createSetupIntent(){
    return this.http.post<{ clientSecret: string }>(
      this.api.setupIntent,
      {},
    );
  }

  /**
   * Notifies the backend to persist the payment method after a successful card setup.
   *
   * @returns Observable completing when the payment method has been saved.
   */
  savePaymentMethod() {
    return this.http.post(this.api.savePaymentMethod, {});
  }

  /**
   * Fetches the user's saved cards.
   *
   * @returns Observable emitting the saved payment methods.
   */
  getSavedCards() {
    return this.http.get<PaymentMethodResponse[]>(
      this.api.paymentMethods,
    );
  }
}
