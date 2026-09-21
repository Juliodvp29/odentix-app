import { Routes } from '@angular/router';

// Patients feature routes.
const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./patients-list/patients-list').then((m) => m.PatientsListPage),
  },
];

export default routes;
