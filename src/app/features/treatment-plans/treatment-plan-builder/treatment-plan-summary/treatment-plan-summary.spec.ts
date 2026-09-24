import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { TreatmentPlanSummary } from './treatment-plan-summary';

describe('TreatmentPlanSummary', () => {
  let fixture: ComponentFixture<TreatmentPlanSummary>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TreatmentPlanSummary],
    }).compileComponents();
    fixture = TestBed.createComponent(TreatmentPlanSummary);
  });

  it('should render gross, discount, and net totals correctly', () => {
    fixture.componentRef.setInput('totals', {
      gross: 500000,
      discount: 50000,
      net: 450000,
    });
    fixture.componentRef.setInput('itemsCount', 2);
    fixture.detectChanges();

    const gross = fixture.nativeElement.querySelector('[data-testid="summary-gross"]');
    const discount = fixture.nativeElement.querySelector('[data-testid="summary-discount"]');
    const net = fixture.nativeElement.querySelector('[data-testid="summary-net"]');
    const count = fixture.nativeElement.querySelector('[data-testid="summary-count"]');

    expect(gross.textContent).toContain('500.000');
    expect(discount.textContent).toContain('50.000');
    expect(net.textContent).toContain('450.000');
    expect(count.textContent).toContain('2 procedimientos');
  });
});
