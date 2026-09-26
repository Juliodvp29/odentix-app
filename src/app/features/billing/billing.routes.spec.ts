import { describe, expect, it } from 'vitest';
import { routes } from '@app/app.routes';
import billingRoutes from './billing.routes';

describe('billing routes', () => {
  it('should register the top-level lazy route in app routes', () => {
    const shellRoute = routes.find((route) => route.path === '');
    const route = shellRoute?.children?.find((child) => child.path === 'billing');

    expect(route?.loadChildren).toBeInstanceOf(Function);
  });

  it('should configure the placeholder home and the invoice detail route', () => {
    expect(billingRoutes).toHaveLength(2);

    expect(billingRoutes[0]?.path).toBe('');
    expect(billingRoutes[0]?.loadComponent).toBeInstanceOf(Function);

    expect(billingRoutes[1]?.path).toBe(':id');
    expect(billingRoutes[1]?.loadComponent).toBeInstanceOf(Function);
  });
});
