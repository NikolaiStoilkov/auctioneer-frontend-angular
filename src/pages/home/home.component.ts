import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Ad, AdFilter } from '../../core/domain/ad.model';
import { AdService } from '../../services/ads/ad.service';
import { NotificationService } from '../../services/notification/notification.service';

/**
 * Home page listing all active auctions.
 *
 * Loads ads page by page and overlays live bid prices from the global
 * SSE stream exposed by {@link NotificationService}.
 */
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatChipsModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent implements OnInit {
  private adService = inject(AdService);
  notificationService = inject(NotificationService);

  ads = signal<Ad[]>([]);
  loading = signal(true);
  page = signal(1);
  pageSize = 10;

  ngOnInit(): void {
    this.load();
  }

  /** Fetches the current page of active ads. */
  load(): void {
    this.loading.set(true);

    const filter: AdFilter = {
      active: true,
      page: this.page(),
      size: this.pageSize,
    };

    this.adService.getPaginated(filter).subscribe({
      next: (loadedAds) => {
        this.ads.set(loadedAds);

        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  /** Navigates to the previous page, if any, and reloads. */
  prevPage(): void {
    if (this.page() > 1) {
      this.page.update((currentPage) => currentPage - 1);

      this.load();
    }
  }

  /** Navigates to the next page and reloads. */
  nextPage(): void {
    this.page.update((currentPage) => currentPage + 1);
    this.load();
  }

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

  /**
   * Maps an ad status to its chip background color.
   *
   * @param status Ad status (`ACTIVE`, `SOLD`, or other).
   * @returns A CSS color: green for active, red for sold, yellow otherwise.
   */
  statusColor(status?: string): string {
    if (status === 'ACTIVE') {
      return '#c8e6c9';
    }
    if (status === 'SOLD') {
      return '#ffcdd2';
    }
    return '#fff9c4';
  }
}
