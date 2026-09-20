import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { TableColumn, TableRow, resolveCellValue } from './table-models';

@Injectable({ providedIn: 'root' })
export class TableExportService {
  private readonly document = inject(DOCUMENT);

  async exportToXlsx(
    columns: ReadonlyArray<TableColumn>,
    rows: ReadonlyArray<TableRow>,
    filename: string,
  ): Promise<Blob> {
    const XLSX = await import('xlsx');
    const sheetData: Array<Array<string>> = [
      columns.map((column) => column.header),
      ...rows.map((row) => columns.map((column) => resolveCellValue(column, row))),
    ];
    const sheet = XLSX.utils.aoa_to_sheet(sheetData);
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, 'Sheet1');
    const buffer = XLSX.write(book, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer;
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const anchor = this.document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
    return blob;
  }
}
