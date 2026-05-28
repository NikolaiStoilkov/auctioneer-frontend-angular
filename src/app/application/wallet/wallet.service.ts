import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { WalletPort, PagedResponse } from '@/core/ports/wallet.port';
import { WalletBalance, CreditTransaction } from '@/core/domain/wallet.model';

@Injectable({ providedIn: 'root' })
export class WalletService {
  private port = inject(WalletPort);

  getBalance(): Observable<WalletBalance> {
    return this.port.getBalance();
  }

  createPaymentIntent(amount: number): Observable<{ clientSecret: string }> {
    return this.port.createPaymentIntent(amount);
  }

  confirmCredits(amount: number): Observable<WalletBalance> {
    return this.port.confirmCredits(amount);
  }

  addCredits(amount: number): Observable<WalletBalance> {
    return this.port.addCredits(amount);
  }

  getTransactions(
    page: number,
    size: number,
  ): Observable<PagedResponse<CreditTransaction>> {
    return this.port.getTransactions(page, size);
  }
}
