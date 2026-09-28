import { Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./my-tasks-page/my-tasks-page').then((m) => m.MyTasksPage),
    data: { title: 'Tareas' },
  },
];

export default routes;
