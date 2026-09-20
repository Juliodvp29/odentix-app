import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Button, ButtonVariant } from './button';

const variants: Array<{ variant: ButtonVariant; expectedClass: string }> = [
  { variant: 'primary', expectedClass: 'bg-teal' },
  { variant: 'secondary', expectedClass: 'bg-surface-alt' },
  { variant: 'ghost', expectedClass: 'bg-transparent' },
  { variant: 'danger', expectedClass: 'bg-danger' },
];

describe('Button', () => {
  let fixture: ComponentFixture<Button>;

  const buttonElement = (): HTMLButtonElement =>
    fixture.nativeElement.querySelector('button') as HTMLButtonElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Button],
    }).compileComponents();
    fixture = TestBed.createComponent(Button);
  });

  for (const { variant, expectedClass } of variants) {
    it(`should render the ${variant} variant`, () => {
      fixture.componentRef.setInput('variant', variant);
      fixture.detectChanges();
      expect(buttonElement().className).toContain(expectedClass);
    });
  }

  it('should emit clicked on click when enabled', () => {
    let emitted = 0;
    fixture.componentInstance.clicked.subscribe(() => emitted++);
    fixture.detectChanges();
    buttonElement().click();
    expect(emitted).toBe(1);
  });

  it('should not emit clicked when disabled', () => {
    let emitted = 0;
    fixture.componentInstance.clicked.subscribe(() => emitted++);
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    buttonElement().click();
    expect(emitted).toBe(0);
  });

  it('should show a spinner and block clicks while loading', () => {
    let emitted = 0;
    fixture.componentInstance.clicked.subscribe(() => emitted++);
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();
    expect(buttonElement().disabled).toBe(true);
    expect(buttonElement().querySelector('[data-testid="loading-spinner"]')).not.toBeNull();
    buttonElement().click();
    expect(emitted).toBe(0);
  });
});
