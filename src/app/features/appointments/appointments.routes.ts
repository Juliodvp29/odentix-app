import { Routes } from '@angular/router';
import { WaitlistService } from './waitlist/waitlist.service';

// Appointments feature routes.
const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./agenda/agenda').then((m) => m.AgendaPage),
    providers: [WaitlistService],
    data: { title: 'Agenda' },
  },
];

export default routes;
