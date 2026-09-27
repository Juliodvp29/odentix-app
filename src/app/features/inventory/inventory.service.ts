import { HttpErrorResponse, HttpResourceRef, httpResource } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from '@core/api/api-client';
import {
  CreateInventoryItemRequest,
  CreateStockMovementRequest,
  InventoryItemResponse,
  StockMovementResponse,
} from './inventory-models';

// A gated tenant surfaces as 403 (explained in the UI, never a dead end).
export function isPlanGateError(error: unknown): boolean {
  return error instanceof HttpErrorResponse && error.status === 403;
}

@Injectable({ providedIn: 'root' })
export class InventoryService {
  private readonly api = inject(ApiClient);

  // Reactive resource for the tenant's items with current stock.
  items(): HttpResourceRef<InventoryItemResponse[] | undefined> {
    return httpResource<InventoryItemResponse[]>(() => ({
      url: this.api.url('/api/v1/inventory/items'),
    }));
  }

  // Creates an item; stock always starts at zero.
  createItem(body: CreateInventoryItemRequest): Observable<InventoryItemResponse> {
    return this.api.post<CreateInventoryItemRequest, InventoryItemResponse>(
      '/api/v1/inventory/items',
      body,
    );
  }

  // Registers a stock entry (positive delta) or withdrawal (negative).
  registerMovement(
    itemId: string,
    body: CreateStockMovementRequest,
  ): Observable<StockMovementResponse> {
    return this.api.post<CreateStockMovementRequest, StockMovementResponse>(
      `/api/v1/inventory/items/${itemId}/movements`,
      body,
    );
  }
}
