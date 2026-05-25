import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UserService } from '../../../application/user/user.service';
import { AuthService } from '../../../application/auth/auth.service';
import { User } from '../../../core/domain/user.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div style="display:flex;justify-content:center;padding:24px 16px">
      <mat-card style="width:100%;max-width:600px">
        <mat-card-header>
          <mat-card-title>My Profile</mat-card-title>
        </mat-card-header>
        <mat-card-content style="padding-top:16px">
          @if (loading()) {
            <div style="display:flex;justify-content:center;padding:32px">
              <mat-spinner></mat-spinner>
            </div>
          } @else {
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
                <mat-label>First Name</mat-label>
                <input matInput formControlName="firstName" />
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Last Name</mat-label>
                <input matInput formControlName="lastName" />
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Email</mat-label>
                <input matInput formControlName="email" />
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Phone</mat-label>
                <input matInput formControlName="phoneNumber" />
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>City</mat-label>
                <input matInput formControlName="city" />
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Country</mat-label>
                <input matInput formControlName="country" />
              </mat-form-field>
              @if (successMsg) {
                <p style="color:green;font-size:0.85rem">{{ successMsg }}</p>
              }
              @if (error) {
                <p style="color:red;font-size:0.85rem">{{ error }}</p>
              }
              <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid">
                Save Changes
              </button>
            </form>
          }
        </mat-card-content>
      </mat-card>
    </div>
  `,
})
export class ProfilePage implements OnInit {
  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private auth = inject(AuthService);

  loading = signal(true);
  successMsg = '';
  error = '';
  private user: User | null = null;

  form = this.fb.group({
    username: ['', Validators.required],
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phoneNumber: ['', Validators.required],
    city: ['', Validators.required],
    country: ['', Validators.required],
  });

  ngOnInit(): void {
    const userId = this.auth.getUserIdFromToken();
    if (!userId) {
      this.loading.set(false);
      this.error = 'Could not identify user. Please sign in again.';
      return;
    }
    this.userService.getById(userId).subscribe({
      next: (u) => {
        this.user = u;
        this.form.patchValue({
          username: u.username,
          firstName: u.firstName,
          lastName: u.lastName,
          email: u.email,
          phoneNumber: u.phoneNumber,
          city: u.city,
          country: u.country,
        });
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onSubmit(): void {
    if (this.form.invalid || !this.user) return;
    const v = this.form.value;
    this.userService
      .edit({
        ...this.user,
        username: v.username!,
        firstName: v.firstName!,
        lastName: v.lastName!,
        email: v.email!,
        phoneNumber: v.phoneNumber!,
        city: v.city!,
        country: v.country!,
      })
      .subscribe({
        next: () => (this.successMsg = 'Profile updated successfully.'),
        error: () => (this.error = 'Failed to update profile.'),
      });
  }
}
