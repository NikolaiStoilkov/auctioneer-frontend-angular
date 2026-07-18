import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { AdService } from '../../services/ads/ad.service';
import { AuthService } from '../../services/auth/auth.service';

/**
 * Page for creating a new auction ad.
 *
 * Validates the ad form and submits it via {@link AdService}; on
 * success the user is redirected to their ads list.
 */
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
  templateUrl: './ad-create.component.html',
  styleUrl: './ad-create.component.css',
})
export class AdCreateComponent {
  private formBuilder = inject(FormBuilder);
  private adService = inject(AdService);
  private authService = inject(AuthService);
  private router = inject(Router);

  /** Error message shown when creation fails. */
  error = '';

  /** New-ad form: title, description, location, starting price, bid step, optional image. */
  form = this.formBuilder.group({
    title: [
      '',
      [Validators.required, Validators.minLength(3), Validators.maxLength(100)],
    ],
    description: [
      '',
      [
        Validators.required,
        Validators.minLength(10),
        Validators.maxLength(1000),
      ],
    ],
    location: ['', Validators.required],
    startingBidPrice: [
      null as number | null,
      [Validators.required, Validators.min(0.01)],
    ],
    bidStep: [
      null as number | null,
      [Validators.required, Validators.min(0.01)],
    ],
    image: [''],
  });

  /** Creates the ad from the form values and navigates to "My ads" on success. */
  onSubmit(): void {
    if (this.form.invalid) {
      return;
    }

    const formValue = this.form.value;
    const userId = this.authService.getUserIdFromToken();

    this.adService
      .create({
        title: formValue.title!,
        description: formValue.description!,
        location: formValue.location!,
        startingBidPrice: formValue.startingBidPrice!,
        currentBidPrice: formValue.startingBidPrice!,
        bidStep: formValue.bidStep!,
        image: formValue.image || undefined,
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
