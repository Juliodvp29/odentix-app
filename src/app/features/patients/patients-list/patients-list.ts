import { Component, TemplateRef, inject, signal, viewChild } from '@angular/core';
import { ModalHandle, ModalService } from '@shared/modal/modal.service';
import { PatientResponse, PatientsService } from '@features/patients/patients.service';
import { Button } from '@shared/button/button';
import { CellDef } from '@shared/table/cell-def';
import { Icon } from '@shared/icon/icon';
import { IconButton } from '@shared/icon-button/icon-button';
import { Link } from '@shared/link/link';
import { Table } from '@shared/table/table';
import { TableColumn, TableQuery, TableRow } from '@shared/table/table-models';
import { ToastService } from '@shared/toast/toast.service';
import { PatientForm } from '@features/patients/patient-form/patient-form';

@Component({
  selector: 'app-patients-list',
  imports: [Button, CellDef, Icon, IconButton, Link, PatientForm, Table],
  templateUrl: './patients-list.html',
})
export class PatientsListPage {
  private readonly patients = inject(PatientsService);
  private readonly modals = inject(ModalService);
  private readonly notifications = inject(ToastService);
  private readonly dialogTemplate = viewChild('patientDialog', { read: TemplateRef });
  private dialogHandle: ModalHandle | null = null;

  readonly columns: ReadonlyArray<TableColumn> = [
    {
      key: 'name',
      header: 'Nombre',
      sortable: true,
      accessor: (row) => this.displayName(row),
    },
    {
      key: 'document',
      header: 'Documento',
      sortable: true,
      accessor: (row) =>
        [row['documentType'], row['documentNumber']].filter(Boolean).join(' ').toString(),
    },
    { key: 'phone', header: 'Teléfono' },
    {
      key: 'status',
      header: 'Estado',
      type: 'status',
      statusTones: { Activo: 'success', Inactivo: 'danger' },
      accessor: (row) => (row['active'] === false ? 'Inactivo' : 'Activo'),
    },
  ];

  readonly query = this.patients.query;
  readonly rows = this.patients.rows;
  readonly total = this.patients.total;
  readonly loading = this.patients.loading;
  readonly editingPatient = signal<PatientResponse | null>(null);

  onQueryChange(query: TableQuery): void {
    this.patients.updateQuery(query);
  }

  displayName(row: TableRow): string {
    return `${String(row['firstName'] ?? '')} ${String(row['lastName'] ?? '')}`.trim();
  }

  openCreate(): void {
    this.editingPatient.set(null);
    this.openDialog('Nuevo paciente');
  }

  openEdit(row: TableRow): void {
    this.editingPatient.set(row as PatientResponse);
    this.openDialog('Editar paciente');
  }

  private openDialog(title: string): void {
    const template = this.dialogTemplate();
    if (template) {
      this.dialogHandle = this.modals.open(template, { title });
    }
  }

  onSaved(): void {
    const editing = this.editingPatient() !== null;
    this.dialogHandle?.close();
    this.dialogHandle = null;
    this.patients.reload();
    this.notifications.success(editing ? 'Paciente actualizado' : 'Paciente creado');
  }

  onCancelled(): void {
    this.dialogHandle?.close();
    this.dialogHandle = null;
  }
}
