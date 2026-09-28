import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it } from 'vitest';
import { NotificationListPage } from './notification-list-page';
import { NotificationResponse } from '../notification-models';

async function flushEffects(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

const ATTEMPTS: NotificationResponse[] = [
  {
    id: 'n-1',
    channel: 'email',
    recipient: 'a@alfa.com',
    templateKey: 'cita_confirmacion',
    status: 'enviada',
    sentAt: '2026-09-20T10:05:00Z',
    createdAt: '2026-09-20T10:00:00Z',
  },
  {
    id: 'n-2',
    channel: 'whatsapp',
    recipient: '+573001112233',
    templateKey: 'cita_recordatorio',
    status: 'fallida',
    errorDetail: 'Timeout del proveedor',
    createdAt: '2026-09-21T10:00:00Z',
  },
  {
    id: 'n-3',
    channel: 'sms',
    recipient: '+573004445566',
    templateKey: 'cita_recordatorio',
    status: 'pendiente',
    createdAt: '2026-09-22T10:00:00Z',
  },
];

describe('NotificationListPage', () => {
  let fixture: ComponentFixture<NotificationListPage>;
  let httpTesting: HttpTestingController;

  const bodyText = (): string => fixture.nativeElement.textContent as string;

  async function flushAttemptPage(totalElements = ATTEMPTS.length): Promise<void> {
    await flushEffects();
    httpTesting
      .expectOne((call) => call.url.endsWith('/api/v1/notifications'))
      .flush({ content: ATTEMPTS, totalElements });
    await flushEffects();
    fixture.detectChanges();
  }

  function openFilters(): void {
    const toggle = Array.from(fixture.nativeElement.querySelectorAll('button')).find((button) =>
      (button as HTMLButtonElement).textContent?.includes('Filtros'),
    ) as HTMLButtonElement | undefined;
    toggle?.click();
    fixture.detectChanges();
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [NotificationListPage],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    fixture = TestBed.createComponent(NotificationListPage);
    httpTesting = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpTesting.verify();
    document.querySelectorAll('.cdk-overlay-container').forEach((element) => element.remove());
  });

  it('should render attempts with channel and status labels', async () => {
    await flushAttemptPage();
    expect(bodyText()).toContain('Notificaciones');
    expect(bodyText()).toContain('WhatsApp');
    expect(bodyText()).toContain('+573001112233');
    expect(bodyText()).toContain('Fallida');
    expect(bodyText()).toContain('Enviada');
    expect(bodyText()).toContain('Pendiente');
  });

  it('should warn when the backend holds more attempts than the window', async () => {
    await flushAttemptPage(250);
    expect(bodyText()).toContain('250 en total');
  });

  it('should filter by status without refetching', async () => {
    await flushAttemptPage();
    openFilters();
    fixture.componentInstance.onQueryChange({
      ...fixture.componentInstance.query(),
      filters: { status: 'fallida' },
    });
    fixture.detectChanges();
    expect(bodyText()).toContain('+573001112233');
    expect(bodyText()).not.toContain('a@alfa.com');
    httpTesting.verify();
  });

  it('should search across recipient, template, channel and status', async () => {
    await flushAttemptPage();
    fixture.componentInstance.onQueryChange({
      ...fixture.componentInstance.query(),
      search: 'whatsapp',
    });
    fixture.detectChanges();
    expect(bodyText()).toContain('+573001112233');
    expect(bodyText()).not.toContain('a@alfa.com');
  });

  it('should show the error detail in the attempt dialog', async () => {
    await flushAttemptPage();
    const failedRow = Array.from(fixture.nativeElement.querySelectorAll('tbody tr')).find((row) =>
      (row as HTMLElement).textContent?.includes('+573001112233'),
    ) as HTMLElement;
    const detail = Array.from(failedRow.querySelectorAll('button')).find((button) =>
      (button as HTMLButtonElement).textContent?.includes('Ver detalle'),
    ) as HTMLButtonElement;
    detail.click();
    fixture.detectChanges();
    await flushEffects();
    const dialog = document.querySelector('.cdk-overlay-pane') as HTMLElement;
    expect(dialog.textContent).toContain('Detalle de notificación');
    expect(dialog.textContent).toContain('Timeout del proveedor');
  });

  it('should retry when loading fails', async () => {
    await flushEffects();
    httpTesting
      .expectOne((call) => call.url.endsWith('/api/v1/notifications'))
      .error(new ProgressEvent('error'));
    await flushEffects();
    fixture.detectChanges();
    expect(bodyText()).toContain('No pudimos cargar las notificaciones.');
    const retry = fixture.nativeElement.querySelector(
      'section[role="alert"] button',
    ) as HTMLButtonElement;
    retry.click();
    await flushEffects();
    fixture.detectChanges();
    httpTesting.expectOne((call) => call.url.endsWith('/api/v1/notifications'));
  });

  it('should show the empty state without attempts', async () => {
    await flushEffects();
    httpTesting
      .expectOne((call) => call.url.endsWith('/api/v1/notifications'))
      .flush({ content: [], totalElements: 0 });
    await flushEffects();
    fixture.detectChanges();
    expect(bodyText()).toContain('No hay intentos de notificación para mostrar');
  });
});
