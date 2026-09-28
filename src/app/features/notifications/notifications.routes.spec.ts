import { describe, expect, it } from 'vitest';
import { routes } from '@app/app.routes';
import notificationsRoutes from './notifications.routes';

describe('notifications routes', () => {
  it('should register the top-level lazy route in app routes', () => {
    const shellRoute = routes.find((route) => route.path === '');
    const route = shellRoute?.children?.find((child) => child.path === 'notifications');

    expect(route?.loadChildren).toBeInstanceOf(Function);
  });

  it('should configure the notification list route', () => {
    expect(notificationsRoutes).toHaveLength(1);

    expect(notificationsRoutes[0]?.path).toBe('');
    expect(notificationsRoutes[0]?.loadComponent).toBeInstanceOf(Function);
  });
});
