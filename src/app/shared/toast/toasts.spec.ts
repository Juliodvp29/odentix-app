import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Toasts } from './toasts';
import { ToastService } from './toast.service';

@Component({
  imports: [Toasts],
  template: '<app-toasts />',
})
class ToastsHost {}

describe('Toasts', () => {
  let fixture: ComponentFixture<ToastsHost>;
  let service: ToastService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToastsHost],
    }).compileComponents();
    fixture = TestBed.createComponent(ToastsHost);
    service = TestBed.inject(ToastService);
    fixture.detectChanges();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render a triggered toast with its type styling', () => {
    service.success('Saved');
    fixture.detectChanges();
    const stack = fixture.nativeElement.querySelector('[aria-live="polite"]') as HTMLElement;
    expect(stack.className).toContain('top-24');
    expect(stack.className).not.toContain('bottom-24');
    const toast = fixture.nativeElement.querySelector('[role="status"]') as HTMLElement;
    expect(toast.textContent).toContain('Saved');
    expect(toast.className).toContain('border-l-success');
  });

  it('should render error toasts as alerts', () => {
    service.error('Failed');
    fixture.detectChanges();
    const toast = fixture.nativeElement.querySelector('[role="alert"]') as HTMLElement;
    expect(toast.textContent).toContain('Failed');
    expect(toast.className).toContain('border-l-danger');
  });

  it('should remove the toast after manual dismiss plays out', () => {
    service.info('Hello');
    fixture.detectChanges();
    const close = fixture.nativeElement.querySelector(
      '[aria-label="Dismiss notification"]',
    ) as HTMLButtonElement;
    close.click();
    vi.advanceTimersByTime(200);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="status"]')).toBeNull();
  });
});
