import { Component, computed, forwardRef, input } from '@angular/core';
import { Field, FormField } from '@angular/forms/signals';
import { FormFieldControl } from '@shared/form-field/form-field-control';

let nextTextInputId = 0;

@Component({
  selector: 'app-text-input',
  imports: [FormField],
  providers: [{ provide: FormFieldControl, useExisting: forwardRef(() => TextInput) }],
  template: `
    <input
      [id]="inputId()"
      [type]="type()"
      [placeholder]="placeholder()"
      [formField]="field()"
      [attr.aria-describedby]="describedBy()"
      [attr.aria-invalid]="showError()"
      [class]="classes()"
    />
  `,
})
export class TextInput implements FormFieldControl {
  readonly inputId = input<string>(`text-input-${(nextTextInputId += 1)}`);
  readonly field = input.required<Field<string | number>>();
  readonly type = input('text');
  readonly placeholder = input('');

  private readonly state = computed(() => this.field()());

  readonly showError = computed(() => {
    const state = this.state();
    return state.touched() && state.errors().length > 0;
  });
  readonly describedBy = computed(() => (this.showError() ? `${this.inputId()}-error` : null));

  readonly classes = computed(
    () =>
      'block w-full rounded-control border border-transparent bg-surface-alt px-12 py-8 ' +
      'text-body text-ink placeholder:text-faint-gray ' +
      'focus:bg-paper focus:outline-none focus:ring-1 focus:ring-teal ' +
      'disabled:cursor-not-allowed disabled:opacity-50' +
      (this.showError() ? ' border-danger' : ''),
  );
}
