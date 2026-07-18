import {
  Component,
  NgZone,
  computed,
  inject,
  OnDestroy,
  OnInit,
  signal
} from '@angular/core';

import { DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import * as variables from '@env/environment.development';

import { Ad, BidResponse } from '../../core/domain/ad.model';
import { Comment } from '../../core/domain/comment.model';

import { AdService } from '../../services/ads/ad.service';
import { CommentService } from '../../services/comment/comment.service';
import { AuthService } from '../../services/auth/auth.service';
import { BalanceService } from '../../services/wallet/balance.service';


@Component({
  selector: 'app-ad-detail',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    DatePipe,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatIconModule,
    MatTooltipModule
  ],
  templateUrl: './ad-detail.component.html',
  styleUrl: './ad-detail.component.css'
})
export class AdDetailComponent implements OnInit, OnDestroy {
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
  latestBidderUserId = signal<number | null>(null);
  bidHistory = signal<BidResponse[]>([]);

  currentBid = computed(
    () => this.ad()?.currentBidPrice ?? this.ad()?.startingBidPrice ?? 0
  );

  nextBid = computed(() => {
    const a = this.ad();
    if (!a) {
      return 0;
    }
    return (a.currentBidPrice ?? a.startingBidPrice) + a.bidStep;
  });

  // The logged-in user is already the highest bidder — they cannot bid again
  // until someone outbids them.
  isHighestBidder = computed(() => {
    const userId = this.auth.getUserIdFromToken();
    return userId != null && this.latestBidderUserId() === userId;
  });

  // Owners cannot bid on their own ads.
  isOwner = computed(() => {
    const userId = this.auth.getUserIdFromToken();
    return userId != null && this.ad()?.authorId === userId;
  });

  commentForm = this.fb.group({
    content: ['', [Validators.required, Validators.maxLength(100)]]
  });

  private sseSource: EventSource | null = null;
  private adId = 0;

  ngOnInit (): void {
    this.adId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadAd();
    this.loadComments();
    this.connectSse();
  }

  ngOnDestroy (): void {
    this.disconnectSse();
  }

  private loadAd (): void {
    this.adService.getById(this.adId).subscribe({
      next: (ad) => {
        this.ad.set(ad);
        this.loading.set(false);
        this.initBidHistoryFromAd(ad);
      },
      error: () => this.loading.set(false)
    });
  }

  private initBidHistoryFromAd (ad: Ad): void {
    if (!ad.lastBidders?.length) {
      return;
    }
    const sorted = [...ad.lastBidders]
      .filter((lb) => lb.amount != null && lb.timestamp != null)
      .sort(
        (a, b) =>
          new Date(b.timestamp!).getTime() - new Date(a.timestamp!).getTime()
      )
      .slice(0, 10);

    const history: BidResponse[] = sorted.map((lb) => ({
      adId: ad.id!,
      currentBidPrice: lb.amount!,
      nextMinimumBid: lb.amount! + (ad.bidStep ?? 0),
      latestBidderUsername: lb.username ?? '',
      latestBidderUserId: lb.userId,
      timestamp: lb.timestamp!
    }));

    this.bidHistory.set(history);

    if (sorted.length > 0) {
      this.latestBidderUsername.set(sorted[0].username ?? '');
      this.latestBidderUserId.set(sorted[0].userId ?? null);
    }
  }

  private loadComments (): void {
    this.commentService.getByAdId(this.adId).subscribe({
      next: (c) => this.comments.set(c)
    });
  }

  // ─── SSE live updates ────────────────────────────────────────────────────────

  private connectSse (): void {
    const url = `${variables.environment.API_URL}/api/ads/${this.adId}/stream`;
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

  private disconnectSse (): void {
    this.sseSource?.close();
    this.sseSource = null;
  }

  private applyBidUpdate (data: BidResponse): void {
    this.ad.update((a) =>
      a ? { ...a, currentBidPrice: data.currentBidPrice } : a
    );
    this.latestBidderUsername.set(data.latestBidderUsername ?? '');
    this.latestBidderUserId.set(data.latestBidderUserId ?? null);

    this.bidHistory.update((h) => {
      if (
        h.some(
          (e) =>
            e.timestamp === data.timestamp &&
            e.currentBidPrice === data.currentBidPrice
        )
      ) {
        return h;
      }
      return [data, ...h].slice(0, 10);
    });
  }

  // ─── Actions ─────────────────────────────────────────────────────────────────

  placeBid (): void {
    if (!this.ad() || this.bidding()) {
      return;
    }
    if (!this.auth.isLoggedIn()) {
      return;
    }
    // Owners cannot bid on their own ads.
    if (this.isOwner()) {
      return;
    }
    // Block self-outbidding: the highest bidder cannot bid again.
    if (this.isHighestBidder()) {
      return;
    }

    this.bidding.set(true);
    this.bidMsg.set('');

    this.adService.bid(this.adId).subscribe({
      next: (response) => {
        this.bidding.set(false);

        this.bidMsg.set(
          `Bid placed! Next minimum: $${response.nextMinimumBid}`
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
      }
    });
  }

  addComment (): void {
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
      adId: this.adId
    };

    this.commentService.create(this.adId, comment).subscribe({
      next: () => {
        this.commentForm.reset();
        this.loadComments();
      }
    });
  }

  statusColor (status?: string): string {
    if (status === 'ACTIVE') {
      return '#c8e6c9';
    }

    if (status === 'SOLD') {
      return '#ffcdd2';
    }

    return '#fff9c4';
  }
}
