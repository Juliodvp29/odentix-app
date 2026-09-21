import { Routes } from '@angular/router';

// Temporary placeholder route. Replaced by the real inventory routes in Fase 8.
const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('../placeholder/coming-soon').then((m) => m.ComingSoon),
    data: { title: 'Inventario' },
  },
];

export default routes;
