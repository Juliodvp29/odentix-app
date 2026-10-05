import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { AuthService } from '@core/auth/auth.service';
import { SessionService } from '@core/auth/session.service';
import { PlanService } from '@app/features/plans/plan.service';
import { ToastService } from '@shared/toast/toast.service';
import { NavItem, Shell, UserRole, visibleNavItems } from './shell';

const ITEMS: ReadonlyArray<NavItem> = [
  { path: '/', label: 'Panel', icon: 'layout-dashboard', roles: ['propietario'] },
  { path: '/admin', label: 'Admin', icon: 'layout-dashboard', roles: ['propietario'] },
];

const GATED: ReadonlyArray<NavItem> = [
  {
    path: '/opportunities',
    label: 'Oportunidades',
    icon: 'target',
    roles: ['propietario'],
    feature: 'opportunities_engine',
  },
  { path: '/patients', label: 'Pacientes', icon: 'users', roles: ['propietario'] },
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

  it('should hide features missing from the plan', () => {
    expect(visibleNavItems(GATED, 'propietario', () => false)).toEqual([GATED[1]]);
    expect(visibleNavItems(GATED, 'propietario', () => true)).toEqual(GATED);
  });
});

describe('Shell', () => {
  let fixture: ComponentFixture<Shell>;
  let planReady: ReturnType<typeof signal<boolean>>;
  let hasFeature: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    planReady = signal(true);
    hasFeature = vi.fn().mockReturnValue(true);
    await TestBed.configureTestingModule({
      imports: [Shell],
      providers: [
        provideRouter([{ path: '**', component: Shell }]),
        { provide: AuthService, useValue: { logout: () => of(undefined) } },
        { provide: PlanService, useValue: { ready: planReady, hasFeature } },
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

  it('should display toasts triggered from anywhere', () => {
    TestBed.inject(ToastService).success('Paciente creado');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Paciente creado');
  });

  it('should hide nav items for features missing from the plan', () => {
    hasFeature.mockImplementation((feature: string) => feature !== 'opportunities_engine');
    TestBed.inject(SessionService).setSession('access-123', 'refresh-123', {
      fullName: 'Ana Pérez',
      role: 'propietario',
    });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Pacientes');
    expect(fixture.nativeElement.textContent).not.toContain('Oportunidades');
  });

  it('should reserve the nav space while the plan is loading', () => {
    planReady.set(false);
    TestBed.inject(SessionService).setSession('access-123', 'refresh-123', {
      fullName: 'Ana Pérez',
      role: 'propietario',
    });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Cargando navegación');
    expect(fixture.nativeElement.textContent).not.toContain('Pacientes');
  });
});
