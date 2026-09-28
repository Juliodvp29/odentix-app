import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { NotificationDetail } from './notification-detail';
import { NotificationResponse } from '../notification-models';

const FAILED: NotificationResponse = {
  id: 'n-1',
  channel: 'whatsapp',
  recipient: '+573001112233',
  templateKey: 'cita_recordatorio',
  status: 'fallida',
  errorDetail: 'Timeout del proveedor',
  createdAt: '2026-09-21T10:00:00Z',
};

describe('NotificationDetail', () => {
  let fixture: ComponentFixture<NotificationDetail>;

  function setup(notification: NotificationResponse = FAILED) {
    TestBed.configureTestingModule({ imports: [NotificationDetail] }).compileComponents();
    fixture = TestBed.createComponent(NotificationDetail);
    fixture.componentRef.setInput('notification', notification);
    fixture.detectChanges();
  }

  it('should show the attempt fields with the error detail', () => {
    setup();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('WhatsApp');
    expect(text).toContain('+573001112233');
    expect(text).toContain('cita_recordatorio');
    expect(text).toContain('Fallida');
    expect(text).toContain('Timeout del proveedor');
  });

  it('should hide the error block without an error detail', () => {
    setup({ ...FAILED, status: 'enviada', errorDetail: undefined });
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Enviada');
    expect(text).not.toContain('Detalle del error');
  });

  it('should emit closed without side effects', () => {
    setup();
    let closed = false;
    fixture.componentInstance.closed.subscribe(() => {
      closed = true;
    });
    fixture.componentInstance.close();
    expect(closed).toBe(true);
  });
});
