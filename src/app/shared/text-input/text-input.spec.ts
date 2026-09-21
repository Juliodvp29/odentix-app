import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { email, form, required } from '@angular/forms/signals';
import { FormField } from '@shared/form-field/form-field';
import { TextInput } from '@shared/text-input/text-input';

@Component({
  imports: [FormField, TextInput],
  template: `
    <app-form-field label="Email" [field]="form.email">
      <app-text-input [field]="form.email" type="email" placeholder="you@example.com" />
    </app-form-field>
  `,
})
class EmailHost {
  readonly model = signal({ email: '' });
  readonly form = form(this.model, (s) => {
    required(s.email, { message: 'Email is required' });
    email(s.email, { message: 'Enter a valid email address' });
  });
}

@Component({
  imports: [TextInput],
  template: `
    <app-text-input [field]="form.email">
      <ng-template #suffix>
        <span data-testid="suffix">S</span>
      </ng-template>
    </app-text-input>
  `,
})
class SuffixHost {
  readonly model = signal({ email: '' });
  readonly form = form(this.model);
}

describe('TextInput inside FormField', () => {
  let fixture: ComponentFixture<EmailHost>;

  const inputElement = (): HTMLInputElement =>
    fixture.nativeElement.querySelector('input') as HTMLInputElement;

  function typeAndBlur(value: string): void {
    const input = inputElement();
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmailHost],
    }).compileComponents();
    fixture = TestBed.createComponent(EmailHost);
    fixture.detectChanges();
  });

  it('should render the input with its type and placeholder', () => {
    expect(inputElement().getAttribute('type')).toBe('email');
    expect(inputElement().getAttribute('placeholder')).toBe('you@example.com');
    expect(inputElement().getAttribute('autocomplete')).toBeNull();
    expect(inputElement().className).toContain('border-hairline');
    expect(inputElement().className).toContain('placeholder:text-mid-gray');
  });

  it('should be keyboard-focusable', () => {
    inputElement().focus();
    expect(document.activeElement).toBe(inputElement());
  });

  it('should show the schema validation error without extra wiring', () => {
    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeNull();
    typeAndBlur('not-an-email');
    const error = fixture.nativeElement.querySelector('[role="alert"]') as HTMLElement;
    expect(error?.textContent?.trim()).toBe('Enter a valid email address');
  });

  it('should associate label and error with the input for screen readers', () => {
    typeAndBlur('not-an-email');
    const input = inputElement();
    const label = fixture.nativeElement.querySelector('label') as HTMLLabelElement;
    const error = fixture.nativeElement.querySelector('[role="alert"]') as HTMLElement;
    expect(label.getAttribute('for')).toBe(input.id);
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-describedby')).toBe(error.id);
  });
});

describe('TextInput suffix', () => {
  let fixture: ComponentFixture<SuffixHost>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SuffixHost],
    }).compileComponents();
    fixture = TestBed.createComponent(SuffixHost);
    fixture.detectChanges();
  });

  it('should project suffix content and reserve its space', () => {
    const suffix = fixture.nativeElement.querySelector('[data-testid="suffix"]') as HTMLElement;
    expect(suffix?.textContent).toBe('S');
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    expect(input.className).toContain('pr-40');
  });
});
