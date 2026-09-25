import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { ToastService } from '@shared/toast/toast.service';
import { PatientsService } from '@features/patients/patients.service';
import { AppointmentsService } from '@features/appointments/appointments.service';
import { TreatmentPlansService } from '../treatment-plans.service';
import { TreatmentPlanBuilderPage } from './treatment-plan-builder-page';

describe('TreatmentPlanBuilderPage', () => {
  let fixture: ComponentFixture<TreatmentPlanBuilderPage>;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TreatmentPlanBuilderPage],
      providers: [
        {
          provide: Router,
          useValue: {
            navigate: vi.fn(),
          },
        },
        {
          provide: TreatmentPlansService,
          useValue: {
            createTreatmentPlan: vi.fn().mockReturnValue(of({ id: 'plan-123' })),
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
            professionalOptions: () => [],
          },
        },
        {
          provide: ToastService,
          useValue: { success: vi.fn() },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TreatmentPlanBuilderPage);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should navigate to plan detail when saved', () => {
    fixture.componentInstance.onSaved({ id: 'plan-999' });
    expect(router.navigate).toHaveBeenCalledWith(['/treatment-plans', 'plan-999']);
  });

  it('should navigate back to treatment-plans when cancelled', () => {
    fixture.componentInstance.onCancelled();
    expect(router.navigate).toHaveBeenCalledWith(['/treatment-plans']);
  });
});
