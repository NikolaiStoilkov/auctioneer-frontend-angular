import { API_URL } from './api-url';

const adsBase = `${API_URL}/api/ads`;

/**
 * Ad endpoints. Noun-based REST paths: the HTTP verb carries the action
 * (POST /api/ads creates, PUT /api/ads/{id} edits, POST /api/ads/{id}/bids bids).
 */
export const ADS_API = {
  base: adsBase,
  byId: (id: number) => `${adsBase}/${id}`,
  myAds: `${adsBase}/my-ads`,
  create: adsBase,
  edit: (adId: number) => `${adsBase}/${adId}`,
  bid: (adId: number) => `${adsBase}/${adId}/bids`,
  pagination: `${adsBase}/pagination`,
  stream: `${adsBase}/stream`,
  bidStream: (adId: number) => `${adsBase}/${adId}/stream`,
} as const;
