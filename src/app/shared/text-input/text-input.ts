import { NgTemplateOutlet } from '@angular/common';
import { Component, TemplateRef, computed, contentChild, forwardRef, input } from '@angular/core';
import { Field, FormField } from '@angular/forms/signals';
import { FormFieldControl } from '@shared/form-field/form-field-control';

let nextTextInputId = 0;

@Component({
  selector: 'app-text-input',
  imports: [FormField, NgTemplateOutlet],
  providers: [{ provide: FormFieldControl, useExisting: forwardRef(() => TextInput) }],
  template: `
    <span class="relative block">
      <input
        [id]="inputId()"
        [type]="type()"
        [placeholder]="placeholder()"
        [attr.autocomplete]="autocomplete() || null"
        [formField]="field()"
        [attr.aria-describedby]="describedBy()"
        [attr.aria-invalid]="showError()"
        [class.tracking-widest]="type() === 'password'"
        [class]="classes()"
      />
      @if (suffix(); as suffixTemplate) {
        <span class="absolute inset-y-0 right-4 inline-flex items-center">
          <ng-container *ngTemplateOutlet="suffixTemplate" />
        </span>
      }
    </span>
  `,
})
export class TextInput implements FormFieldControl {
  readonly inputId = input<string>(`text-input-${(nextTextInputId += 1)}`);
  readonly field = input.required<Field<string | number>>();
  readonly type = input('text');
  readonly placeholder = input('');
  readonly autocomplete = input('');

  readonly suffix = contentChild('suffix', { read: TemplateRef });

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
      (this.suffix() ? ' pr-40' : '') +
      (this.showError() ? ' border-danger' : ''),
  );
}
