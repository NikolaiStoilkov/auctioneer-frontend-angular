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
  authService = inject(AuthService);
  private formBuilder = inject(FormBuilder);

  ad = signal<Ad | null>(null);
  comments = signal<Comment[]>([]);
  loading = signal(true);
  bidding = signal(false);
  bidMessage = signal('');
  bidError = signal(false);
  sseConnected = signal(false);
  latestBidderUsername = signal('');
  latestBidderUserId = signal<number | null>(null);
  bidHistory = signal<BidResponse[]>([]);

  currentBid = computed(
    () => this.ad()?.currentBidPrice ?? this.ad()?.startingBidPrice ?? 0
  );

  nextBid = computed(() => {
    const currentAd = this.ad();
    if (!currentAd) {
      return 0;
    }
    return (
      (currentAd.currentBidPrice ?? currentAd.startingBidPrice) +
      currentAd.bidStep
    );
  });

  // The logged-in user is already the highest bidder — they cannot bid again
  // until someone outbids them.
  isHighestBidder = computed(() => {
    const userId = this.authService.getUserIdFromToken();
    return userId != null && this.latestBidderUserId() === userId;
  });

  // Owners cannot bid on their own ads.
  isOwner = computed(() => {
    const userId = this.authService.getUserIdFromToken();
    return userId != null && this.ad()?.authorId === userId;
  });

  commentForm = this.formBuilder.group({
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
    const sortedBidders = [...ad.lastBidders]
      .filter((bidder) => bidder.amount != null && bidder.timestamp != null)
      .sort(
        (firstBidder, secondBidder) =>
          new Date(secondBidder.timestamp!).getTime() -
          new Date(firstBidder.timestamp!).getTime()
      )
      .slice(0, 10);

    const bidHistoryEntries: BidResponse[] = sortedBidders.map((bidder) => ({
      adId: ad.id!,
      currentBidPrice: bidder.amount!,
      nextMinimumBid: bidder.amount! + (ad.bidStep ?? 0),
      latestBidderUsername: bidder.username ?? '',
      latestBidderUserId: bidder.userId,
      timestamp: bidder.timestamp!
    }));

    this.bidHistory.set(bidHistoryEntries);

    if (sortedBidders.length > 0) {
      this.latestBidderUsername.set(sortedBidders[0].username ?? '');
      this.latestBidderUserId.set(sortedBidders[0].userId ?? null);
    }
  }

  private loadComments (): void {
    this.commentService.getByAdId(this.adId).subscribe({
      next: (loadedComments) => this.comments.set(loadedComments)
    });
  }

  // ─── SSE live updates ────────────────────────────────────────────────────────

  private connectSse (): void {
    const url = `${variables.environment.API_URL}/api/ads/${this.adId}/stream`;
    try {
      this.sseSource = new EventSource(url);

      this.sseSource.addEventListener('bid', (event: MessageEvent) => {
        try {
          const bidUpdate: BidResponse = JSON.parse(event.data);
          this.ngZone.run(() => this.applyBidUpdate(bidUpdate));
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

  private applyBidUpdate (bidUpdate: BidResponse): void {
    this.ad.update((currentAd) =>
      currentAd
        ? { ...currentAd, currentBidPrice: bidUpdate.currentBidPrice }
        : currentAd
    );
    this.latestBidderUsername.set(bidUpdate.latestBidderUsername ?? '');
    this.latestBidderUserId.set(bidUpdate.latestBidderUserId ?? null);

    this.bidHistory.update((history) => {
      if (
        history.some(
          (historyEntry) =>
            historyEntry.timestamp === bidUpdate.timestamp &&
            historyEntry.currentBidPrice === bidUpdate.currentBidPrice
        )
      ) {
        return history;
      }
      return [bidUpdate, ...history].slice(0, 10);
    });
  }

  // ─── Actions ─────────────────────────────────────────────────────────────────

  placeBid (): void {
    if (!this.ad() || this.bidding()) {
      return;
    }
    if (!this.authService.isLoggedIn()) {
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
    this.bidMessage.set('');

    this.adService.bid(this.adId).subscribe({
      next: (bidResponse) => {
        this.bidding.set(false);

        this.bidMessage.set(
          `Bid placed! Next minimum: $${bidResponse.nextMinimumBid}`
        );

        this.bidError.set(false);

        this.applyBidUpdate(bidResponse);

        this.balanceService.refresh();
      },
      error: (errorResponse) => {
        this.bidding.set(false);

        const errorMessage =
          errorResponse?.error?.error ??
          errorResponse?.error?.message ??
          'Failed to place bid. Please try again.';

        this.bidMessage.set(
          typeof errorMessage === 'string'
            ? errorMessage
            : 'Failed to place bid.'
        );

        this.bidError.set(true);
      }
    });
  }

  addComment (): void {
    if (this.commentForm.invalid || !this.ad()) {
      return;
    }

    const userId = this.authService.getUserIdFromToken();

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
