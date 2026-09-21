import { Routes } from '@angular/router';

// Temporary placeholder route. Replaced by the real patients routes in Fase 3.
const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('../placeholder/coming-soon').then((m) => m.ComingSoon),
    data: { title: 'Pacientes' },
  },
];

export default routes;
