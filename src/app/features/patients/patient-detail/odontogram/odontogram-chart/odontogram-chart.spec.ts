import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OdontogramChart } from './odontogram-chart';
import { OdontogramEntry } from '../odontogram-model';

const ENTRIES: ReadonlyMap<number, ReadonlyArray<OdontogramEntry>> = new Map([
  [16, [{ id: 'entry-1', entryType: 'diagnostico', surface: 'oclusal', condition: 'Caries' }]],
  [36, [{ id: 'entry-2', entryType: 'diagnostico', condition: 'Pieza ausente' }]],
]);

describe('OdontogramChart', () => {
  let fixture: ComponentFixture<OdontogramChart>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OdontogramChart],
    }).compileComponents();
    fixture = TestBed.createComponent(OdontogramChart);
    fixture.componentRef.setInput('entriesByTooth', ENTRIES);
    fixture.detectChanges();
  });

  function toothButtons(): HTMLButtonElement[] {
    return Array.from(
      fixture.nativeElement.querySelectorAll('button[aria-label^="Pieza"]'),
    ) as HTMLButtonElement[];
  }

  it('should render all 32 teeth across quadrants', () => {
    expect(toothButtons()).toHaveLength(32);
    expect(fixture.nativeElement.textContent).toContain('Cuadrante 1 (18 - 11)');
    expect(fixture.nativeElement.textContent).toContain('Maxilar Inferior');
  });

  it('should emit the tooth on click', () => {
    const emitted: unknown[] = [];
    fixture.componentInstance.toothSelected.subscribe((selection) => emitted.push(selection));
    toothButtons()[2]?.click();
    expect(emitted).toEqual([{ tooth: 16, surface: null }]);
  });

  it('should emit the surface on polygon click', () => {
    const emitted: unknown[] = [];
    fixture.componentInstance.toothSelected.subscribe((selection) => emitted.push(selection));
    fixture.detectChanges();
    const polygons = fixture.nativeElement.querySelectorAll('polygon');
    (polygons[0] as SVGPolygonElement).dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(emitted).toEqual([{ tooth: 18, surface: 'vestibular' }]);
  });

  it('should move selection with arrow keys and focus the tooth', () => {
    const emitted: unknown[] = [];
    fixture.componentRef.setInput('selectedTooth', 18);
    fixture.componentInstance.toothSelected.subscribe((selection) => emitted.push(selection));
    fixture.detectChanges();
    toothButtons()[0]?.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }),
    );
    expect(emitted).toEqual([{ tooth: 17, surface: null }]);
    expect(document.activeElement?.getAttribute('aria-label')).toContain('Pieza 17');
  });

  it('should render a cross for missing teeth', () => {
    const lines = fixture.nativeElement.querySelectorAll('line');
    expect(lines.length).toBeGreaterThan(0);
  });

  it('should emit deselected from the header button', () => {
    let deselected = false;
    fixture.componentInstance.deselected.subscribe(() => (deselected = true));
    const button = Array.from(fixture.nativeElement.querySelectorAll('button')).find((element) =>
      (element as HTMLButtonElement).textContent?.includes('Deseleccionar'),
    ) as HTMLButtonElement;
    button.click();
    expect(deselected).toBe(true);
  });
});
