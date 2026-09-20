import { Component, inject, TemplateRef, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ModalService } from './modal.service';

@Component({
  template: `
    <button (click)="open()">Open dialog</button>
    <ng-template #dialogBody>
      <p>Dialog body</p>
      <button>Dialog action</button>
    </ng-template>
  `,
})
class ModalHost {
  private readonly modals = inject(ModalService);
  private readonly body = viewChild('dialogBody', { read: TemplateRef });

  open(): void {
    const template = this.body();
    if (template) {
      this.modals.open(template, { title: 'Test dialog' });
    }
  }
}

describe('ModalService', () => {
  let fixture: ComponentFixture<ModalHost>;

  const pane = (): HTMLElement | null => document.querySelector('.cdk-overlay-pane');
  const paneText = (): string => pane()?.textContent ?? '';

  async function openDialog(): Promise<void> {
    (fixture.nativeElement.querySelector('button') as HTMLButtonElement).click();
    fixture.detectChanges();
    await fixture.whenStable();
  }

  function settleAfterClose(action: () => void): void {
    vi.useFakeTimers();
    try {
      action();
      vi.advanceTimersByTime(300);
      fixture.detectChanges();
    } finally {
      vi.useRealTimers();
    }
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalHost],
    }).compileComponents();
    fixture = TestBed.createComponent(ModalHost);
    fixture.detectChanges();
  });

  afterEach(() => {
    document.querySelectorAll('.cdk-overlay-container').forEach((element) => element.remove());
    document.documentElement.classList.remove('cdk-global-scrollblock');
  });

  it('should open a dialog with title and content', async () => {
    await openDialog();
    expect(paneText()).toContain('Test dialog');
    expect(paneText()).toContain('Dialog body');
  });

  it('should focus inside the dialog on open', async () => {
    await openDialog();
    expect(pane()?.contains(document.activeElement)).toBe(true);
  });

  it('should close when the close button is clicked', async () => {
    await openDialog();
    const closeButton = pane()?.querySelector('[aria-label="Close dialog"]') as HTMLButtonElement;
    settleAfterClose(() => closeButton.click());
    expect(pane()).toBeNull();
  });

  it('should close on Escape', async () => {
    await openDialog();
    const panel = pane()?.querySelector('.modal-panel-enter') as HTMLElement;
    settleAfterClose(() => {
      panel.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    });
    expect(pane()).toBeNull();
  });

  it('should close on backdrop click', async () => {
    await openDialog();
    const backdrop = document.querySelector('.cdk-overlay-backdrop') as HTMLElement;
    settleAfterClose(() => backdrop.click());
    expect(pane()).toBeNull();
  });

  it('should install an active focus trap around the dialog', async () => {
    // jsdom performs no Tab navigation and reports zero element geometry,
    // so the wrap itself cannot run here (covered by CDK's own suite and
    // future browser E2E). This proves the trap is attached and enabled:
    // CDK only inserts its anchors for a live trap.
    await openDialog();
    const anchors = Array.from(
      document.querySelectorAll('.cdk-overlay-container .cdk-focus-trap-anchor'),
    );
    expect(anchors.length).toBe(2);
  });

  it('should lock page scroll while open', async () => {
    Object.defineProperty(document.documentElement, 'scrollHeight', {
      value: 2000,
      configurable: true,
    });
    try {
      await openDialog();
      expect(document.documentElement.classList.contains('cdk-global-scrollblock')).toBe(true);
      const closeButton = pane()?.querySelector('[aria-label="Close dialog"]') as HTMLButtonElement;
      settleAfterClose(() => closeButton.click());
      expect(document.documentElement.classList.contains('cdk-global-scrollblock')).toBe(false);
    } finally {
      delete (document.documentElement as { scrollHeight?: number }).scrollHeight;
    }
  });
});
