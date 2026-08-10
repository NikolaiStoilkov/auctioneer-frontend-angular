import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { Ad } from '../../core/domain/ad.model';
import { AdService } from '../../services/ads/ad.service';
import { SpinnerComponent } from '../../components/spinner/spinner.component';
import { AdListPageComponent } from '../../shared/ad-list-page.component';
import { AdStatusColorPipe } from '../../shared/ad-status-color.pipe';

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
    AdStatusColorPipe,
  ],
  templateUrl: './my-ads.component.html',
  styleUrl: './my-ads.component.css',
})
export class MyAdsComponent extends AdListPageComponent implements OnInit {
  private adService = inject(AdService);

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
}
