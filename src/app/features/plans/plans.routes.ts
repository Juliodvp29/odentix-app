import { Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./plan-selection/plan-selection').then((m) => m.PlanSelection),
    data: { title: 'Configuración' },
  },
];

export default routes;
