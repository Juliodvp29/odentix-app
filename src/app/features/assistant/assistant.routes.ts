import { Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./assistant-chat/assistant-chat').then((m) => m.AssistantChat),
    data: { title: 'Asistente' },
  },
];

export default routes;
