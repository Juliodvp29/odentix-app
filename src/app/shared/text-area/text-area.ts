import { Component, computed, forwardRef, input } from '@angular/core';
import { Field, FormField } from '@angular/forms/signals';
import { FormFieldControl } from '@shared/form-field/form-field-control';

let nextTextAreaId = 0;

// Multiline sibling of TextInput: same resting/focus/error treatment
// from the design system, sized by rows instead of a single line.
@Component({
  selector: 'app-text-area',
  imports: [FormField],
  providers: [{ provide: FormFieldControl, useExisting: forwardRef(() => TextArea) }],
  template: `
    <textarea
      [id]="inputId()"
      [rows]="rows()"
      [placeholder]="placeholder()"
      [formField]="field()"
      [attr.aria-describedby]="describedBy()"
      [attr.aria-invalid]="showError()"
      [class]="classes()"
    ></textarea>
  `,
})
export class TextArea implements FormFieldControl {
  readonly inputId = input<string>(`text-area-${(nextTextAreaId += 1)}`);
  readonly field = input.required<Field<string>>();
  readonly rows = input(4);
  readonly placeholder = input('');

  private readonly state = computed(() => this.field()());

  readonly showError = computed(() => {
    const state = this.state();
    return state.touched() && state.errors().length > 0;
  });
  readonly describedBy = computed(() => (this.showError() ? `${this.inputId()}-error` : null));

  readonly classes = computed(
    () =>
      'block w-full rounded-control border border-hairline bg-surface-alt px-12 py-8 ' +
      'text-body text-ink placeholder:text-mid-gray ' +
      'focus:border-teal focus:bg-paper focus:outline-none focus:ring-1 focus:ring-teal ' +
      'disabled:cursor-not-allowed disabled:opacity-50' +
      (this.showError() ? ' border-danger' : ''),
  );
}
