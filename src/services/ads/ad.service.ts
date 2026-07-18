import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Ad, AdFilter, BidResponse } from '../../core/domain/ad.model';

import * as variables from "@env/environment.development";

@Injectable({ providedIn: 'root' })
export class AdService {
  private base = `${variables.environment.API_URL}/api/ads`;

  constructor(private http: HttpClient) {}

  getById(id: number) {
    return this.http.get<Ad>(`${this.base}/${id}`);
  }

  getMyAds() {
    return this.http.get<Ad[]>(`${this.base}/my-ads`);
  }

  create(ad: Ad) {
    return this.http.post<void>(`${this.base}/create`, ad);
  }

  edit(adId: number, ad: Ad){
    return this.http.post<void>(`${this.base}/edit/${adId}`, ad);
  }

  /** Place a bid. The next price is always currentBidPrice + bidStep (server-enforced). */
  bid(adId: number){
    return this.http.post<BidResponse>(`${this.base}/bid/${adId}`, {});
  }

  getPaginated(filter: AdFilter) {
    const params: Record<string, string> = {};

    if (filter.active !== undefined) {
      params['active'] = String(filter.active);
    }

    if (filter.dateFrom) {
      params['dateFrom'] = filter.dateFrom;
    }

    if (filter.dateTo) {
      params['dateTo'] = filter.dateTo;
    }

    if (filter.page) {
      params['page'] = String(filter.page);
    }

    if (filter.size) {
      params['size'] = String(filter.size);
    }

    return this.http.get<Ad[]>(`${this.base}/pagination`, { params });
  }
}
