import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { By } from '@angular/platform-browser';
import { describe, expect, it } from 'vitest';
import { LeadResponse, LeadStatus } from '../lead-models';
import { LeadStageSelect } from '../lead-stage-select/lead-stage-select';
import { LeadCard } from './lead-card';

const LEAD: LeadResponse = {
  id: 'lead-1',
  fullName: 'Ana Torres',
  source: 'Instagram',
  procedureOfInterest: 'Ortodoncia',
  estimatedValueCop: 2500000,
  status: 'nuevo',
  assignedToName: 'Carlos Pérez',
  lastContactAt: '2026-09-25T12:00:00Z',
};

describe('LeadCard', () => {
  let fixture: ComponentFixture<LeadCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeadCard],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(LeadCard);
    fixture.componentRef.setInput('lead', LEAD);
    fixture.detectChanges();
  });

  it('should render the lead summary with assignee and value', () => {
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Ana Torres');
    expect(text).toContain('Instagram');
    expect(text).toContain('Ortodoncia');
    expect(text).toContain('2.500.000');
    expect(text).toContain('CP');
    expect(text).toContain('Carlos Pérez');
  });

  it('should link to the lead detail', () => {
    const link = fixture.nativeElement.querySelector(
      'a[href="/leads/lead-1"]',
    ) as HTMLAnchorElement;
    expect(link).not.toBeNull();
  });

  it('should delegate stage moves to the shared selector', () => {
    const selector = fixture.debugElement.query(By.directive(LeadStageSelect));
    expect(selector).not.toBeNull();
    expect(selector.componentInstance.status()).toBe('nuevo');
    expect(fixture.nativeElement.textContent).toContain('Nuevo');
  });

  it('should re-emit moves reported by the selector', () => {
    let moved: { id: string; status: LeadStatus } | undefined;
    fixture.componentInstance.moved.subscribe((event) => {
      moved = event;
    });
    const selector = fixture.debugElement.query(By.directive(LeadStageSelect));
    selector.componentInstance.moved.emit({ id: 'lead-1', status: 'contactado' });
    expect(moved).toEqual({ id: 'lead-1', status: 'contactado' });
  });

  it('should flag converted leads with a patient link', () => {
    fixture.componentRef.setInput('lead', {
      ...LEAD,
      convertedPatientId: 'patient-9',
      convertedPatientName: 'Ana Torres',
    });
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Convertido');
    const link = fixture.nativeElement.querySelector(
      'a[href="/patients/patient-9"]',
    ) as HTMLAnchorElement;
    expect(link).not.toBeNull();
  });
});
