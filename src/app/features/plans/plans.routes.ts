import { Routes } from '@angular/router';

// Temporary placeholder route. Replaced by the real plans routes in Fase 12.
const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('../placeholder/coming-soon').then((m) => m.ComingSoon),
    data: { title: 'Planes' },
  },
];

export default routes;
