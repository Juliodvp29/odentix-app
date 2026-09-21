import { Routes } from '@angular/router';

// Temporary placeholder route. Replaced by the real portfolio routes in Fase 7.
const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('../placeholder/coming-soon').then((m) => m.ComingSoon),
    data: { title: 'Cartera' },
  },
];

export default routes;
