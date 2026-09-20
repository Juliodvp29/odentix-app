import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { form, required } from '@angular/forms/signals';
import { FormField } from '@shared/form-field/form-field';
import { Select } from '@shared/select/select';

@Component({
  imports: [FormField, Select],
  template: `
    <app-form-field label="Country" [field]="form.country">
      <app-select [field]="form.country">
        <option value="">Choose a country</option>
        <option value="co">Colombia</option>
      </app-select>
    </app-form-field>
  `,
})
class CountryHost {
  readonly model = signal({ country: '' });
  readonly form = form(this.model, (s) => {
    required(s.country, { message: 'Country is required' });
  });
}

describe('Select inside FormField', () => {
  let fixture: ComponentFixture<CountryHost>;

  const selectElement = (): HTMLSelectElement =>
    fixture.nativeElement.querySelector('select') as HTMLSelectElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CountryHost],
    }).compileComponents();
    fixture = TestBed.createComponent(CountryHost);
    fixture.detectChanges();
  });

  it('should render the projected options', () => {
    const options = Array.from(selectElement().querySelectorAll('option'));
    expect(options.map((option) => option.value)).toEqual(['', 'co']);
  });

  it('should be keyboard-focusable', () => {
    selectElement().focus();
    expect(document.activeElement).toBe(selectElement());
  });

  it('should update the model when an option is chosen', () => {
    const select = selectElement();
    select.value = 'co';
    select.dispatchEvent(new Event('input', { bubbles: true }));
    select.dispatchEvent(new Event('change', { bubbles: true }));
    fixture.detectChanges();
    expect(fixture.componentInstance.model().country).toBe('co');
  });

  it('should show the required error after touching an empty select', () => {
    const select = selectElement();
    select.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    const error = fixture.nativeElement.querySelector('[role="alert"]') as HTMLElement;
    expect(error?.textContent?.trim()).toBe('Country is required');
    expect(select.getAttribute('aria-invalid')).toBe('true');
  });
});
