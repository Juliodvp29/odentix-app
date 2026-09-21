import { Routes } from '@angular/router';

// Temporary placeholder route. Replaced by the real assistant routes in Fase 11.
const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('../placeholder/coming-soon').then((m) => m.ComingSoon),
    data: { title: 'Asistente' },
  },
];

export default routes;
