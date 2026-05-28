import {
  Component,
  NgZone,
  computed,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Ad, BidResponse } from '@/core/domain/ad.model';
import { Comment } from '@/core/domain/comment.model';
import { AdService } from '@/application/ads/ad.service';
import { CommentService } from '@/application/comment/comment.service';
import { AuthService } from '@/application/auth/auth.service';
import { BalanceService } from '@/application/wallet/balance.service';
import { environment } from '@env/environment';

@Component({
  selector: 'app-ad-detail',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    DatePipe,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatIconModule,
    MatTooltipModule,
  ],
  styles: [
    `
      .bid-panel {
        background: linear-gradient(135deg, #f5f7fa 0%, #e8f4fd 100%);
        border: 2px solid #1976d2;
        border-radius: 12px;
        padding: 20px;
        margin: 16px 0;
      }
      .bid-panel.live {
        border-color: #43a047;
        background: linear-gradient(135deg, #f5f7fa 0%, #e8f5e9 100%);
      }
      .price-row {
        display: flex;
        gap: 24px;
        flex-wrap: wrap;
        align-items: center;
        margin-bottom: 12px;
      }
      .price-box {
        text-align: center;
        padding: 10px 16px;
        background: white;
        border-radius: 8px;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
        min-width: 100px;
      }
      .price-box .label {
        font-size: 11px;
        color: #777;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .price-box .value {
        font-size: 20px;
        font-weight: 700;
        color: #1976d2;
        margin-top: 2px;
      }
      .price-box.highlight .value {
        color: #e65100;
      }
      .price-box.next .value {
        color: #43a047;
      }
      .live-badge {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        background: #e8f5e9;
        color: #2e7d32;
        font-size: 12px;
        font-weight: 600;
        padding: 2px 8px;
        border-radius: 12px;
        border: 1px solid #a5d6a7;
      }
      .live-dot {
        width: 8px;
        height: 8px;
        background: #43a047;
        border-radius: 50%;
        animation: pulse 1.4s infinite;
      }
      @keyframes pulse {
        0%,
        100% {
          opacity: 1;
        }
        50% {
          opacity: 0.3;
        }
      }
      .bid-history-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 12px;
        border-radius: 6px;
        background: white;
        margin-bottom: 6px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.07);
      }
      .bid-history-item:first-child {
        background: #e3f2fd;
        font-weight: 600;
      }
      .bid-winner {
        color: #1565c0;
      }
      .bid-amount {
        font-weight: 700;
        color: #1976d2;
      }
      .comment-item {
        display: flex;
        gap: 12px;
        padding: 12px 0;
        border-bottom: 1px solid #f0f0f0;
        align-items: flex-start;
      }
      .comment-avatar {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: #3f51b5;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        font-weight: 700;
        flex-shrink: 0;
      }
      .comment-body {
        flex: 1;
      }
      .comment-meta {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 4px;
      }
      .comment-username {
        font-weight: 600;
        font-size: 0.875rem;
        color: #333;
      }
      .comment-time {
        font-size: 0.75rem;
        color: #999;
      }
      .comment-text {
        margin: 0;
        font-size: 0.875rem;
        color: #444;
        line-height: 1.5;
      }
    `,
  ],
  template: `
    <div style="max-width: 840px; margin: 0 auto; padding: 24px 16px">
      @if (loading()) {
        <div style="display:flex;justify-content:center;padding:48px">
          <mat-spinner></mat-spinner>
        </div>
      } @else if (ad()) {
        <!-- ── Main Ad Card ── -->
        <mat-card>
          @if (ad()!.image) {
            <img
              mat-card-image
              [src]="ad()!.image"
              [alt]="ad()!.title"
              style="max-height:380px;object-fit:cover"
            />
          }
          <mat-card-header style="padding:16px 16px 0">
            <mat-card-title style="font-size:22px">{{
              ad()!.title
            }}</mat-card-title>
            <mat-card-subtitle>
              <mat-icon style="font-size:14px;vertical-align:middle"
                >place</mat-icon
              >
              {{ ad()!.location }}
            </mat-card-subtitle>
          </mat-card-header>

          <mat-card-content style="padding:16px">
            <p style="color:#444;line-height:1.6">{{ ad()!.description }}</p>

            <mat-divider style="margin:16px 0"></mat-divider>

            <!-- ── Status chip ── -->
            <div
              style="display:flex;align-items:center;gap:12px;margin-bottom:16px"
            >
              <mat-chip-set>
                <mat-chip
                  [style.background]="statusColor(ad()!.status)"
                  style="font-weight:600"
                >
                  {{ ad()!.status }}
                </mat-chip>
              </mat-chip-set>
              @if (sseConnected()) {
                <span class="live-badge">
                  <span class="live-dot"></span>LIVE
                </span>
              }
            </div>

            <!-- ── Bid Panel ── -->
            <div class="bid-panel" [class.live]="sseConnected()">
              <div class="price-row">
                <div class="price-box">
                  <div class="label">Starting Price</div>
                  <div class="value">\${{ ad()!.startingBidPrice }}</div>
                </div>
                <div class="price-box highlight">
                  <div class="label">Current Bid</div>
                  <div class="value">\${{ currentBid() }}</div>
                </div>
                <div class="price-box">
                  <div class="label">Bid Step</div>
                  <div class="value">\${{ ad()!.bidStep }}</div>
                </div>
                @if (ad()!.status === 'ACTIVE') {
                  <div class="price-box next">
                    <div class="label">Your Bid Will Be</div>
                    <div class="value">\${{ nextBid() }}</div>
                  </div>
                }
              </div>

              @if (latestBidderUsername()) {
                <div style="font-size:13px;color:#555;margin-bottom:12px">
                  <mat-icon style="font-size:14px;vertical-align:middle"
                    >person</mat-icon
                  >
                  Highest bidder: <strong>{{ latestBidderUsername() }}</strong>
                </div>
              }

              <!-- Place Bid Button (logged-in & ACTIVE) -->
              @if (auth.isLoggedIn() && ad()!.status === 'ACTIVE') {
                <div
                  style="display:flex;align-items:center;gap:12px;flex-wrap:wrap"
                >
                  <button
                    mat-raised-button
                    color="primary"
                    [disabled]="bidding()"
                    (click)="placeBid()"
                    style="padding:0 28px;height:44px;font-size:15px"
                  >
                    @if (bidding()) {
                      <mat-spinner
                        diameter="20"
                        style="display:inline-block"
                      ></mat-spinner>
                    } @else {
                      <ng-container>
                        <mat-icon>gavel</mat-icon>&nbsp;Place Bid — \${{
                          nextBid()
                        }}
                      </ng-container>
                    }
                  </button>
                  @if (bidMsg()) {
                    <span
                      [style.color]="bidError() ? '#c62828' : '#2e7d32'"
                      style="font-weight:500"
                    >
                      <mat-icon style="font-size:16px;vertical-align:middle">
                        {{
                          bidError() ? 'error_outline' : 'check_circle_outline'
                        }}
                      </mat-icon>
                      {{ bidMsg() }}
                    </span>
                  }
                </div>
              } @else if (!auth.isLoggedIn() && ad()!.status === 'ACTIVE') {
                <p style="color:#777;margin:0">
                  <a routerLink="/sign-in">Sign in</a> to place a bid.
                </p>
              }
            </div>

            <!-- ── Bid History ── -->
            @if (bidHistory().length > 0) {
              <mat-divider style="margin:16px 0"></mat-divider>
              <h3 style="margin:0 0 12px">
                <mat-icon style="vertical-align:middle">history</mat-icon>
                Bid History
              </h3>
              <div>
                @for (entry of bidHistory(); track entry.timestamp) {
                  <div class="bid-history-item">
                    <span class="bid-winner">
                      <mat-icon style="font-size:14px;vertical-align:middle"
                        >person</mat-icon
                      >
                      {{ entry.latestBidderUsername }}
                    </span>
                    <span class="bid-amount"
                      >\${{ entry.currentBidPrice }}</span
                    >
                    <span style="font-size:12px;color:#999">
                      {{ entry.timestamp | date: 'short' }}
                    </span>
                  </div>
                }
              </div>
            }
          </mat-card-content>
        </mat-card>

        <!-- ── Comments Card ── -->
        <mat-card style="margin-top:24px">
          <mat-card-header style="padding:16px 16px 0">
            <mat-card-title>
              <mat-icon style="vertical-align:middle">comment</mat-icon>
              Comments
            </mat-card-title>
          </mat-card-header>
          <mat-card-content style="padding:16px">
            @for (comment of comments(); track comment.id) {
              <div class="comment-item">
                <div class="comment-avatar">
                  {{ (comment.authorUsername ?? 'U').charAt(0).toUpperCase() }}
                </div>
                <div class="comment-body">
                  <div class="comment-meta">
                    <span class="comment-username">{{
                      comment.authorUsername ?? 'User #' + comment.authorId
                    }}</span>
                    @if (comment.createdAt) {
                      <span class="comment-time">{{
                        comment.createdAt | date: 'MMM d, y · h:mm a'
                      }}</span>
                    }
                  </div>
                  <p class="comment-text">{{ comment.content }}</p>
                </div>
              </div>
            }
            @if (comments().length === 0) {
              <p style="color:#aaa;text-align:center;padding:16px 0">
                No comments yet.
              </p>
            }
            @if (auth.isLoggedIn()) {
              <form
                [formGroup]="commentForm"
                (ngSubmit)="addComment()"
                style="margin-top:16px;display:flex;gap:12px;align-items:flex-start"
              >
                <mat-form-field appearance="outline" style="flex:1">
                  <mat-label>Add a comment</mat-label>
                  <input matInput formControlName="content" />
                </mat-form-field>
                <button
                  mat-raised-button
                  color="primary"
                  type="submit"
                  [disabled]="commentForm.invalid"
                  style="margin-top:4px"
                >
                  Post
                </button>
              </form>
            }
          </mat-card-content>
        </mat-card>
      } @else {
        <p style="text-align:center;color:#777;padding:48px">Ad not found.</p>
      }
    </div>
  `,
})
export class AdDetailPage implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private adService = inject(AdService);
  private commentService = inject(CommentService);
  private ngZone = inject(NgZone);
  private balanceService = inject(BalanceService);
  auth = inject(AuthService);
  private fb = inject(FormBuilder);

  ad = signal<Ad | null>(null);
  comments = signal<Comment[]>([]);
  loading = signal(true);
  bidding = signal(false);
  bidMsg = signal('');
  bidError = signal(false);
  sseConnected = signal(false);
  latestBidderUsername = signal('');
  bidHistory = signal<BidResponse[]>([]);

  currentBid = computed(
    () => this.ad()?.currentBidPrice ?? this.ad()?.startingBidPrice ?? 0,
  );
  nextBid = computed(() => {
    const a = this.ad();
    if (!a) {
      return 0;
    }
    return (a.currentBidPrice ?? a.startingBidPrice) + a.bidStep;
  });

  commentForm = this.fb.group({
    content: ['', [Validators.required, Validators.maxLength(100)]],
  });

  private sseSource: EventSource | null = null;
  private adId = 0;

  ngOnInit(): void {
    this.adId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadAd();
    this.loadComments();
    this.connectSse();
  }

  ngOnDestroy(): void {
    this.disconnectSse();
  }

  private loadAd(): void {
    this.adService.getById(this.adId).subscribe({
      next: (ad) => {
        this.ad.set(ad);
        this.loading.set(false);
        this.initBidHistoryFromAd(ad);
      },
      error: () => this.loading.set(false),
    });
  }

  private initBidHistoryFromAd(ad: Ad): void {
    if (!ad.lastBidders?.length) {
      return;
    }
    const history: BidResponse[] = [...ad.lastBidders]
      .filter((lb) => lb.amount != null && lb.timestamp != null)
      .sort(
        (a, b) =>
          new Date(b.timestamp!).getTime() - new Date(a.timestamp!).getTime(),
      )
      .slice(0, 10)
      .map((lb) => ({
        adId: ad.id!,
        currentBidPrice: lb.amount!,
        nextMinimumBid: lb.amount! + (ad.bidStep ?? 0),
        latestBidderUsername: lb.username ?? '',
        timestamp: lb.timestamp!,
      }));

    this.bidHistory.set(history);

    if (history.length > 0) {
      this.latestBidderUsername.set(history[0].latestBidderUsername);
    }
  }

  private loadComments(): void {
    this.commentService.getByAdId(this.adId).subscribe({
      next: (c) => this.comments.set(c),
    });
  }

  // ─── SSE live updates ────────────────────────────────────────────────────────

  private connectSse(): void {
    const url = `${environment.apiUrl}/api/ads/${this.adId}/stream`;
    try {
      this.sseSource = new EventSource(url);

      this.sseSource.addEventListener('bid', (event: MessageEvent) => {
        try {
          const data: BidResponse = JSON.parse(event.data);
          this.ngZone.run(() => this.applyBidUpdate(data));
        } catch {
          /* ignore parse errors */
        }
      });

      this.sseSource.onopen = () =>
        this.ngZone.run(() => this.sseConnected.set(true));
      this.sseSource.onerror = () =>
        this.ngZone.run(() => this.sseConnected.set(false));
    } catch {
      console.log(url);
    }
  }

  private disconnectSse(): void {
    this.sseSource?.close();
    this.sseSource = null;
  }

  private applyBidUpdate(data: BidResponse): void {
    this.ad.update((a) =>
      a ? { ...a, currentBidPrice: data.currentBidPrice } : a,
    );
    this.latestBidderUsername.set(data.latestBidderUsername ?? '');

    this.bidHistory.update((h) => {
      if (
        h.some(
          (e) =>
            e.timestamp === data.timestamp &&
            e.currentBidPrice === data.currentBidPrice,
        )
      ) {
        return h;
      }
      return [data, ...h].slice(0, 10);
    });
  }

  // ─── Actions ─────────────────────────────────────────────────────────────────

  placeBid(): void {
    if (!this.ad() || this.bidding()) {
      return;
    }
    if (!this.auth.isLoggedIn()) {
      return;
    }

    this.bidding.set(true);
    this.bidMsg.set('');

    this.adService.bid(this.adId).subscribe({
      next: (response) => {
        this.bidding.set(false);

        this.bidMsg.set(
          `Bid placed! Next minimum: $${response.nextMinimumBid}`,
        );

        this.bidError.set(false);

        this.applyBidUpdate(response);

        this.balanceService.refresh();
      },
      error: (err) => {
        this.bidding.set(false);

        const msg =
          err?.error?.error ??
          err?.error?.message ??
          'Failed to place bid. Please try again.';

        this.bidMsg.set(typeof msg === 'string' ? msg : 'Failed to place bid.');

        this.bidError.set(true);
      },
    });
  }

  addComment(): void {
    if (this.commentForm.invalid || !this.ad()) {
      return;
    }

    const userId = this.auth.getUserIdFromToken();

    if (!userId) {
      return;
    }

    const comment = {
      content: this.commentForm.value.content!,
      authorId: userId,
      adId: this.adId,
    };

    this.commentService.create(this.adId, comment).subscribe({
      next: () => {
        this.commentForm.reset();
        this.loadComments();
      },
    });
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
