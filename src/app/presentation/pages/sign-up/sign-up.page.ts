import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '@/application/auth/auth.service';

@Component({
  selector: 'app-sign-up',
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
    <div style="display:flex;justify-content:center;padding:24px 16px">
      <mat-card style="width:100%;max-width:500px">
        <mat-card-header>
          <mat-card-title>Sign Up</mat-card-title>
        </mat-card-header>
        <mat-card-content style="padding-top:16px">
          <form
            [formGroup]="form"
            (ngSubmit)="onSubmit()"
            style="display:flex;flex-direction:column;gap:10px"
          >
            <mat-form-field appearance="outline">
              <mat-label>Username</mat-label>
              <input matInput formControlName="username" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Password</mat-label>
              <input matInput type="password" formControlName="password" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>First Name</mat-label>
              <input matInput formControlName="firstName" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Last Name</mat-label>
              <input matInput formControlName="lastName" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Email</mat-label>
              <input matInput type="email" formControlName="email" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Phone Number</mat-label>
              <input matInput formControlName="phoneNumber" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>UCN (10 digits)</mat-label>
              <input matInput formControlName="ucn" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Country</mat-label>
              <input matInput formControlName="country" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>City</mat-label>
              <input matInput formControlName="city" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Street</mat-label>
              <input matInput formControlName="street" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Street Number</mat-label>
              <input matInput formControlName="streetNumber" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Postal Code</mat-label>
              <input matInput formControlName="postalCode" />
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
              Sign Up
            </button>
          </form>
        </mat-card-content>
        <mat-card-actions>
          <p style="padding:0 16px 8px">
            Already have an account? <a routerLink="/sign-in">Sign In</a>
          </p>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
})
export class SignUpPage {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  error = '';

  form = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(3)]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phoneNumber: ['', Validators.required],
    ucn: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
    country: ['', Validators.required],
    city: ['', Validators.required],
    street: ['', Validators.required],
    streetNumber: ['', Validators.required],
    postalCode: [
      '',
      [Validators.required, Validators.pattern(/^[0-9]{4,10}$/)],
    ],
  });

  onSubmit(): void {
    if (this.form.invalid) {
      return;
    }

    const v = this.form.value;

    this.authService
      .signUp({
        username: v.username!,
        password: v.password!,
        firstName: v.firstName!,
        lastName: v.lastName!,
        email: v.email!,
        phoneNumber: v.phoneNumber!,
        ucn: v.ucn!,
        country: v.country!,
        city: v.city!,
        street: v.street!,
        streetNumber: v.streetNumber!,
        postalCode: v.postalCode!,
        roles: ['USER'],
      })
      .subscribe({
        next: () => this.router.navigate(['/']),
        error: () => (this.error = 'Registration failed. Please try again.'),
      });
  }
}
