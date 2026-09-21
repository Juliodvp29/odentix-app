import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OdontogramPanel } from './odontogram-panel';

const ENTRIES = [
  {
    id: 'entry-1',
    entryType: 'diagnostico',
    surface: 'oclusal',
    condition: 'Caries oclusal',
    notes: 'Profundidad media',
    recordedAt: '2026-09-21T10:00:00Z',
  },
  {
    id: 'entry-2',
    entryType: 'estado_actual',
    surface: 'vestibular',
    condition: 'Control rutinario',
  },
];

describe('OdontogramPanel', () => {
  let fixture: ComponentFixture<OdontogramPanel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OdontogramPanel],
    }).compileComponents();
    fixture = TestBed.createComponent(OdontogramPanel);
    fixture.componentRef.setInput('toothNumber', 16);
    fixture.componentRef.setInput('entries', ENTRIES);
    fixture.detectChanges();
  });

  it('should render the tooth header with status and affected surfaces', () => {
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Pieza 16');
    expect(text).toContain('Molar');
    expect(text).toContain('Requiere atención');
    expect(text).toContain('Vestibular, Oclusal');
    expect(text).toContain('2 entradas');
  });

  it('should list entries with type badges', () => {
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Diagnóstico');
    expect(text).toContain('Caries oclusal');
    expect(text).toContain('Estado actual');
    expect(text).toContain('Profundidad media');
  });

  it('should show an empty state that requests a first entry', () => {
    let requested = false;
    fixture.componentInstance.addEntry.subscribe(() => (requested = true));
    fixture.componentRef.setInput('entries', []);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Sin entradas registradas');
    const button = Array.from(fixture.nativeElement.querySelectorAll('button')).find((element) =>
      (element as HTMLButtonElement).textContent?.includes('Registrar primer hallazgo'),
    ) as HTMLButtonElement;
    button.click();
    expect(requested).toBe(true);
  });
});
