import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastOptions {
  durationMs?: number;
}

export interface Toast {
  readonly id: number;
  readonly message: string;
  readonly type: ToastType;
  readonly role: 'status' | 'alert';
  readonly leaving: boolean;
}

interface ToastState extends Toast {
  durationMs: number;
  timer: ReturnType<typeof setTimeout> | null;
}

const defaultDurations: Record<ToastType, number> = {
  success: 4000,
  info: 4000,
  error: 0,
  warning: 0,
};

// Matches --duration-base: keep in sync if the token changes.
const EXIT_ANIMATION_MS = 200;

let nextToastId = 0;

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly state = signal<ReadonlyArray<ToastState>>([]);

  readonly toasts = this.state.asReadonly();

  show(message: string, type: ToastType = 'info', options: ToastOptions = {}): number {
    const id = (nextToastId += 1);
    const entry: ToastState = {
      id,
      message,
      type,
      role: type === 'error' || type === 'warning' ? 'alert' : 'status',
      leaving: false,
      durationMs: options.durationMs ?? defaultDurations[type],
      timer: null,
    };
    if (entry.durationMs > 0) {
      entry.timer = setTimeout(() => this.dismiss(id), entry.durationMs);
    }
    this.state.update((toasts) => [...toasts, entry]);
    return id;
  }

  success(message: string, options: ToastOptions = {}): number {
    return this.show(message, 'success', options);
  }

  error(message: string, options: ToastOptions = {}): number {
    return this.show(message, 'error', options);
  }

  info(message: string, options: ToastOptions = {}): number {
    return this.show(message, 'info', options);
  }

  warning(message: string, options: ToastOptions = {}): number {
    return this.show(message, 'warning', options);
  }

  dismiss(id: number): void {
    const current = this.state().find((toast) => toast.id === id);
    if (!current || current.leaving) {
      return;
    }
    if (current.timer) {
      clearTimeout(current.timer);
    }
    this.state.update((toasts) =>
      toasts.map((toast) => (toast.id === id ? { ...toast, leaving: true, timer: null } : toast)),
    );
    setTimeout(() => {
      this.state.update((toasts) => toasts.filter((toast) => toast.id !== id));
    }, EXIT_ANIMATION_MS);
  }
}
