import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Skeleton, SkeletonVariant } from './skeleton';

const variants: Array<{ variant: SkeletonVariant; expectedClass: string }> = [
  { variant: 'line', expectedClass: 'rounded-sm' },
  { variant: 'block', expectedClass: 'rounded-card' },
  { variant: 'circle', expectedClass: 'rounded-pill' },
];

describe('Skeleton', () => {
  let fixture: ComponentFixture<Skeleton>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Skeleton],
    }).compileComponents();
    fixture = TestBed.createComponent(Skeleton);
  });

  for (const { variant, expectedClass } of variants) {
    it(`should render the ${variant} variant`, () => {
      fixture.componentRef.setInput('variant', variant);
      fixture.detectChanges();
      const skeleton = fixture.nativeElement.querySelector('span') as HTMLElement;
      expect(skeleton.className).toContain('skeleton');
      expect(skeleton.className).toContain(expectedClass);
    });
  }

  it('should hide the skeleton from assistive technology', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.getAttribute('aria-hidden')).toBe('true');
  });
});
