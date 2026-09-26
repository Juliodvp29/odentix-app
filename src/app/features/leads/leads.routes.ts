import { Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./leads-board/leads-board').then((m) => m.LeadsBoard),
    data: { title: 'Prospectos' },
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./lead-detail/lead-detail').then((m) => m.LeadDetail),
    data: { title: 'Detalle de prospecto' },
  },
];

export default routes;
