import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Link } from '@shared/link/link';

describe('Link', () => {
  let fixture: ComponentFixture<Link>;

  const anchorElement = (): HTMLAnchorElement =>
    fixture.nativeElement.querySelector('a') as HTMLAnchorElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Link],
    }).compileComponents();
    fixture = TestBed.createComponent(Link);
    fixture.componentRef.setInput('href', '/patients');
  });

  it('should render an anchor with the given href', () => {
    fixture.detectChanges();
    expect(anchorElement().getAttribute('href')).toBe('/patients');
    expect(anchorElement().className).toContain('text-teal');
  });

  it('should open external links in a new tab with noreferrer', () => {
    fixture.componentRef.setInput('external', true);
    fixture.detectChanges();
    expect(anchorElement().getAttribute('target')).toBe('_blank');
    expect(anchorElement().getAttribute('rel')).toBe('noreferrer');
  });
});
