import { describe, expect, it } from 'vitest';
import { routes } from '@app/app.routes';
import opportunitiesRoutes from './opportunities.routes';

describe('opportunities routes', () => {
  it('should register the top-level lazy route in app routes', () => {
    const shellRoute = routes.find((route) => route.path === '');
    const route = shellRoute?.children?.find((child) => child.path === 'opportunities');

    expect(route?.loadChildren).toBeInstanceOf(Function);
  });

  it('should configure the opportunities board route', () => {
    expect(opportunitiesRoutes).toHaveLength(2);

    expect(opportunitiesRoutes[0]?.path).toBe('');
    expect(opportunitiesRoutes[0]?.loadComponent).toBeInstanceOf(Function);
  });

  it('should configure the recovered value route', () => {
    expect(opportunitiesRoutes[1]?.path).toBe('recuperado');
    expect(opportunitiesRoutes[1]?.loadComponent).toBeInstanceOf(Function);
  });

  it('should land on opportunities after login and on unknown routes', () => {
    const shellRoute = routes.find((route) => route.path === '');
    const landing = shellRoute?.children?.find(
      (child) => child.path === '' && child.pathMatch === 'full',
    );
    const fallback = routes.find((route) => route.path === '**');

    expect(landing?.redirectTo).toBe('opportunities');
    expect(fallback?.redirectTo).toBe('opportunities');
  });
});
