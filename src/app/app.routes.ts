import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'placeholder' },
  {
    path: 'placeholder',
    loadComponent: () => import('./features/placeholder/placeholder').then((m) => m.Placeholder),
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login-page/login-page').then((m) => m.LoginPage),
  },
  { path: '**', redirectTo: 'placeholder' },
];
