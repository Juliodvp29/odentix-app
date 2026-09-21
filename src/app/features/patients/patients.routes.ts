import { Routes } from '@angular/router';

// Patients feature routes.
const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./patients-list/patients-list').then((m) => m.PatientsListPage),
  },
  {
    path: ':id',
    loadComponent: () => import('./patient-detail/patient-detail').then((m) => m.PatientDetailPage),
  },
];

export default routes;
