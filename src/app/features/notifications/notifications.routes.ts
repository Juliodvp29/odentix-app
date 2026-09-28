import { Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./notification-list-page/notification-list-page').then((m) => m.NotificationListPage),
    data: { title: 'Notificaciones' },
  },
];

export default routes;
