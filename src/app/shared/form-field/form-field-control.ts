import { Signal } from '@angular/core';

// Contract letting app-form-field discover the input id of a projected
// control (text input, select, ...) to wire label and error association.
export abstract class FormFieldControl {
  abstract readonly inputId: Signal<string>;
}
