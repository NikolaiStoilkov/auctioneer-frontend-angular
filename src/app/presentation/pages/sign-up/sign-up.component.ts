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
  templateUrl: './sign-up.component.html',
  styleUrl: './sign-up.component.css',
})
export class SignUpComponent {
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
