import { Injectable, effect, inject, signal } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { WalletService } from './wallet.service';

@Injectable({ providedIn: 'root' })
export class BalanceService {
  private authService = inject(AuthService);
  private walletService = inject(WalletService);

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

  refresh() {
    if (!this.authService.isLoggedIn()) {
      return;
    }

    this.walletService.getBalance().subscribe({
      next: (walletBalance) => this.balance.set(Number(walletBalance.balance)),
    });
  }
}
