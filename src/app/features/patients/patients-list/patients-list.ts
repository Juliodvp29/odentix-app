import { Component, inject } from '@angular/core';
import { PatientsService } from '@features/patients/patients.service';
import { Table } from '@shared/table/table';
import { TableColumn, TableQuery } from '@shared/table/table-models';

@Component({
  selector: 'app-patients-list',
  imports: [Table],
  templateUrl: './patients-list.html',
})
export class PatientsListPage {
  private readonly patients = inject(PatientsService);

  readonly columns: ReadonlyArray<TableColumn> = [
    {
      key: 'name',
      header: 'Nombre',
      sortable: true,
      accessor: (row) =>
        `${String(row['firstName'] ?? '')} ${String(row['lastName'] ?? '')}`.trim(),
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

  onQueryChange(query: TableQuery): void {
    this.patients.updateQuery(query);
  }
}
