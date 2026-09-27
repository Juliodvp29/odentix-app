import { describe, expect, it } from 'vitest';
import { routes } from '@app/app.routes';
import portfolioRoutes from './portfolio.routes';

describe('portfolio routes', () => {
  it('should register the top-level lazy route in app routes', () => {
    const shellRoute = routes.find((route) => route.path === '');
    const route = shellRoute?.children?.find((child) => child.path === 'portfolio');

    expect(route?.loadChildren).toBeInstanceOf(Function);
  });

  it('should configure the dashboard route', () => {
    expect(portfolioRoutes).toHaveLength(1);

    expect(portfolioRoutes[0]?.path).toBe('');
    expect(portfolioRoutes[0]?.loadComponent).toBeInstanceOf(Function);
  });
});
