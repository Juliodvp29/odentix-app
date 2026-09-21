import { Routes } from '@angular/router';

// Temporary placeholder route. Replaced by the real agenda routes in Fase 4.
const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('../placeholder/coming-soon').then((m) => m.ComingSoon),
    data: { title: 'Agenda' },
  },
];

export default routes;
