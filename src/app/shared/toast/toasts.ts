import { Component, computed, inject } from '@angular/core';
import { IconButton } from '@shared/icon-button/icon-button';
import { Toast, ToastService, ToastType } from './toast.service';

const borderClasses: Record<ToastType, string> = {
  success: 'border-l-success',
  error: 'border-l-danger',
  info: 'border-l-info',
  warning: 'border-l-warning',
};

@Component({
  selector: 'app-toasts',
  imports: [IconButton],
  template: `
    <div class="fixed top-24 right-24 z-50 flex flex-col items-end gap-8" aria-live="polite">
      @for (toast of toasts(); track toast.id) {
        <div
          role="status"
          [attr.role]="toast.role"
          [class]="toastClasses(toast)"
          style="border-left-width: 3px"
        >
          <p class="text-body text-ink">{{ toast.message }}</p>
          <app-icon-button label="Dismiss notification" (clicked)="dismiss(toast.id)">
            <svg
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              aria-hidden="true"
            >
              <path d="M4 4l8 8M12 4l-8 8" stroke-linecap="round" />
            </svg>
          </app-icon-button>
        </div>
      }
    </div>
  `,
})
export class Toasts {
  private readonly service = inject(ToastService);

  readonly toasts = computed(() => this.service.toasts());

  dismiss(id: number): void {
    this.service.dismiss(id);
  }

  toastClasses(toast: Toast): string {
    return (
      'flex items-center gap-12 rounded-card bg-paper p-16 shadow-raised ' +
      borderClasses[toast.type] +
      (toast.leaving ? ' toast-leave' : ' toast-enter')
    );
  }
}
