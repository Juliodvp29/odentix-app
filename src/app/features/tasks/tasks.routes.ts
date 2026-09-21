import { Routes } from '@angular/router';

// Temporary placeholder route. Replaced by the real tasks routes in Fase 9.
const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('../placeholder/coming-soon').then((m) => m.ComingSoon),
    data: { title: 'Tareas' },
  },
];

export default routes;
