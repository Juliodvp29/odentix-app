import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { form, required } from '@angular/forms/signals';
import { FormField } from '../form-field/form-field';
import { TextInput } from '../text-input/text-input';

@Component({
  imports: [FormField, TextInput],
  template: `
    <app-form-field label="Full name" [field]="form.name">
      <app-text-input [field]="form.name" />
    </app-form-field>
  `,
})
class NameHost {
  readonly model = signal({ name: '' });
  readonly form = form(this.model, (s) => {
    required(s.name, { message: 'Name is required' });
  });
}

describe('FormField', () => {
  let fixture: ComponentFixture<NameHost>;

  const inputElement = (): HTMLInputElement =>
    fixture.nativeElement.querySelector('input') as HTMLInputElement;

  function blurEmpty(): void {
    const input = inputElement();
    input.value = '';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NameHost],
    }).compileComponents();
    fixture = TestBed.createComponent(NameHost);
    fixture.detectChanges();
  });

  it('should render the label text', () => {
    const label = fixture.nativeElement.querySelector('label') as HTMLLabelElement;
    expect(label.textContent?.trim()).toBe('Full name');
  });

  it('should hide the error until the field is touched', () => {
    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeNull();
  });

  it('should show the required error after touching an empty field', () => {
    blurEmpty();
    const error = fixture.nativeElement.querySelector('[role="alert"]') as HTMLElement;
    expect(error?.textContent?.trim()).toBe('Name is required');
    expect(inputElement().className).toContain('border-danger');
  });
});
