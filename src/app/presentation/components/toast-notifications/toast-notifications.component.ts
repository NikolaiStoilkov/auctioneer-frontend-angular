import { Component, inject } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { NotificationService } from '@/application/notification/notification.service';

@Component({
  selector: 'app-toast-notifications',
  standalone: true,
  imports: [CurrencyPipe, RouterLink, MatIconModule, MatButtonModule],
  template: `
    <div class="toast-container">
      @for (toast of ns.toasts(); track toast.id) {
        <div class="toast">
          <mat-icon class="toast-icon">gavel</mat-icon>
          <div class="toast-body">
            <div class="toast-title">
              {{
                toast.type === 'OUTBID'
                  ? "You've been outbid!"
                  : 'New bid on your auction'
              }}
            </div>
            <div class="toast-msg">
              <strong>{{ toast.latestBidderUsername }}</strong> bid
              <strong>{{ toast.currentBidPrice | currency }}</strong> on
              <a [routerLink]="['/ads', toast.adId]" class="toast-link">{{
                toast.adTitle
              }}</a>
            </div>
          </div>
          <button
            mat-icon-button
            class="toast-close"
            (click)="ns.dismissToast(toast.id)"
          >
            <mat-icon>close</mat-icon>
          </button>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .toast-container {
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        gap: 10px;
        max-width: 360px;
      }
      .toast {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        background: #323232;
        color: #fff;
        border-radius: 8px;
        padding: 14px 12px 14px 16px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
        animation: slide-in 0.25s ease-out;
      }
      @keyframes slide-in {
        from {
          transform: translateX(110%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      .toast-icon {
        color: #ff9800;
        margin-top: 2px;
        flex-shrink: 0;
      }
      .toast-body {
        flex: 1;
        min-width: 0;
      }
      .toast-title {
        font-weight: 600;
        font-size: 0.9rem;
        margin-bottom: 4px;
      }
      .toast-msg {
        font-size: 0.82rem;
        color: #ccc;
        line-height: 1.4;
      }
      .toast-link {
        color: #90caf9;
        text-decoration: none;
      }
      .toast-link:hover {
        text-decoration: underline;
      }
      .toast-close {
        flex-shrink: 0;
        color: #aaa !important;
        width: 28px !important;
        height: 28px !important;
        line-height: 28px !important;
      }
    `,
  ],
})
export class ToastNotificationsComponent {
  ns = inject(NotificationService);
}
