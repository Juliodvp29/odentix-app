import { Routes } from '@angular/router';

// The lead detail arrives in FASE6-02; until then the route renders the
// shared placeholder so cards link somewhere sane.
const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./leads-board/leads-board').then((m) => m.LeadsBoard),
    data: { title: 'Prospectos' },
  },
  {
    path: ':id',
    loadComponent: () => import('../placeholder/coming-soon').then((m) => m.ComingSoon),
    data: { title: 'Detalle de prospecto' },
  },
];

export default routes;
