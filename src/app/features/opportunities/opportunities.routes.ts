import { Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./opportunities-board/opportunities-board').then((m) => m.OpportunitiesBoard),
    data: { title: 'Oportunidades' },
  },
];

export default routes;
