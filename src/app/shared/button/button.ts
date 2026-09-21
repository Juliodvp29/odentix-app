import { Component, computed, input, output } from '@angular/core';
import { Icon, IconName } from '@shared/icon/icon';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonType = 'button' | 'submit' | 'reset';
export type ButtonIconPosition = 'start' | 'end';

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-teal text-paper hover:bg-teal-deep',
  secondary: 'bg-surface-alt text-ink hover:bg-hairline',
  ghost: 'bg-transparent text-ink hover:bg-surface-alt',
  danger: 'bg-danger text-paper hover:bg-danger-deep',
};

@Component({
  selector: 'app-button',
  imports: [Icon],
  host: { class: 'block', '[class.w-full]': 'fullWidth()' },
  template: `
    <button
      [type]="type()"
      [disabled]="isDisabled()"
      [attr.aria-busy]="loading()"
      [class]="classes()"
      (click)="handleClick()"
    >
      @if (startIcon(); as iconName) {
        <app-icon [name]="iconName" />
      }
      <span [class.invisible]="loading()">
        <ng-content />
      </span>
      @if (endIcon(); as iconName) {
        <app-icon [name]="iconName" />
      }
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
  readonly icon = input<IconName | null>(null);
  readonly iconPosition = input<ButtonIconPosition>('start');
  readonly fullWidth = input(false);
  readonly clicked = output<void>();

  readonly isDisabled = computed(() => this.disabled() || this.loading());
  readonly startIcon = computed(() =>
    this.iconPosition() === 'start' && !this.loading() ? this.icon() : null,
  );
  readonly endIcon = computed(() =>
    this.iconPosition() === 'end' && !this.loading() ? this.icon() : null,
  );

  readonly classes = computed(
    () =>
      'relative inline-flex items-center justify-center rounded-control px-16 py-8 ' +
      'text-body font-medium transition-colors duration-fast ' +
      'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal ' +
      'disabled:cursor-not-allowed disabled:opacity-50 ' +
      (this.icon() ? 'gap-8 ' : '') +
      (this.fullWidth() ? 'w-full ' : '') +
      variantClasses[this.variant()],
  );

  handleClick(): void {
    if (!this.isDisabled()) {
      this.clicked.emit();
    }
  }
}
