import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '@/application/auth/auth.service';

@Component({
  selector: 'app-sign-in',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  template: `
    <div
      style="display:flex;justify-content:center;align-items:center;min-height:80vh;padding:16px"
    >
      <mat-card style="width:100%;max-width:400px">
        <mat-card-header>
          <mat-card-title>Sign In</mat-card-title>
        </mat-card-header>
        <mat-card-content style="padding-top:16px">
          <form
            [formGroup]="form"
            (ngSubmit)="onSubmit()"
            style="display:flex;flex-direction:column;gap:12px"
          >
            <mat-form-field appearance="outline">
              <mat-label>Username</mat-label>
              <input matInput formControlName="username" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Password</mat-label>
              <input matInput type="password" formControlName="password" />
            </mat-form-field>
            @if (error) {
              <p style="color:red;font-size:0.85rem">{{ error }}</p>
            }
            <button
              mat-raised-button
              color="primary"
              type="submit"
              [disabled]="form.invalid"
            >
              Sign In
            </button>
          </form>
        </mat-card-content>
        <mat-card-actions>
          <p style="padding:0 16px 8px">
            Don't have an account? <a routerLink="/sign-up">Sign Up</a>
          </p>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
})
export class SignInPage {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  error = '';

  form = this.fb.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
  });

  onSubmit(): void {
    if (this.form.invalid) {
      return;
    }
    this.authService
      .signIn({
        username: this.form.value.username!,
        password: this.form.value.password!,
      })
      .subscribe({
        next: () => this.router.navigate(['/']),
        error: () => (this.error = 'Invalid credentials'),
      });
  }
}
