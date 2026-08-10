import { inject } from '@angular/core';

import { Ad } from '../core/domain/ad.model';
import { NotificationService } from '../services/notification/notification.service';

/**
 * Base class for pages that render a list of ads with live prices.
 *
 * Holds the {@link NotificationService} injection and the
 * {@link livePrice} helper shared by the home and "my ads" pages, so the
 * live-price logic is defined once instead of being copied per page.
 */
export abstract class AdListPageComponent {
  /** Global SSE-backed notification service exposing live ad prices. */
  readonly notificationService = inject(NotificationService);

  /**
   * Returns the ad's current price formatted with two decimals,
   * preferring the live SSE price over the loaded snapshot.
   *
   * @param ad Ad to price.
   * @returns The display price, e.g. `"120.00"`.
   */
  livePrice(ad: Ad): string {
    const price =
      this.notificationService.liveAdPrices()[ad.id!] ??
      ad.currentBidPrice ??
      ad.startingBidPrice;

    return Number(price).toFixed(2);
  }
}
