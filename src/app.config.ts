import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

import { routes } from './app.routes';
import { AdPort } from './core/ports/ad.port';
import { AuthPort } from './core/ports/auth.port';
import { CommentPort } from './core/ports/comment.port';
import { UserPort } from './core/ports/user.port';
import { StripePort } from './core/ports/stripe.port';
import { WalletPort } from './core/ports/wallet.port';
import { jwtInterceptor } from './interceptors/jwt.interceptor';
import { AdService } from './services/ads/ad.service';
import { AuthService } from './services/auth/auth.service';
import { CommentService } from './services/comment/comment.service';
import { UserService } from './services/user/user.service';
import { StripeService } from './services/stripe/stripe.service';
import { WalletService } from './services/wallet/wallet.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([jwtInterceptor])),
    provideAnimationsAsync(),
    { provide: AdPort, useClass: AdService },
    { provide: AuthPort, useClass: AuthService },
    { provide: CommentPort, useClass: CommentService },
    { provide: UserPort, useClass: UserService },
    { provide: StripePort, useClass: StripeService },
    { provide: WalletPort, useClass: WalletService },
  ],
};
