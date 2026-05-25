import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

import { routes } from './app.routes';
import { AdPort } from './core/ports/ad.port';
import { AuthPort } from './core/ports/auth.port';
import { CommentPort } from './core/ports/comment.port';
import { UserPort } from './core/ports/user.port';
import { AdHttpAdapter } from './infrastructure/http/ad-http.adapter';
import { AuthHttpAdapter } from './infrastructure/http/auth-http.adapter';
import { CommentHttpAdapter } from './infrastructure/http/comment-http.adapter';
import { UserHttpAdapter } from './infrastructure/http/user-http.adapter';
import { jwtInterceptor } from './infrastructure/http/jwt.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([jwtInterceptor])),
    provideAnimationsAsync(),
    { provide: AdPort, useClass: AdHttpAdapter },
    { provide: AuthPort, useClass: AuthHttpAdapter },
    { provide: CommentPort, useClass: CommentHttpAdapter },
    { provide: UserPort, useClass: UserHttpAdapter },
  ],
};
