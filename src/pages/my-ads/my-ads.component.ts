import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Ad } from '../../core/domain/ad.model';
import { AdService } from '../../services/ads/ad.service';
import { NotificationService } from '../../services/notification/notification.service';

@Component({
  selector: 'app-my-ads',
  standalone: true,
  imports: [
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatChipsModule,
    MatProgressSpinnerModule,
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

  livePrice(ad: Ad): string {
    const price =
      this.notificationService.liveAdPrices()[ad.id!] ??
      ad.currentBidPrice ??
      ad.startingBidPrice;

    return Number(price).toFixed(2);
  }

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
