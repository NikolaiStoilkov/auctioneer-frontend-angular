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
import { UserService } from '@/application/user/user.service';
import { AuthService } from '@/application/auth/auth.service';
import { StripeService } from '@/application/stripe/stripe.service';
import { User } from '@/core/domain/user.model';
import { PaymentMethodResponse } from '@/core/domain/stripe.model';

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
  styles: [
    `
      .profile-layout {
        display: flex;
        justify-content: center;
        padding: 24px 16px;
        gap: 24px;
        flex-wrap: wrap;
      }
      .profile-sidenav {
        width: 220px;
        flex-shrink: 0;
      }
      .profile-content {
        flex: 1;
        min-width: 280px;
        max-width: 600px;
      }
      .nav-item {
        border-radius: 8px;
        margin-bottom: 4px;
        cursor: pointer;
      }
      .nav-item.active {
        background: rgba(63, 81, 181, 0.12);
        color: #3f51b5;
      }
      .nav-item.active mat-icon {
        color: #3f51b5;
      }
      .section-title {
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: #888;
        padding: 12px 16px 4px;
      }
      #stripe-card-element {
        border: 1px solid rgba(0, 0, 0, 0.23);
        border-radius: 4px;
        padding: 14px 12px;
        font-size: 1rem;
        transition: border-color 0.2s;
        background: #fff;
      }
      #stripe-card-element:hover {
        border-color: rgba(0, 0, 0, 0.87);
      }
      #stripe-card-element.focused {
        border-color: #3f51b5;
        border-width: 2px;
      }
    `,
  ],
  template: `
    <div class="profile-layout">
      <mat-card class="profile-sidenav">
        <mat-card-content style="padding: 8px 0">
          <p class="section-title">Account</p>
          <mat-nav-list>
            <mat-list-item
              class="nav-item"
              [class.active]="activeTab() === 'info'"
              (click)="setTab('info')"
            >
              <mat-icon matListItemIcon>person</mat-icon>
              <span matListItemTitle>Profile Information</span>
            </mat-list-item>
            <mat-list-item
              class="nav-item"
              [class.active]="activeTab() === 'payment'"
              (click)="setTab('payment')"
            >
              <mat-icon matListItemIcon>credit_card</mat-icon>
              <span matListItemTitle>Add Payment Method</span>
            </mat-list-item>
          </mat-nav-list>
        </mat-card-content>
      </mat-card>

      <mat-card class="profile-content">
        @if (activeTab() === 'info') {
          <mat-card-header>
            <mat-card-title>Profile Information</mat-card-title>
            <mat-card-subtitle>Update your personal details</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content style="padding-top: 16px">
            @if (loading()) {
              <div style="display:flex;justify-content:center;padding:32px">
                <mat-spinner></mat-spinner>
              </div>
            } @else {
              <form
                [formGroup]="form"
                (ngSubmit)="onSubmit()"
                style="display:flex;flex-direction:column;gap:10px"
              >
                <mat-form-field appearance="outline">
                  <mat-label>Username</mat-label>
                  <mat-icon matPrefix>account_circle</mat-icon>
                  <input matInput formControlName="username" />
                </mat-form-field>
                <div style="display:flex;gap:12px">
                  <mat-form-field appearance="outline" style="flex:1">
                    <mat-label>First Name</mat-label>
                    <input matInput formControlName="firstName" />
                  </mat-form-field>
                  <mat-form-field appearance="outline" style="flex:1">
                    <mat-label>Last Name</mat-label>
                    <input matInput formControlName="lastName" />
                  </mat-form-field>
                </div>
                <mat-form-field appearance="outline">
                  <mat-label>Email</mat-label>
                  <mat-icon matPrefix>email</mat-icon>
                  <input matInput formControlName="email" type="email" />
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Phone</mat-label>
                  <mat-icon matPrefix>phone</mat-icon>
                  <input matInput formControlName="phoneNumber" />
                </mat-form-field>
                <div style="display:flex;gap:12px">
                  <mat-form-field appearance="outline" style="flex:1">
                    <mat-label>City</mat-label>
                    <input matInput formControlName="city" />
                  </mat-form-field>
                  <mat-form-field appearance="outline" style="flex:1">
                    <mat-label>Country</mat-label>
                    <input matInput formControlName="country" />
                  </mat-form-field>
                </div>
                @if (profileSuccess) {
                  <p style="color:#388e3c;font-size:0.85rem;margin:0">
                    ✓ Profile updated successfully.
                  </p>
                }
                @if (profileError) {
                  <p style="color:#d32f2f;font-size:0.85rem;margin:0">
                    {{ profileError }}
                  </p>
                }
                <button
                  mat-raised-button
                  color="primary"
                  type="submit"
                  [disabled]="form.invalid || saving()"
                >
                  @if (saving()) {
                    <mat-spinner
                      diameter="20"
                      style="display:inline-block"
                    ></mat-spinner>
                  } @else {
                    Save Changes
                  }
                </button>
              </form>
            }
          </mat-card-content>
        }

        @if (activeTab() === 'payment') {
          <mat-card-header>
            <mat-card-title>Add Payment Method</mat-card-title>
            <mat-card-subtitle
              >Securely save your card via Stripe</mat-card-subtitle
            >
          </mat-card-header>
          <mat-card-content style="padding-top:20px">
            <!-- ── Saved Cards ── -->
            @if (cardsLoading()) {
              <div
                style="display:flex;justify-content:center;padding:12px 0 20px"
              >
                <mat-spinner diameter="28"></mat-spinner>
              </div>
            } @else if (savedCards().length > 0) {
              <div style="margin-bottom:20px">
                <p
                  style="font-size:0.75rem;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:#666;margin:0 0 10px"
                >
                  Saved Cards
                </p>
                @for (pm of savedCards(); track pm.id) {
                  <div
                    style="display:flex;align-items:center;gap:12px;padding:10px 14px;border:1px solid #e0e0e0;border-radius:8px;margin-bottom:8px;background:#fafafa"
                  >
                    <mat-icon style="color:#555;flex-shrink:0"
                      >credit_card</mat-icon
                    >
                    <span style="font-weight:600;text-transform:capitalize">{{
                      pm.card?.brand
                    }}</span>
                    <span style="letter-spacing:0.06em"
                      >•••• {{ pm.card?.last4 }}</span
                    >
                    <span style="color:#888;font-size:0.8rem;margin-left:auto">
                      Expires {{ pm.card?.expMonth }}/{{ pm.card?.expYear }}
                    </span>
                  </div>
                }
                <mat-divider style="margin:16px 0"></mat-divider>
              </div>
            }

            @if (paymentLoading()) {
              <div style="display:flex;justify-content:center;padding:32px">
                <mat-spinner></mat-spinner>
              </div>
            } @else {
              <div style="display:flex;flex-direction:column;gap:16px">
                <p style="color:#555;font-size:0.875rem;margin:0">
                  Enter your card details below. Your information is handled
                  securely by Stripe. Use test card
                  <strong>4242 4242 4242 4242</strong>, any future date and any
                  CVC.
                </p>
                <div>
                  <label
                    style="font-size:0.75rem;color:#666;display:block;margin-bottom:6px"
                    >Card details</label
                  >
                  <div id="stripe-card-element" #cardElementRef></div>
                  @if (cardError) {
                    <p style="color:#d32f2f;font-size:0.75rem;margin:6px 0 0">
                      {{ cardError }}
                    </p>
                  }
                </div>
                @if (paymentSuccess) {
                  <p style="color:#388e3c;font-size:0.875rem;margin:0">
                    ✓ Payment method saved successfully!
                  </p>
                }
                @if (paymentError) {
                  <p style="color:#d32f2f;font-size:0.875rem;margin:0">
                    {{ paymentError }}
                  </p>
                }
                <button
                  mat-raised-button
                  color="primary"
                  (click)="confirmCard()"
                  [disabled]="confirmingCard()"
                  style="height:48px"
                >
                  @if (confirmingCard()) {
                    <mat-spinner
                      diameter="22"
                      style="display:inline-block"
                    ></mat-spinner>
                  } @else {
                    <ng-container>
                      <mat-icon>lock</mat-icon>
                      Save Card
                    </ng-container>
                  }
                </button>
              </div>
            }
          </mat-card-content>
        }
      </mat-card>
    </div>
  `,
})
export class ProfilePage implements OnInit {
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
