import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Ad, AdFilter } from '@/core/domain/ad.model';
import { AdService } from '@/application/ads/ad.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, MatCardModule, MatButtonModule, MatChipsModule, MatProgressSpinnerModule],
  template: `
    <div style="max-width:1100px;margin:0 auto;padding:24px 16px">
      <h1 style="margin-bottom:24px">Active Auctions</h1>
      @if (loading()) {
        <div style="display:flex;justify-content:center;padding:48px">
          <mat-spinner></mat-spinner>
        </div>
      } @else {
        <div
          style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:20px"
        >
          @for (ad of ads(); track ad.id) {
            <mat-card style="cursor:pointer" [routerLink]="['/ads', ad.id]">
              @if (ad.image) {
                <img
                  mat-card-image
                  [src]="ad.image"
                  [alt]="ad.title"
                  style="height:180px;object-fit:cover"
                />
              } @else {
                <div
                  style="height:180px;background:#e0e0e0;display:flex;align-items:center;justify-content:center;color:#9e9e9e;font-size:0.9rem"
                >
                  No Image
                </div>
              }
              <mat-card-header style="padding:12px 12px 0">
                <mat-card-title style="font-size:1rem">{{ ad.title }}</mat-card-title>
                <mat-card-subtitle>{{ ad.location }}</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content style="padding:8px 12px">
                <p
                  style="margin:0;font-size:0.85rem;color:#555;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical"
                >
                  {{ ad.description }}
                </p>
                <div
                  style="margin-top:8px;display:flex;justify-content:space-between;align-items:center"
                >
                  <span style="font-weight:500;color:#1976d2"
                    >Current: \${{ ad.currentBidPrice ?? ad.startingBidPrice }}</span
                  >
                  <mat-chip-set>
                    <mat-chip [style.background]="statusColor(ad.status)">{{ ad.status }}</mat-chip>
                  </mat-chip-set>
                </div>
              </mat-card-content>
            </mat-card>
          }
          @if (ads().length === 0) {
            <p style="color:#666">No auctions found.</p>
          }
        </div>
        @if (ads().length > 0) {
          <div style="display:flex;justify-content:center;gap:12px;margin-top:32px">
            <button mat-button [disabled]="page() === 1" (click)="prevPage()">Previous</button>
            <span style="line-height:36px">Page {{ page() }}</span>
            <button mat-button [disabled]="ads().length < pageSize" (click)="nextPage()">
              Next
            </button>
          </div>
        }
      }
    </div>
  `,
})
export class HomePage implements OnInit {
  private adService = inject(AdService);

  ads = signal<Ad[]>([]);
  loading = signal(true);
  page = signal(1);
  pageSize = 10;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    const filter: AdFilter = { active: true, page: this.page(), size: this.pageSize };
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

  statusColor(status?: string): string {
    if (status === 'ACTIVE') return '#c8e6c9';
    if (status === 'SOLD') return '#ffcdd2';
    return '#fff9c4';
  }
}
