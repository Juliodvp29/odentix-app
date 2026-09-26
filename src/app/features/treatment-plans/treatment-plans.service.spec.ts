import { HttpParams } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { ApiClient } from '@core/api/api-client';
import {
  CreateTreatmentPlanRequest,
  TreatmentPlanResponse,
  UpdateTreatmentPlanRequest,
} from './treatment-plan-models';
import { TreatmentPlansService } from './treatment-plans.service';

const MOCK_PLAN: TreatmentPlanResponse = {
  id: 'plan-123',
  patientId: 'patient-456',
  patientFullName: 'Carlos Pérez',
  diagnosis: 'Rehabilitación oral',
  status: 'borrador',
  totalPriceCop: 380000,
  items: [
    {
      id: 'item-1',
      procedureId: 'proc-1',
      toothNumber: 16,
      priceCop: 400000,
      discountCop: 20000,
      netPriceCop: 380000,
    },
  ],
};

describe('TreatmentPlansService', () => {
  let service: TreatmentPlansService;
  let api: ApiClient;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TreatmentPlansService,
        {
          provide: ApiClient,
          useValue: {
            url: (path: string) => `http://localhost:8081${path}`,
            get: vi.fn(),
            post: vi.fn(),
            patch: vi.fn(),
          },
        },
      ],
    });
    service = TestBed.inject(TreatmentPlansService);
    api = TestBed.inject(ApiClient);
  });

  it('should list treatment plans with filters', async () => {
    vi.spyOn(api, 'get').mockReturnValue(of([MOCK_PLAN]));

    let result: TreatmentPlanResponse[] = [];
    service.listTreatmentPlans('patient-456', 'borrador').subscribe((res) => {
      result = res;
    });

    expect(api.get).toHaveBeenCalledWith('/api/v1/treatment-plans', expect.any(HttpParams));
    expect(result).toEqual([MOCK_PLAN]);
  });

  it('should get a single treatment plan by ID', async () => {
    vi.spyOn(api, 'get').mockReturnValue(of(MOCK_PLAN));

    let result: TreatmentPlanResponse | undefined;
    service.getTreatmentPlan('plan-123').subscribe((res) => {
      result = res;
    });

    expect(api.get).toHaveBeenCalledWith('/api/v1/treatment-plans/plan-123');
    expect(result).toEqual(MOCK_PLAN);
  });

  it('should post a new treatment plan', async () => {
    const request: CreateTreatmentPlanRequest = {
      patientId: 'patient-456',
      diagnosis: 'Rehabilitación oral',
      items: [{ toothNumber: 16, priceCop: 400000, discountCop: 20000 }],
    };
    vi.spyOn(api, 'post').mockReturnValue(of(MOCK_PLAN));

    let result: TreatmentPlanResponse | undefined;
    service.createTreatmentPlan(request).subscribe((res) => {
      result = res;
    });

    expect(api.post).toHaveBeenCalledWith('/api/v1/treatment-plans', request);
    expect(result).toEqual(MOCK_PLAN);
  });

  it('should patch an existing draft treatment plan', async () => {
    const updateReq: UpdateTreatmentPlanRequest = {
      diagnosis: 'Nuevo diagnóstico',
      items: [{ toothNumber: 16, priceCop: 350000 }],
    };
    vi.spyOn(api, 'patch').mockReturnValue(of({ ...MOCK_PLAN, diagnosis: 'Nuevo diagnóstico' }));

    let result: TreatmentPlanResponse | undefined;
    service.updateTreatmentPlan('plan-123', updateReq).subscribe((res) => {
      result = res;
    });

    expect(api.patch).toHaveBeenCalledWith('/api/v1/treatment-plans/plan-123', updateReq);
    expect(result?.diagnosis).toBe('Nuevo diagnóstico');
  });

  it('should patch the plan status through the status endpoint', async () => {
    vi.spyOn(api, 'patch').mockReturnValue(of({ ...MOCK_PLAN, status: 'presentado' }));

    let result: TreatmentPlanResponse | undefined;
    service.updateStatus('plan-123', 'presentado').subscribe((res) => {
      result = res;
    });

    expect(api.patch).toHaveBeenCalledWith('/api/v1/treatment-plans/plan-123/status', {
      status: 'presentado',
    });
    expect(result?.status).toBe('presentado');
  });
});
