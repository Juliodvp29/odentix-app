import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-link',
  imports: [NgTemplateOutlet, RouterLink],
  template: `
    <ng-template #content><ng-content /></ng-template>
    @if (route(); as internalRoute) {
      <a [routerLink]="internalRoute" [class]="classes()">
        <ng-container *ngTemplateOutlet="content" />
      </a>
    } @else {
      <a
        [href]="href() ?? ''"
        [attr.target]="external() ? '_blank' : null"
        [attr.rel]="external() ? 'noreferrer' : null"
        [class]="classes()"
      >
        <ng-container *ngTemplateOutlet="content" />
      </a>
    }
  `,
})
export class Link {
  readonly href = input<string | null>(null);
  readonly route = input<string | readonly string[] | null>(null);
  readonly external = input(false);

  readonly classes = computed(
    () =>
      'text-teal underline-offset-2 hover:text-teal-deep hover:underline ' +
      'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal',
  );
}
