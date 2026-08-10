import { Component, booleanAttribute, input } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

/**
 * The app's single, unified loading spinner.
 *
 * Two variants cover every use in the app:
 * - block (default): centered spinner for page/section loading states.
 * - inline: small spinner rendered inside buttons or rows.
 *
 * ```html
 * <app-spinner />                        <!-- centered block spinner -->
 * <app-spinner inline [diameter]="20" /> <!-- small inline spinner -->
 * ```
 */
@Component({
  selector: 'app-spinner',
  standalone: true,
  imports: [MatProgressSpinnerModule],
  template: `
    @if (inline()) {
      <mat-spinner [diameter]="diameter()" class="inline-spinner" />
    } @else {
      <div class="spinner-wrap">
        <mat-spinner [diameter]="diameter()" />
      </div>
    }
  `,
  styles: `
    .spinner-wrap {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 48px 0;
    }

    .inline-spinner {
      display: inline-block;
      vertical-align: middle;
    }
  `,
})
export class SpinnerComponent {
  /** Renders the small inline variant when set. */
  inline = input(false, { transform: booleanAttribute });
  /** Spinner diameter in px. Defaults to Material's standard size. */
  diameter = input(40);
}
