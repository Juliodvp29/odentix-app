import { describe, expect, it } from 'vitest';
import { routes } from '@app/app.routes';
import assistantRoutes from './assistant.routes';

describe('assistant routes', () => {
  it('should register the top-level lazy route in app routes', () => {
    const shellRoute = routes.find((route) => route.path === '');
    const route = shellRoute?.children?.find((child) => child.path === 'assistant');

    expect(route?.loadChildren).toBeInstanceOf(Function);
  });

  it('should configure the assistant chat route', () => {
    expect(assistantRoutes).toHaveLength(1);

    expect(assistantRoutes[0]?.path).toBe('');
    expect(assistantRoutes[0]?.loadComponent).toBeInstanceOf(Function);
  });
});
