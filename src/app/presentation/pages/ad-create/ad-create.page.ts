import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { AdService } from '../../../application/ads/ad.service';
import { AuthService } from '../../../application/auth/auth.service';

@Component({
  selector: 'app-ad-create',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  template: `
    <div style="display:flex;justify-content:center;padding:24px 16px">
      <mat-card style="width:100%;max-width:600px">
        <mat-card-header>
          <mat-card-title>Create Auction</mat-card-title>
        </mat-card-header>
        <mat-card-content style="padding-top:16px">
          <form
            [formGroup]="form"
            (ngSubmit)="onSubmit()"
            style="display:flex;flex-direction:column;gap:12px"
          >
            <mat-form-field appearance="outline">
              <mat-label>Title</mat-label>
              <input matInput formControlName="title" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Description</mat-label>
              <textarea matInput formControlName="description" rows="4"></textarea>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Location</mat-label>
              <input matInput formControlName="location" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Starting Bid Price</mat-label>
              <input matInput type="number" formControlName="startingBidPrice" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Bid Step</mat-label>
              <input matInput type="number" formControlName="bidStep" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Image URL (optional)</mat-label>
              <input matInput formControlName="image" />
            </mat-form-field>
            @if (error) {
              <p style="color:red;font-size:0.85rem">{{ error }}</p>
            }
            <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid">
              Create Auction
            </button>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
})
export class AdCreatePage {
  private fb = inject(FormBuilder);
  private adService = inject(AdService);
  private auth = inject(AuthService);
  private router = inject(Router);

  error = '';

  form = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
    description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(1000)]],
    location: ['', Validators.required],
    startingBidPrice: [null as number | null, [Validators.required, Validators.min(0.01)]],
    bidStep: [null as number | null, [Validators.required, Validators.min(0.01)]],
    image: [''],
  });

  onSubmit(): void {
    if (this.form.invalid) return;
    const v = this.form.value;
    const userId = this.auth.getUserIdFromToken();
    this.adService
      .create({
        title: v.title!,
        description: v.description!,
        location: v.location!,
        startingBidPrice: v.startingBidPrice!,
        currentBidPrice: v.startingBidPrice!,
        bidStep: v.bidStep!,
        image: v.image || undefined,
        authorId: userId ?? undefined,
        status: 'ACTIVE',
        isActive: true,
      })
      .subscribe({
        next: () => this.router.navigate(['/my-ads']),
        error: () => (this.error = 'Failed to create auction.'),
      });
  }
}
