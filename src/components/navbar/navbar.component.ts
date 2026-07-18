import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { AuthService } from '../../services/auth/auth.service';
import { NotificationService } from '../../services/notification/notification.service';
import { BalanceService } from '../../services/wallet/balance.service';

/**
 * Top navigation bar.
 *
 * Shows the main navigation links and, for logged-in users, the wallet
 * balance and the unread notification badge. The template binds directly
 * to the injected {@link AuthService}, {@link NotificationService},
 * and {@link BalanceService}.
 */
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
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
})
export class NavbarComponent {
  authService = inject(AuthService);
  notificationService = inject(NotificationService);
  balanceService = inject(BalanceService);
}
