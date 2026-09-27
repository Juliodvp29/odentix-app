import { Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./specialists-list/specialists-list').then((m) => m.SpecialistsList),
    data: { title: 'Especialistas' },
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./specialist-detail/specialist-detail').then((m) => m.SpecialistDetail),
    data: { title: 'Detalle de especialista' },
  },
  {
    path: ':id/settlements/:settlementId',
    loadComponent: () =>
      import('./settlement-detail/settlement-detail').then((m) => m.SettlementDetail),
    data: { title: 'Detalle de liquidación' },
  },
];

export default routes;
