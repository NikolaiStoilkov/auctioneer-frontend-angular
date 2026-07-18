import { Injectable, OnDestroy, effect, inject, signal } from '@angular/core';

import { AuthService } from '../auth/auth.service';
import { BalanceService } from '../wallet/balance.service';
import { UserNotification } from '../../core/domain/notification.model';

import { ADS_API } from '../../core/config/ads.api';
import { USERS_API } from '../../core/config/users.api';


/** A {@link UserNotification} shown as a toast, tagged with a client-side id for dismissal. */
export interface ToastNotification extends UserNotification {
  /** Client-generated identifier used to dismiss the toast. */
  id: number;
}

/**
 * Receives real-time auction events over Server-Sent Events (SSE).
 *
 * Maintains two streams:
 * - a global, unauthenticated bid stream that keeps {@link liveAdPrices}
 *   up to date for every ad in the app, and
 * - a per-user notification stream (connected only while logged in) that
 *   produces toast notifications, tracks the unread count, and refreshes
 *   the wallet balance when the user is outbid.
 *
 * Toasts auto-dismiss after 6 seconds.
 */
@Injectable({ providedIn: 'root' })
export class NotificationService implements OnDestroy {
  private userSseSource: EventSource | null = null;
  private globalBidSource: EventSource | null = null;
  private nextId = 0;

  /** Currently visible toast notifications, newest first. */
  toasts = signal<ToastNotification[]>([]);

  /** Number of notifications received since the user last opened the notification UI. */
  unreadCount = signal(0);

  /** Live bid prices keyed by adId — updated for every bid across all ads. */
  liveAdPrices = signal<Record<number, number>>({});

  private balanceService = inject(BalanceService);

  constructor(private authService: AuthService) {
    this.connectGlobalBids();

    effect(() => {
      if (authService.isLoggedIn()) {
        this.connectUserStream();
      } else {
        this.disconnectUserStream();
      }
    });
  }

  /** Opens the global bid SSE stream feeding {@link liveAdPrices}. No-op when already connected. */
  private connectGlobalBids(): void {
    if (this.globalBidSource) {
      return;
    }

    this.globalBidSource = new EventSource(ADS_API.stream);

    this.globalBidSource.addEventListener('bid', (event: MessageEvent) => {
      const bid = JSON.parse(event.data);
      this.liveAdPrices.update((prices) => ({
        ...prices,
        [bid.adId]: bid.currentBidPrice,
      }));
    });
  }

  /**
   * Opens the authenticated per-user notification stream.
   *
   * Each incoming notification updates the live price for its ad, refreshes
   * the wallet balance, shows a toast, and bumps the unread count.
   * No-op when already connected or when no valid token is available.
   */
  private connectUserStream(): void {
    if (this.userSseSource) {
      return;
    }

    const token = this.authService.getToken();

    if (!token) {
      return;
    }

    this.userSseSource = new EventSource(USERS_API.notificationsStream(token));

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

        this.toasts.update((currentToasts) => [toast, ...currentToasts]);

        this.unreadCount.update((currentCount) => currentCount + 1);

        setTimeout(() => this.dismissToast(toast.id), 6000);
      },
    );
  }

  /** Closes the per-user stream and clears all toasts and the unread count. */
  private disconnectUserStream(): void {
    this.userSseSource?.close();
    this.userSseSource = null;
    this.toasts.set([]);
    this.unreadCount.set(0);
  }

  /**
   * Removes a toast from the visible list.
   *
   * @param id Client-side id of the toast to dismiss.
   */
  dismissToast(id: number): void {
    this.toasts.update((currentToasts) =>
      currentToasts.filter((toast) => toast.id !== id),
    );
  }

  /** Resets the unread notification counter to zero. */
  clearUnread(): void {
    this.unreadCount.set(0);
  }

  ngOnDestroy(): void {
    this.globalBidSource?.close();
    this.disconnectUserStream();
  }
}
