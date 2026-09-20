import { Component, computed, input, output } from '@angular/core';

@Component({
  selector: 'app-icon-button',
  template: `
    <button
      type="button"
      [attr.aria-label]="label()"
      [disabled]="disabled()"
      [class]="classes()"
      (click)="handleClick()"
    >
      <ng-content />
    </button>
  `,
})
export class IconButton {
  readonly label = input.required<string>();
  readonly disabled = input(false);
  readonly clicked = output<void>();

  readonly classes = computed(
    () =>
      'inline-flex h-32 w-32 items-center justify-center rounded-sm bg-transparent text-ink ' +
      '[&>svg]:h-20 [&>svg]:w-20 hover:bg-surface-alt transition-colors duration-fast ' +
      'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal ' +
      'disabled:cursor-not-allowed disabled:opacity-50',
  );

  handleClick(): void {
    if (!this.disabled()) {
      this.clicked.emit();
    }
  }
}
