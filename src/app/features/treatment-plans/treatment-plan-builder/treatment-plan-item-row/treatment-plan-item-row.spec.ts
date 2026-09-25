import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import { TreatmentPlanItemDraft, TreatmentPlanItemRow } from './treatment-plan-item-row';

const DRAFT_ITEM: TreatmentPlanItemDraft = {
  id: 'draft-1',
  toothNumber: 16,
  procedureId: 'proc-resina',
  procedureName: 'Restauración en resina compuesta',
  priceCop: 130000,
  discountCop: 10000,
};

describe('TreatmentPlanItemRow', () => {
  let fixture: ComponentFixture<TreatmentPlanItemRow>;
  let component: TreatmentPlanItemRow;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TreatmentPlanItemRow],
    }).compileComponents();

    fixture = TestBed.createComponent(TreatmentPlanItemRow);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('item', DRAFT_ITEM);
    fixture.componentRef.setInput('index', 0);
    fixture.componentRef.setInput('canRemove', true);
    fixture.detectChanges();
  });

  it('should render tooth, procedure, and live net price', () => {
    expect(fixture.nativeElement.textContent).toContain('120.000');
  });

  it('should emit updated price and calculate net correctly', () => {
    const emitSpy = vi.spyOn(component.itemChange, 'emit');
    const priceInput = fixture.nativeElement.querySelector(
      'input[type="number"][placeholder="Precio"]',
    ) as HTMLInputElement;

    priceInput.value = '200000';
    priceInput.dispatchEvent(new Event('input'));

    expect(emitSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        priceCop: 200000,
      }),
    );
  });

  it('should emit updated discount and flag error when discount exceeds price', () => {
    fixture.componentRef.setInput('item', {
      ...DRAFT_ITEM,
      priceCop: 50000,
      discountCop: 60000,
    });
    fixture.detectChanges();

    const error = fixture.nativeElement.querySelector('[data-testid="discount-error"]');
    const discount = fixture.nativeElement.querySelector(
      'input[placeholder="0"]',
    ) as HTMLInputElement;
    expect(error).not.toBeNull();
    expect(discount.getAttribute('aria-invalid')).toBe('true');
    expect(discount.getAttribute('aria-describedby')).toBe('discount-error-draft-1');
    expect(error.textContent).toContain('El descuento no puede superar el precio base');
  });

  it('should emit remove event when trash button is clicked', () => {
    const removeSpy = vi.spyOn(component.remove, 'emit');
    const button = fixture.nativeElement.querySelector(
      'button[aria-label="Eliminar procedimiento"]',
    ) as HTMLButtonElement;
    button.click();

    expect(removeSpy).toHaveBeenCalled();
  });

  it('should emit updated tooth and procedure when selecting from dropdowns', () => {
    const emitSpy = vi.spyOn(component.itemChange, 'emit');
    component.onToothSelect('21');
    expect(emitSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        toothNumber: 21,
      }),
    );

    component.onProcedureSelect('proc-implante');
    expect(emitSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        procedureId: 'proc-implante',
        priceCop: 2200000,
      }),
    );
  });

  it('should step price up and down via stepper buttons', () => {
    const emitSpy = vi.spyOn(component.itemChange, 'emit');
    const increaseBtn = fixture.nativeElement.querySelector(
      'button[aria-label="Aumentar precio"]',
    ) as HTMLButtonElement;
    const decreaseBtn = fixture.nativeElement.querySelector(
      'button[aria-label="Disminuir precio"]',
    ) as HTMLButtonElement;

    increaseBtn.click();
    expect(emitSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        priceCop: 131000,
      }),
    );

    decreaseBtn.click();
    expect(emitSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        priceCop: 129000,
      }),
    );
  });

  it('should step discount up and down via stepper buttons without going below zero', () => {
    const emitSpy = vi.spyOn(component.itemChange, 'emit');
    const increaseBtn = fixture.nativeElement.querySelector(
      'button[aria-label="Aumentar descuento"]',
    ) as HTMLButtonElement;
    const decreaseBtn = fixture.nativeElement.querySelector(
      'button[aria-label="Disminuir descuento"]',
    ) as HTMLButtonElement;

    increaseBtn.click();
    expect(emitSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        discountCop: 11000,
      }),
    );

    decreaseBtn.click();
    expect(emitSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        discountCop: 9000,
      }),
    );

    // Test clamped to 0
    fixture.componentRef.setInput('item', {
      ...DRAFT_ITEM,
      discountCop: 500,
    });
    fixture.detectChanges();

    decreaseBtn.click();
    expect(emitSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        discountCop: 0,
      }),
    );
  });
});
