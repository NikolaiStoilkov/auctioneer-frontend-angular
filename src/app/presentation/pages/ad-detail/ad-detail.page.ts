import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { Ad } from '../../../core/domain/ad.model';
import { Comment } from '../../../core/domain/comment.model';
import { AdService } from '../../../application/ads/ad.service';
import { CommentService } from '../../../application/comment/comment.service';
import { AuthService } from '../../../application/auth/auth.service';

@Component({
  selector: 'app-ad-detail',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatChipsModule,
  ],
  template: `
    <div style="max-width:800px;margin:0 auto;padding:24px 16px">
      @if (loading()) {
        <div style="display:flex;justify-content:center;padding:48px">
          <mat-spinner></mat-spinner>
        </div>
      } @else if (ad()) {
        <mat-card>
          @if (ad()!.image) {
            <img
              mat-card-image
              [src]="ad()!.image"
              [alt]="ad()!.title"
              style="max-height:350px;object-fit:cover"
            />
          }
          <mat-card-header style="padding:16px 16px 0">
            <mat-card-title>{{ ad()!.title }}</mat-card-title>
            <mat-card-subtitle>{{ ad()!.location }}</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content style="padding:16px">
            <p>{{ ad()!.description }}</p>
            <mat-divider style="margin:12px 0"></mat-divider>
            <div style="display:flex;gap:24px;flex-wrap:wrap;margin-bottom:8px">
              <div><strong>Starting Price:</strong> \${{ ad()!.startingBidPrice }}</div>
              <div>
                <strong>Current Bid:</strong> \${{
                  ad()!.currentBidPrice ?? ad()!.startingBidPrice
                }}
              </div>
              <div><strong>Bid Step:</strong> \${{ ad()!.bidStep }}</div>
              <div>
                <mat-chip-set>
                  <mat-chip [style.background]="statusColor(ad()!.status)">{{
                    ad()!.status
                  }}</mat-chip>
                </mat-chip-set>
              </div>
            </div>
            @if (auth.isLoggedIn() && ad()!.status === 'ACTIVE') {
              <mat-divider style="margin:16px 0"></mat-divider>
              <h3>Place a Bid</h3>
              <form
                [formGroup]="bidForm"
                (ngSubmit)="placeBid()"
                style="display:flex;align-items:flex-start;gap:12px;flex-wrap:wrap"
              >
                <mat-form-field appearance="outline" style="flex:1;min-width:160px">
                  <mat-label>Your Bid Amount</mat-label>
                  <input matInput type="number" formControlName="amount" />
                </mat-form-field>
                <button
                  mat-raised-button
                  color="accent"
                  type="submit"
                  [disabled]="bidForm.invalid"
                  style="margin-top:4px"
                >
                  Bid
                </button>
              </form>
              @if (bidMsg) {
                <p [style.color]="bidError ? 'red' : 'green'">{{ bidMsg }}</p>
              }
            }
          </mat-card-content>
        </mat-card>

        <mat-card style="margin-top:24px">
          <mat-card-header style="padding:16px 16px 0">
            <mat-card-title>Comments</mat-card-title>
          </mat-card-header>
          <mat-card-content style="padding:16px">
            @for (comment of comments(); track comment.id) {
              <div style="padding:8px 0;border-bottom:1px solid #eee">
                <p style="margin:0">{{ comment.content }}</p>
              </div>
            }
            @if (comments().length === 0) {
              <p style="color:#777">No comments yet.</p>
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
      }
    </div>
  `,
})
export class AdDetailPage implements OnInit {
  private route = inject(ActivatedRoute);
  private adService = inject(AdService);
  private commentService = inject(CommentService);
  auth = inject(AuthService);
  private fb = inject(FormBuilder);

  ad = signal<Ad | null>(null);
  comments = signal<Comment[]>([]);
  loading = signal(true);
  bidMsg = '';
  bidError = false;

  bidForm = this.fb.group({
    amount: [null as number | null, [Validators.required, Validators.min(0.01)]],
  });

  commentForm = this.fb.group({
    content: ['', [Validators.required, Validators.maxLength(100)]],
  });

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.adService.getById(id).subscribe({
      next: (ad) => {
        this.ad.set(ad);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
    this.commentService.getByAdId(id).subscribe({
      next: (c) => this.comments.set(c),
    });
  }

  placeBid(): void {
    if (this.bidForm.invalid || !this.ad()) return;
    const userId = this.auth.getUserIdFromToken();
    if (!userId) return;
    const adId = this.ad()!.id!;
    this.adService.bid(adId, { adId, userId, amount: this.bidForm.value.amount! }).subscribe({
      next: () => {
        this.bidMsg = 'Bid placed successfully!';
        this.bidError = false;
        this.adService.getById(adId).subscribe((a) => this.ad.set(a));
      },
      error: () => {
        this.bidMsg = 'Failed to place bid.';
        this.bidError = true;
      },
    });
  }

  addComment(): void {
    if (this.commentForm.invalid || !this.ad()) return;
    const userId = this.auth.getUserIdFromToken();
    if (!userId) return;
    const adId = this.ad()!.id!;
    const comment = { content: this.commentForm.value.content!, authorId: userId, adId };
    this.commentService.create(adId, comment).subscribe({
      next: () => {
        this.commentForm.reset();
        this.commentService.getByAdId(adId).subscribe((c) => this.comments.set(c));
      },
    });
  }

  statusColor(status?: string): string {
    if (status === 'ACTIVE') return '#c8e6c9';
    if (status === 'SOLD') return '#ffcdd2';
    return '#fff9c4';
  }
}
