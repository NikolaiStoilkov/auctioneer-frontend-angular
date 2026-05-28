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
import { WalletService } from '@/application/wallet/wallet.service';
import { StripeService } from '@/application/stripe/stripe.service';
import { WalletBalance, CreditTransaction } from '@/core/domain/wallet.model';
import { PaymentMethodResponse } from '@/core/domain/stripe.model';

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
  styles: [
    `
      .page-wrapper {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 24px 16px;
        gap: 24px;
      }
      .top-row {
        display: flex;
        gap: 24px;
        width: 100%;
        max-width: 900px;
        flex-wrap: wrap;
      }
      .balance-card {
        flex: 1;
        min-width: 200px;
      }
      .add-card {
        flex: 2;
        min-width: 320px;
      }
      .history-card {
        width: 100%;
        max-width: 900px;
      }
      .balance-amount {
        font-size: 2.2rem;
        font-weight: 700;
        color: #3f51b5;
        margin: 8px 0 0;
      }
      .preset-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 10px;
        margin-bottom: 16px;
      }
      .preset-btn {
        height: 52px;
        font-size: 1rem;
        font-weight: 600;
      }
      .preset-btn.selected {
        background: #3f51b5;
        color: #fff;
      }
      #stripe-payment-element {
        border: 1px solid rgba(0, 0, 0, 0.23);
        border-radius: 4px;
        padding: 14px 12px;
        background: #fff;
        transition: border-color 0.2s;
      }
      #stripe-payment-element.focused {
        border-color: #3f51b5;
        border-width: 2px;
      }
      .type-chip {
        font-size: 0.75rem;
        font-weight: 600;
      }
      .chip-purchase {
        background: #e8f5e9 !important;
        color: #2e7d32 !important;
      }
      .chip-debit {
        background: #fce4ec !important;
        color: #c62828 !important;
      }
      .chip-refund {
        background: #e3f2fd !important;
        color: #1565c0 !important;
      }
    `,
  ],
  template: `
    <div class="page-wrapper">
      <div class="top-row">
        <mat-card class="balance-card">
          <mat-card-header>
            <mat-card-title>
              <mat-icon style="vertical-align:middle;margin-right:6px"
                >account_balance_wallet</mat-icon
              >
              My Balance
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            @if (balanceLoading()) {
              <mat-spinner diameter="32" style="margin:16px auto"></mat-spinner>
            } @else if (balance()) {
              <p class="balance-amount">
                €{{ balance()!.balance | number: '1.2-2' }}
              </p>
              <p style="color:#757575;margin:4px 0 0;font-size:0.85rem">
                Credits: €{{ balance()!.credits | number: '1.2-2' }}
              </p>
            } @else {
              <p style="color:#9e9e9e;margin-top:12px">
                Could not load balance.
              </p>
            }
          </mat-card-content>
        </mat-card>

        <mat-card class="add-card">
          <mat-card-header>
            <mat-card-title>
              <mat-icon style="vertical-align:middle;margin-right:6px"
                >add_card</mat-icon
              >
              Add Credits
            </mat-card-title>
            <mat-card-subtitle
              >Select an amount and pay securely via Stripe</mat-card-subtitle
            >
          </mat-card-header>
          <mat-card-content style="padding-top:16px">
            @if (!paymentStep()) {
              <div class="preset-grid">
                @for (amount of presets; track amount) {
                  <button
                    mat-stroked-button
                    class="preset-btn"
                    [class.selected]="selectedPreset() === amount"
                    (click)="selectPreset(amount)"
                  >
                    €{{ amount }}
                  </button>
                }
              </div>
              <form [formGroup]="form" (ngSubmit)="proceedToPayment()">
                <mat-form-field appearance="outline" style="width:100%">
                  <mat-label>Custom amount (€)</mat-label>
                  <mat-icon matPrefix>euro</mat-icon>
                  <input
                    matInput
                    type="number"
                    min="1"
                    formControlName="amount"
                    placeholder="e.g. 75"
                    (input)="selectedPreset.set(null)"
                  />
                  @if (form.get('amount')?.hasError('min')) {
                    <mat-error>Minimum amount is €1</mat-error>
                  }
                </mat-form-field>
                @if (intentError) {
                  <p style="color:#d32f2f;font-size:0.875rem;margin:0 0 8px">
                    {{ intentError }}
                  </p>
                }
                <button
                  mat-raised-button
                  color="primary"
                  type="submit"
                  [disabled]="form.invalid || creatingIntent()"
                  style="width:100%;height:48px;font-size:1rem"
                >
                  @if (creatingIntent()) {
                    <mat-spinner
                      diameter="24"
                      style="display:inline-block"
                    ></mat-spinner>
                  } @else {
                    Continue to Payment
                  }
                </button>
              </form>
            } @else {
              <div style="display:flex;flex-direction:column;gap:16px">
                <div style="display:flex;align-items:center;gap:8px">
                  <button mat-icon-button (click)="backToAmount()">
                    <mat-icon>arrow_back</mat-icon>
                  </button>
                  <span style="font-size:1rem;font-weight:500">
                    Pay €{{ form.value.amount | number: '1.2-2' }}
                  </span>
                </div>

                <!-- Payment method selection (shown only when a saved card exists) -->
                @if (savedCards().length > 0) {
                  <div>
                    <p
                      style="font-size:0.75rem;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:#666;margin:0 0 8px"
                    >
                      Payment Method
                    </p>
                    <!-- Saved card option -->
                    <div
                      (click)="selectSavedCard()"
                      style="display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:8px;cursor:pointer;margin-bottom:8px;transition:border-color 0.15s,background 0.15s"
                      [style.border]="
                        useSavedCard()
                          ? '2px solid #3f51b5'
                          : '1px solid #e0e0e0'
                      "
                      [style.background]="
                        useSavedCard() ? '#f3f4fe' : '#fafafa'
                      "
                    >
                      <mat-icon style="color:#3f51b5;flex-shrink:0"
                        >credit_card</mat-icon
                      >
                      <div style="flex:1;font-size:0.9rem">
                        <span
                          style="font-weight:600;text-transform:capitalize"
                          >{{ savedCards()[0].card?.brand }}</span
                        >
                        <span style="margin:0 5px;letter-spacing:0.05em"
                          >•••• {{ savedCards()[0].card?.last4 }}</span
                        >
                      </div>
                      <span
                        style="font-size:0.8rem;color:#888;white-space:nowrap"
                      >
                        Expires {{ savedCards()[0].card?.expMonth }}/{{
                          savedCards()[0].card?.expYear
                        }}
                      </span>
                    </div>
                    <!-- New card option -->
                    <div
                      (click)="switchToNewCard()"
                      style="display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:8px;cursor:pointer;transition:border-color 0.15s,background 0.15s"
                      [style.border]="
                        !useSavedCard()
                          ? '2px solid #3f51b5'
                          : '1px solid #e0e0e0'
                      "
                      [style.background]="
                        !useSavedCard() ? '#f3f4fe' : '#fafafa'
                      "
                    >
                      <mat-icon style="color:#555;flex-shrink:0"
                        >add_card</mat-icon
                      >
                      <span style="font-size:0.9rem">Use a different card</span>
                    </div>
                  </div>
                }

                <!-- Card element — shown only when entering a new card -->
                @if (!useSavedCard() || savedCards().length === 0) {
                  @if (savedCards().length === 0) {
                    <p style="color:#555;font-size:0.875rem;margin:0">
                      Use test card <strong>4242 4242 4242 4242</strong>, any
                      future date and any CVC.
                    </p>
                  }
                  @if (stripeLoading()) {
                    <mat-spinner
                      diameter="32"
                      style="margin:0 auto"
                    ></mat-spinner>
                  }
                  <div>
                    <label
                      style="font-size:0.75rem;color:#666;display:block;margin-bottom:6px"
                      >Card details</label
                    >
                    <div id="stripe-payment-element"></div>
                    @if (cardError) {
                      <p style="color:#d32f2f;font-size:0.75rem;margin:6px 0 0">
                        {{ cardError }}
                      </p>
                    }
                  </div>
                }

                @if (successMsg) {
                  <p style="color:#388e3c;font-size:0.9rem;margin:0">
                    <mat-icon style="font-size:16px;vertical-align:middle"
                      >check_circle</mat-icon
                    >
                    {{ successMsg }}
                  </p>
                }
                @if (errorMsg) {
                  <p style="color:#d32f2f;font-size:0.9rem;margin:0">
                    {{ errorMsg }}
                  </p>
                }
                <button
                  mat-raised-button
                  color="primary"
                  (click)="confirmPayment()"
                  [disabled]="submitting() || stripeLoading()"
                  style="width:100%;height:48px;font-size:1rem"
                >
                  @if (submitting()) {
                    <mat-spinner
                      diameter="24"
                      style="display:inline-block"
                    ></mat-spinner>
                  } @else {
                    <ng-container>
                      <mat-icon>lock</mat-icon>
                      Pay €{{ form.value.amount | number: '1.2-2' }}
                    </ng-container>
                  }
                </button>
              </div>
            }
          </mat-card-content>
        </mat-card>
      </div>

      <mat-card class="history-card">
        <mat-card-header>
          <mat-card-title>
            <mat-icon style="vertical-align:middle;margin-right:6px"
              >history</mat-icon
            >
            Transaction History
          </mat-card-title>
        </mat-card-header>
        <mat-card-content>
          @if (txLoading()) {
            <div style="display:flex;justify-content:center;padding:32px">
              <mat-spinner></mat-spinner>
            </div>
          } @else if (transactions().length === 0) {
            <div style="text-align:center;padding:32px;color:#9e9e9e">
              <mat-icon style="font-size:48px;width:48px;height:48px"
                >receipt_long</mat-icon
              >
              <p>No transactions yet.</p>
            </div>
          } @else {
            <table mat-table [dataSource]="transactions()" style="width:100%">
              <ng-container matColumnDef="date">
                <th mat-header-cell *matHeaderCellDef>Date</th>
                <td mat-cell *matCellDef="let t">
                  {{ t.createdAt | date: 'dd MMM yyyy, HH:mm' }}
                </td>
              </ng-container>
              <ng-container matColumnDef="type">
                <th mat-header-cell *matHeaderCellDef>Type</th>
                <td mat-cell *matCellDef="let t">
                  <span
                    class="type-chip"
                    [class.chip-purchase]="t.type === 'PURCHASE'"
                    [class.chip-debit]="t.type === 'DEBIT'"
                    [class.chip-refund]="t.type === 'REFUND'"
                    style="padding:3px 10px;border-radius:12px"
                  >
                    {{ t.type }}
                  </span>
                </td>
              </ng-container>
              <ng-container matColumnDef="description">
                <th mat-header-cell *matHeaderCellDef>Description</th>
                <td mat-cell *matCellDef="let t">{{ t.description }}</td>
              </ng-container>
              <ng-container matColumnDef="amount">
                <th mat-header-cell *matHeaderCellDef style="text-align:right">
                  Amount
                </th>
                <td mat-cell *matCellDef="let t" style="text-align:right">
                  <span
                    [style.color]="t.type === 'DEBIT' ? '#d32f2f' : '#2e7d32'"
                  >
                    {{ t.type === 'DEBIT' ? '-' : '+' }}€{{
                      t.amount | number: '1.2-2'
                    }}
                  </span>
                </td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
            </table>
            <mat-paginator
              [length]="totalElements()"
              [pageSize]="pageSize"
              [pageIndex]="pageIndex()"
              [pageSizeOptions]="[5, 10, 25]"
              (page)="onPageChange($event)"
            ></mat-paginator>
          }
        </mat-card-content>
      </mat-card>
    </div>
  `,
})
export class AddCreditsPage implements OnInit {
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
