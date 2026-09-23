import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ToastService } from '@shared/toast/toast.service';
import { WaitlistEntryResponse, WaitlistService } from '../waitlist.service';
import { WaitlistRowActions } from './waitlist-row-actions';

const ENTRY: WaitlistEntryResponse = {
  id: 'entry-1',
  patientId: 'patient-1',
  patientName: 'Ana Torres',
  status: 'activa',
};

describe('WaitlistRowActions', () => {
  let fixture: ComponentFixture<WaitlistRowActions>;
  let updateStatus: ReturnType<typeof vi.fn>;

  async function settle(): Promise<void> {
    await fixture.whenStable();
    fixture.detectChanges();
  }

  function paneText(): string {
    return document.querySelector('.cdk-overlay-pane')?.textContent ?? '';
  }

  function paneButton(label: string): HTMLButtonElement {
    return Array.from(document.querySelectorAll('.cdk-overlay-pane button')).find((button) =>
      (button as HTMLButtonElement).textContent?.includes(label),
    ) as HTMLButtonElement;
  }

  beforeEach(async () => {
    updateStatus = vi.fn((id: string, body: { status: string; discardReason?: string }) =>
      of({ ...ENTRY, id, status: body.status as WaitlistEntryResponse['status'] }),
    );
    await TestBed.configureTestingModule({
      imports: [WaitlistRowActions],
      providers: [
        { provide: WaitlistService, useValue: { updateStatus } },
        { provide: ToastService, useValue: { success: vi.fn(), error: vi.fn() } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(WaitlistRowActions);
    fixture.componentRef.setInput('entry', ENTRY);
    fixture.detectChanges();
  });

  afterEach(() => {
    document.querySelectorAll('.cdk-overlay-container').forEach((element) => element.remove());
    document.documentElement.classList.remove('cdk-global-scrollblock');
  });

  it('should show one actions button and open the available options', async () => {
    const trigger = fixture.nativeElement.querySelector(
      'button[aria-haspopup="menu"]',
    ) as HTMLButtonElement;
    expect(trigger).toBeTruthy();
    expect(fixture.nativeElement.querySelectorAll('button')).toHaveLength(1);
    expect(fixture.nativeElement.textContent).not.toContain('Marcar contactado');

    trigger.click();
    await settle();

    expect(paneText()).toContain('Marcar contactado');
    expect(paneText()).toContain('Descartar');
  });

  it('should hide all actions for terminal states', () => {
    for (const status of ['convertida', 'descartada'] as const) {
      fixture.componentRef.setInput('entry', { ...ENTRY, status });
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).not.toContain('Marcar contactado');
      expect(fixture.nativeElement.textContent).not.toContain('Descartar');
    }
  });

  it('should confirm and patch a contact status', async () => {
    let updated: WaitlistEntryResponse | undefined;
    fixture.componentInstance.updated.subscribe((entry) => (updated = entry));
    (fixture.nativeElement.querySelector('button[aria-haspopup="menu"]') as HTMLButtonElement).click();
    await settle();
    paneButton('Marcar contactado').click();
    await settle();
    expect(paneText()).toContain('¿Marcar esta entrada como contactada?');

    paneButton('Sí, marcar contactado').click();
    await settle();

    expect(updateStatus).toHaveBeenCalledWith('entry-1', { status: 'contactado' });
    expect(updated?.status).toBe('contactado');
  });

  it('should send a discard reason when provided', async () => {
    (fixture.nativeElement.querySelector('button[aria-haspopup="menu"]') as HTMLButtonElement).click();
    await settle();
    paneButton('Descartar').click();
    await settle();
    const input = document.querySelector(
      'input[placeholder="Motivo del descarte"]',
    ) as HTMLInputElement;
    input.value = 'El paciente no continúa';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    paneButton('Sí, descartar').click();
    await settle();

    expect(updateStatus).toHaveBeenCalledWith('entry-1', {
      status: 'descartada',
      discardReason: 'El paciente no continúa',
    });
  });
});
