import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { Ad } from '../../core/domain/ad.model';
import { AdService } from '../../services/ads/ad.service';
import { NotificationService } from '../../services/notification/notification.service';
import { SpinnerComponent } from '../../components/spinner/spinner.component';

/**
 * "My ads" page listing the auctions created by the logged-in user,
 * with live prices from the global SSE stream.
 */
@Component({
  selector: 'app-my-ads',
  standalone: true,
  imports: [
    SpinnerComponent,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatChipsModule,
  ],
  templateUrl: './my-ads.component.html',
  styleUrl: './my-ads.component.css',
})
export class MyAdsComponent implements OnInit {
  private adService = inject(AdService);
  notificationService = inject(NotificationService);

  ads = signal<Ad[]>([]);
  loading = signal(true);

  ngOnInit(): void {
    this.adService.getMyAds().subscribe({
      next: (loadedAds) => {
        this.ads.set(loadedAds);

        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
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
