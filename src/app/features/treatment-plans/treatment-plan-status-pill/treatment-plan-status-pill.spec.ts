import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { TreatmentPlanStatusPill } from './treatment-plan-status-pill';

describe('TreatmentPlanStatusPill', () => {
  let fixture: ComponentFixture<TreatmentPlanStatusPill>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TreatmentPlanStatusPill],
    }).compileComponents();
    fixture = TestBed.createComponent(TreatmentPlanStatusPill);
  });

  it('should render the correct label for borrador', () => {
    fixture.componentRef.setInput('status', 'borrador');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Borrador');
  });

  it('should render the correct label for aceptado', () => {
    fixture.componentRef.setInput('status', 'aceptado');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Aceptado');
  });

  it('should fallback to borrador for unknown or null status', () => {
    fixture.componentRef.setInput('status', null);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Borrador');
  });
});
