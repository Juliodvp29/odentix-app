import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { form, required } from '@angular/forms/signals';
import { FormField } from '@shared/form-field/form-field';
import { TextArea } from '@shared/text-area/text-area';

@Component({
  imports: [FormField, TextArea],
  template: `
    <app-form-field label="Mensaje" [field]="form.body">
      <app-text-area [field]="form.body" [rows]="6" placeholder="Escribe el mensaje…" />
    </app-form-field>
  `,
})
class MessageHost {
  readonly model = signal({ body: '' });
  readonly form = form(this.model, (s) => {
    required(s.body, { message: 'El mensaje es obligatorio.' });
  });
}

describe('TextArea inside FormField', () => {
  let fixture: ComponentFixture<MessageHost>;

  const areaElement = (): HTMLTextAreaElement =>
    fixture.nativeElement.querySelector('textarea') as HTMLTextAreaElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MessageHost],
    }).compileComponents();
    fixture = TestBed.createComponent(MessageHost);
    fixture.detectChanges();
  });

  it('should render the textarea with rows and placeholder', () => {
    expect(areaElement().getAttribute('rows')).toBe('6');
    expect(areaElement().getAttribute('placeholder')).toBe('Escribe el mensaje…');
    expect(areaElement().className).toContain('border-hairline');
    expect(areaElement().className).toContain('placeholder:text-mid-gray');
  });

  it('should be keyboard-focusable', () => {
    areaElement().focus();
    expect(document.activeElement).toBe(areaElement());
  });

  it('should mark the error state after blur with empty value', () => {
    areaElement().dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    expect(areaElement().getAttribute('aria-invalid')).toBe('true');
    expect(areaElement().className).toContain('border-danger');
  });
});
