import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TableCell } from './table-cell';
import { TableColumn, TableRow } from './table-models';

describe('TableCell', () => {
  let fixture: ComponentFixture<TableCell>;

  const render = (column: TableColumn, row: TableRow): HTMLElement => {
    fixture.componentRef.setInput('column', column);
    fixture.componentRef.setInput('row', row);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TableCell],
    }).compileComponents();
    fixture = TestBed.createComponent(TableCell);
  });

  it('should render plain text by default', () => {
    const element = render({ key: 'name', header: 'Name' }, { name: 'Ada' });
    expect(element.textContent?.trim()).toBe('Ada');
  });

  it('should render a status badge with its tone', () => {
    const element = render(
      {
        key: 'status',
        header: 'Status',
        type: 'status',
        statusTones: { confirmed: 'success' },
      },
      { status: 'confirmed' },
    );
    const badge = element.querySelector('span') as HTMLElement;
    expect(badge.textContent?.trim()).toBe('confirmed');
    expect(badge.className).toContain('bg-success-soft');
    expect(badge.className).toContain('text-success-deep');
  });

  it('should render unknown statuses with the neutral tone', () => {
    const element = render({ key: 'status', header: 'Status', type: 'status' }, { status: '?' });
    const badge = element.querySelector('span') as HTMLElement;
    expect(badge.className).toContain('bg-surface-alt');
  });

  it('should render an avatar with initials', () => {
    const element = render({ key: 'name', header: 'Name', type: 'avatar' }, { name: 'Ada Luz' });
    const avatar = element.querySelector('span') as HTMLElement;
    expect(avatar.textContent?.trim()).toBe('AL');
    expect(avatar.getAttribute('title')).toBe('Ada Luz');
  });

  it('should render a formatted date', () => {
    const element = render(
      { key: 'joined', header: 'Joined', type: 'date' },
      { joined: '2026-01-12' },
    );
    expect(element.textContent).toContain('2026');
  });

  it('should render a currency amount', () => {
    const element = render(
      { key: 'salary', header: 'Salary', type: 'currency' },
      { salary: 1200000 },
    );
    expect(element.textContent).toContain('1.200.000');
  });
});
