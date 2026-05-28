import { Routes } from '@angular/router';
import { authGuard } from './presentation/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./presentation/pages/home/home.page').then((m) => m.HomePage),
  },
  {
    path: 'sign-in',
    loadComponent: () =>
      import('./presentation/pages/sign-in/sign-in.page').then(
        (m) => m.SignInPage,
      ),
  },
  {
    path: 'sign-up',
    loadComponent: () =>
      import('./presentation/pages/sign-up/sign-up.page').then(
        (m) => m.SignUpPage,
      ),
  },
  {
    path: 'ads/create',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./presentation/pages/ad-create/ad-create.page').then(
        (m) => m.AdCreatePage,
      ),
  },
  {
    path: 'ads/:id',
    loadComponent: () =>
      import('./presentation/pages/ad-detail/ad-detail.page').then(
        (m) => m.AdDetailPage,
      ),
  },
  {
    path: 'my-ads',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./presentation/pages/my-ads/my-ads.page').then(
        (m) => m.MyAdsPage,
      ),
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./presentation/pages/profile/profile.page').then(
        (m) => m.ProfilePage,
      ),
  },
  {
    path: 'add-credits',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./presentation/pages/add-credits/add-credits.page').then(
        (m) => m.AddCreditsPage,
      ),
  },
  { path: '**', redirectTo: '' },
];
