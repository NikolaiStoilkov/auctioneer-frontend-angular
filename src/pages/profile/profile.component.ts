import {
  Component,
  inject,
  OnInit,
  signal,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import {
  loadStripe,
  Stripe,
  StripeElements,
  StripeCardElement,
} from '@stripe/stripe-js';
import { UserService } from '../../services/user/user.service';
import { AuthService } from '../../services/auth/auth.service';
import { StripeService } from '../../services/stripe/stripe.service';
import { User } from '../../core/domain/user.model';
import { PaymentMethodResponse } from '../../core/domain/stripe.model';

type ProfileTab = 'info' | 'payment';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatListModule,
    MatIconModule,
    MatDividerModule,
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
})
export class ProfileComponent implements OnInit {
  @ViewChild('cardElementRef') cardElementRef!: ElementRef;

  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private auth = inject(AuthService);
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
  private stripeElements: StripeElements | null = null;
  private cardElement: StripeCardElement | null = null;
  private setupClientSecret = '';

  form = this.fb.group({
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

    const userId = this.auth.getUserIdFromToken();
    if (!userId) {
      this.loading.set(false);
      this.profileError = 'Could not identify user. Please sign in again.';
      return;
    }
    this.userService.getById(userId).subscribe({
      next: (u) => {
        this.user = u;

        this.form.patchValue({
          username: u.username,
          firstName: u.firstName,
          lastName: u.lastName,
          email: u.email,
          phoneNumber: u.phoneNumber,
          city: u.city,
          country: u.country,
        });

        this.loading.set(false);
      },
      error: () => {
        this.profileError = 'Failed to load profile.';

        this.loading.set(false);
      },
    });
  }

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

  setTab(tab: ProfileTab): void {
    if (this.activeTab() === 'payment' && tab !== 'payment') {
      this.cardElement?.unmount();
      this.cardElement = null;
      this.stripeElements = null;
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

  private async initStripeElements(): Promise<void> {
    this.paymentLoading.set(true);
    this.paymentSuccess = false;
    try {
      const config = await new Promise<{ publishableKey: string }>(
        (resolve, reject) => {
          this.stripeService
            .getConfig()
            .subscribe({ next: resolve, error: reject });
        },
      );

      const secret = await new Promise<{ clientSecret: string }>(
        (resolve, reject) => {
          this.stripeService
            .createSetupIntent()
            .subscribe({ next: resolve, error: reject });
        },
      );

      this.setupClientSecret = secret.clientSecret;
      this.stripe = await loadStripe(config.publishableKey);
      if (!this.stripe) {
        throw new Error('Stripe failed to load');
      }

      this.stripeElements = this.stripe.elements();
      this.cardElement = this.stripeElements.create('card', {
        hidePostalCode: true,
        style: {
          base: {
            fontSize: '16px',
            color: '#333',
            '::placeholder': { color: '#999' },
          },
          invalid: { color: '#d32f2f' },
        },
      });

      this.paymentLoading.set(false);
      await new Promise<void>((resolve) => setTimeout(resolve, 0));

      const el = document.getElementById('stripe-card-element');

      if (el) {
        this.cardElement.mount(el);

        this.cardElement.on('change', (event) => {
          this.cardError = event.error ? event.error.message : '';
        });

        this.cardElement.on('focus', () => el.classList.add('focused'));
        this.cardElement.on('blur', () => el.classList.remove('focused'));
      }
    } catch {
      this.paymentError =
        'Could not load Stripe. Check your publishable key in backend config.';
      this.paymentLoading.set(false);
    }
  }

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

      this.stripeElements = null;

      this.stripe = null;

      this.setupClientSecret = '';

      this.loadSavedCards();

      setTimeout(() => this.initStripeElements(), 100);
    }
    this.confirmingCard.set(false);
  }

  onSubmit(): void {
    if (this.form.invalid || !this.user) {
      return;
    }

    this.saving.set(true);

    this.profileSuccess = false;

    this.profileError = '';

    const v = this.form.value;

    this.userService
      .edit({
        ...this.user,
        username: v.username!,
        firstName: v.firstName!,
        lastName: v.lastName!,
        email: v.email!,
        phoneNumber: v.phoneNumber!,
        city: v.city!,
        country: v.country!,
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
