import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { InventoryItemResponse } from '../inventory-models';
import { StockMovementForm } from './stock-movement-form';

const ITEM: InventoryItemResponse = {
  id: 'item-1',
  name: 'Guantes de nitrilo',
  unit: 'cajas',
  quantity: 12,
  minThreshold: 5,
};

function setQuantity(fixture: ComponentFixture<StockMovementForm>, value: string): void {
  const input = fixture.nativeElement.querySelector('#movement-quantity') as HTMLInputElement;
  input.value = value;
  input.dispatchEvent(new Event('input'));
  fixture.detectChanges();
}

function submit(fixture: ComponentFixture<StockMovementForm>): void {
  fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
  fixture.detectChanges();
}

describe('StockMovementForm', () => {
  let fixture: ComponentFixture<StockMovementForm>;
  let httpTesting: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StockMovementForm],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    fixture = TestBed.createComponent(StockMovementForm);
    fixture.componentRef.setInput('item', ITEM);
    fixture.detectChanges();
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should show the item with its current stock', () => {
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Guantes de nitrilo');
    expect(text).toContain('12');
  });

  it('should block a zero quantity without posting', () => {
    setQuantity(fixture, '0');
    submit(fixture);
    httpTesting.expectNone((call) => call.url.includes('/movements'));
    expect(fixture.nativeElement.textContent).toContain('La cantidad debe ser al menos 1.');
  });

  it('should block a withdrawal above the stock without posting', () => {
    fixture.componentInstance.model.update((model) => ({ ...model, kind: 'out' }));
    fixture.detectChanges();
    setQuantity(fixture, '20');
    submit(fixture);
    httpTesting.expectNone((call) => call.url.includes('/movements'));
    expect(fixture.nativeElement.textContent).toContain(
      'La salida supera el stock disponible (12).',
    );
  });

  it('should POST a negative delta for withdrawals and emit on success', async () => {
    let moved = false;
    fixture.componentInstance.moved.subscribe(() => {
      moved = true;
    });
    fixture.componentInstance.model.update((model) => ({
      ...model,
      kind: 'out',
      reason: 'Uso en consulta',
    }));
    fixture.detectChanges();
    setQuantity(fixture, '2');
    submit(fixture);
    const request = httpTesting.expectOne((call) =>
      call.url.endsWith('/api/v1/inventory/items/item-1/movements'),
    );
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ quantityDelta: -2, reason: 'Uso en consulta' });
    request.flush({ id: 'mov-1', quantityDelta: -2 });
    await fixture.whenStable();
    fixture.detectChanges();
    expect(moved).toBe(true);
  });

  it('should surface the backend message when the movement is rejected', async () => {
    setQuantity(fixture, '3');
    submit(fixture);
    const request = httpTesting.expectOne((call) => call.url.endsWith('/movements'));
    request.flush(
      { message: 'El consumo dejaría el inventario en negativo' },
      { status: 409, statusText: 'Conflict' },
    );
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain(
      'El consumo dejaría el inventario en negativo',
    );
  });
});
