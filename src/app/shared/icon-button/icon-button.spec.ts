import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IconButton } from './icon-button';

describe('IconButton', () => {
  let fixture: ComponentFixture<IconButton>;

  const buttonElement = (): HTMLButtonElement =>
    fixture.nativeElement.querySelector('button') as HTMLButtonElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IconButton],
    }).compileComponents();
    fixture = TestBed.createComponent(IconButton);
    fixture.componentRef.setInput('label', 'Close dialog');
  });

  it('should expose the label as its accessible name', () => {
    fixture.detectChanges();
    expect(buttonElement().getAttribute('aria-label')).toBe('Close dialog');
  });

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
});
