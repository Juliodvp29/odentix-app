import { Component, TemplateRef, inject, viewChild } from '@angular/core';
import { Button } from '@shared/button/button';
import { CellDef } from '@shared/table/cell-def';
import { Link } from '@shared/link/link';
import { Table } from '@shared/table/table';
import { TableColumn, TableQuery, TableRow } from '@shared/table/table-models';
import { ModalHandle, ModalService } from '@shared/modal/modal.service';
import { ToastService } from '@shared/toast/toast.service';
import { WaitlistCreateDialog } from '../waitlist-create-dialog/waitlist-create-dialog';
import { WaitlistRowActions } from '../waitlist-row-actions/waitlist-row-actions';
import { WAITLIST_STATUS_OPTIONS, waitlistStatusMeta } from '../waitlist-status';
import { WaitlistEntryResponse, WaitlistService } from '../waitlist.service';

const availabilityFormatter = new Intl.DateTimeFormat('es-CO', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'America/Bogota',
});

@Component({
  selector: 'app-waitlist-list',
  imports: [Button, CellDef, Link, Table, WaitlistCreateDialog, WaitlistRowActions],
  templateUrl: './waitlist-list.html',
  host: { class: 'block' },
})
export class WaitlistListPage {
  private readonly waitlist = inject(WaitlistService);
  private readonly modals = inject(ModalService);
  private readonly toasts = inject(ToastService);
  private readonly createTemplate = viewChild.required<TemplateRef<unknown>>('createTemplate');
  private createDialog: ModalHandle | null = null;

  readonly columns: ReadonlyArray<TableColumn> = [
    {
      key: 'patient',
      header: 'Paciente',
      accessor: (row) => this.patientName(this.entry(row)),
    },
    {
      key: 'phone',
      header: 'Teléfono',
      accessor: (row) => this.entry(row).patientPhone || 'Sin teléfono',
    },
    {
      key: 'status',
      header: 'Estado',
      type: 'status',
      statusTones: {
        Activa: 'info',
        Contactado: 'success',
        Convertida: 'success',
        Descartada: 'danger',
      },
      filter: { kind: 'select', options: WAITLIST_STATUS_OPTIONS },
      accessor: (row) => this.statusLabel(this.entry(row)),
    },
    {
      key: 'availability',
      header: 'Disponibilidad',
      accessor: (row) => this.availability(this.entry(row)),
    },
    {
      key: 'createdAt',
      header: 'Creada',
      type: 'date',
      sortable: true,
      accessor: (row) => this.entry(row).createdAt ?? '',
    },
  ];

  readonly query = this.waitlist.query;
  readonly rows = this.waitlist.rows;
  readonly total = this.waitlist.total;
  readonly loading = this.waitlist.loading;
  readonly loadError = this.waitlist.loadError;

  constructor() {
    this.waitlist.reset();
    this.waitlist.reload();
  }

  onQueryChange(query: TableQuery): void {
    this.waitlist.updateQuery(query);
  }

  entry(row: TableRow): WaitlistEntryResponse {
    return row as WaitlistEntryResponse;
  }

  patientName(entry: WaitlistEntryResponse): string {
    return entry.patientName || 'Paciente sin nombre';
  }

  patientRoute(entry: WaitlistEntryResponse): string | null {
    return entry.patientId ? `/patients/${entry.patientId}` : null;
  }

  statusLabel(entry: WaitlistEntryResponse): string {
    return waitlistStatusMeta(entry).label;
  }

  availability(entry: WaitlistEntryResponse): string {
    const from = this.formatDate(entry.desiredFrom);
    const to = this.formatDate(entry.desiredTo);
    if (from && to) {
      return `${from} – ${to}`;
    }
    if (from) {
      return `Desde ${from}`;
    }
    if (to) {
      return `Hasta ${to}`;
    }
    return 'Cualquier horario';
  }

  retry(): void {
    this.waitlist.reload();
  }

  openCreate(): void {
    this.createDialog = this.modals.open(this.createTemplate(), {
      title: 'Nueva entrada en lista de espera',
    });
  }

  onEntryUpdated(): void {
    this.waitlist.reload();
  }

  onCreateSaved(): void {
    this.closeCreate();
    this.waitlist.reload();
    this.toasts.success('Entrada añadida a la lista de espera.');
  }

  onCreateCancelled(): void {
    this.closeCreate();
  }

  private closeCreate(): void {
    this.createDialog?.close();
    this.createDialog = null;
  }

  private formatDate(value: string | undefined): string {
    if (!value) {
      return '';
    }
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '' : availabilityFormatter.format(date);
  }
}
