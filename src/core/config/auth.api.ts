import { API_URL } from './api-url';

const authBase = `${API_URL}/api/auth`;

export const AUTH_API = {
  base: authBase,
  signIn: `${authBase}/sign-in`,
  signUp: `${authBase}/sign-up`,
} as const;
