import { Observable } from 'rxjs';
import { WalletBalance, CreditTransaction } from '../domain/wallet.model';

export interface PagedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
}

export abstract class IWalletService {
  abstract getBalance(): Observable<WalletBalance>;
  abstract createPaymentIntent(
    amount: number,
  ): Observable<{ clientSecret: string }>;
  abstract confirmCredits(amount: number): Observable<WalletBalance>;
  abstract addCredits(amount: number): Observable<WalletBalance>;
  abstract getTransactions(
    page: number,
    size: number,
  ): Observable<PagedResponse<CreditTransaction>>;
}
