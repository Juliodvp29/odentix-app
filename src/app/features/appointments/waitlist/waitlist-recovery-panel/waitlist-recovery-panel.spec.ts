import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WaitlistEntryResponse } from '../waitlist.service';
import { WaitlistRecoveryPanel } from './waitlist-recovery-panel';

const CANDIDATE: WaitlistEntryResponse = {
  id: 'entry-1',
  patientId: 'patient-1',
  patientName: 'Ana Torres',
  patientPhone: '3001234567',
  desiredFrom: '2026-09-22T14:00:00Z',
  desiredTo: '2026-09-22T15:00:00Z',
  status: 'activa',
};

describe('WaitlistRecoveryPanel', () => {
  let fixture: ComponentFixture<WaitlistRecoveryPanel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WaitlistRecoveryPanel],
    }).compileComponents();
    fixture = TestBed.createComponent(WaitlistRecoveryPanel);
    fixture.detectChanges();
  });

  it('should render a loading state', () => {
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();

    const loading = fixture.nativeElement.querySelector('[aria-busy="true"]') as HTMLElement;
    expect(loading).toBeTruthy();
    expect(loading.getAttribute('aria-label')).toBe('Cargando candidatos');
  });

  it('should render candidate details', () => {
    fixture.componentRef.setInput('candidates', [CANDIDATE]);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Ana Torres');
    expect(text).toContain('3001234567');
    expect(text).toContain('22/09/2026');
  });

  it('should render the empty state', () => {
    fixture.componentRef.setInput('candidates', []);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('No hay candidatos compatibles');
    expect(fixture.nativeElement.textContent).toContain('canceló correctamente');
  });

  it('should expose retry and close actions', () => {
    let retried = false;
    let closed = false;
    fixture.componentInstance.retry.subscribe(() => (retried = true));
    fixture.componentInstance.closed.subscribe(() => (closed = true));
    fixture.componentRef.setInput('error', 'No pudimos cargar los candidatos.');
    fixture.detectChanges();

    const buttons = Array.from(
      fixture.nativeElement.querySelectorAll('button'),
    ) as HTMLButtonElement[];
    buttons.find((button) => button.textContent?.includes('Reintentar'))?.click();
    buttons.find((button) => button.textContent?.includes('Cerrar'))?.click();

    expect(retried).toBe(true);
    expect(closed).toBe(true);
  });
});
