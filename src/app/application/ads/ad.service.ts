import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AdPort } from '../../core/ports/ad.port';
import { Ad, AdFilter, BidRequest } from '../../core/domain/ad.model';

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

  bid(adId: number, bidRequest: BidRequest): Observable<void> {
    return this.adPort.bid(adId, bidRequest);
  }

  getPaginated(filter: AdFilter): Observable<Ad[]> {
    return this.adPort.getPaginated(filter);
  }
}
