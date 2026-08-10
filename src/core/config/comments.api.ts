import { API_URL } from './api-url';

const commentsBase = `${API_URL}/api/comments`;

/**
 * Comment endpoints. Noun-based REST paths: POST /api/comments creates
 * (the ad id travels in the payload), PUT /api/comments edits,
 * DELETE /api/comments/{id} deletes.
 */
export const COMMENTS_API = {
  base: commentsBase,
  byAdId: (adId: number) => `${commentsBase}/${adId}`,
  create: commentsBase,
  edit: commentsBase,
  delete: (id: number) => `${commentsBase}/${id}`,
} as const;
