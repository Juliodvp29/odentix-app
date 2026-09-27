import { Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./portfolio-dashboard/portfolio-dashboard').then((m) => m.PortfolioDashboard),
    data: { title: 'Cartera' },
  },
];

export default routes;
