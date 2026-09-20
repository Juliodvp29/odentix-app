import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { email, form, required } from '@angular/forms/signals';
import { FormField } from '../form-field/form-field';
import { TextInput } from './text-input';

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
