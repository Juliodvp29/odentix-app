import { Routes } from '@angular/router';

// Appointments feature routes.
const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./agenda/agenda').then((m) => m.AgendaPage),
    data: { title: 'Agenda' },
  },
];

export default routes;
