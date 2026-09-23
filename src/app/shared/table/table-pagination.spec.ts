import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TablePagination } from './table-pagination';

describe('TablePagination', () => {
  let fixture: ComponentFixture<TablePagination>;

  const buttons = (): Array<HTMLButtonElement> =>
    Array.from(fixture.nativeElement.querySelectorAll('button')) as Array<HTMLButtonElement>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TablePagination],
    }).compileComponents();
    fixture = TestBed.createComponent(TablePagination);
    fixture.componentRef.setInput('page', 2);
    fixture.componentRef.setInput('pageSize', 10);
    fixture.componentRef.setInput('total', 35);
    fixture.detectChanges();
  });

  it('should describe the visible range', () => {
    expect(fixture.nativeElement.textContent).toContain('11–20 de 35');
  });

  it('should emit the previous page', () => {
    let emitted = 0;
    fixture.componentInstance.pageChange.subscribe((page) => (emitted = page));
    buttons()
      .find((button) => button.textContent?.includes('Anterior'))
      ?.click();
    expect(emitted).toBe(1);
  });

  it('should emit the next page', () => {
    let emitted = 0;
    fixture.componentInstance.pageChange.subscribe((page) => (emitted = page));
    buttons()
      .find((button) => button.textContent?.includes('Siguiente'))
      ?.click();
    expect(emitted).toBe(3);
  });

  it('should disable previous on the first page', () => {
    let emitted = 0;
    fixture.componentInstance.pageChange.subscribe(() => emitted++);
    fixture.componentRef.setInput('page', 1);
    fixture.detectChanges();
    const previous = buttons().find((button) => button.textContent?.includes('Anterior'));
    expect(previous?.disabled).toBe(true);
    previous?.click();
    expect(emitted).toBe(0);
  });

  it('should emit the new page size', () => {
    let emitted = 0;
    fixture.componentInstance.pageSizeChange.subscribe((size) => (emitted = size));
    const select = fixture.nativeElement.querySelector('select') as HTMLSelectElement;
    select.value = '20';
    select.dispatchEvent(new Event('change', { bubbles: true }));
    expect(emitted).toBe(20);
  });
});
