import { Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./treatment-plans-list/treatment-plans-list').then((m) => m.TreatmentPlansList),
    data: { title: 'Planes de tratamiento' },
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./treatment-plan-builder/treatment-plan-builder-page').then(
        (m) => m.TreatmentPlanBuilderPage,
      ),
    data: { title: 'Nuevo plan de tratamiento' },
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./treatment-plan-detail/treatment-plan-detail').then((m) => m.TreatmentPlanDetail),
    data: { title: 'Detalle de plan de tratamiento' },
  },
];

export default routes;
