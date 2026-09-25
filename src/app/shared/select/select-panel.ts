import { DOCUMENT } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  inject,
  input,
  output,
  viewChildren,
} from '@angular/core';
import { Icon } from '@shared/icon/icon';
import { SelectOption } from './select';

@Component({
  selector: 'app-select-panel',
  imports: [Icon],
  template: `
    <div
      role="listbox"
      [attr.aria-label]="label()"
      (keydown)="onKeydown($event)"
      class="absolute right-0 top-full z-50 mt-4 min-w-48 max-w-96 rounded-control bg-paper py-4 shadow-raised"
    >
      @for (option of options(); track option.value; let i = $index) {
        <div
          #option
          role="option"
          tabindex="-1"
          [id]="inputId() + '-opt-' + i"
          [attr.aria-selected]="isSelected(option)"
          (click)="choose.emit(i)"
          (mouseenter)="focusOption(i)"
          [class]="optionClasses(option)"
        >
          <span class="truncate">{{ option.label }}</span>
          @if (isSelected(option)) {
            <app-icon name="check" />
          }
        </div>
      } @empty {
        <p class="px-12 py-8 text-caption text-mid-gray">No options</p>
      }
    </div>
  `,
})
export class SelectPanel implements AfterViewInit {
  readonly options = input<ReadonlyArray<SelectOption>>([]);
  readonly selectedValue = input('');
  readonly inputId = input('');
  readonly label = input('Options');
  readonly choose = output<number>();
  readonly commit = output<number>();
  readonly dismissed = output<void>();

  private readonly document = inject(DOCUMENT);
  private readonly optionElements = viewChildren<ElementRef<HTMLElement>>('option');

  ngAfterViewInit(): void {
    const selected = this.options().findIndex((option) => option.value === this.selectedValue());
    this.focusOption(Math.max(0, selected));
  }

  isSelected(option: SelectOption): boolean {
    return option.value === this.selectedValue();
  }

  optionClasses(option: SelectOption): string {
    const base = 'flex cursor-pointer items-center justify-between gap-8 px-12 py-8 text-body ';
    if (this.isSelected(option)) {
      return `${base}bg-teal-soft font-medium text-teal-deep`;
    }
    return `${base}text-ink hover:bg-surface-alt focus:bg-surface-alt focus:outline-none`;
  }

  focusOption(index: number): void {
    this.optionElements()[index]?.nativeElement.focus();
  }

  focusedIndex(): number {
    return this.optionElements().findIndex(
      (element) => element.nativeElement === this.document.activeElement,
    );
  }

  onKeydown(event: KeyboardEvent): void {
    const count = this.options().length;
    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        event.stopPropagation();
        if (this.focusedIndex() >= 0) {
          this.choose.emit(this.focusedIndex());
        }
        break;
      case 'ArrowDown':
        event.preventDefault();
        event.stopPropagation();
        this.focusOption(count === 0 ? 0 : (this.focusedIndex() + 1) % count);
        break;
      case 'ArrowUp':
        event.preventDefault();
        event.stopPropagation();
        this.focusOption(count === 0 ? 0 : (this.focusedIndex() - 1 + count) % count);
        break;
      case 'Home':
        event.preventDefault();
        event.stopPropagation();
        this.focusOption(0);
        break;
      case 'End':
        event.preventDefault();
        event.stopPropagation();
        this.focusOption(Math.max(0, count - 1));
        break;
      case 'Escape':
        event.preventDefault();
        event.stopPropagation();
        this.dismissed.emit();
        break;
      case 'Tab':
        if (this.focusedIndex() >= 0) {
          this.commit.emit(this.focusedIndex());
        }
        break;
    }
  }
}
