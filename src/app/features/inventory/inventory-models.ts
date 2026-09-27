import { components } from '@core/api/schema';

export type InventoryItemResponse = components['schemas']['InventoryItemResponse'];
export type CreateInventoryItemRequest = components['schemas']['CreateInventoryItemRequest'];
export type CreateStockMovementRequest = components['schemas']['CreateStockMovementRequest'];
export type StockMovementResponse = components['schemas']['StockMovementResponse'];

export type StockMovementKind = 'in' | 'out';

// A depleted item is actionable information, never an emergency:
// Warning badge per the design system, never Danger.
export function isCriticalItem(item: {
  quantity?: number | null;
  minThreshold?: number | null;
}): boolean {
  return Number(item.quantity ?? 0) <= Number(item.minThreshold ?? 0);
}

export function stockLabel(item: {
  quantity?: number | null;
  unit?: string | null;
}): string {
  const quantity = Number(item.quantity ?? 0);
  return item.unit ? `${quantity} ${item.unit}` : String(quantity);
}
