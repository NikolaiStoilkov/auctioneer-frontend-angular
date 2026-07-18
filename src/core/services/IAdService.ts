import { Observable } from 'rxjs';
import { Ad, AdFilter, BidResponse } from '../domain/ad.model';

export abstract class IAdService {
  abstract getById(id: number): Observable<Ad>;
  abstract getMyAds(): Observable<Ad[]>;
  abstract create(ad: Ad): Observable<void>;
  abstract edit(adId: number, ad: Ad): Observable<void>;
  /** Place a bid – no body needed; next price = currentBidPrice + bidStep. */
  abstract bid(adId: number): Observable<BidResponse>;
  abstract getPaginated(filter: AdFilter): Observable<Ad[]>;
}
