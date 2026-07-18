import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../services/auth/auth.service';

/**
 * Registration page.
 *
 * Collects credentials, personal details, and address, registers the
 * user via {@link AuthService.signUp} (which also signs them in), and
 * redirects to the home page on success.
 */
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
  private formBuilder = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  /** Error message shown when registration fails. */
  error = '';

  /** Registration form: credentials, personal details, and address. */
  form = this.formBuilder.group({
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

  /** Registers the user with the `USER` role and navigates home on success. */
  onSubmit(): void {
    if (this.form.invalid) {
      return;
    }

    const formValue = this.form.value;

    this.authService
      .signUp({
        username: formValue.username!,
        password: formValue.password!,
        firstName: formValue.firstName!,
        lastName: formValue.lastName!,
        email: formValue.email!,
        phoneNumber: formValue.phoneNumber!,
        ucn: formValue.ucn!,
        country: formValue.country!,
        city: formValue.city!,
        street: formValue.street!,
        streetNumber: formValue.streetNumber!,
        postalCode: formValue.postalCode!,
        roles: ['USER'],
      })
      .subscribe({
        next: () => this.router.navigate(['/']),
        error: () => (this.error = 'Registration failed. Please try again.'),
      });
  }
}
