import { Component, computed, input, output } from '@angular/core';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonType = 'button' | 'submit' | 'reset';

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-teal text-paper hover:bg-teal-deep',
  secondary: 'bg-surface-alt text-ink hover:bg-hairline',
  ghost: 'bg-transparent text-ink hover:bg-surface-alt',
  danger: 'bg-danger text-paper hover:bg-danger-deep',
};

@Component({
  selector: 'app-button',
  template: `
    <button
      [type]="type()"
      [disabled]="isDisabled()"
      [attr.aria-busy]="loading()"
      [class]="classes()"
      (click)="handleClick()"
    >
      <span [class.invisible]="loading()">
        <ng-content />
      </span>
      @if (loading()) {
        <span
          data-testid="loading-spinner"
          aria-hidden="true"
          class="absolute h-16 w-16 animate-spin rounded-pill border-2 border-current border-t-transparent"
        ></span>
      }
    </button>
  `,
})
export class Button {
  readonly variant = input<ButtonVariant>('primary');
  readonly type = input<ButtonType>('button');
  readonly disabled = input(false);
  readonly loading = input(false);
  readonly clicked = output<void>();

  readonly isDisabled = computed(() => this.disabled() || this.loading());

  readonly classes = computed(
    () =>
      'relative inline-flex items-center justify-center rounded-control px-16 py-8 ' +
      'text-body font-medium transition-colors duration-fast ' +
      'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal ' +
      'disabled:cursor-not-allowed disabled:opacity-50 ' +
      variantClasses[this.variant()],
  );

  handleClick(): void {
    if (!this.isDisabled()) {
      this.clicked.emit();
    }
  }
}
