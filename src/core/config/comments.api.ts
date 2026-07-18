import { API_URL } from './api-url';

const commentsBase = `${API_URL}/api/comments`;

export const COMMENTS_API = {
  base: commentsBase,
  byAdId: (adId: number) => `${commentsBase}/${adId}`,
  create: (adId: number) => `${commentsBase}/create/${adId}`,
  edit: `${commentsBase}/edit`,
  delete: (id: number) => `${commentsBase}/delete/${id}`,
} as const;
