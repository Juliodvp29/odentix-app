import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { ApiClient } from '@core/api/api-client';
import { InventoryItemResponse } from './inventory-models';
import { InventoryService } from './inventory.service';

const MOCK_ITEM: InventoryItemResponse = {
  id: 'item-1',
  name: 'Guantes de nitrilo',
  unit: 'cajas',
  quantity: 12,
  minThreshold: 5,
};

describe('InventoryService', () => {
  let service: InventoryService;
  let api: ApiClient;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        InventoryService,
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
    service = TestBed.inject(InventoryService);
    api = TestBed.inject(ApiClient);
  });

  it('should post a new inventory item', async () => {
    vi.spyOn(api, 'post').mockReturnValue(of(MOCK_ITEM));

    let result: InventoryItemResponse | undefined;
    service
      .createItem({ name: 'Guantes de nitrilo', unit: 'cajas', minThreshold: 5 })
      .subscribe((res) => {
        result = res;
      });

    expect(api.post).toHaveBeenCalledWith('/api/v1/inventory/items', {
      name: 'Guantes de nitrilo',
      unit: 'cajas',
      minThreshold: 5,
    });
    expect(result).toEqual(MOCK_ITEM);
  });

  it('should post a stock movement against an item', async () => {
    vi.spyOn(api, 'post').mockReturnValue(of({ id: 'mov-1', quantityDelta: -2 }));

    service.registerMovement('item-1', { quantityDelta: -2, reason: 'Uso en consulta' }).subscribe();

    expect(api.post).toHaveBeenCalledWith('/api/v1/inventory/items/item-1/movements', {
      quantityDelta: -2,
      reason: 'Uso en consulta',
    });
  });
});
