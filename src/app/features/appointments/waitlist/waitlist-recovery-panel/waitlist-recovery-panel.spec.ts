import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ToastService } from '@shared/toast/toast.service';
import { WaitlistService } from '../waitlist.service';
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

async function settleModal(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 250));
}

describe('WaitlistRecoveryPanel', () => {
  let fixture: ComponentFixture<WaitlistRecoveryPanel>;
  let convert: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    convert = vi.fn(() => of({ id: 'appointment-2' }));
    await TestBed.configureTestingModule({
      imports: [WaitlistRecoveryPanel],
      providers: [
        { provide: WaitlistService, useValue: { convert } },
        { provide: ToastService, useValue: { success: vi.fn(), error: vi.fn() } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(WaitlistRecoveryPanel);
    fixture.detectChanges();
  });

  afterEach(() => {
    document.querySelectorAll('.cdk-overlay-container').forEach((element) => element.remove());
    document.documentElement.classList.remove('cdk-global-scrollblock');
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

  it('should not offer manual conversion for terminal candidates', () => {
    fixture.componentRef.setInput('candidates', [{ ...CANDIDATE, status: 'convertida' }]);
    fixture.componentRef.setInput('sourceAppointmentId', 'appointment-1');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).not.toContain('Convertir');
  });

  it('should convert a candidate and remove it from the inline panel', async () => {
    fixture.componentRef.setInput('candidates', [CANDIDATE]);
    fixture.componentRef.setInput('sourceAppointmentId', 'appointment-1');
    fixture.componentRef.setInput('sourceStartsAt', '2026-09-22T14:00:00Z');
    fixture.componentRef.setInput('sourceEndsAt', '2026-09-22T15:00:00Z');
    fixture.detectChanges();

    const convertButton = Array.from(fixture.nativeElement.querySelectorAll('button')).find(
      (button) => (button as HTMLButtonElement).textContent?.includes('Convertir'),
    ) as HTMLButtonElement;
    convertButton.click();
    fixture.detectChanges();
    await settleModal();
    expect(document.querySelector('.cdk-overlay-pane')?.textContent).toContain('Ana Torres');

    const confirm = Array.from(document.querySelectorAll('.cdk-overlay-pane button')).find(
      (button) => (button as HTMLButtonElement).textContent?.includes('Convertir en cita'),
    ) as HTMLButtonElement;
    confirm.click();
    await settleModal();
    fixture.detectChanges();

    expect(convert).toHaveBeenCalledWith('entry-1', { sourceAppointmentId: 'appointment-1' });
    expect(fixture.nativeElement.textContent).toContain('No hay candidatos compatibles');
  });
});
