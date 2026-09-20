import { Component, computed, contentChild, input } from '@angular/core';
import { Field } from '@angular/forms/signals';
import { FormFieldControl } from '@shared/form-field/form-field-control';

@Component({
  selector: 'app-form-field',
  template: `
    <label [attr.for]="labelFor()" class="mb-8 block text-body font-medium text-ink">
      {{ label() }}
    </label>
    <ng-content />
    @if (showError()) {
      <span [id]="errorId()" role="alert" class="mt-4 block text-caption text-danger-deep">
        {{ firstError() }}
      </span>
    }
  `,
})
export class FormField {
  readonly label = input.required<string>();
  readonly field = input.required<Field<string | number>>();

  private readonly control = contentChild(FormFieldControl);
  private readonly state = computed(() => this.field()());

  readonly showError = computed(() => {
    const state = this.state();
    return state.touched() && state.errors().length > 0;
  });
  readonly firstError = computed(() => this.state().errors()[0]?.message ?? '');
  readonly labelFor = computed(() => this.control()?.inputId());
  readonly errorId = computed(() => {
    const target = this.labelFor();
    return target ? `${target}-error` : null;
  });
}
