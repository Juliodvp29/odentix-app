import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { email, form, required, submit } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '@core/auth/auth.service';
import { Button } from '@shared/button/button';
import { BrandMark } from '@shared/brand-mark/brand-mark';
import { FormField } from '@shared/form-field/form-field';
import { Icon } from '@shared/icon/icon';
import { IconButton } from '@shared/icon-button/icon-button';
import { TextInput } from '@shared/text-input/text-input';

@Component({
  selector: 'app-login-page',
  imports: [BrandMark, Button, FormField, Icon, IconButton, TextInput],
  templateUrl: './login-page.html',
})
export class LoginPage {
  private readonly auth = inject(AuthService);

  readonly model = signal({ email: '', password: '' });
  readonly loginForm = form(this.model, (schema) => {
    required(schema.email, { message: 'El correo es obligatorio' });
    email(schema.email, { message: 'Ingresa un correo válido' });
    required(schema.password, { message: 'La contraseña es obligatoria' });
  });
  readonly submitting = signal(false);
  readonly serverError = signal<string | null>(null);
  readonly showPassword = signal(false);

  submitLogin(): void {
    this.serverError.set(null);
    submit(this.loginForm, async () => {
      this.submitting.set(true);
      try {
        await firstValueFrom(this.auth.login(this.model()));
      } catch (error) {
        this.serverError.set(loginErrorMessage(error));
      } finally {
        this.submitting.set(false);
      }
    });
  }
}

export function loginErrorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    const backendMessage = (error.error as { error?: string } | null)?.error;
    if (backendMessage) {
      return backendMessage;
    }
    if (error.status === 0) {
      return 'Sin conexión con el servidor. Intenta de nuevo.';
    }
  }
  return 'No pudimos iniciar sesión. Intenta de nuevo.';
}
