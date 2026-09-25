import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { ToastService } from '@shared/toast/toast.service';
import { PatientsService } from '@features/patients/patients.service';
import { AppointmentsService } from '@features/appointments/appointments.service';
import { TreatmentPlansService } from '../treatment-plans.service';
import { TreatmentPlanResponse } from '../treatment-plan-models';
import { TreatmentPlanBuilder } from './treatment-plan-builder';

const MOCK_CREATED: TreatmentPlanResponse = {
  id: 'plan-new-1',
  patientId: 'patient-123',
  patientFullName: 'Carlos Pérez',
  diagnosis: 'Test diagnosis',
  status: 'borrador',
  totalPriceCop: 90000,
  items: [],
};

describe('TreatmentPlanBuilder', () => {
  let fixture: ComponentFixture<TreatmentPlanBuilder>;
  let component: TreatmentPlanBuilder;
  let plansService: TreatmentPlansService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TreatmentPlanBuilder],
      providers: [
        {
          provide: TreatmentPlansService,
          useValue: {
            createTreatmentPlan: vi.fn().mockReturnValue(of(MOCK_CREATED)),
          },
        },
        {
          provide: PatientsService,
          useValue: {
            searchPatients: vi.fn().mockReturnValue(of([])),
          },
        },
        {
          provide: AppointmentsService,
          useValue: {
            professionalOptions: () => [{ id: 'prof-1', name: 'Dr. Mario Bros' }],
          },
        },
        {
          provide: ToastService,
          useValue: {
            success: vi.fn(),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TreatmentPlanBuilder);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('initialPatientId', 'patient-123');
    fixture.componentRef.setInput('initialPatientName', 'Carlos Pérez');
    fixture.detectChanges();
  });

  it('should expose a semantic form and accessible patient search', () => {
    fixture.componentRef.setInput('initialPatientId', null);
    fixture.componentRef.setInput('initialPatientName', null);
    fixture.detectChanges();

    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    const input = fixture.nativeElement.querySelector('#patient-search') as HTMLInputElement;
    expect(form).not.toBeNull();
    expect(input.getAttribute('aria-required')).toBe('true');
    expect(input.getAttribute('aria-controls')).toBe('patient-results');
  });

  it('should initialize with initial patient and 1 default procedure with instant total', () => {
    expect(component.items().length).toBe(1);
    expect(component.totals().net).toBe(90000);
    expect(fixture.nativeElement.textContent).toContain('Carlos Pérez');
    expect(fixture.nativeElement.textContent).toContain('90.000');
  });

  it('should update totals in real-time when adding a procedure', () => {
    component.addItem();
    fixture.detectChanges();

    expect(component.items().length).toBe(2);
    // 90000 + 90000 = 180000
    expect(component.totals().net).toBe(180000);
    expect(fixture.nativeElement.textContent).toContain('180.000');
  });

  it('should update totals in real-time when updating an item price and discount', () => {
    component.updateItem(0, {
      id: component.items()[0].id,
      toothNumber: 16,
      procedureId: 'proc-resina',
      procedureName: 'Resina',
      priceCop: 150000,
      discountCop: 25000,
    });
    fixture.detectChanges();

    expect(component.totals().gross).toBe(150000);
    expect(component.totals().discount).toBe(25000);
    expect(component.totals().net).toBe(125000);
  });

  it('should remove an item and update totals in real-time', () => {
    component.addItem();
    expect(component.items().length).toBe(2);

    component.removeItem(0);
    fixture.detectChanges();

    expect(component.items().length).toBe(1);
    expect(component.totals().net).toBe(90000);
  });

  it('should invalidate form and block submit when discount exceeds price', () => {
    component.updateItem(0, {
      id: component.items()[0].id,
      toothNumber: null,
      procedureId: 'proc-profilaxis',
      procedureName: 'Profilaxis',
      priceCop: 50000,
      discountCop: 80000,
    });
    fixture.detectChanges();

    expect(component.hasDiscountError()).toBe(true);
    expect(component.isValid()).toBe(false);
  });

  it('should submit plan and emit saved on success', () => {
    plansService = TestBed.inject(TreatmentPlansService);
    const saveSpy = vi.spyOn(component.saved, 'emit');

    component.diagnosis.set('Rehabilitación completa');
    component.submitPlan();

    expect(plansService.createTreatmentPlan).toHaveBeenCalledWith({
      patientId: 'patient-123',
      professionalId: undefined,
      diagnosis: 'Rehabilitación completa',
      items: [
        {
          toothNumber: undefined,
          priceCop: 90000,
          discountCop: 0,
        },
      ],
    });
    expect(saveSpy).toHaveBeenCalledWith(MOCK_CREATED);
    expect(TestBed.inject(ToastService).success).toHaveBeenCalledWith(
      'Plan de tratamiento creado correctamente en estado borrador.',
    );
  });
});
