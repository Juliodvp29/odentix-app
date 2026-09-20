import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-link',
  template: `
    <a
      [href]="href()"
      [attr.target]="external() ? '_blank' : null"
      [attr.rel]="external() ? 'noreferrer' : null"
      [class]="classes()"
    >
      <ng-content />
    </a>
  `,
})
export class Link {
  readonly href = input.required<string>();
  readonly external = input(false);

  readonly classes = computed(
    () =>
      'text-teal underline-offset-2 hover:text-teal-deep hover:underline ' +
      'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal',
  );
}
