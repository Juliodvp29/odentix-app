import { Routes } from '@angular/router';

// Temporary placeholder route. Replaced by the real treatment plan routes in Fase 5.
const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('../placeholder/coming-soon').then((m) => m.ComingSoon),
    data: { title: 'Planes de tratamiento' },
  },
];

export default routes;
