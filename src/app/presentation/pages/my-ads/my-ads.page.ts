import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Ad } from '../../../core/domain/ad.model';
import { AdService } from '../../../application/ads/ad.service';

@Component({
  selector: 'app-my-ads',
  standalone: true,
  imports: [RouterLink, MatCardModule, MatButtonModule, MatChipsModule, MatProgressSpinnerModule],
  template: `
    <div style="max-width:1100px;margin:0 auto;padding:24px 16px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px">
        <h1 style="margin:0">My Auctions</h1>
        <button mat-raised-button color="primary" routerLink="/ads/create">+ Create New</button>
      </div>
      @if (loading()) {
        <div style="display:flex;justify-content:center;padding:48px">
          <mat-spinner></mat-spinner>
        </div>
      } @else {
        <div
          style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:20px"
        >
          @for (ad of ads(); track ad.id) {
            <mat-card>
              @if (ad.image) {
                <img
                  mat-card-image
                  [src]="ad.image"
                  [alt]="ad.title"
                  style="height:160px;object-fit:cover"
                />
              }
              <mat-card-header style="padding:12px 12px 0">
                <mat-card-title style="font-size:1rem">{{ ad.title }}</mat-card-title>
                <mat-card-subtitle>{{ ad.location }}</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content style="padding:8px 12px">
                <div style="display:flex;justify-content:space-between;align-items:center">
                  <span style="font-weight:500;color:#1976d2"
                    >\${{ ad.currentBidPrice ?? ad.startingBidPrice }}</span
                  >
                  <mat-chip-set>
                    <mat-chip [style.background]="statusColor(ad.status)">{{ ad.status }}</mat-chip>
                  </mat-chip-set>
                </div>
              </mat-card-content>
              <mat-card-actions style="padding:0 8px 8px">
                <button mat-button [routerLink]="['/ads', ad.id]">View</button>
              </mat-card-actions>
            </mat-card>
          }
          @if (ads().length === 0) {
            <p style="color:#666">You have no auctions yet.</p>
          }
        </div>
      }
    </div>
  `,
})
export class MyAdsPage implements OnInit {
  private adService = inject(AdService);

  ads = signal<Ad[]>([]);
  loading = signal(true);

  ngOnInit(): void {
    this.adService.getMyAds().subscribe({
      next: (data) => {
        this.ads.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  statusColor(status?: string): string {
    if (status === 'ACTIVE') return '#c8e6c9';
    if (status === 'SOLD') return '#ffcdd2';
    return '#fff9c4';
  }
}
