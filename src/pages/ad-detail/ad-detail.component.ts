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

import { ADS_API } from '../../core/config/ads.api';

import { Ad, BidResponse } from '../../core/domain/ad.model';
import { Comment } from '../../core/domain/comment.model';

import { AdService } from '../../services/ads/ad.service';
import { CommentService } from '../../services/comment/comment.service';
import { AuthService } from '../../services/auth/auth.service';
import { BalanceService } from '../../services/wallet/balance.service';


/**
 * Ad detail page — the live auction view for a single ad.
 *
 * Loads the ad and its comments, subscribes to the ad's SSE bid stream
 * for real-time price updates, and lets eligible users place bids and
 * post comments. Owners and the current highest bidder are blocked
 * from bidding.
 */
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

  /** The displayed ad, or `null` while loading or on error. */
  ad = signal<Ad | null>(null);
  /** Comments posted on the ad. */
  comments = signal<Comment[]>([]);
  /** `true` while the ad is being fetched. */
  loading = signal(true);
  /** `true` while a bid request is in flight. */
  bidding = signal(false);
  /** Success or error feedback for the last bid attempt. */
  bidMessage = signal('');
  /** Whether {@link bidMessage} represents an error. */
  bidError = signal(false);
  /** Whether the live bid SSE stream is currently connected. */
  sseConnected = signal(false);
  /** Username of the most recent bidder. */
  latestBidderUsername = signal('');
  /** User id of the most recent bidder, or `null` when there are no bids. */
  latestBidderUserId = signal<number | null>(null);
  /** The last (up to 10) bids, newest first. */
  bidHistory = signal<BidResponse[]>([]);

  /** The current price of the auction, falling back to the starting price. */
  currentBid = computed(
    () => this.ad()?.currentBidPrice ?? this.ad()?.startingBidPrice ?? 0
  );

  /** The price the next bid will be placed at (`current price + bid step`). */
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

  /**
   * Whether the logged-in user is already the highest bidder — they cannot
   * bid again until someone outbids them.
   */
  isHighestBidder = computed(() => {
    const userId = this.authService.getUserIdFromToken();
    return userId != null && this.latestBidderUserId() === userId;
  });

  /** Whether the logged-in user owns this ad. Owners cannot bid on their own ads. */
  isOwner = computed(() => {
    const userId = this.authService.getUserIdFromToken();
    return userId != null && this.ad()?.authorId === userId;
  });

  /** Form for posting a new comment (max 100 characters). */
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

  /** Fetches the ad and seeds the bid history from its last bidders. */
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

  /**
   * Builds the initial bid history from the ad's `lastBidders`, sorted
   * newest first and capped at 10 entries, and derives the latest bidder.
   *
   * @param ad The freshly loaded ad.
   */
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

  /** Fetches the ad's comments. */
  private loadComments (): void {
    this.commentService.getByAdId(this.adId).subscribe({
      next: (loadedComments) => this.comments.set(loadedComments)
    });
  }

  // ─── SSE live updates ────────────────────────────────────────────────────────

  /**
   * Opens the ad's SSE bid stream and applies incoming bid events.
   *
   * Events arrive outside Angular's zone, so updates are re-entered
   * via `NgZone.run` to trigger change detection.
   */
  private connectSse (): void {
    const url = ADS_API.bidStream(this.adId);
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

  /** Closes the SSE bid stream. */
  private disconnectSse (): void {
    this.sseSource?.close();
    this.sseSource = null;
  }

  /**
   * Applies a bid to the local state: updates the ad's price, the latest
   * bidder, and prepends the bid to the history (deduplicated, capped at 10).
   *
   * @param bidUpdate Bid received from the SSE stream or a bid response.
   */
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

  /**
   * Places a bid on the ad for the logged-in user.
   *
   * No-op while a bid is in flight, or when the user is logged out,
   * owns the ad, or is already the highest bidder. On success the local
   * state and wallet balance are refreshed; on failure the server's
   * error message is shown.
   */
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

  /** Posts the comment from {@link commentForm}, then resets the form and reloads the comments. */
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

  /**
   * Maps an ad status to its chip background color.
   *
   * @param status Ad status (`ACTIVE`, `SOLD`, or other).
   * @returns A CSS color: green for active, red for sold, yellow otherwise.
   */
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
