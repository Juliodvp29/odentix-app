import { Component, input } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideCalendar,
  lucideCheck,
  lucideChevronDown,
  lucideChevronLeft,
  lucideChevronRight,
  lucideChevronUp,
  lucideDownload,
  lucideEye,
  lucideEyeOff,
  lucideFileText,
  lucideLayoutDashboard,
  lucideLock,
  lucideLogOut,
  lucidePencil,
  lucidePackage,
  lucidePlus,
  lucideRefreshCw,
  lucideSearch,
  lucideSettings,
  lucideStethoscope,
  lucideTarget,
  lucideTrash2,
  lucideTriangleAlert,
  lucideUsers,
  lucideWallet,
  lucideX,
} from '@ng-icons/lucide';

export type IconName =
  | 'x'
  | 'calendar'
  | 'chevron-down'
  | 'chevron-left'
  | 'chevron-right'
  | 'chevron-up'
  | 'search'
  | 'settings'
  | 'stethoscope'
  | 'target'
  | 'refresh'
  | 'pencil'
  | 'package'
  | 'plus'
  | 'trash-2'
  | 'download'
  | 'check'
  | 'eye'
  | 'eye-off'
  | 'file-text'
  | 'triangle-alert'
  | 'layout-dashboard'
  | 'lock'
  | 'log-out'
  | 'users'
  | 'wallet';

const ICON_NAMES: Record<IconName, string> = {
  x: 'lucideX',
  calendar: 'lucideCalendar',
  'chevron-down': 'lucideChevronDown',
  'chevron-left': 'lucideChevronLeft',
  'chevron-right': 'lucideChevronRight',
  'chevron-up': 'lucideChevronUp',
  search: 'lucideSearch',
  settings: 'lucideSettings',
  stethoscope: 'lucideStethoscope',
  target: 'lucideTarget',
  refresh: 'lucideRefreshCw',
  pencil: 'lucidePencil',
  package: 'lucidePackage',
  plus: 'lucidePlus',
  'trash-2': 'lucideTrash2',
  download: 'lucideDownload',
  check: 'lucideCheck',
  eye: 'lucideEye',
  'eye-off': 'lucideEyeOff',
  'file-text': 'lucideFileText',
  'triangle-alert': 'lucideTriangleAlert',
  'layout-dashboard': 'lucideLayoutDashboard',
  lock: 'lucideLock',
  'log-out': 'lucideLogOut',
  users: 'lucideUsers',
  wallet: 'lucideWallet',
};

@Component({
  selector: 'app-icon',
  imports: [NgIcon],
  providers: [
    provideIcons({
      lucideCalendar,
      lucideCheck,
      lucideChevronDown,
      lucideChevronLeft,
      lucideChevronRight,
      lucideChevronUp,
      lucideDownload,
      lucideEye,
      lucideEyeOff,
      lucideFileText,
      lucideLayoutDashboard,
      lucideLock,
      lucideLogOut,
      lucidePencil,
      lucidePackage,
      lucidePlus,
      lucideRefreshCw,
      lucideSearch,
      lucideSettings,
      lucideStethoscope,
      lucideTarget,
      lucideTrash2,
      lucideTriangleAlert,
      lucideUsers,
      lucideWallet,
      lucideX,
    }),
  ],
  template: `<ng-icon [name]="iconNames[name()]" aria-hidden="true" />`,
})
export class Icon {
  readonly name = input.required<IconName>();
  readonly iconNames = ICON_NAMES;
}
