import { describe, expect, it } from 'vitest';
import { routes } from '@app/app.routes';
import specialistsRoutes from './specialists.routes';

describe('specialists routes', () => {
  it('should register the top-level lazy route in app routes', () => {
    const shellRoute = routes.find((route) => route.path === '');
    const route = shellRoute?.children?.find((child) => child.path === 'specialists');

    expect(route?.loadChildren).toBeInstanceOf(Function);
  });

  it('should configure list, detail, and settlement routes', () => {
    expect(specialistsRoutes).toHaveLength(3);

    expect(specialistsRoutes[0]?.path).toBe('');
    expect(specialistsRoutes[0]?.loadComponent).toBeInstanceOf(Function);

    expect(specialistsRoutes[1]?.path).toBe(':id');
    expect(specialistsRoutes[1]?.loadComponent).toBeInstanceOf(Function);

    expect(specialistsRoutes[2]?.path).toBe(':id/settlements/:settlementId');
    expect(specialistsRoutes[2]?.loadComponent).toBeInstanceOf(Function);
  });
});
