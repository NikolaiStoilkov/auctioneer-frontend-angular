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
  templateUrl: './toast-notifications.component.html',
  styleUrl: './toast-notifications.component.css',
})
export class ToastNotificationsComponent {
  ns = inject(NotificationService);
}
