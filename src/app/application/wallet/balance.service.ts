import { Injectable, effect, inject, signal } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { WalletService } from './wallet.service';

@Injectable({ providedIn: 'root' })
export class BalanceService {
  private auth = inject(AuthService);
  private wallet = inject(WalletService);

  balance = signal<number | null>(null);

  constructor() {
    effect(() => {
      if (this.auth.isLoggedIn()) {
        this.refresh();
      } else {
        this.balance.set(null);
      }
    });
  }

  refresh(): void {
    if (!this.auth.isLoggedIn()) {
      return;
    }

    this.wallet.getBalance().subscribe({
      next: (b) => this.balance.set(Number(b.balance)),
    });
  }
}
