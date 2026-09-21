import { Routes } from '@angular/router';

// Temporary placeholder route. Replaced by the real opportunities routes in Fase 10.
const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('../placeholder/coming-soon').then((m) => m.ComingSoon),
    data: { title: 'Oportunidades' },
  },
];

export default routes;
