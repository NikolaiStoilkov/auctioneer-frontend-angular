import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Ad, AdFilter, BidResponse } from '@/core/domain/ad.model';
import { AdPort } from '@/core/ports/ad.port';
import { environment } from '@env/environment';

@Injectable({ providedIn: 'root' })
export class AdHttpAdapter extends AdPort {
  private base = `${environment.apiUrl}/api/ads`;

  constructor(private http: HttpClient) {
    super();
  }

  getById(id: number): Observable<Ad> {
    return this.http.get<Ad>(`${this.base}/${id}`);
  }

  getMyAds(): Observable<Ad[]> {
    return this.http.get<Ad[]>(`${this.base}/my-ads`);
  }

  create(ad: Ad): Observable<void> {
    return this.http.post<void>(`${this.base}/create`, ad);
  }

  edit(adId: number, ad: Ad): Observable<void> {
    return this.http.post<void>(`${this.base}/edit/${adId}`, ad);
  }

  /** POST /api/ads/bid/{adId} — no body required; the server derives the price. */
  bid(adId: number): Observable<BidResponse> {
    return this.http.post<BidResponse>(`${this.base}/bid/${adId}`, {});
  }

  getPaginated(filter: AdFilter): Observable<Ad[]> {
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
