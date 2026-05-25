import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../../application/auth/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, MatToolbarModule, MatButtonModule],
  template: `
    <mat-toolbar color="primary">
      <span routerLink="/" style="cursor:pointer;font-weight:bold;font-size:1.2rem;"
        >Auctioneer</span
      >
      <span style="flex:1"></span>
      @if (auth.isLoggedIn()) {
        <button mat-button routerLink="/my-ads">My Ads</button>
        <button mat-button routerLink="/ads/create">Create Ad</button>
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
}
