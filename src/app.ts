import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar.component';
import { ToastNotificationsComponent } from './components/toast-notifications/toast-notifications.component';
import { NotificationService } from './services/notification/notification.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, ToastNotificationsComponent],
  template: `
    <app-navbar></app-navbar>
    <router-outlet></router-outlet>
    <app-toast-notifications></app-toast-notifications>
  `,
  styles: [],
})
export class App {
  // Eagerly instantiate so SSE connects as soon as the app loads for logged-in users
  private _ns = inject(NotificationService);
}
