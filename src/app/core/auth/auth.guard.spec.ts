import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { SessionService } from './session.service';
import { authGuard } from './auth.guard';

@Component({ template: '<p>Protected content</p>' })
class ProtectedHost {}

@Component({ template: '<p>Login content</p>' })
class LoginHost {}

describe('authGuard', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'placeholder', component: ProtectedHost, canActivate: [authGuard] },
          { path: 'login', component: LoginHost },
        ]),
      ],
    });
  });

  it('should allow navigation with an active session', () => {
    TestBed.inject(SessionService).setSession('access-123', 'refresh-123');
    const result = TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));
    expect(result).toBe(true);
  });

  it('should redirect to login without a session', () => {
    const result = TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));
    expect(result.toString()).toBe('/login');
  });

  it('should land on login when navigating directly to a protected URL', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/placeholder');
    expect(harness.routeNativeElement?.textContent).toContain('Login content');
    expect(TestBed.inject(Router).url).toBe('/login');
  });
});
