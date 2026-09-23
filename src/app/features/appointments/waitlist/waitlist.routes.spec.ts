import { routes } from '@app/app.routes';
import waitlistRoutes from './waitlist.routes';
import { waitlistGuard } from './waitlist.guard';

describe('waitlist routes', () => {
  it('should register the top-level lazy route with the role guard', () => {
    const shellRoute = routes.find((route) => route.path === '');
    const route = shellRoute?.children?.find((child) => child.path === 'waitlist');

    expect(route?.loadChildren).toBeInstanceOf(Function);
    expect(route?.canActivate).toEqual([waitlistGuard]);
  });

  it('should lazy-load the list page inside the waitlist feature', () => {
    expect(waitlistRoutes).toHaveLength(1);
    expect(waitlistRoutes[0]?.path).toBe('');
    expect(waitlistRoutes[0]?.loadComponent).toBeInstanceOf(Function);
  });
});
