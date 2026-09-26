import { Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./leads-board/leads-board').then((m) => m.LeadsBoard),
    data: { title: 'Prospectos' },
  },
  {
    // Before ':id': otherwise "metrics" would match the detail route.
    path: 'metrics',
    loadComponent: () =>
      import('./lead-metrics/lead-metrics').then((m) => m.LeadMetrics),
    data: { title: 'Métricas de prospectos' },
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./lead-detail/lead-detail').then((m) => m.LeadDetail),
    data: { title: 'Detalle de prospecto' },
  },
];

export default routes;
