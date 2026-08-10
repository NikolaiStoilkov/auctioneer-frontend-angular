import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatDividerModule } from '@angular/material/divider';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { DecimalPipe, DatePipe } from '@angular/common';
import { loadStripe, Stripe, StripeCardElement } from '@stripe/stripe-js';
import { WalletService } from '../../services/wallet/wallet.service';
import { StripeService } from '../../services/stripe/stripe.service';
import {
  WalletBalance,
  CreditTransaction,
} from '../../core/domain/wallet.model';
import { PaymentMethodResponse } from '../../core/domain/stripe.model';
import { SpinnerComponent } from '../../components/spinner/spinner.component';
import { createAndMountStripeCard } from '../../shared/stripe-card.util';

/** Quick-select top-up amounts offered on the page. */
const PRESET_AMOUNTS = [10, 25, 50, 100, 250, 500];

/**
 * Add-credits page — tops up the wallet with a Stripe card payment.
 *
 * Two-step flow: pick an amount (preset or custom), then pay with a
 * saved card or a newly entered one. After Stripe confirms the payment
 * the backend is asked to credit the wallet. Also shows the current
 * balance and a paginated credit transaction history.
 */
@Component({
  selector: 'app-add-credits',
  standalone: true,
  imports: [
    SpinnerComponent,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatTableModule,
    MatDividerModule,
    MatPaginatorModule,
    DecimalPipe,
    DatePipe,
  ],
  templateUrl: './add-credits.component.html',
  styleUrl: './add-credits.component.css',
})
export class AddCreditsComponent implements OnInit {
  private formBuilder = inject(FormBuilder);
  private walletService = inject(WalletService);
  private stripeService = inject(StripeService);

  readonly presets = PRESET_AMOUNTS;
  readonly displayedColumns = ['date', 'type', 'description', 'amount'];
  readonly pageSize = 10;

  balance = signal<WalletBalance | null>(null);
  balanceLoading = signal(true);
  creatingIntent = signal(false);
  stripeLoading = signal(false);
  submitting = signal(false);
  transactionsLoading = signal(true);
  transactions = signal<CreditTransaction[]>([]);
  totalElements = signal(0);
  pageIndex = signal(0);
  selectedPreset = signal<number | null>(null);
  paymentStep = signal(false);
  savedCards = signal<PaymentMethodResponse[]>([]);
  useSavedCard = signal(false);

  successMessage = '';
  errorMessage = '';
  intentError = '';
  cardError = '';

  private stripe: Stripe | null = null;
  private cardElement: StripeCardElement | null = null;
  private paymentClientSecret = '';

  form = this.formBuilder.group({
    amount: [null as number | null, [Validators.required, Validators.min(1)]],
  });

  ngOnInit(): void {
    this.loadBalance();
    this.loadTransactions(0);
    this.prefetchStripe();
    this.loadSavedCards();
  }

  /** Fetches the user's saved cards and defaults to paying with one when available. */
  private loadSavedCards(): void {
    this.stripeService.getSavedCards().subscribe({
      next: (cards) => {
        this.savedCards.set(cards);
        this.useSavedCard.set(cards.length > 0);
      },
    });
  }

  /** Loads Stripe.js in the background so the payment step opens instantly. */
  private prefetchStripe(): void {
    this.stripeService.getConfig().subscribe({
      next: async (config) => {
        this.stripe = await loadStripe(config.publishableKey);
      },
    });
  }

  /**
   * Fills the amount field with a preset value.
   *
   * @param amount Preset top-up amount.
   */
  selectPreset(amount: number): void {
    this.selectedPreset.set(amount);
    this.form.patchValue({ amount });
    this.intentError = '';
  }

  /**
   * Creates a payment intent for the chosen amount and advances to the
   * payment step, mounting the card input unless a saved card is used.
   */
  proceedToPayment(): void {
    if (this.form.invalid) {
      return;
    }

    this.creatingIntent.set(true);

    this.intentError = '';

    const amount = this.form.value.amount!;

    this.walletService.createPaymentIntent(amount).subscribe({
      next: (paymentIntentResponse) => {
        this.paymentClientSecret = paymentIntentResponse.clientSecret;

        this.creatingIntent.set(false);

        this.paymentStep.set(true);

        if (!this.useSavedCard() || this.savedCards().length === 0) {
          setTimeout(() => this.mountCardElement(), 50);
        }
      },
      error: () => {
        this.intentError = 'Could not initiate payment. Please try again.';

        this.creatingIntent.set(false);
      },
    });
  }

  /** Switches the payment step to the saved card, unmounting the card input. */
  selectSavedCard(): void {
    this.useSavedCard.set(true);
    this.cardElement?.unmount();
    this.cardElement = null;
  }

  /** Switches the payment step to entering a new card. */
  switchToNewCard(): void {
    this.useSavedCard.set(false);
    setTimeout(() => this.mountCardElement(), 0);
  }

  /** Creates the Stripe card element and mounts it into the payment step's container. */
  private mountCardElement(): void {
    if (!this.stripe) {
      return;
    }
    this.stripeLoading.set(true);
    this.cardElement = createAndMountStripeCard(
      this.stripe,
      'stripe-payment-element',
      (message) => (this.cardError = message),
    );
    this.stripeLoading.set(false);
  }

  /**
   * Confirms the card payment with Stripe and, on success, asks the
   * backend to credit the wallet, then resets the flow back to the
   * amount step and reloads the transaction history.
   */
  async confirmPayment(): Promise<void> {
    if (!this.stripe || !this.paymentClientSecret) {
      return;
    }
    const isUsingSavedCard =
      this.useSavedCard() && this.savedCards().length > 0;
    if (!isUsingSavedCard && !this.cardElement) {
      return;
    }

    this.submitting.set(true);
    this.successMessage = '';
    this.errorMessage = '';

    const result = await this.stripe.confirmCardPayment(
      this.paymentClientSecret,
      {
        payment_method: isUsingSavedCard
          ? this.savedCards()[0].id
          : { card: this.cardElement! },
      },
    );

    if (result.error) {
      this.errorMessage = result.error.message ?? 'Payment failed.';
      this.submitting.set(false);
      return;
    }

    const amount = this.form.value.amount!;
    this.walletService.confirmCredits(amount).subscribe({
      next: (updatedBalance) => {
        this.balance.set(updatedBalance);
        this.successMessage = `€${amount.toFixed(2)} added to your account!`;
        this.submitting.set(false);
        this.paymentStep.set(false);
        this.form.reset();
        this.selectedPreset.set(null);
        this.useSavedCard.set(this.savedCards().length > 0);
        this.loadTransactions(0);
      },
      error: () => {
        this.errorMessage =
          'Payment succeeded but credits update failed. Contact support.';
        this.submitting.set(false);
      },
    });
  }

  /** Returns from the payment step to the amount step, discarding the card input. */
  backToAmount(): void {
    this.paymentStep.set(false);
    this.cardElement?.unmount();
    this.cardElement = null;
    this.errorMessage = '';
    this.cardError = '';
    this.useSavedCard.set(this.savedCards().length > 0);
  }

  /**
   * Handles paginator navigation in the transaction history.
   *
   * @param event Paginator event carrying the new page index.
   */
  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.loadTransactions(event.pageIndex);
  }

  /** Fetches the current wallet balance. */
  private loadBalance(): void {
    this.balanceLoading.set(true);
    this.walletService.getBalance().subscribe({
      next: (walletBalance) => {
        this.balance.set(walletBalance);
        this.balanceLoading.set(false);
      },
      error: () => this.balanceLoading.set(false),
    });
  }

  /**
   * Fetches a page of the credit transaction history.
   *
   * @param page Zero-based page index.
   */
  private loadTransactions(page: number): void {
    this.transactionsLoading.set(true);
    this.walletService.getTransactions(page, this.pageSize).subscribe({
      next: (transactionsPage) => {
        this.transactions.set(transactionsPage.content);
        this.totalElements.set(transactionsPage.totalElements);
        this.transactionsLoading.set(false);
      },
      error: () => this.transactionsLoading.set(false),
    });
  }
}
