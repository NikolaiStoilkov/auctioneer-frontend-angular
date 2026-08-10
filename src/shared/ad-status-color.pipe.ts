import { Pipe, PipeTransform } from '@angular/core';

/**
 * Maps an ad status to its chip background color.
 *
 * Shared across the home, my-ads, and ad-detail views so the
 * status → color mapping lives in exactly one place.
 *
 * @example
 * ```html
 * <mat-chip [style.background]="ad.status | adStatusColor">…</mat-chip>
 * ```
 */
@Pipe({
  name: 'adStatusColor',
  standalone: true,
})
export class AdStatusColorPipe implements PipeTransform {
  /**
   * @param status Ad status (`ACTIVE`, `SOLD`, or other).
   * @returns A CSS color: green for active, red for sold, yellow otherwise.
   */
  transform(status?: string): string {
    if (status === 'ACTIVE') {
      return '#c8e6c9';
    }
    if (status === 'SOLD') {
      return '#ffcdd2';
    }
    return '#fff9c4';
  }
}
