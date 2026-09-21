import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '@core/auth/auth.service';
import { SessionService } from '@core/auth/session.service';
import { NavItem, Shell, UserRole, visibleNavItems } from './shell';

const ITEMS: ReadonlyArray<NavItem> = [
  { path: '/', label: 'Panel', icon: 'layout-dashboard', roles: ['propietario'] },
  { path: '/admin', label: 'Admin', icon: 'layout-dashboard', roles: ['propietario'] },
];

describe('visibleNavItems', () => {
  it('should show nothing without a role', () => {
    expect(visibleNavItems(ITEMS, null)).toEqual([]);
    expect(visibleNavItems(ITEMS, undefined)).toEqual([]);
  });

  it('should filter items by role', () => {
    const role: UserRole = 'recepcion';
    expect(visibleNavItems(ITEMS, role)).toEqual([]);
    expect(visibleNavItems(ITEMS, 'propietario').length).toBe(2);
  });
});

describe('Shell', () => {
  let fixture: ComponentFixture<Shell>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Shell],
      providers: [
        provideRouter([{ path: '**', component: Shell }]),
        { provide: AuthService, useValue: { logout: () => of(undefined) } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(Shell);
  });

  it('should render the navigation and the user for an authenticated session', () => {
    TestBed.inject(SessionService).setSession('access-123', 'refresh-123', {
      fullName: 'Ana Pérez',
      role: 'odontologo',
    });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Panel principal');
    expect(fixture.nativeElement.textContent).toContain('Ana Pérez');
    expect(fixture.nativeElement.textContent).toContain('Odontólogo');
  });

  it('should log out through the auth service', () => {
    const auth = TestBed.inject(AuthService);
    const logout = vi.spyOn(auth, 'logout');
    TestBed.inject(SessionService).setSession('access-123', 'refresh-123');
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector(
      '[aria-label="Cerrar sesión"]',
    ) as HTMLButtonElement;
    button.click();
    expect(logout).toHaveBeenCalled();
  });
});
