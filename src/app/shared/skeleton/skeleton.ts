import { Component, computed, input } from '@angular/core';

export type SkeletonVariant = 'line' | 'block' | 'circle';

const variantClasses: Record<SkeletonVariant, string> = {
  line: 'h-12 w-full rounded-sm',
  block: 'min-h-16 h-full w-full rounded-card',
  circle: 'h-40 w-40 shrink-0 rounded-pill',
};

@Component({
  selector: 'app-skeleton',
  host: { 'aria-hidden': 'true', class: 'block' },
  template: `<span [class]="classes()"></span>`,
})
export class Skeleton {
  readonly variant = input<SkeletonVariant>('line');

  readonly classes = computed(() => `skeleton block ${variantClasses[this.variant()]}`);
}
