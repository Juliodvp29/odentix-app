import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Subject, throwError } from 'rxjs';
import { AuthService } from '@core/auth/auth.service';
import { LoginPage, loginErrorMessage } from './login-page';

describe('LoginPage', () => {
  let fixture: ComponentFixture<LoginPage>;
  let login: ReturnType<typeof vi.fn>;

  const emailInput = (): HTMLInputElement =>
    fixture.nativeElement.querySelector('input[type="email"]') as HTMLInputElement;
  const passwordInput = (): HTMLInputElement =>
    fixture.nativeElement.querySelector('input[placeholder="Tu contraseña"]') as HTMLInputElement;

  function fillValidForm(): void {
    emailInput().value = 'admin@odentix.co';
    emailInput().dispatchEvent(new Event('input', { bubbles: true }));
    passwordInput().value = 'secret';
    passwordInput().dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
  }

  function submitForm(): void {
    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    fixture.detectChanges();
  }

  beforeEach(async () => {
    login = vi.fn();
    await TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [{ provide: AuthService, useValue: { login } }],
    }).compileComponents();
    fixture = TestBed.createComponent(LoginPage);
    fixture.detectChanges();
  });

  it('should render the login form', () => {
    expect(emailInput()).not.toBeNull();
    expect(passwordInput()).not.toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Ingresar');
  });

  it('should render brand chrome without dead links', () => {
    expect(fixture.nativeElement.textContent).toContain('Sistema Clínico Odontológico');
    expect(fixture.nativeElement.querySelector('a')).toBeNull();
  });

  it('should show field errors without calling login on invalid submit', () => {
    submitForm();
    expect(fixture.nativeElement.textContent).toContain('El correo es obligatorio');
    expect(login).not.toHaveBeenCalled();
  });

  it('should map backend errors to messages', () => {
    expect(
      loginErrorMessage(
        new HttpErrorResponse({ status: 401, error: { error: 'Credenciales inválidas' } }),
      ),
    ).toBe('Credenciales inválidas');
    expect(loginErrorMessage(new HttpErrorResponse({ status: 0 }))).toContain('Sin conexión');
    expect(loginErrorMessage(new Error('boom'))).toContain('No pudimos');
  });

  it('should show the backend error without reloading on failed login', () => {
    login.mockReturnValue(
      throwError(
        () => new HttpErrorResponse({ status: 401, error: { error: 'Credenciales inválidas' } }),
      ),
    );
    fillValidForm();
    submitForm();
    return fixture.whenStable().then(() => {
      fixture.detectChanges();
      const alert = fixture.nativeElement.querySelector('[role="alert"]') as HTMLElement;
      expect(alert?.textContent?.trim()).toBe('Credenciales inválidas');
      expect(alert.querySelector('app-icon')).not.toBeNull();
    });
  });

  it('should show a loading state while the request is in flight', () => {
    const pending = new Subject<void>();
    login.mockReturnValue(pending.asObservable());
    fillValidForm();
    submitForm();
    const spinner = fixture.nativeElement.querySelector('[data-testid="loading-spinner"]');
    expect(spinner).not.toBeNull();
    pending.next();
    pending.complete();
  });

  it('should toggle password visibility', () => {
    expect(passwordInput().getAttribute('type')).toBe('password');
    const toggle = fixture.nativeElement.querySelector(
      '[aria-label="Mostrar contraseña"]',
    ) as HTMLButtonElement;
    toggle.click();
    fixture.detectChanges();
    expect(passwordInput().getAttribute('type')).toBe('text');
    expect(fixture.nativeElement.querySelector('[aria-label="Ocultar contraseña"]')).not.toBeNull();
  });
});
