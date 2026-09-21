import { Component, input } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideCheck,
  lucideChevronDown,
  lucideDownload,
  lucideEye,
  lucideEyeOff,
  lucideLayoutDashboard,
  lucideLogOut,
  lucidePencil,
  lucideTrash2,
  lucideTriangleAlert,
  lucideUsers,
  lucideX,
} from '@ng-icons/lucide';

export type IconName =
  | 'x'
  | 'chevron-down'
  | 'pencil'
  | 'trash-2'
  | 'download'
  | 'check'
  | 'eye'
  | 'eye-off'
  | 'triangle-alert'
  | 'layout-dashboard'
  | 'log-out'
  | 'users';

const ICON_NAMES: Record<IconName, string> = {
  x: 'lucideX',
  'chevron-down': 'lucideChevronDown',
  pencil: 'lucidePencil',
  'trash-2': 'lucideTrash2',
  download: 'lucideDownload',
  check: 'lucideCheck',
  eye: 'lucideEye',
  'eye-off': 'lucideEyeOff',
  'triangle-alert': 'lucideTriangleAlert',
  'layout-dashboard': 'lucideLayoutDashboard',
  'log-out': 'lucideLogOut',
  users: 'lucideUsers',
};

@Component({
  selector: 'app-icon',
  imports: [NgIcon],
  providers: [
    provideIcons({
      lucideCheck,
      lucideChevronDown,
      lucideDownload,
      lucideEye,
      lucideEyeOff,
      lucideLayoutDashboard,
      lucideLogOut,
      lucidePencil,
      lucideTrash2,
      lucideTriangleAlert,
      lucideUsers,
      lucideX,
    }),
  ],
  template: `<ng-icon [name]="iconNames[name()]" aria-hidden="true" />`,
})
export class Icon {
  readonly name = input.required<IconName>();
  readonly iconNames = ICON_NAMES;
}
