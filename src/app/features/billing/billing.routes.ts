import { Routes } from '@angular/router';

// The billing home stays a placeholder until the invoices list exists.
// FASE5-03 covers creating an invoice from a treatment plan and viewing
// its detail; the list arrives with a later ticket.
const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('../placeholder/coming-soon').then((m) => m.ComingSoon),
    data: { title: 'Facturación' },
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./invoice-detail/invoice-detail').then((m) => m.InvoiceDetail),
    data: { title: 'Detalle de factura' },
  },
];

export default routes;
