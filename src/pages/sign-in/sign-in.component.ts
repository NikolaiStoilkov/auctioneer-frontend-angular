import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../services/auth/auth.service';

/**
 * Sign-in page.
 *
 * Submits the credentials via {@link AuthService.signIn} and redirects
 * to the home page on success.
 */
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
  templateUrl: './sign-in.component.html',
  styleUrl: './sign-in.component.css',
})
export class SignInComponent {
  private formBuilder = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  /** Error message shown when authentication fails. */
  error = '';

  /** Credentials form: username and password. */
  form = this.formBuilder.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
  });

  /** Signs the user in and navigates home on success. */
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
