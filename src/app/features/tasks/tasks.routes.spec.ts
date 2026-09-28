import { describe, expect, it } from 'vitest';
import { routes } from '@app/app.routes';
import tasksRoutes from './tasks.routes';

describe('tasks routes', () => {
  it('should register the top-level lazy route in app routes', () => {
    const shellRoute = routes.find((route) => route.path === '');
    const route = shellRoute?.children?.find((child) => child.path === 'tasks');

    expect(route?.loadChildren).toBeInstanceOf(Function);
  });

  it('should configure the tasks list route', () => {
    expect(tasksRoutes).toHaveLength(1);

    expect(tasksRoutes[0]?.path).toBe('');
    expect(tasksRoutes[0]?.loadComponent).toBeInstanceOf(Function);
  });
});
