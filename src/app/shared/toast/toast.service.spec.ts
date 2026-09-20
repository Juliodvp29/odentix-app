import { TestBed } from '@angular/core/testing';
import { ToastService } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ToastService);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should add a toast with its message and type', () => {
    service.success('Saved');
    const toasts = service.toasts();
    expect(toasts.length).toBe(1);
    expect(toasts[0].message).toBe('Saved');
    expect(toasts[0].type).toBe('success');
    expect(toasts[0].leaving).toBe(false);
  });

  it('should auto-dismiss a success toast after its duration', () => {
    service.success('Saved');
    vi.advanceTimersByTime(4000);
    expect(service.toasts()[0].leaving).toBe(true);
    vi.advanceTimersByTime(200);
    expect(service.toasts().length).toBe(0);
  });

  it('should keep error toasts until dismissed manually', () => {
    service.error('Failed');
    vi.advanceTimersByTime(10000);
    expect(service.toasts().length).toBe(1);
    expect(service.toasts()[0].leaving).toBe(false);
  });

  it('should remove a toast after manual dismiss plays out', () => {
    const id = service.info('Hello');
    service.dismiss(id);
    expect(service.toasts()[0].leaving).toBe(true);
    vi.advanceTimersByTime(200);
    expect(service.toasts().length).toBe(0);
  });

  it('should assign alert role to error and warning toasts', () => {
    service.error('Failed');
    service.warning('Careful');
    service.info('Hello');
    const roles = service.toasts().map((toast) => toast.role);
    expect(roles).toEqual(['alert', 'alert', 'status']);
  });
});
