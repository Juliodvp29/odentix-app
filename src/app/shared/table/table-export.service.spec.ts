import { TestBed } from '@angular/core/testing';
import { TableExportService } from './table-export.service';
import { TableColumn, TableRow } from './table-models';

const columns: ReadonlyArray<TableColumn> = [
  { key: 'name', header: 'Name' },
  { key: 'role', header: 'Role' },
];

const rows: ReadonlyArray<TableRow> = [
  { name: 'Ada', role: 'Dentist' },
  { name: 'Luis', role: 'Reception' },
];

describe('TableExportService', () => {
  let service: TableExportService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TableExportService);
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:mock'),
      revokeObjectURL: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should generate a workbook with headers and rows', async () => {
    const blob = await service.exportToXlsx(columns, rows, 'team.xlsx');
    expect(blob.type).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    const XLSX = await import('xlsx');
    const book = XLSX.read(await blob.arrayBuffer());
    const sheet = book.Sheets[book.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json<Array<string>>(sheet, { header: 1 });
    expect(data).toEqual([
      ['Name', 'Role'],
      ['Ada', 'Dentist'],
      ['Luis', 'Reception'],
    ]);
  });
});
