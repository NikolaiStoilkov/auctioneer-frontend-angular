import { API_URL } from './api-url';

const adsBase = `${API_URL}/api/ads`;

export const ADS_API = {
  base: adsBase,
  byId: (id: number) => `${adsBase}/${id}`,
  myAds: `${adsBase}/my-ads`,
  create: `${adsBase}/create`,
  edit: (adId: number) => `${adsBase}/edit/${adId}`,
  bid: (adId: number) => `${adsBase}/bid/${adId}`,
  pagination: `${adsBase}/pagination`,
  stream: `${adsBase}/stream`,
  bidStream: (adId: number) => `${adsBase}/${adId}/stream`,
} as const;
