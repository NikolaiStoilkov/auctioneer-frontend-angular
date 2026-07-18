import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatDividerModule } from '@angular/material/divider';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { DecimalPipe, DatePipe } from '@angular/common';
import {
  loadStripe,
  Stripe,
  StripeElements,
  StripeCardElement,
} from '@stripe/stripe-js';
import { WalletService } from '../../services/wallet/wallet.service';
import { StripeService } from '../../services/stripe/stripe.service';
import { WalletBalance, CreditTransaction } from '../../core/domain/wallet.model';
import { PaymentMethodResponse } from '../../core/domain/stripe.model';

const PRESET_AMOUNTS = [10, 25, 50, 100, 250, 500];

@Component({
  selector: 'app-add-credits',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
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
  private fb = inject(FormBuilder);
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
  txLoading = signal(true);
  transactions = signal<CreditTransaction[]>([]);
  totalElements = signal(0);
  pageIndex = signal(0);
  selectedPreset = signal<number | null>(null);
  paymentStep = signal(false);
  savedCards = signal<PaymentMethodResponse[]>([]);
  useSavedCard = signal(false);

  successMsg = '';
  errorMsg = '';
  intentError = '';
  cardError = '';

  private stripe: Stripe | null = null;
  private cardElement: StripeCardElement | null = null;
  private paymentClientSecret = '';

  form = this.fb.group({
    amount: [null as number | null, [Validators.required, Validators.min(1)]],
  });

  ngOnInit(): void {
    this.loadBalance();
    this.loadTransactions(0);
    this.prefetchStripe();
    this.loadSavedCards();
  }

  private loadSavedCards(): void {
    this.stripeService.getSavedCards().subscribe({
      next: (cards) => {
        this.savedCards.set(cards);
        this.useSavedCard.set(cards.length > 0);
      },
    });
  }

  private prefetchStripe(): void {
    this.stripeService.getConfig().subscribe({
      next: async (cfg) => {
        this.stripe = await loadStripe(cfg.publishableKey);
      },
    });
  }

  selectPreset(amount: number): void {
    this.selectedPreset.set(amount);
    this.form.patchValue({ amount });
    this.intentError = '';
  }

  proceedToPayment(): void {
    if (this.form.invalid) {
      return;
    }

    this.creatingIntent.set(true);

    this.intentError = '';

    const amount = this.form.value.amount!;

    this.walletService.createPaymentIntent(amount).subscribe({
      next: (res) => {
        this.paymentClientSecret = res.clientSecret;

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

  selectSavedCard(): void {
    this.useSavedCard.set(true);
    this.cardElement?.unmount();
    this.cardElement = null;
  }

  switchToNewCard(): void {
    this.useSavedCard.set(false);
    setTimeout(() => this.mountCardElement(), 0);
  }

  private mountCardElement(): void {
    if (!this.stripe) {
      return;
    }
    this.stripeLoading.set(true);
    const elements: StripeElements = this.stripe.elements();
    this.cardElement = elements.create('card', {
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
    const el = document.getElementById('stripe-payment-element');
    if (el) {
      this.cardElement.mount(el);
      this.cardElement.on('change', (event) => {
        this.cardError = event.error ? event.error.message : '';
      });
      this.cardElement.on('focus', () => el.classList.add('focused'));
      this.cardElement.on('blur', () => el.classList.remove('focused'));
    }
    this.stripeLoading.set(false);
  }

  async confirmPayment(): Promise<void> {
    if (!this.stripe || !this.paymentClientSecret) {
      return;
    }
    const usingSaved = this.useSavedCard() && this.savedCards().length > 0;
    if (!usingSaved && !this.cardElement) {
      return;
    }

    this.submitting.set(true);
    this.successMsg = '';
    this.errorMsg = '';

    const result = await this.stripe.confirmCardPayment(
      this.paymentClientSecret,
      {
        payment_method: usingSaved
          ? this.savedCards()[0].id
          : { card: this.cardElement! },
      },
    );

    if (result.error) {
      this.errorMsg = result.error.message ?? 'Payment failed.';
      this.submitting.set(false);
      return;
    }

    const amount = this.form.value.amount!;
    this.walletService.confirmCredits(amount).subscribe({
      next: (updated) => {
        this.balance.set(updated);
        this.successMsg = `€${amount.toFixed(2)} added to your account!`;
        this.submitting.set(false);
        this.paymentStep.set(false);
        this.form.reset();
        this.selectedPreset.set(null);
        this.useSavedCard.set(this.savedCards().length > 0);
        this.loadTransactions(0);
      },
      error: () => {
        this.errorMsg =
          'Payment succeeded but credits update failed. Contact support.';
        this.submitting.set(false);
      },
    });
  }

  backToAmount(): void {
    this.paymentStep.set(false);
    this.cardElement?.unmount();
    this.cardElement = null;
    this.errorMsg = '';
    this.cardError = '';
    this.useSavedCard.set(this.savedCards().length > 0);
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.loadTransactions(event.pageIndex);
  }

  private loadBalance(): void {
    this.balanceLoading.set(true);
    this.walletService.getBalance().subscribe({
      next: (b) => {
        this.balance.set(b);
        this.balanceLoading.set(false);
      },
      error: () => this.balanceLoading.set(false),
    });
  }

  private loadTransactions(page: number): void {
    this.txLoading.set(true);
    this.walletService.getTransactions(page, this.pageSize).subscribe({
      next: (res) => {
        this.transactions.set(res.content);
        this.totalElements.set(res.totalElements);
        this.txLoading.set(false);
      },
      error: () => this.txLoading.set(false),
    });
  }
}
