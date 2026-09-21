import { Routes } from '@angular/router';
import { authGuard } from '@core/auth/auth.guard';

export const routes: Routes = [
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./shell/shell').then((m) => m.Shell),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'placeholder' },
      {
        path: 'placeholder',
        loadComponent: () =>
          import('./features/placeholder/placeholder').then((m) => m.Placeholder),
      },
      // One lazy route file per feature module (Fases 3–12). Each file is a
      // placeholder today and grows into the real feature routes in its phase.
      { path: 'patients', loadChildren: () => import('./features/patients/patients.routes') },
      {
        path: 'appointments',
        loadChildren: () => import('./features/appointments/appointments.routes'),
      },
      {
        path: 'treatment-plans',
        loadChildren: () => import('./features/treatment-plans/treatment-plans.routes'),
      },
      { path: 'billing', loadChildren: () => import('./features/billing/billing.routes') },
      { path: 'leads', loadChildren: () => import('./features/leads/leads.routes') },
      { path: 'portfolio', loadChildren: () => import('./features/portfolio/portfolio.routes') },
      {
        path: 'specialists',
        loadChildren: () => import('./features/specialists/specialists.routes'),
      },
      { path: 'inventory', loadChildren: () => import('./features/inventory/inventory.routes') },
      { path: 'tasks', loadChildren: () => import('./features/tasks/tasks.routes') },
      {
        path: 'opportunities',
        loadChildren: () => import('./features/opportunities/opportunities.routes'),
      },
      { path: 'assistant', loadChildren: () => import('./features/assistant/assistant.routes') },
      { path: 'plans', loadChildren: () => import('./features/plans/plans.routes') },
    ],
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login-page/login-page').then((m) => m.LoginPage),
  },
  { path: '**', redirectTo: 'placeholder' },
];
