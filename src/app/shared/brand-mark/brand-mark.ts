import { Component, input } from '@angular/core';

const SIZES: Record<'16' | '20' | '24', string> = {
  '16': 'h-16 w-16',
  '20': 'h-20 w-20',
  '24': 'h-24 w-24',
};

@Component({
  selector: 'app-brand-mark',
  template: `
    <svg
      [class]="sizes[size()]"
      fill="none"
      stroke="currentColor"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="1.8"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        d="M12 2C8.5 2 6 4 6 7.5C6 9.8 7 11.5 8 13.5C9 15.5 8.5 19 9.5 21C10.5 23 11 22 12 18C13 22 13.5 23 14.5 21C15.5 19 15 15.5 16 13.5C17 11.5 18 9.8 18 7.5C18 4 15.5 2 12 2Z"
      ></path>
      <path d="M9.5 8.5C10.5 7.5 13.5 7.5 14.5 8.5" opacity="0.6"></path>
    </svg>
  `,
})
export class BrandMark {
  readonly size = input<'16' | '20' | '24'>('24');
  readonly sizes = SIZES;
}
