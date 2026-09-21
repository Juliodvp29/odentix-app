import { DOCUMENT } from '@angular/common';
import {
  Component,
  ElementRef,
  computed,
  effect,
  forwardRef,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { Field, FormField } from '@angular/forms/signals';
import { FormFieldControl } from '@shared/form-field/form-field-control';
import { Icon } from '@shared/icon/icon';
import { SelectPanel } from './select-panel';

export interface SelectOption {
  readonly value: string;
  readonly label: string;
}

let nextSelectId = 0;

@Component({
  selector: 'app-select',
  imports: [FormField, Icon, SelectPanel],
  providers: [{ provide: FormFieldControl, useExisting: forwardRef(() => Select) }],
  host: { class: 'block' },
  template: `
    <div class="relative" (keydown)="onKeydown($event)">
      <select
        #native
        [id]="inputId() + '-native'"
        [formField]="field()"
        tabindex="-1"
        aria-hidden="true"
        class="sr-only"
      >
        @for (option of allOptions(); track option.value) {
          <option [value]="option.value">{{ option.label }}</option>
        }
      </select>
      <button
        #trigger
        type="button"
        [id]="inputId()"
        [disabled]="!interactive()"
        aria-haspopup="listbox"
        [attr.aria-expanded]="open()"
        [attr.aria-describedby]="describedBy()"
        [attr.aria-invalid]="showError()"
        [class]="classes()"
        (click)="toggle()"
        (blur)="markTouched()"
      >
        <span class="flex-1 truncate text-left">{{ displayLabel() }}</span>
        <span class="inline-flex transition-transform duration-fast" [class.rotate-180]="open()">
          <app-icon name="chevron-down" />
        </span>
      </button>
      @if (open()) {
        <app-select-panel
          [options]="allOptions()"
          [selectedValue]="selectedValue()"
          [inputId]="inputId()"
          [label]="placeholder() || 'Options'"
          (choose)="onPanelChoose($event)"
          (commit)="onPanelCommit($event)"
          (dismissed)="close()"
        />
      }
    </div>
  `,
})
export class Select implements FormFieldControl {
  readonly inputId = input<string>(`select-${(nextSelectId += 1)}`);
  readonly field = input.required<Field<string>>();
  readonly options = input<ReadonlyArray<SelectOption>>([]);
  readonly placeholder = input('');

  private readonly document = inject(DOCUMENT);
  private readonly host = inject(ElementRef);
  private readonly trigger = viewChild('trigger', { read: ElementRef });
  private readonly nativeSelect = viewChild('native', { read: ElementRef });
  private readonly state = computed(() => this.field()());

  readonly open = signal(false);

  readonly showError = computed(() => {
    const state = this.state();
    return state.touched() && state.errors().length > 0;
  });
  readonly interactive = computed(() => {
    const state = this.state();
    return !state.disabled() && !state.readonly();
  });
  readonly describedBy = computed(() => (this.showError() ? `${this.inputId()}-error` : null));
  readonly allOptions = computed<ReadonlyArray<SelectOption>>(() =>
    this.placeholder()
      ? [{ value: '', label: this.placeholder() }, ...this.options()]
      : [...this.options()],
  );
  readonly selectedValue = computed(() => this.state().value());
  readonly displayLabel = computed(
    () => this.allOptions().find((option) => option.value === this.selectedValue())?.label ?? '',
  );
  readonly classes = computed(
    () =>
      'flex w-full items-center justify-between gap-8 rounded-control border border-transparent ' +
      'bg-surface-alt px-12 py-8 text-body text-ink ' +
      'focus:bg-paper focus:outline-none focus:ring-1 focus:ring-teal ' +
      'disabled:cursor-not-allowed disabled:opacity-50' +
      (this.showError() ? ' border-danger' : ''),
  );

  private readonly closeOnOutsidePointer = effect((onCleanup) => {
    if (!this.open()) {
      return;
    }
    const handler = (event: PointerEvent): void => {
      if (!this.host.nativeElement.contains(event.target as Node)) {
        this.close(false);
      }
    };
    this.document.addEventListener('pointerdown', handler);
    onCleanup(() => this.document.removeEventListener('pointerdown', handler));
  });

  markTouched(): void {
    this.state().markAsTouched();
  }

  toggle(): void {
    if (!this.interactive()) {
      return;
    }
    if (this.open()) {
      this.close();
    } else {
      this.open.set(true);
    }
  }

  close(refocus = true): void {
    this.open.set(false);
    if (refocus) {
      const trigger = this.trigger();
      (trigger?.nativeElement as HTMLButtonElement | undefined)?.focus();
    }
  }

  choose(option: SelectOption, refocus = true): void {
    const native = this.nativeSelect();
    if (!native || !this.interactive()) {
      return;
    }
    const select = native.nativeElement as HTMLSelectElement;
    select.value = option.value;
    select.dispatchEvent(new Event('input', { bubbles: true }));
    select.dispatchEvent(new Event('change', { bubbles: true }));
    this.close(refocus);
  }

  onPanelChoose(index: number): void {
    const option = this.allOptions()[index];
    if (option) {
      this.choose(option);
    }
  }

  onPanelCommit(index: number): void {
    const option = this.allOptions()[index];
    if (option) {
      this.choose(option, false);
    } else {
      this.close(false);
    }
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.defaultPrevented || !this.interactive() || this.open()) {
      return;
    }
    if (
      event.key === 'Enter' ||
      event.key === ' ' ||
      event.key === 'ArrowDown' ||
      event.key === 'ArrowUp'
    ) {
      event.preventDefault();
      this.open.set(true);
    }
  }
}
