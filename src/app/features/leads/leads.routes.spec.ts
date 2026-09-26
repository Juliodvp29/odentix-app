import { describe, expect, it } from 'vitest';
import { routes } from '@app/app.routes';
import leadsRoutes from './leads.routes';

describe('leads routes', () => {
  it('should register the top-level lazy route in app routes', () => {
    const shellRoute = routes.find((route) => route.path === '');
    const route = shellRoute?.children?.find((child) => child.path === 'leads');

    expect(route?.loadChildren).toBeInstanceOf(Function);
  });

  it('should configure the board and the detail placeholder routes', () => {
    expect(leadsRoutes).toHaveLength(2);

    expect(leadsRoutes[0]?.path).toBe('');
    expect(leadsRoutes[0]?.loadComponent).toBeInstanceOf(Function);

    expect(leadsRoutes[1]?.path).toBe(':id');
    expect(leadsRoutes[1]?.loadComponent).toBeInstanceOf(Function);
  });
});
