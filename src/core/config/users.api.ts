import { API_URL } from './api-url';

const usersBase = `${API_URL}/api/users`;

/**
 * User endpoints. Noun-based REST paths: PATCH /api/users edits the
 * authenticated user's own profile.
 */
export const USERS_API = {
  base: usersBase,
  byId: (id: number) => `${usersBase}/${id}`,
  edit: usersBase,
  notificationsStream: (token: string) =>
    `${usersBase}/notifications/stream?token=${encodeURIComponent(token)}`,
} as const;
