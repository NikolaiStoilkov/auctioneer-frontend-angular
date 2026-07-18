import { Injectable, inject } from '@angular/core';
import { PagedResponse } from '../../core/ports/wallet.port';
import { WalletBalance, CreditTransaction } from '../../core/domain/wallet.model';
import { HttpClient } from '@angular/common/http';
import * as variables from '@env/environment.development';

@Injectable({ providedIn: 'root' })
export class WalletService {
  private http = inject(HttpClient);
  private base = `${variables.environment.API_URL}/api/wallet`;

  getBalance () {
    return this.http.get<WalletBalance>(`${this.base}/balance`);
  }

  createPaymentIntent (amount: number) {
    return this.http.post<{ clientSecret: string }>(
      `${this.base}/create-payment-intent`,
      {
        amount
      }
    );
  }

  confirmCredits (amount: number) {
    return this.http.post<WalletBalance>(`${this.base}/confirm-credits`, {
      amount
    });
  }

  addCredits (amount: number) {
    return this.http.post<WalletBalance>(`${this.base}/add-credits`, {
      amount
    });
  }

  getTransactions (
    page: number,
    size: number
  ) {
    return this.http.get<PagedResponse<CreditTransaction>>(
      `${this.base}/transactions?page=${page}&size=${size}`
    );
  }
}
