import { Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./opportunities-board/opportunities-board').then((m) => m.OpportunitiesBoard),
    data: { title: 'Oportunidades' },
  },
  {
    path: 'recuperado',
    loadComponent: () => import('./recovered-value/recovered-value').then((m) => m.RecoveredValue),
    data: { title: 'Valor recuperado' },
  },
];

export default routes;
