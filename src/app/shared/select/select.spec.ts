import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { form, required } from '@angular/forms/signals';
import { FormField } from '@shared/form-field/form-field';
import { Select } from './select';

@Component({
  imports: [FormField, Select],
  template: `
    <app-form-field label="Country" [field]="form.country">
      <app-select [field]="form.country" placeholder="Choose a country" [options]="countries" />
    </app-form-field>
  `,
})
class CountryHost {
  readonly model = signal({ country: '' });
  readonly form = form(this.model, (s) => {
    required(s.country, { message: 'Country is required' });
  });
  readonly countries = [
    { value: 'co', label: 'Colombia' },
    { value: 'mx', label: 'Mexico' },
  ];
}

describe('Select inside FormField', () => {
  let fixture: ComponentFixture<CountryHost>;

  const triggerButton = (): HTMLButtonElement =>
    fixture.nativeElement.querySelector('button[type="button"]') as HTMLButtonElement;
  const listbox = (): HTMLElement | null => fixture.nativeElement.querySelector('[role="listbox"]');

  function openPanel(): void {
    triggerButton().click();
    fixture.detectChanges();
  }

  function keyDownOnFocus(key: string): void {
    (document.activeElement as HTMLElement).dispatchEvent(
      new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }),
    );
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CountryHost],
    }).compileComponents();
    fixture = TestBed.createComponent(CountryHost);
    fixture.detectChanges();
  });

  it('should render the placeholder and a hidden bound native select', () => {
    expect(triggerButton().textContent).toContain('Choose a country');
    const native = fixture.nativeElement.querySelector('select') as HTMLSelectElement;
    expect(native.querySelectorAll('option').length).toBe(3);
  });

  it('should be keyboard-focusable', () => {
    triggerButton().focus();
    expect(document.activeElement).toBe(triggerButton());
  });

  it('should open the listbox on click', () => {
    openPanel();
    expect(listbox()).not.toBeNull();
    expect(listbox()?.querySelectorAll('[role="option"]').length).toBe(3);
  });

  it('should focus the selected option on open', () => {
    openPanel();
    const options = Array.from(
      fixture.nativeElement.querySelectorAll('[role="option"]'),
    ) as Array<HTMLElement>;
    expect(document.activeElement).toBe(options[0]);
  });

  it('should select with arrows and Enter, updating the model', () => {
    openPanel();
    keyDownOnFocus('ArrowDown');
    keyDownOnFocus('Enter');
    expect(fixture.componentInstance.model().country).toBe('co');
    expect(triggerButton().textContent).toContain('Colombia');
    expect(listbox()).toBeNull();
  });

  it('should close on Escape without changing the value and refocus', () => {
    openPanel();
    keyDownOnFocus('ArrowDown');
    keyDownOnFocus('Escape');
    expect(listbox()).toBeNull();
    expect(fixture.componentInstance.model().country).toBe('');
    expect(document.activeElement).toBe(triggerButton());
  });

  it('should commit on Tab and close', () => {
    openPanel();
    keyDownOnFocus('ArrowDown');
    keyDownOnFocus('ArrowDown');
    keyDownOnFocus('Tab');
    expect(fixture.componentInstance.model().country).toBe('mx');
    expect(listbox()).toBeNull();
  });

  it('should close on outside pointer down', () => {
    openPanel();
    document.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    fixture.detectChanges();
    expect(listbox()).toBeNull();
  });

  it('should show the required error after blur on empty', () => {
    triggerButton().dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    const error = fixture.nativeElement.querySelector('[role="alert"]') as HTMLElement;
    expect(error?.textContent?.trim()).toBe('Country is required');
    expect(triggerButton().getAttribute('aria-invalid')).toBe('true');
    expect(triggerButton().getAttribute('aria-describedby')).toBe(error.id);
  });
});
