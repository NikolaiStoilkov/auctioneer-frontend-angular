import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { PagedResponse } from '../../core/services/IWalletService';
import { WalletBalance, CreditTransaction } from '../../core/domain/wallet.model';

import { WALLET_API } from '../../core/config/wallet.api';

/**
 * HTTP client for the wallet REST API.
 *
 * Handles the credit top-up flow (Stripe payment intent → confirmation)
 * and exposes the balance and the credit transaction history.
 */
@Injectable({ providedIn: 'root' })
export class WalletService {
  private http = inject(HttpClient);
  private api = WALLET_API;

  /**
   * Fetches the current user's wallet balance.
   *
   * @returns Observable emitting the {@link WalletBalance}.
   */
  getBalance () {
    return this.http.get<WalletBalance>(this.api.balance);
  }

  /**
   * Creates a Stripe payment intent for a credit top-up.
   *
   * @param amount Amount of credits to purchase.
   * @returns Observable emitting the Stripe client secret used to confirm the card payment.
   */
  createPaymentIntent (amount: number) {
    return this.http.post<{ clientSecret: string }>(
      this.api.createPaymentIntent,
      {
        amount
      }
    );
  }

  /**
   * Credits the wallet after a successful Stripe card payment.
   *
   * @param amount Amount of credits that was paid for.
   * @returns Observable emitting the updated {@link WalletBalance}.
   */
  confirmCredits (amount: number) {
    return this.http.post<WalletBalance>(this.api.confirmCredits, {
      amount
    });
  }

  /**
   * Adds credits to the wallet directly, without a card payment.
   *
   * @param amount Amount of credits to add.
   * @returns Observable emitting the updated {@link WalletBalance}.
   */
  addCredits (amount: number) {
    return this.http.post<WalletBalance>(this.api.addCredits, {
      amount
    });
  }

  /**
   * Fetches a page of the user's credit transaction history.
   *
   * @param page Zero-based page index.
   * @param size Number of transactions per page.
   * @returns Observable emitting the requested page of {@link CreditTransaction}s.
   */
  getTransactions (
    page: number,
    size: number
  ) {
    return this.http.get<PagedResponse<CreditTransaction>>(
      this.api.transactions(page, size)
    );
  }
}
