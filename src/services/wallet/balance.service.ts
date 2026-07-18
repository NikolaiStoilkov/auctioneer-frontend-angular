import { Injectable, effect, inject, signal } from '@angular/core';

import { WalletService } from './wallet.service';
import { AuthService } from '../auth/auth.service';

/**
 * Holds the current user's wallet balance as an app-wide signal.
 *
 * Automatically loads the balance on login and clears it on logout.
 * Other parts of the app (bidding, notifications, payments) call
 * {@link refresh} after any operation that changes the balance.
 */
@Injectable({ providedIn: 'root' })
export class BalanceService {
  private authService = inject(AuthService);
  private walletService = inject(WalletService);

  /** Current wallet balance, or `null` while logged out or not yet loaded. */
  balance = signal<number | null>(null);

  constructor() {
    effect(() => {
      if (this.authService.isLoggedIn()) {
        this.refresh();
      } else {
        this.balance.set(null);
      }
    });
  }

  /** Re-fetches the wallet balance from the API. No-op while logged out. */
  refresh() {
    if (!this.authService.isLoggedIn()) {
      return;
    }

    this.walletService.getBalance().subscribe({
      next: (walletBalance) => this.balance.set(Number(walletBalance.balance)),
    });
  }
}
