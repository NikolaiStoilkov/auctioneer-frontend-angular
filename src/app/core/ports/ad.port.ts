import { Observable } from 'rxjs';
import { Ad, AdFilter, BidRequest } from '../domain/ad.model';

export abstract class AdPort {
  abstract getById(id: number): Observable<Ad>;
  abstract getMyAds(): Observable<Ad[]>;
  abstract create(ad: Ad): Observable<void>;
  abstract edit(adId: number, ad: Ad): Observable<void>;
  abstract bid(adId: number, bidRequest: BidRequest): Observable<void>;
  abstract getPaginated(filter: AdFilter): Observable<Ad[]>;
}
