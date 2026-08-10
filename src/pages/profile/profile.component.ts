import {
  Component,
  inject,
  OnInit,
  signal,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom, forkJoin } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { loadStripe, Stripe, StripeCardElement } from '@stripe/stripe-js';
import { UserService } from '../../services/user/user.service';
import { AuthService } from '../../services/auth/auth.service';
import { StripeService } from '../../services/stripe/stripe.service';
import { User } from '../../core/domain/user.model';
import { PaymentMethodResponse } from '../../core/domain/stripe.model';
import { SpinnerComponent } from '../../components/spinner/spinner.component';
import { createAndMountStripeCard } from '../../shared/stripe-card.util';

/** The two tabs of the profile page. */
type ProfileTab = 'info' | 'payment';

/**
 * Profile page with two tabs:
 * - **info** — view and edit the user's personal details, and
 * - **payment** — save a card via a Stripe setup intent and list the
 *   already saved cards.
 *
 * Also handles the return leg of a Stripe 3DS redirect by reading the
 * `redirect_status` query parameter.
 */
@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    SpinnerComponent,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatListModule,
    MatIconModule,
    MatDividerModule,
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
})
export class ProfileComponent implements OnInit {
  @ViewChild('cardElementRef') cardElementRef!: ElementRef;

  private formBuilder = inject(FormBuilder);
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private stripeService = inject(StripeService);
  private route = inject(ActivatedRoute);

  activeTab = signal<ProfileTab>('info');
  loading = signal(true);
  saving = signal(false);
  paymentLoading = signal(false);
  confirmingCard = signal(false);
  savedCards = signal<PaymentMethodResponse[]>([]);
  cardsLoading = signal(false);

  profileSuccess = false;
  profileError = '';
  paymentSuccess = false;
  paymentError = '';
  cardError = '';

  private user: User | null = null;
  private stripe: Stripe | null = null;
  private cardElement: StripeCardElement | null = null;
  private setupClientSecret = '';

  form = this.formBuilder.group({
    username: ['', Validators.required],
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phoneNumber: ['', Validators.required],
    city: ['', Validators.required],
    country: ['', Validators.required],
  });

  ngOnInit(): void {
    // Handle Stripe 3DS redirect return: ?redirect_status=succeeded&setup_intent_client_secret=...
    const redirectStatus =
      this.route.snapshot.queryParamMap.get('redirect_status');
    if (redirectStatus === 'succeeded') {
      this.paymentSuccess = true;
      this.activeTab.set('payment');
    }

    this.loadSavedCards();

    const userId = this.authService.getUserIdFromToken();
    if (!userId) {
      this.loading.set(false);
      this.profileError = 'Could not identify user. Please sign in again.';
      return;
    }
    this.userService.getById(userId).subscribe({
      next: (loadedUser) => {
        this.user = loadedUser;

        this.form.patchValue({
          username: loadedUser.username,
          firstName: loadedUser.firstName,
          lastName: loadedUser.lastName,
          email: loadedUser.email,
          phoneNumber: loadedUser.phoneNumber,
          city: loadedUser.city,
          country: loadedUser.country,
        });

        this.loading.set(false);
      },
      error: () => {
        this.profileError = 'Failed to load profile.';

        this.loading.set(false);
      },
    });
  }

  /** Fetches the user's saved cards for the payment tab. */
  private loadSavedCards(): void {
    this.cardsLoading.set(true);

    this.stripeService.getSavedCards().subscribe({
      next: (cards) => {
        this.savedCards.set(cards);
        this.cardsLoading.set(false);
      },
      error: () => this.cardsLoading.set(false),
    });
  }

  /**
   * Switches between the info and payment tabs.
   *
   * Leaving the payment tab tears down the Stripe card element; entering
   * it (re-)initializes Stripe. All feedback messages are cleared.
   *
   * @param tab Tab to activate.
   */
  setTab(tab: ProfileTab): void {
    if (this.activeTab() === 'payment' && tab !== 'payment') {
      this.cardElement?.unmount();
      this.cardElement = null;
      this.stripe = null;
      this.setupClientSecret = '';
    }

    this.activeTab.set(tab);
    this.profileSuccess = false;
    this.profileError = '';
    this.paymentSuccess = false;
    this.paymentError = '';
    this.cardError = '';

    if (tab === 'payment') {
      setTimeout(() => this.initStripeElements(), 100);
    }
  }

  /**
   * Initializes Stripe.js for the payment tab: fetches the publishable
   * key and a setup intent, then mounts the card input element.
   */
  private async initStripeElements(): Promise<void> {
    this.paymentLoading.set(true);
    this.paymentSuccess = false;
    try {
      // Observables all the way to the async boundary: both HTTP calls run
      // in parallel via forkJoin and are only bridged to a promise once,
      // right where Stripe.js (a promise-based SDK) takes over.
      const { config, setupIntentResponse } = await firstValueFrom(
        forkJoin({
          config: this.stripeService.getConfig(),
          setupIntentResponse: this.stripeService.createSetupIntent(),
        }),
      );

      this.setupClientSecret = setupIntentResponse.clientSecret;
      this.stripe = await loadStripe(config.publishableKey);
      if (!this.stripe) {
        throw new Error('Stripe failed to load');
      }

      this.paymentLoading.set(false);
      // Yield one macrotask so the card container exists in the DOM.
      await new Promise<void>((resolve) => setTimeout(resolve, 0));

      this.cardElement = createAndMountStripeCard(
        this.stripe,
        'stripe-card-element',
        (message) => (this.cardError = message),
      );
    } catch {
      this.paymentError =
        'Could not load Stripe. Check your publishable key in backend config.';
      this.paymentLoading.set(false);
    }
  }

  /**
   * Confirms the card setup with Stripe, saving the entered card.
   *
   * 3DS flows may redirect away and return to `/profile`. On success the
   * saved cards are reloaded and a fresh card element is initialized.
   */
  async confirmCard(): Promise<void> {
    if (!this.stripe || !this.cardElement || !this.setupClientSecret) {
      return;
    }

    this.confirmingCard.set(true);

    this.paymentSuccess = false;

    this.paymentError = '';

    const result = await this.stripe.confirmCardSetup(this.setupClientSecret, {
      payment_method: { card: this.cardElement },
      return_url: `${window.location.origin}/profile`,
    });

    if (result.error) {
      this.paymentError = result.error.message ?? 'Card setup failed.';
    } else {
      this.paymentSuccess = true;

      this.cardElement?.clear();

      this.cardElement?.unmount();

      this.cardElement = null;

      this.stripe = null;

      this.setupClientSecret = '';

      this.loadSavedCards();

      setTimeout(() => this.initStripeElements(), 100);
    }
    this.confirmingCard.set(false);
  }

  /** Saves the profile form via {@link UserService.edit}. */
  onSubmit(): void {
    if (this.form.invalid || !this.user) {
      return;
    }

    this.saving.set(true);

    this.profileSuccess = false;

    this.profileError = '';

    const formValue = this.form.value;

    this.userService
      .edit({
        ...this.user,
        username: formValue.username!,
        firstName: formValue.firstName!,
        lastName: formValue.lastName!,
        email: formValue.email!,
        phoneNumber: formValue.phoneNumber!,
        city: formValue.city!,
        country: formValue.country!,
      })
      .subscribe({
        next: () => {
          this.profileSuccess = true;

          this.saving.set(false);
        },
        error: () => {
          this.profileError = 'Failed to update profile.';

          this.saving.set(false);
        },
      });
  }
}
