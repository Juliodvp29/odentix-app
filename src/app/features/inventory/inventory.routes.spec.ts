import { describe, expect, it } from 'vitest';
import { routes } from '@app/app.routes';
import inventoryRoutes from './inventory.routes';

describe('inventory routes', () => {
  it('should register the top-level lazy route in app routes', () => {
    const shellRoute = routes.find((route) => route.path === '');
    const route = shellRoute?.children?.find((child) => child.path === 'inventory');

    expect(route?.loadChildren).toBeInstanceOf(Function);
  });

  it('should configure the inventory list route', () => {
    expect(inventoryRoutes).toHaveLength(1);

    expect(inventoryRoutes[0]?.path).toBe('');
    expect(inventoryRoutes[0]?.loadComponent).toBeInstanceOf(Function);
  });
});
