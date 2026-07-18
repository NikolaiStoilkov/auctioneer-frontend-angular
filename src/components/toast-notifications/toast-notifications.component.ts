import { Component, inject } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { NotificationService } from '../../services/notification/notification.service';

/**
 * Overlay that renders the toast notifications emitted by
 * {@link NotificationService}.
 *
 * Toasts link to the related ad and can be dismissed manually;
 * otherwise they auto-dismiss after a few seconds.
 */
@Component({
  selector: 'app-toast-notifications',
  standalone: true,
  imports: [CurrencyPipe, RouterLink, MatIconModule, MatButtonModule],
  templateUrl: './toast-notifications.component.html',
  styleUrl: './toast-notifications.component.css',
})
export class ToastNotificationsComponent {
  notificationService = inject(NotificationService);
}
