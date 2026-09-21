import { Routes } from '@angular/router';
import { authGuard } from '@core/auth/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'placeholder' },
  {
    path: 'placeholder',
    canActivate: [authGuard],
    loadComponent: () => import('./features/placeholder/placeholder').then((m) => m.Placeholder),
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login-page/login-page').then((m) => m.LoginPage),
  },
  { path: '**', redirectTo: 'placeholder' },
];
