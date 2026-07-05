import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Ad, AdFilter } from '@/core/domain/ad.model';
import { AdService } from '@/application/ads/ad.service';
import { NotificationService } from '@/application/notification/notification.service';

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
  ns = inject(NotificationService);

  ads = signal<Ad[]>([]);
  loading = signal(true);
  page = signal(1);
  pageSize = 10;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);

    const filter: AdFilter = {
      active: true,
      page: this.page(),
      size: this.pageSize,
    };

    this.adService.getPaginated(filter).subscribe({
      next: (data) => {
        this.ads.set(data);

        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  prevPage(): void {
    if (this.page() > 1) {
      this.page.update((p) => p - 1);

      this.load();
    }
  }

  nextPage(): void {
    this.page.update((p) => p + 1);
    this.load();
  }

  livePrice(ad: Ad): string {
    const price =
      this.ns.liveAdPrices()[ad.id!] ??
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
