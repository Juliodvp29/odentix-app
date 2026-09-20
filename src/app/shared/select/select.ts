import { Component, computed, forwardRef, input } from '@angular/core';
import { Field, FormField } from '@angular/forms/signals';
import { FormFieldControl } from '../form-field/form-field-control';

let nextSelectId = 0;

@Component({
  selector: 'app-select',
  imports: [FormField],
  providers: [{ provide: FormFieldControl, useExisting: forwardRef(() => Select) }],
  template: `
    <select
      [id]="inputId()"
      [formField]="field()"
      [attr.aria-describedby]="describedBy()"
      [attr.aria-invalid]="showError()"
      [class]="classes()"
    >
      <ng-content />
    </select>
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
      'block w-full rounded-control border border-transparent bg-surface-alt px-12 py-8 ' +
      'text-body text-ink focus:bg-paper focus:outline-none focus:ring-1 focus:ring-teal ' +
      'disabled:cursor-not-allowed disabled:opacity-50' +
      (this.showError() ? ' border-danger' : ''),
  );
}
