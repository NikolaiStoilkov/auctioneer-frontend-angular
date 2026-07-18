import { Observable } from 'rxjs';
import { PaymentMethodResponse } from '../domain/stripe.model';

export abstract class IStripeService {
  abstract getConfig(): Observable<{ publishableKey: string }>;
  abstract createSetupIntent(): Observable<{ clientSecret: string }>;
  abstract savePaymentMethod(): Observable<unknown>;
  abstract getSavedCards(): Observable<PaymentMethodResponse[]>;
}
