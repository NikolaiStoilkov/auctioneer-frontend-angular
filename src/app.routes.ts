import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/home/home.component').then(
        (m) => m.HomeComponent,
      ),
  },
  {
    path: 'sign-in',
    loadComponent: () =>
      import('./pages/sign-in/sign-in.component').then(
        (m) => m.SignInComponent,
      ),
  },
  {
    path: 'sign-up',
    loadComponent: () =>
      import('./pages/sign-up/sign-up.component').then(
        (m) => m.SignUpComponent,
      ),
  },
  {
    path: 'ads/create',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/ad-create/ad-create.component').then(
        (m) => m.AdCreateComponent,
      ),
  },
  {
    path: 'ads/:id',
    loadComponent: () =>
      import('./pages/ad-detail/ad-detail.component').then(
        (m) => m.AdDetailComponent,
      ),
  },
  {
    path: 'my-ads',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/my-ads/my-ads.component').then(
        (m) => m.MyAdsComponent,
      ),
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/profile/profile.component').then(
        (m) => m.ProfileComponent,
      ),
  },
  {
    path: 'add-credits',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/add-credits/add-credits.component').then(
        (m) => m.AddCreditsComponent,
      ),
  },
  { path: '**', redirectTo: '' },
];
