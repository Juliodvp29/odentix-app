import { Component, computed, forwardRef, input } from '@angular/core';
import { Field, FormField } from '@angular/forms/signals';
import { FormFieldControl } from '@shared/form-field/form-field-control';
import { Icon } from '@shared/icon/icon';

let nextSelectId = 0;

@Component({
  selector: 'app-select',
  imports: [FormField, Icon],
  providers: [{ provide: FormFieldControl, useExisting: forwardRef(() => Select) }],
  template: `
    <span class="relative block">
      <select
        [id]="inputId()"
        [formField]="field()"
        [attr.aria-describedby]="describedBy()"
        [attr.aria-invalid]="showError()"
        [class]="classes()"
      >
        <ng-content />
      </select>
      <span
        class="pointer-events-none absolute top-1/2 right-12 inline-flex h-16 w-16 -translate-y-1/2 items-center justify-center text-mid-gray"
      >
        <app-icon name="chevron-down" />
      </span>
    </span>
  `,
})
export class Select implements FormFieldControl {
  readonly inputId = input<string>(`select-${(nextSelectId += 1)}`);
  readonly field = input.required<Field<string>>();

  private readonly state = computed(() => this.field()());

  readonly showError = computed(() => {
    const state = this.state();
    return state.touched() && state.errors().length > 0;
  });
  readonly describedBy = computed(() => (this.showError() ? `${this.inputId()}-error` : null));

  readonly classes = computed(
    () =>
      'block w-full appearance-none rounded-control border border-transparent bg-surface-alt py-8 pl-12 pr-32 ' +
      'text-body text-ink focus:bg-paper focus:outline-none focus:ring-1 focus:ring-teal ' +
      'disabled:cursor-not-allowed disabled:opacity-50' +
      (this.showError() ? ' border-danger' : ''),
  );
}
