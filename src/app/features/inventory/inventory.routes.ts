import { Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./inventory-list/inventory-list').then((m) => m.InventoryListPage),
    data: { title: 'Inventario' },
  },
];

export default routes;
