import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Ad, AdFilter, BidResponse } from '../../core/domain/ad.model';

import { ADS_API } from '../../core/config/ads.api';

/**
 * HTTP client for the auction ads REST API.
 *
 * Handles fetching, creating, and editing ads, as well as placing bids.
 * Live price updates are delivered separately over SSE (see
 * {@link NotificationService} and the ad-detail page's bid stream).
 */
@Injectable({ providedIn: 'root' })
export class AdService {
  private api = ADS_API;

  constructor(private http: HttpClient) {}

  /**
   * Fetches a single ad by its id.
   *
   * @param id Id of the ad to fetch.
   * @returns Observable emitting the requested {@link Ad}.
   */
  getById(id: number) {
    return this.http.get<Ad>(this.api.byId(id));
  }

  /**
   * Fetches all ads created by the currently authenticated user.
   *
   * @returns Observable emitting the user's ads.
   */
  getMyAds() {
    return this.http.get<Ad[]>(this.api.myAds);
  }

  /**
   * Creates a new ad owned by the current user.
   *
   * @param ad Ad payload to create.
   * @returns Observable completing when the ad has been created.
   */
  create(ad: Ad) {
    return this.http.post<void>(this.api.create, ad);
  }

  /**
   * Updates an existing ad.
   *
   * @param adId Id of the ad to edit.
   * @param ad Updated ad payload.
   * @returns Observable completing when the ad has been updated.
   */
  edit(adId: number, ad: Ad){
    return this.http.put<void>(this.api.edit(adId), ad);
  }

  /**
   * Places a bid on the given ad for the current user.
   *
   * The bid amount is not sent by the client: the next price is always
   * `currentBidPrice + bidStep`, enforced server-side.
   *
   * @param adId Id of the ad to bid on.
   * @returns Observable emitting the resulting {@link BidResponse}.
   */
  bid(adId: number){
    return this.http.post<BidResponse>(this.api.bid(adId), {});
  }

  /**
   * Fetches a page of ads matching the given filter.
   *
   * Only the filter properties that are set are sent as query parameters.
   *
   * @param filter Pagination and filtering options (active flag, date range, page, size).
   * @returns Observable emitting the matching page of ads.
   */
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

    return this.http.get<Ad[]>(this.api.pagination, { params });
  }
}
