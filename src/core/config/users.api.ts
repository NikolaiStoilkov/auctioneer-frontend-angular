import { API_URL } from './api-url';

const usersBase = `${API_URL}/api/users`;

export const USERS_API = {
  base: usersBase,
  byId: (id: number) => `${usersBase}/${id}`,
  edit: `${usersBase}/edit`,
  notificationsStream: (token: string) =>
    `${usersBase}/notifications/stream?token=${encodeURIComponent(token)}`,
} as const;
