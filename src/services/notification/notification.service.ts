import { Injectable, OnDestroy, effect, inject, signal } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { BalanceService } from '../wallet/balance.service';
import { UserNotification } from '../../core/domain/notification.model';
import * as variables  from '@env/environment.development';
// import environmentProd  from '@env/environment';


export interface ToastNotification extends UserNotification {
  id: number;
}

@Injectable({ providedIn: 'root' })
export class NotificationService implements OnDestroy {
  private userSseSource: EventSource | null = null;
  private globalBidSource: EventSource | null = null;
  private nextId = 0;

  toasts = signal<ToastNotification[]>([]);
  unreadCount = signal(0);
  /** Live bid prices keyed by adId — updated for every bid across all ads. */
  liveAdPrices = signal<Record<number, number>>({});

  private balanceService = inject(BalanceService);

  constructor(private auth: AuthService) {
    this.connectGlobalBids();

    effect(() => {
      if (auth.isLoggedIn()) {
        this.connectUserStream();
      } else {
        this.disconnectUserStream();
      }
    });
  }

  private connectGlobalBids(): void {
    if (this.globalBidSource) {
      return;
    }

    const url = `${variables.environment.API_URL}/api/ads/stream`;

    this.globalBidSource = new EventSource(url);

    this.globalBidSource.addEventListener('bid', (event: MessageEvent) => {
      const bid = JSON.parse(event.data);
      this.liveAdPrices.update((prices) => ({
        ...prices,
        [bid.adId]: bid.currentBidPrice,
      }));
    });
  }

  private connectUserStream(): void {
    if (this.userSseSource) {
      return;
    }

    const token = this.auth.getToken();

    if (!token) {
      return;
    }

    const url = `${variables.environment.API_URL}/api/users/notifications/stream?token=${encodeURIComponent(token)}`;

    this.userSseSource = new EventSource(url);

    this.userSseSource.addEventListener(
      'notification',
      (event: MessageEvent) => {
        const notification: UserNotification = JSON.parse(event.data);

        this.liveAdPrices.update((prices) => ({
          ...prices,
          [notification.adId]: notification.currentBidPrice,
        }));

        this.balanceService.refresh();

        const toast: ToastNotification = {
          ...notification,
          id: ++this.nextId
        };

        this.toasts.update((t) => [toast, ...t]);

        this.unreadCount.update((c) => c + 1);

        setTimeout(() => this.dismissToast(toast.id), 6000);
      },
    );
  }

  private disconnectUserStream(): void {
    this.userSseSource?.close();
    this.userSseSource = null;
    this.toasts.set([]);
    this.unreadCount.set(0);
  }

  dismissToast(id: number): void {
    this.toasts.update((t) => t.filter((n) => n.id !== id));
  }

  clearUnread(): void {
    this.unreadCount.set(0);
  }

  ngOnDestroy(): void {
    this.globalBidSource?.close();
    this.disconnectUserStream();
  }
}
