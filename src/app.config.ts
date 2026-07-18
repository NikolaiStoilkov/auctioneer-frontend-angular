import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

import { routes } from './app.routes';
import { jwtInterceptor } from './interceptors/jwt.interceptor';

// Services
import { AdService } from './services/ads/ad.service';
import { AuthService } from './services/auth/auth.service';
import { CommentService } from './services/comment/comment.service';
import { UserService } from './services/user/user.service';
import { StripeService } from './services/stripe/stripe.service';
import { WalletService } from './services/wallet/wallet.service';

// Core/Services (interfaces)
import { IAdService } from './core/services/IAdService';
import { IAuthService } from './core/services/IAuthService';
import { ICommentService } from './core/services/ICommentService';
import { IUserService } from './core/services/IUserService';
import { IStripeService } from './core/services/IStripeService';
import { IWalletService } from './core/services/IWalletService';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([jwtInterceptor])),
    provideAnimationsAsync(),
    { provide: IAdService, useClass: AdService },
    { provide: IAuthService, useClass: AuthService },
    { provide: ICommentService, useClass: CommentService },
    { provide: IUserService, useClass: UserService },
    { provide: IStripeService, useClass: StripeService },
    { provide: IWalletService, useClass: WalletService },
  ],
};
