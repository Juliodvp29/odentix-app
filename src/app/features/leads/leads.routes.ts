import { Routes } from '@angular/router';

// Temporary placeholder route. Replaced by the real leads routes in Fase 6.
const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('../placeholder/coming-soon').then((m) => m.ComingSoon),
    data: { title: 'Leads' },
  },
];

export default routes;
