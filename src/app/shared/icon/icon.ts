import { Component, input } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideChevronDown, lucidePencil, lucideTrash2, lucideX } from '@ng-icons/lucide';

export type IconName = 'x' | 'chevron-down' | 'pencil' | 'trash-2';

const ICON_NAMES: Record<IconName, string> = {
  x: 'lucideX',
  'chevron-down': 'lucideChevronDown',
  pencil: 'lucidePencil',
  'trash-2': 'lucideTrash2',
};

@Component({
  selector: 'app-icon',
  imports: [NgIcon],
  providers: [provideIcons({ lucideChevronDown, lucidePencil, lucideTrash2, lucideX })],
  template: `<ng-icon [name]="iconNames[name()]" aria-hidden="true" />`,
})
export class Icon {
  readonly name = input.required<IconName>();
  readonly iconNames = ICON_NAMES;
}
