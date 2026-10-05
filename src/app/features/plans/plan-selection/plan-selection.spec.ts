import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { SessionService } from '@core/auth/session.service';
import { ToastService } from '@shared/toast/toast.service';
import { PlanSelection } from './plan-selection';
import { PlanCatalogResponse } from '../plan-models';
import { PlanService } from '../plan.service';

const PLANS: PlanCatalogResponse[] = [
  {
    code: 'esencial',
    name: 'Esencial',
    monthlyPriceCop: 99900,
    annualPriceCop: 999000,
    features: [],
    limits: { max_patients: 150, max_users: 0 },
  },
  {
    code: 'clinica',
    name: 'Clínica',
    monthlyPriceCop: 259900,
    annualPriceCop: 2599000,
    features: ['ai_assistant', 'crm_leads'],
    limits: { max_patients: 800 },
  },
];

describe('PlanSelection', () => {
  let fixture: ComponentFixture<PlanSelection>;
  let checkout: ReturnType<typeof vi.fn>;
  let reload: ReturnType<typeof vi.fn>;
  let toastError: ReturnType<typeof vi.fn>;
  let currentUser: ReturnType<typeof signal>;

  function setup(
    role: string = 'propietario',
    plans: PlanCatalogResponse[] | null = PLANS,
    error: unknown = undefined,
  ) {
    const mockResource = {
      value: signal(plans),
      isLoading: signal(plans === null && error === undefined),
      error: signal(error),
      reload: vi.fn(),
    };
    reload = mockResource.reload;
    checkout = vi.fn().mockReturnValue(of({ paymentUrl: 'https://bold.test/pay/1' }));
    toastError = vi.fn();
    currentUser = signal({ fullName: 'Pau', role });

    TestBed.configureTestingModule({
      imports: [PlanSelection],
      providers: [
        provideRouter([]),
        {
          provide: PlanService,
          useValue: {
            catalog: () => mockResource,
            checkout,
            plan: signal({ planCode: 'esencial', features: [], limits: {} }),
          },
        },
        { provide: SessionService, useValue: { currentUser } },
        { provide: ToastService, useValue: { success: vi.fn(), error: toastError } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PlanSelection);
    fixture.detectChanges();
  }

  it('should render catalog prices, features and limits from the backend', () => {
    setup();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Configuración');
    expect(text).toContain('Esencial');
    expect(text).toContain('Clínica');
    expect(text).toContain('99.900');
    expect(text).toContain('Asistente con IA');
    expect(text).toContain('Pacientes');
    expect(text).toContain('No incluido');
    expect(text).toContain('Tu plan actual');
  });

  it('should highlight the active plan apart from the upgrade options', () => {
    setup();
    const banner = fixture.nativeElement.querySelector(
      'section[aria-label="Tu plan actual"]',
    ) as HTMLElement;
    expect(banner).not.toBeNull();
    expect(banner.textContent).toContain('Esencial');
    expect(banner.textContent).toContain('99.900');
    expect(fixture.nativeElement.textContent).toContain('Cambiar de plan');
    expect(fixture.nativeElement.textContent).toContain('Plan actual');
  });

  it('should switch prices with the billing cycle', () => {
    setup();
    const tabs = fixture.nativeElement.querySelectorAll('[role="tab"]');
    (tabs[1] as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('999.000');
  });

  it('should start a checkout through Bold on choose', () => {
    setup();
    const choose = Array.from(fixture.nativeElement.querySelectorAll('button')).find((button) =>
      (button as HTMLButtonElement).textContent?.includes('Elegir Clínica'),
    ) as HTMLButtonElement;
    choose.click();
    expect(checkout).toHaveBeenCalledWith('clinica', 'monthly');
  });

  it('should explain checkout failures without leaving', async () => {
    setup();
    checkout.mockReturnValue(throwError(() => new Error('down')));
    const choose = Array.from(fixture.nativeElement.querySelectorAll('button')).find((button) =>
      (button as HTMLButtonElement).textContent?.includes('Elegir Clínica'),
    ) as HTMLButtonElement;
    choose.click();

    await fixture.whenStable();
    expect(toastError).toHaveBeenCalledWith('No pudimos iniciar el pago. Intenta de nuevo.');
    expect(fixture.componentInstance.checkingOut()).toBeNull();
  });

  it('should keep plan changes owner-only', () => {
    setup('recepcion');
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Solo el propietario puede cambiar el plan');
    expect(text).not.toContain('Elegir Clínica');
  });

  it('should retry when loading fails', () => {
    setup('propietario', null, new Error('fail'));
    expect(fixture.nativeElement.textContent).toContain('No pudimos cargar los planes.');
    const button = fixture.nativeElement.querySelector(
      'section[role="alert"] button',
    ) as HTMLButtonElement;
    button.click();
    expect(reload).toHaveBeenCalled();
  });

  it('should show the empty state without plans', () => {
    setup('propietario', []);
    expect(fixture.nativeElement.textContent).toContain('No hay planes disponibles');
  });
});
