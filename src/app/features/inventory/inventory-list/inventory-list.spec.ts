import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { describe, expect, it, vi } from 'vitest';
import { InventoryItemResponse } from '../inventory-models';
import { InventoryService } from '../inventory.service';
import { InventoryListPage } from './inventory-list';

const ITEMS: InventoryItemResponse[] = [
  { id: 'item-1', name: 'Guantes de nitrilo', unit: 'cajas', quantity: 3, minThreshold: 5 },
  { id: 'item-2', name: 'Resina A2', unit: 'jeringas', quantity: 12, minThreshold: 5 },
];

describe('InventoryListPage', () => {
  let fixture: ComponentFixture<InventoryListPage>;
  let reload: ReturnType<typeof vi.fn>;

  function setup(
    items: InventoryItemResponse[] | null = ITEMS,
    loading = false,
    error: unknown = undefined,
  ) {
    const mockResource = {
      value: signal(items),
      isLoading: signal(loading),
      error: signal(error),
      reload: vi.fn(),
    };
    reload = mockResource.reload;

    TestBed.configureTestingModule({
      imports: [InventoryListPage],
      providers: [
        {
          provide: InventoryService,
          useValue: {
            items: () => mockResource,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(InventoryListPage);
    fixture.detectChanges();
  }

  afterEach(() => {
    document.querySelectorAll('.cdk-overlay-container').forEach((element) => element.remove());
    document.documentElement.classList.remove('cdk-global-scrollblock');
  });

  it('should render items with stock and flag the critical one', () => {
    setup();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Guantes de nitrilo');
    expect(text).toContain('3 cajas');
    expect(text).toContain('Resina A2');
    expect(text).toContain('Bajo stock');
    expect(text).toContain('Disponible');
  });

  it('should render an empty state without items', () => {
    setup([]);
    expect(fixture.nativeElement.textContent).toContain('No hay insumos para mostrar');
  });

  it('should explain plan gating instead of failing', () => {
    setup(null, false, new HttpErrorResponse({ status: 403 }));
    expect(fixture.nativeElement.textContent).toContain(
      'El inventario no está incluido en tu plan',
    );
  });

  it('should retry on other errors', () => {
    setup(null, false, new Error('fail'));
    expect(fixture.nativeElement.textContent).toContain('No pudimos cargar el inventario.');
    const buttons = Array.from(
      fixture.nativeElement.querySelectorAll('button'),
    ) as HTMLButtonElement[];
    const retry = buttons.find((button) => button.textContent?.includes('Reintentar'));
    expect(retry).toBeTruthy();
    retry?.click();
    expect(reload).toHaveBeenCalled();
  });

  it('should open the movement modal for a row', () => {
    setup();
    const buttons = Array.from(
      fixture.nativeElement.querySelectorAll('button'),
    ) as HTMLButtonElement[];
    const movement = buttons.find((button) => button.textContent?.includes('Movimiento'));
    expect(movement).toBeTruthy();
    movement?.click();
    fixture.detectChanges();
    expect(document.querySelector('.cdk-overlay-pane')?.textContent).toContain(
      'Guantes de nitrilo',
    );
  });

  it('should open the creation modal from the header', () => {
    setup();
    const buttons = Array.from(
      fixture.nativeElement.querySelectorAll('button'),
    ) as HTMLButtonElement[];
    const create = buttons.find((button) => button.textContent?.includes('Nuevo insumo'));
    expect(create).toBeTruthy();
    create?.click();
    fixture.detectChanges();
    expect(document.querySelector('.cdk-overlay-pane')?.textContent).toContain(
      'El stock nace en cero',
    );
  });
});
