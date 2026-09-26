import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { ApiClient } from '@core/api/api-client';
import { InvoiceResponse, PaymentResponse } from './billing-models';
import { InvoicesService } from './invoices.service';

const MOCK_INVOICE: InvoiceResponse = {
  id: 'inv-1',
  patientId: 'patient-456',
  treatmentPlanId: 'plan-123',
  invoiceNumber: 'FAC-000001',
  status: 'pendiente',
  subtotalCop: 540000,
  discountCop: 20000,
  totalCop: 520000,
  items: [
    {
      id: 'i-1',
      description: 'Tratamiento pieza 16',
      quantity: 1,
      unitPriceCop: 400000,
      totalCop: 400000,
    },
  ],
};

describe('InvoicesService', () => {
  let service: InvoicesService;
  let api: ApiClient;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        InvoicesService,
        {
          provide: ApiClient,
          useValue: {
            url: (path: string) => `http://localhost:8081${path}`,
            get: vi.fn(),
            post: vi.fn(),
          },
        },
      ],
    });
    service = TestBed.inject(InvoicesService);
    api = TestBed.inject(ApiClient);
  });

  it('should post an invoice from a treatment plan with an explicit discount', async () => {
    vi.spyOn(api, 'post').mockReturnValue(of(MOCK_INVOICE));

    let result: InvoiceResponse | undefined;
    service.createInvoice('plan-123', 20000).subscribe((res) => {
      result = res;
    });

    expect(api.post).toHaveBeenCalledWith('/api/v1/invoices', {
      treatmentPlanId: 'plan-123',
      discountCop: 20000,
    });
    expect(result).toEqual(MOCK_INVOICE);
  });

  it('should omit the discount when it is not provided', async () => {
    vi.spyOn(api, 'post').mockReturnValue(of(MOCK_INVOICE));

    service.createInvoice('plan-123').subscribe();

    expect(api.post).toHaveBeenCalledWith('/api/v1/invoices', { treatmentPlanId: 'plan-123' });
  });

  it('should get a single invoice by ID', async () => {
    vi.spyOn(api, 'get').mockReturnValue(of(MOCK_INVOICE));

    let result: InvoiceResponse | undefined;
    service.getInvoice('inv-1').subscribe((res) => {
      result = res;
    });

    expect(api.get).toHaveBeenCalledWith('/api/v1/invoices/inv-1');
    expect(result).toEqual(MOCK_INVOICE);
  });

  it('should post a payment against an invoice', async () => {
    const payment: PaymentResponse = {
      id: 'pay-1',
      invoiceId: 'inv-1',
      amountCop: 520000,
      method: 'efectivo',
      invoiceStatus: 'pagada',
    };
    vi.spyOn(api, 'post').mockReturnValue(of(payment));

    let result: PaymentResponse | undefined;
    service
      .registerPayment('inv-1', { amountCop: 520000, method: 'efectivo' })
      .subscribe((res) => {
        result = res;
      });

    expect(api.post).toHaveBeenCalledWith('/api/v1/invoices/inv-1/payments', {
      amountCop: 520000,
      method: 'efectivo',
    });
    expect(result?.invoiceStatus).toBe('pagada');
  });
});
