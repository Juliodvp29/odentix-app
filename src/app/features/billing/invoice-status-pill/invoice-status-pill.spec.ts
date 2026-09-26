import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { InvoiceStatusPill } from './invoice-status-pill';

describe('InvoiceStatusPill', () => {
  let fixture: ComponentFixture<InvoiceStatusPill>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InvoiceStatusPill],
    }).compileComponents();
    fixture = TestBed.createComponent(InvoiceStatusPill);
  });

  it('should render the correct label for pendiente', () => {
    fixture.componentRef.setInput('status', 'pendiente');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Pendiente');
    const pill = fixture.nativeElement.querySelector('[data-testid="status-pill"]');
    expect(pill.classList.contains('rounded-pill')).toBe(true);
    expect(pill.className).not.toContain('border');
  });

  it('should render the correct label for pagada', () => {
    fixture.componentRef.setInput('status', 'pagada');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Pagada');
  });

  it('should fallback to pendiente for unknown or null status', () => {
    fixture.componentRef.setInput('status', null);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Pendiente');
  });
});
