import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BrandMark } from './brand-mark';

describe('BrandMark', () => {
  let fixture: ComponentFixture<BrandMark>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BrandMark],
    }).compileComponents();
    fixture = TestBed.createComponent(BrandMark);
    fixture.detectChanges();
  });

  it('should render the tooth mark hidden from assistive technology', () => {
    const svg = fixture.nativeElement.querySelector('svg') as SVGElement;
    expect(svg).not.toBeNull();
    expect(svg.getAttribute('aria-hidden')).toBe('true');
  });

  it('should size the mark from its input', () => {
    fixture.componentRef.setInput('size', '16');
    fixture.detectChanges();
    const svg = fixture.nativeElement.querySelector('svg') as SVGElement;
    expect(svg.className.baseVal).toContain('h-16');
  });
});
