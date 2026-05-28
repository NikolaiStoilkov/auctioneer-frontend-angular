import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AdPort } from '@/core/ports/ad.port';
import { Ad, AdFilter, BidResponse } from '@/core/domain/ad.model';

@Injectable({ providedIn: 'root' })
export class AdService {
  constructor(private adPort: AdPort) {}

  getById(id: number): Observable<Ad> {
    return this.adPort.getById(id);
  }

  getMyAds(): Observable<Ad[]> {
    return this.adPort.getMyAds();
  }

  create(ad: Ad): Observable<void> {
    return this.adPort.create(ad);
  }

  edit(adId: number, ad: Ad): Observable<void> {
    return this.adPort.edit(adId, ad);
  }

  /** Place a bid. The next price is always currentBidPrice + bidStep (server-enforced). */
  bid(adId: number): Observable<BidResponse> {
    return this.adPort.bid(adId);
  }

  getPaginated(filter: AdFilter): Observable<Ad[]> {
    return this.adPort.getPaginated(filter);
  }
}
