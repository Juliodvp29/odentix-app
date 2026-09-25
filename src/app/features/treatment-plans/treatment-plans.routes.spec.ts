import { describe, expect, it } from 'vitest';
import { routes } from '@app/app.routes';
import treatmentPlansRoutes from './treatment-plans.routes';

describe('treatment-plans routes', () => {
  it('should register the top-level lazy route in app routes', () => {
    const shellRoute = routes.find((route) => route.path === '');
    const route = shellRoute?.children?.find((child) => child.path === 'treatment-plans');

    expect(route?.loadChildren).toBeInstanceOf(Function);
  });

  it('should configure list, new builder, and detail routes', () => {
    expect(treatmentPlansRoutes).toHaveLength(3);

    expect(treatmentPlansRoutes[0]?.path).toBe('');
    expect(treatmentPlansRoutes[0]?.loadComponent).toBeInstanceOf(Function);

    expect(treatmentPlansRoutes[1]?.path).toBe('new');
    expect(treatmentPlansRoutes[1]?.loadComponent).toBeInstanceOf(Function);

    expect(treatmentPlansRoutes[2]?.path).toBe(':id');
    expect(treatmentPlansRoutes[2]?.loadComponent).toBeInstanceOf(Function);
  });
});
