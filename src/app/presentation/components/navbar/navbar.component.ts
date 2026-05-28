import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { AuthService } from '@/application/auth/auth.service';
import { NotificationService } from '@/application/notification/notification.service';
import { BalanceService } from '@/application/wallet/balance.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    RouterLink,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatBadgeModule,
  ],
  template: `
    <mat-toolbar color="primary">
      <span
        routerLink="/"
        style="cursor:pointer;font-weight:bold;font-size:1.2rem;"
        >Auctioneer</span
      >
      <span style="flex:1"></span>
      @if (auth.isLoggedIn()) {
        <button mat-button routerLink="/my-ads">My Ads</button>
        <button mat-button routerLink="/ads/create">Create Ad</button>
        <button mat-button routerLink="/add-credits">
          <mat-icon>account_balance_wallet</mat-icon>
          \${{ bs.balance() !== null ? bs.balance()!.toFixed(2) : '—' }}
        </button>
        <button
          mat-icon-button
          (click)="ns.clearUnread()"
          style="margin: 0 4px;"
        >
          @if (ns.unreadCount() > 0) {
            <mat-icon
              [matBadge]="ns.unreadCount()"
              matBadgeColor="warn"
              matBadgeSize="small"
            >
              notifications
            </mat-icon>
          } @else {
            <mat-icon>notifications_none</mat-icon>
          }
        </button>
        <button mat-button routerLink="/profile">Profile</button>
        <button mat-button (click)="auth.logout()">Logout</button>
      } @else {
        <button mat-button routerLink="/sign-in">Sign In</button>
        <button mat-button routerLink="/sign-up">Sign Up</button>
      }
    </mat-toolbar>
  `,
})
export class NavbarComponent {
  auth = inject(AuthService);
  ns = inject(NotificationService);
  bs = inject(BalanceService);
}
