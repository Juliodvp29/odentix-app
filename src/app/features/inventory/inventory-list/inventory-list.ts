import { Component, TemplateRef, computed, inject, signal, viewChild } from '@angular/core';
import { Button } from '@shared/button/button';
import { Icon } from '@shared/icon/icon';
import { Table } from '@shared/table/table';
import {
  TableColumn,
  TableQuery,
  TableRow,
  createInitialQuery,
} from '@shared/table/table-models';
import { ModalHandle, ModalService } from '@shared/modal/modal.service';
import { ToastService } from '@shared/toast/toast.service';
import { InventoryItemResponse, isCriticalItem, stockLabel } from '../inventory-models';
import { InventoryService, isPlanGateError } from '../inventory.service';
import { InventoryItemForm } from '../inventory-item-form/inventory-item-form';
import { StockMovementForm } from '../stock-movement-form/stock-movement-form';

@Component({
  selector: 'app-inventory-list',
  imports: [Button, Icon, InventoryItemForm, StockMovementForm, Table],
  templateUrl: './inventory-list.html',
  host: { class: 'block' },
})
export class InventoryListPage {
  private readonly inventory = inject(InventoryService);
  private readonly modals = inject(ModalService);
  private readonly toasts = inject(ToastService);
  private readonly createTemplate = viewChild.required<TemplateRef<unknown>>('createTemplate');
  private readonly movementTemplate =
    viewChild.required<TemplateRef<unknown>>('movementTemplate');
  private createDialog: ModalHandle | null = null;
  private movementDialog: ModalHandle | null = null;

  private readonly resource = this.inventory.items();

  readonly query = signal<TableQuery>(createInitialQuery(20));
  readonly rows = computed<TableRow[]>(() => this.resource.value() ?? []);
  readonly total = computed(() => this.rows().length);
  readonly loading = computed(() => this.resource.isLoading());
  readonly planGated = computed(() => isPlanGateError(this.resource.error()));
  readonly loadError = computed(
    () => !this.planGated() && this.resource.error() !== undefined,
  );

  readonly selectedItem = signal<InventoryItemResponse | null>(null);

  readonly columns: ReadonlyArray<TableColumn> = [
    {
      key: 'name',
      header: 'Insumo',
      accessor: (row) => this.item(row).name || 'Sin nombre',
    },
    {
      key: 'unit',
      header: 'Unidad',
      accessor: (row) => this.item(row).unit || '—',
    },
    {
      key: 'stock',
      header: 'Stock',
      sortable: true,
      accessor: (row) => stockLabel(this.item(row)),
    },
    {
      key: 'threshold',
      header: 'Umbral',
      accessor: (row) => String(this.item(row).minThreshold ?? 0),
    },
    {
      key: 'status',
      header: 'Estado',
      type: 'status',
      statusTones: {
        'Bajo stock': 'warning',
        Disponible: 'teal',
      },
      accessor: (row) => this.statusLabel(this.item(row)),
    },
  ];

  item(row: TableRow): InventoryItemResponse {
    return row as InventoryItemResponse;
  }

  statusLabel(item: InventoryItemResponse): string {
    return isCriticalItem(item) ? 'Bajo stock' : 'Disponible';
  }

  onQueryChange(query: TableQuery): void {
    this.query.set(query);
  }

  retry(): void {
    this.resource.reload();
  }

  openCreate(): void {
    this.createDialog = this.modals.open(this.createTemplate(), {
      title: 'Nuevo insumo',
    });
  }

  openMovement(item: InventoryItemResponse): void {
    this.selectedItem.set(item);
    this.movementDialog = this.modals.open(this.movementTemplate(), {
      title: `Movimiento — ${item.name || 'insumo'}`,
    });
  }

  onItemSaved(): void {
    this.createDialog?.close();
    this.createDialog = null;
    this.toasts.success('Insumo creado.');
    this.resource.reload();
  }

  onItemCancelled(): void {
    this.createDialog?.close();
    this.createDialog = null;
  }

  onMovementSaved(): void {
    this.movementDialog?.close();
    this.movementDialog = null;
    this.selectedItem.set(null);
    this.toasts.success('Movimiento registrado.');
    this.resource.reload();
  }

  onMovementCancelled(): void {
    this.movementDialog?.close();
    this.movementDialog = null;
    this.selectedItem.set(null);
  }
}
