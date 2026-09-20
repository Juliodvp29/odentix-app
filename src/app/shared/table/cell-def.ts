import { Directive, TemplateRef, inject, input } from '@angular/core';

// Marks an ng-template as the custom cell for a table column:
// <ng-template appCell="status" let-row>{{ row.status }}</ng-template>
@Directive({ selector: '[appCell]' })
export class CellDef {
  readonly key = input.required<string>({ alias: 'appCell' });
  readonly template = inject(TemplateRef);
}
