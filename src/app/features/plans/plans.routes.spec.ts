import { describe, expect, it } from 'vitest';
import { routes } from '@app/app.routes';
import plansRoutes from './plans.routes';

describe('plans routes', () => {
  it('should register the top-level lazy route in app routes', () => {
    const shellRoute = routes.find((route) => route.path === '');
    const route = shellRoute?.children?.find((child) => child.path === 'configuracion');

    expect(route?.loadChildren).toBeInstanceOf(Function);
  });

  it('should configure the plan selection route', () => {
    expect(plansRoutes).toHaveLength(1);

    expect(plansRoutes[0]?.path).toBe('');
    expect(plansRoutes[0]?.loadComponent).toBeInstanceOf(Function);
  });
});
