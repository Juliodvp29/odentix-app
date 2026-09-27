import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { InventoryItemForm } from './inventory-item-form';

function submit(fixture: ComponentFixture<InventoryItemForm>): void {
  fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
  fixture.detectChanges();
}

describe('InventoryItemForm', () => {
  let fixture: ComponentFixture<InventoryItemForm>;
  let httpTesting: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InventoryItemForm],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    fixture = TestBed.createComponent(InventoryItemForm);
    fixture.detectChanges();
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should require a name before posting', () => {
    submit(fixture);
    httpTesting.expectNone((call) => call.url.includes('/items'));
    expect(fixture.nativeElement.textContent).toContain('El nombre es obligatorio.');
  });

  it('should POST the item and emit on success', async () => {
    let saved = false;
    fixture.componentInstance.saved.subscribe(() => {
      saved = true;
    });
    fixture.componentInstance.model.update((model) => ({
      ...model,
      name: 'Guantes de nitrilo',
      unit: 'cajas',
      minThreshold: 5,
    }));
    fixture.detectChanges();
    submit(fixture);
    const request = httpTesting.expectOne((call) => call.url.endsWith('/api/v1/inventory/items'));
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      name: 'Guantes de nitrilo',
      unit: 'cajas',
      minThreshold: 5,
    });
    request.flush({ id: 'item-1', name: 'Guantes de nitrilo', quantity: 0 });
    await fixture.whenStable();
    fixture.detectChanges();
    expect(saved).toBe(true);
  });

  it('should surface the backend message on duplicate names', async () => {
    fixture.componentInstance.model.update((model) => ({ ...model, name: 'Guantes' }));
    fixture.detectChanges();
    submit(fixture);
    const request = httpTesting.expectOne((call) => call.url.endsWith('/items'));
    request.flush(
      { message: 'Ya existe un insumo con ese nombre' },
      { status: 409, statusText: 'Conflict' },
    );
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Ya existe un insumo con ese nombre');
  });
});
