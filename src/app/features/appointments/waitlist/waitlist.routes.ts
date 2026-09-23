import { Routes } from '@angular/router';
import { WaitlistService } from './waitlist.service';

const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./waitlist-list/waitlist-list').then((m) => m.WaitlistListPage),
    providers: [WaitlistService],
    data: { title: 'Lista de espera' },
  },
];

export default routes;
