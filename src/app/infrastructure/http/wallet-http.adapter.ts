import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { WalletPort, PagedResponse } from '@/core/ports/wallet.port';
import { WalletBalance, CreditTransaction } from '@/core/domain/wallet.model';
import { environment } from '@env/environment';

@Injectable({ providedIn: 'root' })
export class WalletHttpAdapter extends WalletPort {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/api/wallet`;

  getBalance(): Observable<WalletBalance> {
    return this.http.get<WalletBalance>(`${this.base}/balance`);
  }

  createPaymentIntent(amount: number): Observable<{ clientSecret: string }> {
    return this.http.post<{ clientSecret: string }>(
      `${this.base}/create-payment-intent`,
      {
        amount,
      },
    );
  }

  confirmCredits(amount: number): Observable<WalletBalance> {
    return this.http.post<WalletBalance>(`${this.base}/confirm-credits`, {
      amount,
    });
  }

  addCredits(amount: number): Observable<WalletBalance> {
    return this.http.post<WalletBalance>(`${this.base}/add-credits`, {
      amount,
    });
  }

  getTransactions(
    page: number,
    size: number,
  ): Observable<PagedResponse<CreditTransaction>> {
    return this.http.get<PagedResponse<CreditTransaction>>(
      `${this.base}/transactions?page=${page}&size=${size}`,
    );
  }
}
