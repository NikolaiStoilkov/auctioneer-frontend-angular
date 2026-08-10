import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { Ad, AdFilter } from '../../core/domain/ad.model';
import { AdService } from '../../services/ads/ad.service';
import { SpinnerComponent } from '../../components/spinner/spinner.component';
import { AdListPageComponent } from '../../shared/ad-list-page.component';
import { AdStatusColorPipe } from '../../shared/ad-status-color.pipe';

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
    SpinnerComponent,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatChipsModule,
    AdStatusColorPipe,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent extends AdListPageComponent implements OnInit {
  private adService = inject(AdService);

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
}
